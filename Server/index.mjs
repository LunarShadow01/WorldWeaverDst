import { cluster_token, game_dir } from "./constants.mjs";
import { Cluster } from "./server_objects.mjs";
// const dir = "/mnt/c/"
const cluster_dir = "Cluster_test"

function main() {
  const cluster = new Cluster()
  .setup(["Master"], game_dir, cluster_dir, cluster_token)

  cluster.start()

}

main()