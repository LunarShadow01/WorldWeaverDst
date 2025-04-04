import { extractBranchesData, getAppData, getArgsForBranch, runSteamCmd } from "../manager_logic/steamcmd.mjs";
import addLog, { addFailedTest, addPassedTest } from "./TestLogger.mjs";

const testSteamCmd = async () => {
  addLog("# steamcmd tests: ")

  addLog("quering steamcmd for app data")
  const app_data = await getAppData()
  if (app_data) {
    addPassedTest(`received back valid app data ${app_data}`)
  } else {
    addFailedTest(`app data is not a valid object got: ${app_data}`)
  }

  addLog("extracting branch data from app data")
  const branch_data = extractBranchesData(app_data)
  if (branch_data) {
    addPassedTest(`got back branch data ${branch_data}`)
  } else {
    addFailedTest(`could not extract branch data from app data, got ${branch_data}`)
  }

  addLog("getting steamcmd arguments for public (main) branch")
  const {launch_args, update_args} = getArgsForBranch("public")
  if (launch_args) {
    addPassedTest(`launch arguments received: ${launch_args}`)
  } else {
    addFailedTest(`launch arguments received: ${launch_args}`)
  }
  
  if (update_args) {
    addPassedTest(`update arguments received: ${launch_args}`)
  } else {
    addFailedTest(`update arguments received: ${launch_args}`)
  }

  addLog("attempting to run a steamcmd process")
  const process = runSteamCmd(`${launch_args}`)

  const steamcmd_promise = new Promise((resolve, reject) => {
    const task = setTimeout(() => {
      reject("steamcmd process too long to close")
    }, 30 * 1000);

    process.once("close", (code, signal) => {
      clearTimeout(task)
      if (code === 0) {
        resolve("steamcmd process ended successfully")
      } else {
        reject(`steamcmd process ended with an error code: ${code}`)
      }
    })
  })
  try {
    const res = await steamcmd_promise
    addPassedTest(res)
  } catch (err) {
    addFailedTest(err)
  }

  addLog("end of client steamcmd testing")
}

export default testSteamCmd