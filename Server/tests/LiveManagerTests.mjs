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
  addLog("# cluster manager tests: ")
  addLog("creating client web socket")
  const socket = io("ws://localhost:5000")
  addLog("client web socket created")

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

  socket.emit("get_servers", {user_token})
  const {servers} = await server_promise
  addLog(`received back server count: ${servers.length}`)
  
  addLog("attempting server creation")
  

}

export default testSocketIO