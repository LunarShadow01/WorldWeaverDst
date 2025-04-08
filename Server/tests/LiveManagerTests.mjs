import { io } from "socket.io-client";
import addLog, { addFailedTest, addPassedTest } from "./TestLogger.mjs";
import {inspect} from 'node:util'
import { EventEmitter } from 'node:events'

const makeOncePromise = (socket, event) => {
  const promise = new Promise((resolve, reject) => {
    const task = setTimeout(() => {
      reject(Error("request timed out"))
    }, 15 * 1000);
    
    socket.once(event, (data) => {
      clearTimeout(task)
      resolve(data)
    })
  })

  return promise
}

const testClusterUUID = (uuid) => {
  try {
    const chunks = uuid.split("-")
    if (chunks.length !== 5) {
      addFailedTest("uuid doesn't meet the uuid format")
      return false
    }

    const results = chunks.map((chunk) => {
      return typeof(chunk) === typeof("") && chunk.length > 0
    })

    const result = results.reduce((acc, cur) => {
      return acc && cur
    }, true)

    return result
  } catch (err) {
    addFailedTest("encountered an error while testing cluster uuid")
    return false
  }
}

const createTestCluster = (socket, user_token, name) => {
  const creation_promise = makeOncePromise(socket, "fs_scanned")
  addLog("attempting server creation")
  socket.emit("create_cluster", {
    user_token,
    branch: "public",
    name,
    password: "SoSecure",
    shards: [
      {name: "Master", id: 1},
      {name: "Caves", id: 2},
    ]
  })

  return creation_promise
}

const getClusters = (socket, user_token) => {
  addLog("get scanned servers from the manager")
  const server_promise = makeOncePromise(socket, "server_entries")
  server_promise.catch((err) => {
    addFailedTest(`server entries fetching test failed with err: ${err.message}`)
  })
  
  socket.emit("get_servers", {user_token})
  return server_promise
}

const deleteCluster = (socket, user_token, server) => {
  addLog(`found testing server ${server}`)
    const scanned_promise = makeOncePromise(socket, "fs_scanned")
    scanned_promise.catch((err) => {
      console.log(err)
    }).then(() => {
      addPassedTest(`successfully deleted test server`)
    })

    socket.emit("send_server_action", {
      user_token,
      cluster_id: server.id,
      action: "delete"
    })

    return scanned_promise
}

const testManager = async () => {
  addLog("# cluster manager tests: ")
  addLog("creating client web socket")
  const socket = io("ws://localhost:5000")
  addLog("client web socket created")

  socket.on("connect_error", (err) => {
    addFailedTest(err)
  })
  socket.on("error", ({err}) => {
    addFailedTest(err)
  })

  const login_promise = makeOncePromise(socket, "new_token")
  login_promise.catch((err) => {
    addFailedTest(`(dupelicate) login test failed with err: ${err.message}`)
  })
  
  addLog("attempting login")
  socket.emit("login", {
    email: "automated@gmail.com",
    password: "",
  })

  const {user_token} = await login_promise
  addLog(`received user token, ${user_token}`)

  const mid_write_server_name = "TestingCluster2"
  const testing_server_name = "TestingCluster"
  const {servers} = await getClusters(socket, user_token)
  addLog(`received back server count: ${servers.length}`)
  
  const test_server = servers.find((server) => {
    return server.name === testing_server_name
  })
  
  const fs_write_server = servers.find((server) => {
    return server.name === mid_write_server_name
  })
  
  if (test_server) {
    await deleteCluster(socket, user_token, test_server)
  }
  if (fs_write_server) {
    await deleteCluster(socket, user_token, fs_write_server)
  }

  await createTestCluster(socket, user_token, testing_server_name)

  const servers2 = (await getClusters(socket, user_token)).servers
  addLog(`received back server count: ${servers2?.length}`)
  
  const test_server2 = servers2.find((server) => {
    return server.name === testing_server_name
  })

  if (test_server2) {
    addPassedTest(`found newly created test server ${inspect(test_server2)}`)
    const res = testClusterUUID(test_server2.id)
    if (res) {
      addPassedTest(`testing server uuid is valid`)
    }
  } else {
    addFailedTest(`could not find the newly created test server`)
    return
  }

  addLog("start the testing cluster")

  addLog("subscribing to minimal updates room")
  socket.emit("join_min_updates", {user_token})
  const events = new EventEmitter()

  const update_promise = makeOncePromise(socket, "min_update")
  update_promise.catch((err) => {
    addFailedTest(`minimal update failed with err: ${err.message}`)
  })

  addLog(`sending request to push a minimal update of cluster: ${inspect(test_server2)}`)
  socket.emit("push_minimal_update", {user_token, cluster_id: test_server2.id})
  
  const new_entry = await update_promise
  addLog(`received back entry update ${JSON.stringify(new_entry)}`)

  let already_checked_running = false
  socket.on("min_update", 
    ({entry, id}) => {
      if (id !== test_server2.id) {
        return
      }

      if (!entry.is_running && !entry.is_online) {
        events.emit("done", null)
      }

      if (entry.is_running && !entry.is_online && !already_checked_running) {
        addPassedTest(`test cluster process ran, updated by minimal entry: ${inspect(entry)}`)
        already_checked_running = true
      }

      if (entry.is_online) {
        addPassedTest(`test cluster is online, shutting down\n received minimal entry: ${inspect(entry)}`)
        socket.emit("send_server_action", {
          user_token,
          action: "stop",
          cluster_id: test_server2.id
        })
      }
  })

  addLog("sending start cluster action")
  socket.emit("send_server_action", {
    user_token,
    action: "start",
    cluster_id: test_server2.id
  })

  const task = setTimeout(() => {
    events.emit("done", Error("cluster did not close in time, terminating test"))
  }, 5 * 60 * 1000);

  await new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, 5 * 1000);
  })

  addLog("testing the creation of a cluster while another cluster is running")
  const fs_changed_promise = createTestCluster(socket, user_token, mid_write_server_name)

  fs_changed_promise.then(async () => {
    const mid_servers = (await getClusters(socket, user_token)).servers
    if (mid_servers.find((server) => server.name === mid_write_server_name)) {
      addPassedTest("successfully created a new cluster while another cluster is running")
    } else {
      addFailedTest("could not find the cluster created while another cluster was running after the file system changed")
    }
  }).catch(() => {
    addFailedTest("error encountered during creation of cluster while another cluster is running")
  })

  try {
    const res = await new Promise((resolve, reject) => {
      events.once("done", (err) => {
        clearTimeout(task)
        if (err) {
          reject(err)
        } else {
          resolve("cluster process finished successfully")
        }
      })
    })
    addPassedTest(res)
  } catch (err) {
    addFailedTest(err)
  }

  addLog("testing backup functionality, with multiple backup calls")
  addLog(`cluster uuid is: ${test_server2.id}`)
  for (let i = 0; i<25; i++) {
    addLog(`making backup number ${i} of the testing cluster`)
    const backup_promise = makeOncePromise(socket, "backup_complete")
    backup_promise.then(({id, name, time}) => {
        const expected_name = `autobackup_${i % 21}`
        const result_name = name
        if (expected_name !== result_name) {
          addFailedTest(`expected name and result name did not match, got instead: ${expected_name} -> ${result_name}`)
        } else {
          addPassedTest("backup test concluded successfully")
        }
      }).catch(() => {
      addFailedTest("could not make backup")
    })
    socket.emit("backup_cluster", {user_token, cluster_id: test_server2.id})
    await backup_promise
  }
  
  addLog("disconnecting client")
  socket.disconnect(true)

  addLog("end of cluster manager testing")
}

export default testManager