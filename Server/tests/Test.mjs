import testManager from './LiveManagerTests.mjs'
import testSocketIO from './SocketTests.mjs'
import testSteamCmd from './SteamCmdTests.mjs'
import addLog, { endLogging } from './TestLogger.mjs'


addLog("launched automated testing")

addLog("")
addLog("")
await testSteamCmd()

addLog("")
addLog("")
await testSocketIO()

addLog("")
addLog("")
await testManager()

addLog("automated testing concluded")

endLogging()