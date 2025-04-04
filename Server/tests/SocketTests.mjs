import { io } from "socket.io-client";
import addLog, { addFailedTest, addPassedTest } from "./TestLogger.mjs";
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

const testSocketIO = async () => {
  addLog("# client web socket tests: ")
  addLog("creating client web socket")
  const socket = io("ws://localhost:5000")
  addLog("client web socket created")

  const login_promise = makeOncePromise(socket, "new_token")
  login_promise.catch((err) => {
    addFailedTest(`login test failed with err: ${err.message}`)
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

  socket.emit("get_servers", {user_token})
  const {servers} = await server_promise
  addLog(`received back servers: ${JSON.stringify(servers)}`)
  
  if (servers.length <= 0) {
    addFailedTest("received back 0 servers exiting further testing")
    socket.disconnect(true)
    return
  } else {
    addPassedTest("got back servers from the manager as requested")
  }

  addLog("testing clusters uuid")
  for (const cluster of servers) {
    const res = testClusterUUID(cluster.id)
    if (res) {
      addPassedTest(`uuid ${cluster.id} is valid`)
    } else {
      addFailedTest(`uuid ${cluster.id} is not valid`)
    }
  }

  addLog("subscribing to minimal updates room")
  socket.emit("join_min_updates", {user_token})

  const update_promise = makeOncePromise(socket, "min_update")
  update_promise.catch((err) => {
    addFailedTest(`minimal update failed with err: ${err.message}`)
  })
  
  const cluster = servers[Math.floor(Math.random() * servers.length)]


  addLog(`sending request to push a minimal update of cluster: ${JSON.stringify(cluster)}`)
  socket.emit("push_minimal_update", {user_token, cluster_id: cluster.id})
  const new_entry = await update_promise
  addLog(`received back entry update ${JSON.stringify(new_entry)}`)

  if (new_entry.entry.id !== cluster.id) {
    addFailedTest("failed to retrive update for the correct cluster requested")
  } else {
    addPassedTest("successfully received entry update of requested cluster")
  }

  addLog("disconnecting client")
  socket.disconnect(true)

  addLog("end of client socket testing")
}

export default testSocketIO