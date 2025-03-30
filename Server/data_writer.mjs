import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const data_file = path.resolve(".", "data.json")

if (!existsSync(data_file)) {
  writeFileSync(data_file, JSON.stringify({}))
}

export function getData() {
  const data = readFileSync(data_file)
  return JSON.parse(data)
}

export function writeData(data) {
  const json_string = JSON.stringify(data)
  writeFileSync(data_file, json_string)
}

export function getDataKey(key) {
  return getData()[key]
}

export function hasDataKey(key) {
  return getData().hasOwnProperty(key)
}

export function setDataKey(key, value) {
  const data = getData()
  data[key] = value
  writeData(data)
}

