import { pid } from "node:process"
import { spawn } from "node:child_process"
import path from "node:path"
import { existsSync } from "node:fs"
import Stream from "node:stream"

import { loadLuaFile } from "./helper.mjs"

export class Shard {
  constructor() {
    this.process = null
    this.interval_task = null
    this.events = new Stream.EventEmitter()
  }

  /**
   * @param {String} shard_name 
   * @returns {Shard}
   */
  setup(
    shard_name,
    is_master,
    game_dir,
    cluster_dir,
    cluster_token
  ) {
    /**@type {String} */
    this.shard_name = shard_name
    /**@type {Boolean} */
    this.is_master = is_master

    /**@type {String} */
    this.game_dir = game_dir
    /**@type {String} */
    this.cluster_dir = cluster_dir
    /**@type {String} */
    this.cluster_token = cluster_token

    return this
  }

  isRunning() {
    return this.process
  }

  start() {
    if (this.isRunning())
      return
    
    const game_dir = this.game_dir
    const cluster_dir = this.cluster_dir
    const token = this.cluster_token

    const cwd = path.resolve(game_dir, "bin64")
    let exe = path.resolve(cwd, "dontstarve_dedicated_server_nullrenderer_x64.exe")

    const args = `-cluster ${cluster_dir} -shard ${this.shard_name} -token ${token} -monitor_parent_process ${pid}`
    this.process = spawn(exe, args.split(" "), {
      cwd: cwd,
      serialization: "json",
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    this.process.stdout.on("data", (chunk) => {
      const data = new Buffer.from(chunk).toString("utf-8")
      this.events.emit("stdout", this, data)
    })

    this.process.addListener("close", this.onClosed)
    this.process.addListener("error", (err) => {
      console.error(err)
    })
  }

  /**
   * @param {Number | null} code
   * @param {NodeJS.Signals | null} signal
   */
  onClosed(code, signal) {
    console.log("shard closed with code: ", code, " by signal: ", signal)
    
    this.process = null
  }

  stop() {
    if (!this.isRunning()) {
      return
    }

    this.sendCommand("c_shutdown(true)")
  }

  sendCommand(cmd) {
    if (!this.isRunning()) {
      console.log("cannot send command process isn't running")
      return
    }

    try {
      const formatted = cmd + "\n"
      const stdin = this.process.stdin

      if (stdin.writable && !stdin.writableNeedDrain) {
        stdin.write(formatted)
      } else {
        throw Error("write stream is non writable")
      }
    } catch (err) {
      console.error(err.message)
    }
  }
}

export class Cluster {
  constructor() {
    /**@type {Shard[]} */
    this.shards = []
    /**@type {Shard | null} */
    this.master = null
  }

  /**
   * @param {String[]} shard_codes 
   * @param {String} game_dir 
   * @param {String} cluster_dir 
   * @returns {Cluster}
   */
  setup(
    shard_codes,
    game_dir,
    cluster_dir,
    cluster_token
  ) {
    this.game_dir = game_dir
    this.cluster_dir = cluster_dir
    this.cluster_token = cluster_token
    if (!existsSync(game_dir)) {
      throw Error("game directory or cluster directory cannot be found")
    }

    for (const shard_code of shard_codes) {
      const is_master = shard_code == "Master"
      const shard = new Shard().setup(
        shard_code,
        is_master,
        game_dir,
        cluster_dir,
        cluster_token
      )
      shard.events.addListener("stdout", this.onShardStdout)

      this.shards.push(shard)
      if (is_master) {
        this.master = shard
      }
    }
    // setTimeout(() => {
    //   this.stop()
    // }, 60 * 1000);

    if (this.master) {
      this.master.sendCommand(loadLuaFile(dirname, "worlddata.lua"))
    }

    return this
  }

  start() {
    for (const shard of this.shards) {
      shard.start()
    }
  }

  stop() {
    for (const shard of this.shards) {
      shard.stop()
    }
  }

  sendCommand(cmd, just_master = true) {
    if (just_master) {
      this.master?.sendCommand(cmd)
    } else {
      for (const shard of this.shards) {
        shard.sendCommand(cmd)
      }
    }
  }

  /**
   * @param {Shard} shard
   * @param {String} data
   */
  onShardStdout(shard, data) {
    // temporary stdout to server console
    console.log("("+shard.shard_name+"): ", data)
  }
}