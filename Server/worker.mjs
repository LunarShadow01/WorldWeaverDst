import { parseShardOutput } from "./manager_logic/helpers.mjs";
import assert from 'node:assert'
import path from "node:path";
import { Worker, MessageChannel, MessagePort, isMainThread, parentPort } from "node:worker_threads";

/**
 * @returns {Worker | null}
 */
const createWorker = async () => {
  if (isMainThread) {
    const worker = new Worker(path.resolve(".", "worker.mjs"))
    const sub_channel = new MessageChannel()
    worker.postMessage({parent_channel_port: sub_channel.port1}, [sub_channel.port1])
    await new Promise((resolve, reject) => {
      sub_channel.port2.on("message", (value) => {
        console.log(value)
        resolve()
      })
      setTimeout(() => {
        reject("worker initialization timed out")
      }, 5000);
    })
    return worker
  } else {
    let parent_port = null
    parentPort.on("message", (value) => {
      assert(value.parent_channel_port instanceof MessagePort)
      parent_port = value.parent_channel_port
      parent_port.postMessage("received channel port")
      // parent_port.close()
    })

    parentPort.on("parse_shard_output", (cluster_id, shard, stdout_chunk) => {
      const promise = new Promise((resolve, reject) => {
        const parsed = parseShardOutput(shard, stdout_chunk)
        if (parsed) {
          resolve({cluster_id, parsed})
        } else {
          reject("could not parse stdout chunk")
        }
      })

      promise.then(({cluster_id, parsed}) => {
        assert(parent_port instanceof MessagePort)
        parent_port.emit("parsed_shard_output", {cluster_id, parsed})
      }).catch((err) => {
        console.error(err)
      })
    })
  }
  return null
}

if (!isMainThread) {
  createWorker()
}

export default createWorker