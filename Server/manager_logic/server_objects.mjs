import { pid } from "node:process"
import { spawn } from "node:child_process"
import path from "node:path"
import { access, existsSync, mkdir, mkdirSync, rmSync } from "node:fs"
import Stream from "node:stream"

import {
  ClusterConfig,
  getBranchExecutable,
  getClusterDirsInDir,
  getPersistentStorageRoot,
  getShardNamesInCluster,
  getWWClusterConfig,
  handleShardOutput,
  loadLuaFile, 
  restingWatch, 
  saveClusterEntry, 
  ShardConfig,
  writeConfigIni} from "./helpers.mjs"
import { dirname } from "./constants.mjs"
import { Server, Socket } from "socket.io"
import { getDataKey } from "../data_writer.mjs"
import { isUpdateQueued, updateGame } from "./steamcmd.mjs"

export class Shard {
  constructor() {
    this.process = null
    this.interval_task = null
    this.events = new Stream.EventEmitter()
    /**@type {Boolean} */
    this.is_online = false
    /**@type {Boolean} */
    this.is_paused = false
  }

  /**
   * @param {String} data 
   */
  emitStdout(data) {
    if (this.events) {
      this.events.emit("stdout", this, data)
    }
  }

  /**
   * @param {String} shard_name 
   * @returns {Shard}
   */
  setup(
    shard_name,
    is_master,
    cluster_dir,
    cluster_token,
    branch_name
  ) {
    /**@type {String} */
    this.shard_name = shard_name
    /**@type {Boolean} */
    this.is_master = is_master
    /**@type {String} */
    this.cluster_dir = cluster_dir
    /**@type {String} */
    this.cluster_token = cluster_token
    /**@type {String} */
    this.branch_name = branch_name

    return this
  }

  isRunning() {
    return Boolean(this.process)
  }

  isOnline() {
    // fail safe, can't be online and not running
    return this.is_online && this.isRunning()
  }

  start() {
    if (this.isRunning())
      return
    this.is_online = false

    const persistent_storage_root = getPersistentStorageRoot()
    const conf_dir = this.branch_name
    const location_args = `-persistent_storage_root ${persistent_storage_root}`
      +` -conf_dir ${conf_dir}`
    
    const cluster_dir = this.cluster_dir
    const token = this.cluster_token

    const exe = getBranchExecutable(this.branch_name)
    const cwd = path.dirname(exe)

    const args = `${location_args} -cluster ${cluster_dir} -shard ${this.shard_name} -token ${token} -monitor_parent_process ${pid}`
    this.process = spawn(exe, args.split(" "), {
      cwd: cwd,
      serialization: "json",
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    this.process.stdout.on("data", (chunk) => {
      const data = new Buffer.from(chunk).toString("utf-8")
      this.emitStdout(data)
    })

    this.process.addListener("close", (code, signal) => {
      this.onClosed(code, signal)
    })
    this.process.addListener("error", (err) => {
      console.error(err)
    })
  }

  /**
   * @param {Number | null} code
   * @param {NodeJS.Signals | null} signal
   */
  onClosed(code, signal) {
    this.process = null

    if (this.events) {
      this.events.emit("min_update")
    }
    this.emitStdout(`shard closed with code: ${code} by signal: ${signal}`)
  }

  stop() {
    if (!this.isRunning()) {
      return
    }
    
    this.sendCommand("c_shutdown(true)")
    this.is_online = false
  }
  
  sendCommand(cmd) {
    if (!this.isRunning()) {
      return
    }
    
    try {
      const formatted = cmd + "\n"
      const stdin = this.process.stdin

      if (Buffer.from(formatted).byteLength >= stdin.writableHighWaterMark) {
        throw Error("written chunk is too large. overflowing shard write buffer of size: "
          +stdin.writableHighWaterMark+"bytes")
        }
        
        if (stdin.writable && !stdin.writableNeedDrain) {
          stdin.write(formatted)
        } else {
          throw Error("write stream is non writable")
        }
    } catch (err) {
      console.error(err.message)
    }
  }
  
  onWorldActive() {
    this.is_online = true

    if (this.is_master) {
      this.sendCommand(loadLuaFile(dirname, "worlddata.lua"))
      this.sendCommand(loadLuaFile(dirname, "custom_cmds.lua"))
    }
    
    if (this.events) {
      this.events.emit("min_update")
    }
  }
  
  onRollback() {
    this.is_online = false
  }
}

export class Cluster {
  constructor(id) {
    /**@type {Shard[]} */
    this.shards = []
    /**@type {Shard | null} */
    this.master = null

    /**@type {Number} */
    this.id = id

    /**@type {Number} */
    this.cur_players = 0
    /**@type {Number} */
    this.max_players = 0
    /**@type {String | undefined} */
    this.season = undefined
    /**@type {Number | undefined} */
    this.day = undefined
    /**@type {String} */
    this.name = ""
  }

  /**
   * @param {String[]} shard_codes 
   * @param {String} install_dir 
   * @param {String} cluster_dir 
   * @returns {Cluster}
   */
  setup(
    shard_codes,
    cluster_path,
    cluster_token,
    branch_name,
    io
  ) {
    const cluster_dir = path.basename(cluster_path)
    
    const config_data = ClusterConfig.makeFromFile(path.resolve(cluster_path, "cluster.ini"))
    this.name = config_data.getConfigProperty("NETWORK", "cluster_name")
    this.max_players = config_data.getConfigProperty("GAMEPLAY", "max_players")

    this.cluster_path = cluster_path
    this.cluster_token = cluster_token
    this.branch_name = branch_name
    
    /**@type {Socket} */
    this.io = io

    for (const shard_code of shard_codes) {
      const is_master = shard_code == "Master"
      const shard = new Shard().setup(
        shard_code,
        is_master,
        cluster_dir,
        cluster_token,
        branch_name
      )
      shard.events.addListener("stdout", (shard, data) => {
        this.onShardStdout(shard, data)
      })
      shard.events.addListener("min_update", () => {
        this.doMinEntryUpdate()
      })
      
      this.shards.push(shard)
      if (is_master) {
        this.master = shard
      }
    }

    return this
  }

  hasNullrenderer() {
    const exe = getBranchExecutable(this.branch_name)

    return existsSync(exe)
  }

  isRunning() {
    return (this.master && this.master.isRunning())
  }

  isOnline() {
    return (this.master && this.master.isOnline())
  }

  start() {
    if (!this.hasNullrenderer() || isUpdateQueued(this.branch_name)) {
      updateGame(this.branch_name).then(() => {
        for (const shard of this.shards) {
          shard.start()
        }

        this.doMinEntryUpdate() // cluster started, send min update
      })
      return
    }

    for (const shard of this.shards) {
      shard.start()
    }

    this.doMinEntryUpdate() // cluster started, send min update
  }

  /**
   * @param {String[]} shard_names 
   */
  startOnly(shard_names) {
    for (const shard of this.shards) {
      if (shard.shard_name in shard_names) {
        shard.start()
      }
    }
  }

  stop() {
    saveClusterEntry(this, this.getClusterEntry())

    for (const shard of this.shards) {
      shard.stop()
    }

    this.doMinEntryUpdate() // cluster shutdown send update
  }

  pause() {
    this.sendCommand(`SetServerPaused(true)`, true)
  }
  
  unpause() {
    this.sendCommand(`SetServerPaused(false)`, true)
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

  getClusterEntry() {
    const entry = {}
    entry.id = this.id
    entry.is_running = this.isRunning()
    entry.is_online = this.isOnline()
    entry.name = this.name
    entry.max_players = this.max_players
    entry.cur_players = this.cur_players
    entry.season = this.season
    entry.day = this.day

    return entry
  }

  doMinEntryUpdate() {
    const entry = this.getClusterEntry()
    this.io.to("entry_updates")
    .emit("min_update", {id: this.id, entry})
  }

  /**
   * @param {Shard} shard
   * @param {String} data
   */
  onShardStdout(shard, data) {
    handleShardOutput(this, shard, data)

    if (this.io) {
      this.io.to("full_updates/"+this.id)
      .emit("std_updates", {shard, data})
    }
  }

  /**
   * @param {{
   *  cur_players?: Number
   *  max_players?: Number
   *  season?: String
   *  day?: Number
   * }} world_data
   */
  onWorldDataUpdate(world_data) {
    for (const key in world_data) {
      this[key] = world_data[key]
    }

    this.doMinEntryUpdate()
  }

  delete() {
    const cluster_config_path = path.resolve(this.cluster_path, "cluster.ini")
    const master_config_path = path.resolve(this.cluster_path, "Master", "server.ini")
    if (!(existsSync(this.cluster_path)
      && existsSync(cluster_config_path)
      && existsSync(master_config_path))) {
      // if any of the files do not exists
      throw Error(`could not verify the cluster path of this object ${this.cluster_path}
      as represanting a valid cluster. delete operation aborted`)
    }

    rmSync(this.cluster_path, {recursive: true})
  }
}

export class Manager {
  /**
   * @constructor
   * @param {Server} io 
   * @param {String} cluster_token
   */
  constructor(io, cluster_token) {
    /**@type {Cluster[]} */
    this.clusters = {}
    this.io = io
    this.cluster_token = cluster_token
    this.scanned_ids = []

    for (const branch in getDataKey("branches_data")) {
      // only scan the conf root for each branch without recursion
      const conf_dir = path.resolve(getPersistentStorageRoot(), branch)
      restingWatch(conf_dir, {recursive: false}, 1000,
        (event, filename) => {
        this.onFsChange()
      })
    }
  }

  async registerCluster(
    cluster_path,
    cluster_token,
    branch_name,
    shard_codes,
  ) {
    const ww_config = await getWWClusterConfig(cluster_path)
    const uuid = ww_config.MANAGER_DATA.uuid
    const latest_entry = ww_config.entry
    this.scanned_ids.push(uuid)

    if (this.hasCluster(uuid)) {
      return
    }

    const cluster = new Cluster(uuid)
    .setup(
      shard_codes,
      cluster_path,
      cluster_token,
      branch_name,
      this.io
    )

    if (latest_entry) {
      for (const key in latest_entry) {
        cluster[key] = latest_entry[key]
      }
    }

    this.clusters[cluster.id] = cluster
  }

  async scanAndRegisterClusters() {
    const branches_data = getDataKey("branches_data")
    for (const branch_name in branches_data) {
      const branch_conf_dir = path.resolve(getPersistentStorageRoot(), branch_name)
      const cluster_dirs = getClusterDirsInDir(branch_conf_dir)

      for (const cluster_dir of cluster_dirs) {
        const cluster_path =
          path.resolve(branch_conf_dir, cluster_dir)
        const shard_names =
          getShardNamesInCluster(cluster_path)
        
        await this.registerCluster(
          cluster_path,
          this.cluster_token,
          branch_name,
          shard_names
        )
      }
    }
    this.io.emit("fs_scanned", ({message: "cluster rescan complete"}))
  }

  onFsChange() {
    // for (const id in this.clusters) {
    //   const cluster = this.getCluster(id)
    //   saveClusterEntry(cluster, cluster.getClusterEntry())
    // }
    
    // this.clusters = {} // clear all saved clusters for rescanning
    this.scanned_ids = [] // reset scanned ids list
    this.scanAndRegisterClusters().then(() => {
      const registered_clusters_ids = Object.keys(this.clusters)
  
      const none_existent_clusters_ids = registered_clusters_ids.filter(
        ((id) => {return !this.scanned_ids.includes(id)})
      )
  
      for (const id of none_existent_clusters_ids) {
        const cluster = this.getCluster(id)
        if (cluster) {
          cluster.stop()
        }
        delete this.clusters[id]
        console.log(`remove ${id}: ${cluster?.name}, represents a deleted / missing cluster`)
      }
    })
  }

  /**
   * @param {uuid} id 
   * @returns {Boolean}
   */
  hasCluster(id) {
    return Object.keys(this.clusters).includes(id)
  }

  /**
   * @param {uuid} id 
   * @returns {Cluster | undefined}
   */
  getCluster(id) {
    return this.clusters[id]
  }

  getClusterEntries() {
    const entries = []
    for (const id in this.clusters) {
      const cluster = this.getCluster(id)
      entries.push(cluster.getClusterEntry())
    }

    return entries
  }

  sendCommandToCluster(cmd, cluster_id) {
    /**@type {Cluster | undefined} */
    const cluster = this.clusters[cluster_id]
    if (cluster) {
      cluster.sendCommand(cmd, true)
    }
  }

  /**
   * @function
   * @description
   * creates a new cluster
   * under the specified branch
   * with the specified shards
   * the first shard will be designated the master shard
   * other properties of the cluster
   * may be modified after the fact
   * this function will also randomize the cluster_key property
   * @param {String} branch
   * @param {String} name 
   * @param {String} password 
   * @param {{name: String, id: Number}[]} shards 
   */
  createNewCluster(
    branch,
    name,
    password,
    shards
  ) {
    /**@type {Object.<string, {build_id: Number, time_updated: Date}>} */
    const branches = getDataKey("branches_data")
    if (!(Object.keys(branches).includes(branch))) {
      throw Error(`specified branch "${branch}" does not exists`)
    }
    const initial_server_port = 10999
    const cluster_dir = path.resolve(getPersistentStorageRoot(), branch, name)

    if (existsSync(cluster_dir)) {
      throw Error(`cluster with the directory name ${name} already exists, please use a different name`)
    }

    if (shards.length <= 0) {
      throw Error(`must specify at least one shard. received an array: ${shards}`)
    }

    const cluster_config = ClusterConfig.makeDefault()
    cluster_config.setConfigProperty("NETWORK", "cluster_name", name)
    cluster_config.setConfigProperty("NETWORK", "cluster_password", password)
    
    /**@type {ShardConfig[]} */
    const shard_configs = shards.map((shard, i) => {
      const config = ShardConfig.makeDefault()
      config.setConfigProperty("SHARD", "id", shard.id)
      config.setConfigProperty("SHARD", "is_master", i === 0)
      config.setConfigProperty("SHARD", "name", i === 0 ? "Master" : shard.name)
      config.setConfigProperty("NETWORK", "server_port", (initial_server_port-i))

      return config
    })

    mkdirSync(cluster_dir, {recursive: true})
    for (const shard of shard_configs) {
      mkdirSync(path.resolve(cluster_dir, shard.getConfigProperty("SHARD", "name")), {recursive: true})
    }

    writeConfigIni(path.resolve(cluster_dir, "cluster.ini"), cluster_config.compileConfig())
    for (const shard of shard_configs) {
      const shard_name = shard.getConfigProperty("SHARD", "name")
      writeConfigIni(path.resolve(cluster_dir, shard_name, "server.ini"), shard.compileConfig())
    }
  }
}