import os from 'node:os'
import { readFileSync, existsSync, opendirSync, mkdirSync } from "node:fs";
import path from "node:path";
import { parse as iniParse } from 'ini';

import { getDataKey } from '../data_writer.mjs';
import { Cluster, Shard } from './server_objects.mjs';

export class IdManager {
  static count = 0;

  static getNewID() {
    IdManager.count++
    return IdManager.count
  }
}

export function getClusterConfig(cluster_dir) {
  const conf_path = path.resolve(cluster_dir, "cluster.ini")
  if (!existsSync(conf_path)) {
    return null
  }

  const content = readFileSync(conf_path, {encoding: "utf-8"})
  const conf = iniParse(content, {bracketedArray: true})

  return conf

}

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

  if (shard.is_master
    && stdout_chunk.includes(update_data_string)) {
    const world_data = extractWorldWeaverData(stdout_chunk)

    cluster.onWorldDataUpdate(world_data)
  }
}

export function getBranchInstallDir(branch_name) {
  return path.resolve(getDataKey("world_weaver_root"), "GameFiles", branch_name)
}

export function getPersistentStorageRoot() {
  return path.resolve(getDataKey("world_weaver_root"), "DoNotStarveTogether")
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

export function makeDefinedDirs() {
  const branches_data = getDataKey("branches_data")
  const persistent_storage_root = getPersistentStorageRoot()
  for (const branch_name in branches_data) {
    const install_dir = getBranchInstallDir(branch_name)
    mkdirSync(install_dir, {
      recursive: true
    }, () => {})

    const conf_dir = path.resolve(
      persistent_storage_root, branch_name
    )
    mkdirSync(conf_dir, {
      recursive: true
    }, () => {})
  }
}

export function checkDefinedDirs() {
  const branches_data = getDataKey("branches_data")
  const persistent_storage_root = getPersistentStorageRoot()

  let allPathsExist = true
  for (const branch_name in branches_data) {
    const install_dir = getBranchInstallDir(branch_name)
    allPathsExist &= existsSync(install_dir)

    const conf_dir = path.resolve(
      persistent_storage_root, branch_name
    )
    allPathsExist &= existsSync(conf_dir)

    if (!allPathsExist) {
      break;
    }
  }

  return allPathsExist
}