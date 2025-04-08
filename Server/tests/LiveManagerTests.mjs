import { io } from "socket.io-client";
import addLog, { addFailedTest, addPassedTest } from "./TestLogger.mjs";
import {inspect, inspect as utilsInspect} from 'node:util'
import { Socket } from "socket.io";

const makeOncePromise = (socket, event) => {
  const promise = new Promise((resolve, reject) => {
    socket.once(event, (data) => {
      resolve(data)
    })
    
    setTimeout(() => {
      reject(Error("login request timed out"))
    }, 5000);
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

  addLog("get scanned servers from the manager")
  const server_promise = makeOncePromise(socket, "server_entries")
  server_promise.catch((err) => {
    addFailedTest(`server entries fetching test failed with err: ${err.message}`)
  })
  
  const testing_server_name = "TestingCluster"
  socket.emit("get_servers", {user_token})
  const {servers} = await server_promise
  addLog(`received back server count: ${servers.length}`)
  
  const test_server = servers.find((server) => {
    return server.name === testing_server_name
  })
  
  if (test_server) {
    addLog(`found testing server ${test_server}`)
    const scanned_promise = makeOncePromise(socket, "fs_scanned")
    scanned_promise.catch((err) => {
      console.log(err)
    })

    socket.emit("send_server_action", {
      user_token,
      cluster_id: test_server.id,
      action: "delete"
    })

    await scanned_promise
    addPassedTest(`successfully deleted test server`)
  }

  const creation_promise = makeOncePromise(socket, "fs_scanned")
  addLog("attempting server creation")
  socket.emit("create_cluster", {
    user_token,
    branch: "public",
    name: testing_server_name,
    password: "SoSecure",
    shards: [
      {name: "Master", id: 1},
      {name: "Caves", id: 2},
    ]
  })

  await creation_promise

  addLog("get scanned servers from the manager")
  const server_promise2 = makeOncePromise(socket, "server_entries")
  server_promise2.catch((err) => {
    addFailedTest(`server entries fetching test failed with err: ${err.message}`)
  })

  socket.emit("get_servers", {user_token})
  const servers2 = (await server_promise2).servers
  addLog(`received back server count: ${servers2?.length}`)
  
  const test_server2 = servers.find((server) => {
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
}

export default testManager