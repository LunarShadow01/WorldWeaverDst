import { cluster_token } from "./manager_logic/constants.mjs";
import { checkDefinedDirs, makeDefinedDirs } from "./manager_logic/helper.mjs";
import { Manager } from "./manager_logic/server_objects.mjs";

function main() {
  if (!checkDefinedDirs()) {
    makeDefinedDirs()
  }

  const manager = new Manager(null, cluster_token)
  
  manager.scanAndRegisterClusters()
  // console.log(manager.clusters)

  // manager.clusters['1'].start()
}

main()