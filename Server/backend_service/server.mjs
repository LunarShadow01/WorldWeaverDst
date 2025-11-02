import { createServer } from 'http'
import { Server } from 'socket.io'
import { getUserValidate } from './auth.mjs'
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
    const pass_key = socket.handshake.auth.passkey
    const user = getUserValidate(pass_key)
    if (user == null) {
      next(new Error("passkey invalid"))
      return
    }
    args.user = user
    next()
  })

  socket.use(([event, args], next) => {
    console.log(`${args.user.username}: has been validated and sent "${event}" event`)

    next()
  })

  socket.use(([event, ...args], next) => {
    if (debug) {
      console.log(`-----\nsocket: "${socket.id}"\nemitted event "${event}",\nwith arguments ${inspect(args, {colors: inspect.styles.bigint})}`)
    }

    next()
  })
})

let count = 0

io.on("connection", (socket) => {
  socket.on("join_min_updates", ({}) => {
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

    socket.on("get_servers", ({}) => {
      const servers = manager.getClusterEntries()

      socket.emit("server_entries", {servers})
    })

    socket.on("join_full_updates", ({cluster_id}) => {
      if (manager.clusters[cluster_id]) {
        socket.join("full_updates/"+cluster_id)
      }
    })

    socket.on("push_minimal_update", ({cluster_id}) => {
      const cluster = manager.getCluster(cluster_id)
      if (cluster) {
        cluster.doMinEntryUpdate()
      } else {
        socket.emit("error", {err: inspect(Error("could not find requested cluster"))})
      }
    })

    socket.on("send_server_action", ({action, cluster_id}) => {
      if (manager.clusters[cluster_id] === undefined) {
        return
      }

      try {
        switch(action) {
          case "start":
            manager.getCluster(cluster_id).start()
            break;
          case "stop":
            manager.getCluster(cluster_id).stop()
            break;
          case "save":
            manager.sendCommandToCluster(`c_save()`, cluster_id)
            break;
          case "delete":
            const cluster = manager.getCluster(cluster_id)
            cluster.delete()
            break;
          default:
            manager.sendCommandToCluster(`print("action: \"${action}\" not recognized")`, cluster_id)
            break;
        }
      } catch (err) {
        socket.emit("error", {err: inspect(err)})
      }
    })

    socket.on("send_server_command", ({command, cluster_id}) => {
      manager.sendCommandToCluster(command, cluster_id)
    })

    socket.on("create_cluster",
      /**
       * @param {Object} params
       * @param {String} params.branch
       * @param {String} params.name
       * @param {String} params.password
       * @param {{name: String, id: Number}[]} params.shards 
       */
      async ({branch, name, password, shards}) => {
        try {
          manager.createNewCluster(branch, name, password, shards)
        } catch (err) {
          socket.emit("error", {err: inspect(err)})
        }
    })

    socket.on("backup_cluster", ({cluster_id}) => {
      const promise = manager.autoBackupCluster(cluster_id) // temporary simplification
      promise.catch((err) => {
        socket.emit("error", {err: inspect(err)})
      }).then((data) => {
        socket.emit("backup_complete", data)
      })
    })
  })
}

export default io