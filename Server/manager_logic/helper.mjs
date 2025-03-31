import os from 'node:os'
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { getDataKey } from '../data_writer.mjs';

export class IdManager {
  static count = 0;

  static getNewID() {
    IdManager.count++
    return IdManager.count
  }
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

/**
 * @param {Shard} shard 
 * @param {String} stdout_chunk 
 */
export function handleShardOutput(shard, stdout_chunk) {
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
}

export function getBranchInstallDir(branch_name) {
  return path.resolve(getDataKey("world_weaver_root"), "game_files", branch_name)
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

export function getPersistentDir() {
  const platform = os.platform()
  const homedir = os.homedir()
  console.log(platform)

  switch(platform) {
    case "win32":
      return path.resolve(homedir, "My Documents", "Klei")
    case "darwin":
      return path.resolve(homedir, "Documents", "Klei")
    case "linux":
      return path.resolve(homedir, ".klei")
    default:
      // manually insert persistent directory path
      throw Error("build not configured for os")
  }

  // console.log(os.version())
  // console.log(os.homedir())
  // /**@type {Dir} */
  // opendir(os.homedir(), (err, dir) => {
  //   let new_dir = dir.readSync()
  //   while(new_dir) {
  //     console.log(new_dir.name)
  //     new_dir = dir.readSync()
  //   }
  // })
}