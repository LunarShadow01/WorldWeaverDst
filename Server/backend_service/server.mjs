import { createServer } from 'http'
import { Server } from 'socket.io'
import { generateUserToken, isValidToken } from './auth.mjs'
import { Manager } from '../manager_logic/server_objects.mjs'
import { inspect } from 'util'

// const http_server = createServer()
// const io = new Server(http_server, {
//   cors: {
//     origin: "anonymous"
//   }
// })

// http_server.listen(5000)

const io = new Server(5000)
const debug = false

io.use((socket, next) => {
  socket.use(([event, args], next) => {
    if (event === "login" || event === "verify_token") {
      next()
    }
    
    const user_token = args.user_token
    if (!isValidToken(user_token)) {
      next(Error("cannot verify user json web token"))
    } else {
      next()
    }
  })
  next()

  socket.use(([event, ...args], next) => {
    if (debug) {
      console.log(`-----\nsocket: "${socket.id}"\nemitted event "${event}",\nwith arguments ${inspect(args, {colors: inspect.styles.bigint})}`)
    }

    next()
  })
})

let count = 0

io.on("connection", (socket) => {
  socket.on("verify_token", ({user_token}) => {
    socket.emit("token_verified", {res: isValidToken(user_token)})
  })

  socket.on("login", ({email, password}) => {
    const user_token = generateUserToken(email, password)
    socket.emit("new_token", {user_token})
  })

  socket.on("join_min_updates", ({user_token}) => {
    socket.join("entry_updates")
  })

  socket.on("disconnecting", (reason) => {
    console.log((count++),": socket:",socket.id,"disconnected:",reason)
  })
})

/**
 * @param {Manager} manager 
 */
export function ioConnectManager(manager) {
  io.on("connection", (socket) => {

    socket.use(([event, args], next) => {
      const cluster_id = args.cluster_id 
      const cluster = manager.clusters[cluster_id]
      if (cluster_id
        && cluster === undefined
        || cluster === null) {
        if (debug) {
          console.error(`no cluster matching the id ${cluster_id} could be found`)
        }

        next(Error(`no cluster matching the id ${cluster_id} could be found`))
      }

      next()
    })

    socket.on("get_servers", ({user_token}) => {
      const servers = manager.getClusterEntries()

      socket.emit("server_entries", {servers})
    })

    socket.on("join_full_updates", ({user_token, cluster_id}) => {
      if (manager.clusters[cluster_id]) {
        socket.join("full_updates/"+cluster_id)
      }
    })

    socket.on("push_minimal_update", ({user_token, cluster_id}) => {
      const cluster = manager.clusters[cluster_id]
      if (cluster) {
        cluster.doMinEntryUpdate()
      }
    })

    socket.on("send_server_action", ({user_token, action, cluster_id}) => {
      if (manager.clusters[cluster_id] === undefined) {
        return
      }

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
      manager.sendCommandToCluster(command, cluster_id)
    })
  })
}

export default io