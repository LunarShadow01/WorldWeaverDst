import { createServer } from 'http'
import { Server } from 'socket.io'
import { generateUserToken, isValidToken } from './auth.mjs'

const http_server = createServer()
const io = new Server(http_server, {
  cors: {
    origin: "anonymous"
  }
})

http_server.listen(4000)

// const io = new Server(4000)

io.on("connection", (socket) => {
  io.on("verify_token", ({user_token}) => {
    socket.emit("token_verified", {res: isValidToken(user_token)})
  })

  io.on("login", ({email, password}) => {
    const user_token = generateUserToken(email, password)
    socket.emit("new_token", {user_token})
  })

  io.on("get_servers", ({user_token}) => {
    if (!isValidToken(user_token)) {
      socket.emit("error", {message: "token invalid"})
      return
    }

    socket.emit("server_entries", {servers: [
      // push the servers managed by this manager
    ]})
  })

  io.on("subscribe_to_server", ({user_token}) => {
    if (!isValidToken(user_token)) {
      socket.emit("error", {message: "token invalid"})
      return
    }

    // todo
    // socket.join("")
  })

  io.on("unsubscribe_to_server", ({user_token}) => {
    if (!isValidToken(user_token)) {
      socket.emit("error", {message: "token invalid"})
      return
    }

    // todo
    // socket.leave("")
  })

  io.on("send_server_action", ({user_token, action}) => {
    if (!isValidToken(user_token)) {
      socket.emit("error", {message: "token invalid"})
      return
    }


  })

  io.on("send_server_command", ({user_token, command}) => {
    if (!isValidToken(user_token)) {
      socket.emit("error", {message: "token invalid"})
      return
    }

    
  })
})