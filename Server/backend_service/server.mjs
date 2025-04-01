import { createServer } from 'http'
import { Server } from 'socket.io'
import { generateUserToken, isValidToken } from './auth.mjs'
import { Manager } from '../manager_logic/server_objects.mjs'

// const http_server = createServer()
// const io = new Server(http_server, {
//   cors: {
//     origin: "anonymous"
//   }
// })

// http_server.listen(5000)

const io = new Server(5000)

io.on("connection", (socket) => {
  socket.on("verify_token", ({user_token}) => {
    socket.emit("token_verified", {res: isValidToken(user_token)})
  })

  socket.on("login", ({email, password}) => {
    const user_token = generateUserToken(email, password)
    socket.emit("new_token", {user_token})
  })

  socket.on("join_min_updates", ({user_token}) => {
    if (!isValidToken(user_token)) {
      socket.emit("error", {message: "token invalid"})
      return
    }

    socket.join("entry_updates")
  })
})

/**
 * @param {Manager} manager 
 */
export function ioConnectManager(manager) {
  io.on("connection", (socket) => {
    socket.on("get_servers", ({user_token}) => {
      if (!isValidToken(user_token)) {
        socket.emit("error", {message: "token invalid"})
        return
      }

      const servers = manager.getClusterEntries()

      socket.emit("server_entries", {servers})
    })

    socket.on("send_server_action", ({user_token, action, cluster_id}) => {
      if (!isValidToken(user_token)) {
        console.log("user token invalid")
        socket.emit("error", {message: "token invalid"})
        return
      }

      console.log("action: "+action)

      switch(action) {
        case "start":
          manager.clusters[cluster_id].start()
          break;
        case "stop":
          manager.clusters[cluster_id].stop()
          break;
        case "save":
          manager.sendCommandToCluster(`c_save()`, cluster_id)
          break;
        default:
          manager.sendCommandToCluster(`print("action: \"${action}\" not recognized")`, cluster_id)
          break;
      }
    })

    socket.on("send_server_command", ({user_token, command, cluster_id}) => {
      if (!isValidToken(user_token)) {
        socket.emit("error", {message: "token invalid"})
        return
      }

      manager.sendCommandToCluster(command, cluster_id)
    })
  })
}

export default io