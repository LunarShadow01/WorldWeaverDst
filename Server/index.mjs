import path from "node:path";
import { Cluster } from "./server_objects.mjs";

export const dirname = path.dirname(import.meta.url)
const dir = "C:/"
const game_files_dir_name = "game_files"
const clusters_dir_name = "clusters"

const game_dir = dir+"WorkingSpace/Software/Steam/steamapps/common/Don't Starve Together Dedicated Server"
// const game_dir = path.resolve(dirname, game_files_dir_name)
const clusters_dir = path.resolve(dirname, clusters_dir_name)
const cluster_name = "Cluster_test"
const cluster_token = "pds-g^KU_dwt6dsdZ^+o+0rGzyzVvBOihj4Howjh+Z51zfOU7n2B60QescaY4="

function main() {
  const cluster = new Cluster()
  .setup(["Master"], game_dir, clusters_dir, cluster_name, cluster_token)

  cluster.start()

}

main()