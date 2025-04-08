import {writeFileSync} from 'node:fs'
import path from 'node:path'

let passed_tests = 0
let failed_tests = 0
let testing_log = ""
const addLog = (log) => {
  testing_log += `${log}\n`
  console.log(`${log}`)
}

export const addFailedTest = (log) => {
  testing_log += `${log} (✘)\n`
  console.log(`${log} (✘)`)
  failed_tests++
}

export const addPassedTest = (log) => {
  testing_log += `${log} (✓)\n`
  console.log(`${log} (✓)`)
  passed_tests++
}

export const endLogging = () => {
  addLog(`received back ${passed_tests + failed_tests} test reports\nout of which ${passed_tests} passed and ${failed_tests} failed`)
  writeFileSync(path.resolve(".", "tests", "output_log.txt"), testing_log)
}

export default addLog
