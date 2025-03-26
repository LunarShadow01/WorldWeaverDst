import { readFileSync, existsSync } from "node:fs";
import path from "node:path";


export function loadLuaFile(dirname, filename) {
  const file = path.resolve(dirname, "lua", filename)
  if (!existsSync(file)) {
    return
  }

  const content = readFileSync(file, {encoding: "utf-8"})
  return content
}