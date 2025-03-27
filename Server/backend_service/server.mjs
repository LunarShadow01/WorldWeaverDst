import {Server} from 'socket.io'
import { generateUserToken, isValidToken } from './auth.mjs'

const io = new Server(4000)

io.on("connection", (socket) => {
  io.on("login", ({email, password}) => {
    const user_token = generateUserToken(email, password)
    socket.emit("new_token", {user_token})
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