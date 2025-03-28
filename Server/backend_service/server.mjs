import { createServer } from 'http'
import { Server } from 'socket.io'
import { generateUserToken, isValidToken } from './auth.mjs'

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

  socket.on("get_servers", ({user_token}) => {
    if (!isValidToken(user_token)) {
      socket.emit("error", {message: "token invalid"})
      return
    }

    socket.emit("server_entries", {servers: [
      // push the servers managed by this manager
    ]})
  })

  socket.on("join_cluster_room", ({user_token, cluster_id, room}) => {
    if (!isValidToken(user_token)) {
      socket.emit("error", {message: "token invalid"})
      return
    }

    socket.join(cluster_id+"/"+room)
    
  })
  
  socket.on("leave_cluster_room", ({user_token, cluster_id, room}) => {
    if (!isValidToken(user_token)) {
      socket.emit("error", {message: "token invalid"})
      return
    }
    
    socket.leave(cluster_id+"/"+room)
  })

  socket.on("send_server_action", ({user_token, action}) => {
    if (!isValidToken(user_token)) {
      socket.emit("error", {message: "token invalid"})
      return
    }


  })

  socket.on("send_server_command", ({user_token, command}) => {
    if (!isValidToken(user_token)) {
      socket.emit("error", {message: "token invalid"})
      return
    }
  })
})