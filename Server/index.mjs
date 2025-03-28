import { cluster_token, game_dir } from "./manager_logic/constants.mjs";
import { Cluster } from "./manager_logic/server_objects.mjs";
// const dir = "/mnt/c/"
const cluster_dir = "Cluster_test"
/**@type {Cluster[]} */
const clusters = []

function main() {
  const cluster = new Cluster()
  .setup(["Master"], game_dir, cluster_dir, cluster_token)

  cluster.start()
}

main()