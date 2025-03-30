import { spawn } from 'node:child_process'
import { getBranchInstallDir, getSteamCmd } from "./helper.mjs"

const dst_app_id = 343050
const game_branch = "public"
const steamcmd_file = getSteamCmd()
const install_dir = getBranchInstallDir(game_branch)
const launch_args = `+force_install_dir ${install_dir} +login anonymous`
const update_args = `${launch_args} +app_update ${dst_app_id} -beta ${game_branch}`

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

function updateGame() {
  runSteamCmd(`${update_args}`)
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

async function getAvailableBranches() {
  const app_data = await getAppData()
  const branches_data = extractBranchesData(app_data)
  const branches = []
  for (const key in branches_data) {
    branches.push(key)
  }

  return branches
}

// console.log(await getAvailableBranches())