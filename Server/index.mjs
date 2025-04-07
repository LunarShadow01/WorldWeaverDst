import io, { ioConnectManager } from "./backend_service/server.mjs";
import { getDataKey } from "./data_writer.mjs";
import { cluster_token } from "./manager_logic/constants.mjs";
import { checkDefinedDirs, getPersistentStorageRoot, makeDefinedDirs, restingWatch } from "./manager_logic/helpers.mjs";
import { Manager } from "./manager_logic/server_objects.mjs";
import { checkForUpdates } from "./manager_logic/steamcmd.mjs";

async function main() {
  if (Object.keys(getDataKey("branches_data")).length <= 0) {
    await checkForUpdates()
  }
  if (!await checkDefinedDirs()) {
    await makeDefinedDirs()
  }

  const manager = new Manager(io, cluster_token)
  manager.scanAndRegisterClusters()
  restingWatch(getPersistentStorageRoot(), {recursive: true}, 300, (event, filename) => {
    manager.scanAndRegisterClusters()
  })

  ioConnectManager(manager)
}

main()