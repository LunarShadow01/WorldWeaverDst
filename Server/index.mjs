import io, { ioConnectManager } from "./backend_service/server.mjs";
import { cluster_token } from "./manager_logic/constants.mjs";
import { checkDefinedDirs, makeDefinedDirs } from "./manager_logic/helper.mjs";
import { Manager } from "./manager_logic/server_objects.mjs";

function main() {
  if (!checkDefinedDirs()) {
    makeDefinedDirs()
  }

  const manager = new Manager(io, cluster_token)
  manager.scanAndRegisterClusters()

  ioConnectManager(manager)
}

main()