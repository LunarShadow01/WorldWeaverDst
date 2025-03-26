import path from "node:path";
import { Cluster } from "./server_objects.mjs";

export const dirname = path.dirname(import.meta.url)
// const dir = "/mnt/c/"
const dir = "C:/"
const game_dir = dir+"WorkingSpace/Software/Steam/steamapps/common/Don't Starve Together Dedicated Server"
const cluster_dir = "Cluster_test"
const cluster_token = "pds-g^KU_dwt6dsdZ^+o+0rGzyzVvBOihj4Howjh+Z51zfOU7n2B60QescaY4="

function main() {
  const cluster = new Cluster()
  .setup(["Master"], game_dir, cluster_dir, cluster_token)

  cluster.start()

}

main()