import { spawn } from 'node:child_process'
import { getBranchInstallDir, getSteamCmd } from "./helpers.mjs"
import { getDataKey, setDataKey } from '../data_writer.mjs'

const dst_app_id = 343050
const game_branch = "public"
const steamcmd_file = getSteamCmd()
const branch_update_processes = {}

const update_marks_key = "branch_update_marks"

function getArgsForBranch(branch_name) {
  const install_dir = getBranchInstallDir(branch_name)
  const launch_args = `+force_install_dir ${install_dir} +login anonymous`
  const update_args = `${launch_args} +app_update ${dst_app_id} -beta ${branch_name}`

  return {
    launch_args,
    update_args
  }
}
// const install_dir = getBranchInstallDir(game_branch)
// const launch_args = `+force_install_dir ${install_dir} +login anonymous`
// const update_args = `${launch_args} +app_update ${dst_app_id} -beta ${game_branch}`

function runSteamCmd(cmd) {
  const process = spawn(steamcmd_file, `${cmd} +quit`.split(" "))
  process.once("close", (code, signal) => {
    if (code !== 0) {
      console.error("steamcmd exited with an error code: ", code, " by signal: ", signal)
    } else {
      console.log("steamcmd process ended successfully by signal: ", signal)
    }
  })

  return process
}

export function updateGame(branch) {
  if (branch_update_processes[branch] !== null) {
    return createUpdatePromise(branch_update_processes[branch])
  }

  const {update_args} = getArgsForBranch(branch)
  const process = runSteamCmd(`${update_args}`)
  branch_update_processes[branch] = process

  // don't know whether a promise can have 2 resolves
  const promise = createUpdatePromise(process)
  promise.then(() => {
    const branch_update_marks = getDataKey(update_marks_key)
    branch_update_processes[branch] = null
    branch_update_marks[branch] = false
    setDataKey(update_marks_key, branch_update_marks)
  })
  return createUpdatePromise(process)
}

function createUpdatePromise(update_process) {
  return new Promise((resolve, reject) => {
    const error = []

    update_process.on("error", (err) => {
      error.push(err.toString())
    })

    update_process.once("close", (code) => {
      if (code !== 0) {
        reject()
      } else {
        resolve()
      }
    })
  })
}

async function getAppData() {
  const response = await fetch(
    `https://api.steamcmd.net/v1/info/${dst_app_id}`,
    {
      method: 'get',
    }
  )

  const reader = response.body.getReader()
  let data = await reader.read()
  let json_string = ""

  while(!data.done) {
    json_string += Buffer.from(data.value).toString()
    data = await reader.read()
  }

  return JSON.parse(json_string)
}

function extractBranchesData(app_data) {
  return app_data.data[dst_app_id].depots.branches
}

/**
 * @returns {String[]}
 */
function getAvailableBranches(branches_data) {
  const branches = []
  for (const key in branches_data) {
    branches.push(key)
  }

  return branches
}

/**
 * @function
 * @async
 * @returns {Promise<Object<string, boolean>>}
*/
async function checkForUpdates() {
  const app_data = await getAppData()
  const branches_data = extractBranchesData(app_data)
  const saved_branches_data = getDataKey("branches_data")
  /**@type {Object<string, boolean>} */ 
  const branch_update_marks = {}

  for (const branch_name in branches_data) {
    const branch_data = branches_data[branch_name]
    const build_id = branch_data.buildid // game version
    const time_updated = new Date(branch_data.timeupdated * 1000) // update time
    
    const old_version = saved_branches_data[branch_name]?.build_id
    const update_available = build_id > (old_version ? old_version : -1)
    branch_update_marks[branch_name] = update_available
    
    saved_branches_data[branch_name] = {
      build_id,
      time_updated
    }
  }

  setDataKey("branches_data", saved_branches_data)
  setDataKey(update_marks_key, branch_update_marks)
}

export function startUpdatesInterval() {
  const check_interval = 5 * 60 * 1000 // 5 minutes
  setInterval(async () => {
    await checkForUpdates()
    // for (const key in update_marks) {
    //   const should_update = update_marks[key]
    //   if (should_update) {
    //     // mark all clusters of the branch to be updated
    //   }
    // }
  }, check_interval);
}

export function isUpdateQueued(branch_name) {
  const branch_update_marks = getDataKey(update_marks_key)
  return branch_update_marks[branch_name]
}