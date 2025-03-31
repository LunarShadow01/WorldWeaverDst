import { cluster_token, game_dir } from "./manager_logic/constants.mjs";
import { makeDefinedDirs } from "./manager_logic/helper.mjs";
import { Cluster, Manager } from "./manager_logic/server_objects.mjs";
// const dir = "/mnt/c/"
const cluster_dir = "Cluster_test"
/**@type {Cluster[]} */
const clusters = []

function main() {
  // makeDefinedDirs()
  const manager = new Manager(null)
  
  manager.scanAndRegisterClusters()
  console.log(manager.clusters)
  // getPersistentDir()
  // const cluster = new Cluster()
  // .setup(["Master"], game_dir, cluster_dir, cluster_token, "public")

  // cluster.start()
}

main()