import {writeFileSync} from 'node:fs'
import path from 'node:path'

let testing_log = ""
const addLog = (log) => {
  testing_log += `${log}\n`
  console.log(`${log}`)
}

export const addFailedTest = (log) => {
  testing_log += `${log} (✘)\n`
  console.log(`${log} (✘)`)
}

export const addPassedTest = (log) => {
  testing_log += `${log} (✓)\n`
  console.log(`${log} (✓)`)
}

export const endLogging = () => {
  writeFileSync(path.resolve(".", "tests", "output_log.txt"), testing_log)
}

export default addLog
