import os from 'node:os'
import { readFileSync, existsSync, opendirSync, mkdir, access, writeFile, readFile, watch, writeFileSync } from "node:fs";
import { constants as fs_consts } from 'node:fs';
import { inspect, promisify } from 'node:util';
import path from "node:path";
import { parse as iniParse, stringify as iniStringify } from 'ini';

import { getDataKey } from '../data_writer.mjs';
import { Cluster, Shard } from './server_objects.mjs';
import { randomUUID } from 'node:crypto';
// import createWorker from '../worker.mjs';
// import { isMainThread } from 'node:worker_threads';

// if (worker) {
//   console.log(worker)
// }
// let worker = null
// if (isMainThread) {
//   worker = await createWorker()
// }
// console.log(await createWorker())

const mkdirAsync = promisify(mkdir)
const exists = (test_path) => {
  return new Promise((resolve, reject) => {
    access(test_path, (err) => {
      if (err) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

//#region shard output handling
export function loadLuaFile(dirname, filename) {
  const file = path.resolve(dirname, "lua", filename)
  if (!existsSync(file)) {
    return null
  }

  let content = readFileSync(file, {encoding: "utf-8"})
  content = content.replaceAll(new RegExp("--.*?[\r\n]", "g"), "\n")
  content = " ".concat(content.split())
  content = content.replaceAll("\n", " ")
  return content
}

const world_active_string = "World generated on build"
const rollback_sent_string = "Received world rollback request"
const token_invalid_string = "E_INVALID_TOKEN"
const token_expired_string = "E_EXPIRED_TOKEN"
const update_data_string = "WorldWeaverData"
const paused_string = "Sim paused"
const unpaused_string = "Sim unpaused"

/**
 * @param {String} stdout_chunk
 * @returns 
 */
function extractWorldWeaverData(stdout_chunk) {
  const re = new RegExp(`${update_data_string}={.*}`, "g")
  const snippets = Array.from(stdout_chunk.matchAll(re))
  .map((value) => {
    return value[0].split("=")[1]
  })
  const last_snippet = snippets[snippets.length - 1]
  return JSON.parse(last_snippet, null, "")
}

/**
 * @param {Cluster} cluster 
 * @param {Shard} shard 
 * @param {String} stdout_chunk 
 */
export function handleShardOutput(cluster, shard, stdout_chunk) {
  if (stdout_chunk === null || stdout_chunk === undefined) {
    return
  }

  if (stdout_chunk.includes(world_active_string)) {
    shard.onWorldActive()
  }

  if (stdout_chunk.includes(rollback_sent_string)) {
    shard.onRollback()
  }

  if (stdout_chunk.includes(token_expired_string)) {
    // todo
  }

  if (stdout_chunk.includes(token_invalid_string)) {
    // todo
  }

  if (shard.is_master) {
    if (stdout_chunk.includes(update_data_string)) {
      const world_data = extractWorldWeaverData(stdout_chunk)

      cluster.onWorldDataUpdate(world_data)
    }

    if (stdout_chunk.includes(paused_string)) {
      shard.is_paused = true
    } else if (stdout_chunk.includes(unpaused_string)) {
      shard.is_paused = false
    }
  }
}

export function parseShardOutput(shard, stdout_chunk) {
  const results = {
    world_active: stdout_chunk.includes(world_active_string),
    rollbacking: stdout_chunk.includes(rollback_sent_string),
    token_expired: stdout_chunk.includes(token_expired_string),
    token_invalid: stdout_chunk.includes(token_invalid_string),
  }

  if (shard.is_master) {
    if (stdout_chunk.includes(update_data_string)) {
      results.world_data = extractWorldWeaverData(stdout_chunk)
    }

    if (stdout_chunk.includes(paused_string)) {
      results.is_paused = true
    } else if (stdout_chunk.includes(unpaused_string)) {
      results.is_paused = false
    }
  }
}
//#endregion

//#region file system computing
export function getBranchInstallDir(branch_name) {
  return path.resolve(getDataKey("world_weaver_root"), "GameFiles", branch_name)
}

export function getBranchExecutable(branch_name) {
  const bin64_path = path.resolve(getBranchInstallDir(branch_name), "bin64")
  if (!existsSync(bin64_path)) {
    return ""
  }
  const dir = opendirSync(bin64_path)
  let ent = dir.readSync()
  while (ent) {
    if (ent.isFile() && ent.name.includes("dontstarve_dedicated")) {
      dir.close()
      return path.resolve(ent.parentPath, ent.name)
    }
    ent = dir.readSync()
  }
  dir.close()
  return ""
}

export function getPersistentStorageRoot() {
  return path.resolve(getDataKey("world_weaver_root"), "DoNotStarveTogether")
}

export function getBackupsRoot() {
  return path.resolve(getDataKey("world_weaver_root"), "Backups")
}

export function getSteamCmd() {
  const steamcmd_dir = getDataKey("steamcmd_dir")

  const platform = os.platform()
  switch(platform) {
    case "win32": // windows both 32 and 64 bit
      return path.resolve(steamcmd_dir, "steamcmd.exe")
    case "darwin": // macos
      return path.resolve(steamcmd_dir, "steamcmd.sh")
    default: // linux and probably unix variants (BSD, etc)
    case "linux":
      return path.resolve(steamcmd_dir, "steamcmd.sh")
  }
}

/**
 * @param {String} dir_path 
 * @returns {String[]}
 */
export function getClusterDirsInDir(dir_path) {
  if (!existsSync(dir_path)) {
    return []
  }

  const dir = opendirSync(dir_path)
  const cluster_dirs = []
  let dir_entry = dir.readSync()
  while (dir_entry) {
    if (!dir_entry.isDirectory()) {
      dir_entry = dir.readSync()
      continue
    }

    const cluster_ini_path =
      path.resolve(dir_path, dir_entry.name, "cluster.ini")
    if (existsSync(cluster_ini_path)) {
      cluster_dirs.push(dir_entry.name)
    }

    dir_entry = dir.readSync()
  }

  dir.close()

  return cluster_dirs
}

/**
 * @param {String} dir_path 
 * @returns {String[]}
 */
export function getShardNamesInCluster(cluster_path) {
  const shard_names = []
  const dir = opendirSync(cluster_path)
  let dir_entry = dir.readSync()
  while(dir_entry) {
    const server_ini_path =
      path.resolve(cluster_path, dir_entry.name, "server.ini")
    if (dir_entry.isDirectory()
      && existsSync(server_ini_path)) {
      shard_names.push(dir_entry.name)
    }

    dir_entry = dir.readSync()
  }

  dir.close()
  
  return shard_names
}

export async function makeDefinedDirs() {
  const branches_data = getDataKey("branches_data")
  const persistent_storage_root = getPersistentStorageRoot()
  const promises = []
  for (const branch_name in branches_data) {
    const install_dir = getBranchInstallDir(branch_name)
    const install_promise = mkdirAsync(install_dir, {
      recursive: true
    })

    const conf_dir = path.resolve(
      persistent_storage_root, branch_name
    )
    const conf_promise = mkdirAsync(conf_dir, {
      recursive: true
    }, () => {})

    const backups_dir = path.resolve(getBackupsRoot(), branch_name)
    const backups_promise = mkdirAsync(backups_dir, {
      recursive: true
    }, () => {})

    promises.push(install_promise, conf_promise, backups_promise)
  }
  await Promise.all(promises)
}

export async function checkDefinedDirs() {
  const branches_data = getDataKey("branches_data")
  const persistent_storage_root = getPersistentStorageRoot()
  const promises = []

  for (const branch_name in branches_data) {
    const install_dir = getBranchInstallDir(branch_name)
    promises.push(exists(install_dir, fs_consts.F_OK))
    
    const conf_dir = path.resolve(
      persistent_storage_root, branch_name
    )
    promises.push(exists(conf_dir, fs_consts.F_OK))
    
    const backups_dir = path.resolve(getBackupsRoot(), branch_name)
    promises.push(exists(backups_dir, fs_consts.F_OK))
  }

  const results = await Promise.all(promises)
  const do_paths_exists = results.reduce((pre, cur) => {
    return pre && cur
  }, true)
  
  return do_paths_exists
}

/**
 * @param {String | import('node:fs').PathLike} watch_path 
 * @param {import('node:fs').WatchOptions} options 
 * @param {Number} resting_duration 
 * @param {(event: import('node:fs').WatchEventType, filename: String | null) => {}} callback 
 */
export function restingWatch(watch_path, options, resting_duration, callback) {
  if (!existsSync(watch_path)) {
    throw Error(`could not find fs path: "${watch_path}"`)
  }
  let timeout_task

  watch(watch_path, options, (event, filename) => {
    if (filename) {
      if (timeout_task) {
        clearTimeout(timeout_task)
      }

      timeout_task = setTimeout(() => {
        callback(event, filename)
      }, resting_duration);
    }
  })

}
//#endregion

//#region world weaver independent cluster configurations
/**
 * @param {String} cluster_path 
 * @param {Object} config_data 
 * @returns {Promise<any>}
 */
export function setWWClusterConfig(cluster_path, config_data) {
  const config_path = path.resolve(cluster_path, "ww_config.ini")
  writeConfigIni(config_path, config_data)
}

/**
 * @param {String} cluster_path 
 * @returns {Object}
 */
export function getWWClusterConfig(cluster_path) {
  const config_path = path.resolve(cluster_path, "ww_config.ini")
  if (!existsSync(config_path)) {
    setWWClusterConfig(cluster_path, {
      MANAGER_DATA: {
        uuid: randomUUID(),
      }
    })
  }

  try {
    const config_data = readConfigIni(config_path)
    return config_data
  } catch (err) {
    console.error(err)
  }
}

/**
 * @param {Cluster} cluster
 * @param {Object} entry
 */
export async function saveClusterEntry(cluster, entry) {
  const config_data = await getWWClusterConfig(cluster.cluster_path)
  config_data.entry = {}
  config_data.entry.day = entry.day
  config_data.entry.season = entry.season

  await setWWClusterConfig(cluster.cluster_path, config_data)
}
//#endregion

//#region config ini fs access
/**
 * @param {String} file_path 
 * @returns {Object}
 * @throws {Error}
 */
export function readConfigIni(file_path) {
  if (!existsSync(file_path)) {
    throw Error(`file does not exist at the specified path ${file_path}`)
  }

  const data = readFileSync(file_path, 'utf-8')
  const config = iniParse(data)

  return config
}

/**
 * @param {String} file_path 
 * @param {Object} config 
 * @returns {Promise<any>}
 * @throws {Error}
 */
export function writeConfigIni(file_path, config) {
  const data = iniStringify(config)
  writeFileSync(file_path, data, {encoding: 'utf-8'})
}
//#endregion

//#region cluster/shard config helpers
const default_cluster_sections = {
  "GAMEPLAY": {
    game_mode: "survival",
    max_players: 20,
    pvp: false,
    pause_when_empty: true,
  },
  "NETWORK": {
    lan_only_cluster: false,
    cluster_password: "", // no password
    cluster_description: "a default cluster description",
    cluster_name: "cluster name",
    offline_cluster: false,
    cluster_language: "en",
  },
  "MISC": {
    console_enabled: true,
  }, 
  "SHARD": {
    shard_enabled: true,
    bind_ip: "127.0.0.1",
    master_ip: "127.0.0.1",
    master_port: 10888,
    cluster_key: "defaultPass",
  },
}

const default_shard_sections = {
  "NETWORK": {
    server_port: 10998,
  },

  "SHARD": {
    is_master: false,
    name: "Caves",
    id: 2
  },

  "ACCOUNT": {
    encode_user_path: true,
  },

  "STEAM": {
    master_server_port: 27017,
    authentication_port: 8767,
  },
}

export class ConfigSection {
  constructor(name) {
    this.name = name
    this.values = {}
  }
}

export class IniConfig {
  constructor() {
    /**@type {ConfigSection[]} */
    this.sections = []
  }

  static makeDefault() {
    const config = new IniConfig()

    return config
  }

  static makeFromFile(file_path) {
    const config_data = readConfigIni(file_path)
    const config = this.makeDefault()
    for (const section_name in config_data) {
      const section = config.getSection(section_name)
      if (section === null) {
        continue
      }
      for (const key in config_data[section_name]) {
        section.values[key] = config_data[section_name][key]
      }
    }

    return config
  }

  /**
   * @param {String} section 
   * @param {String} key 
   * @param {any} new_value 
   */
  setConfigProperty(section, key, new_value) {
    if (this.getSection(section)) {
      this.getSection(section).values[key] = new_value
    }
  }

  /**
   * @param {String} section 
   * @param {String} key 
   * @returns {undefined | any}
   */
  getConfigProperty(section, key) {
    return this.getSection(section)?.values[key]
  }

  getSection(name) {
    for (const section of this.sections) {
      if (section.name === name) {
        return section
      }
    }
    return null
  }
  
  compileConfig() {
    const config_data = {}
    for (const section of this.sections) {
      config_data[section.name] = {}
      for (const key in section.values) {
        const value = section.values[key]
        config_data[section.name][key] = value
      }
    }

    return config_data
  }
}

export class ClusterConfig extends IniConfig {
  constructor() {
    super()
  }
  
  /**
   * @returns {ClusterConfig}
   */
  static makeDefault() {
    const config = new ClusterConfig()
    for (const name in default_cluster_sections) {
      const section = new ConfigSection(name)
      for (const key in default_cluster_sections[name]) {
        const value = default_cluster_sections[name][key]
        section.values[key] = value
      }
      config.sections.push(section) 
    }

    return config
  }
}

export class ShardConfig extends IniConfig {
  constructor() {
    super()
  }
  
  /**
   * @returns {ClusterConfig}
   */
  static makeDefault() {
    const config = new ClusterConfig()
    for (const name in default_shard_sections) {
      const section = new ConfigSection(name)
      for (const key in default_shard_sections[name]) {
        const value = default_shard_sections[name][key]
        section.values[key] = value
      }
      config.sections.push(section) 
    }

    return config
  }
}
//#endregion


