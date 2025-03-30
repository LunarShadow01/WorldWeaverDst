import { existsSync, readFileSync, writeFileSync } from "node:fs";
import express from "express";
import path from 'node:path'

import { cluster_token, game_dir } from "./manager_logic/constants.mjs";
import { Cluster } from "./manager_logic/server_objects.mjs";
import { Main } from "./backend_service/admin.mjs";

const data_file = path.resolve(".", "data.json")
const steamcmd_key = "steamcmd_dir"
const admin_app = express()

if (!existsSync(data_file)) {
  writeFileSync(data_file, JSON.stringify({}))
}

const cluster_dir = "Cluster_test"
/**@type {Cluster[]} */
const clusters = []

function main() {
  // const cluster = new Cluster()
  // .setup(["Master"], game_dir, cluster_dir, cluster_token)

  // cluster.start()
}

main()

admin_app.use("/", (req, res) => {
  const json_string = readFileSync(data_file)
  const data = JSON.parse(json_string)

  let steamcmd_dir = ""
  if (data.hasOwnProperty(steamcmd_key)) {
    steamcmd_dir = data[steamcmd_key]
  }

  res.send(Main({steamcmd_dir}))
})

admin_app.listen(3001, () => {
  console.log("listening on http://localhost:3001")
})