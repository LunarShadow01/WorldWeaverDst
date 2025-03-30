import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const data_file = path.resolve(".", "data.json")

function validateStructure() {
  const base_data = {
    "example": "*default*",
    "steamcmd_dir": "",
    "game_files_dir": "",
    "clusters_dir": "",
    "jwt_secret": "",
    "jwt_secret_issued_date": "",
    "users": []
  }

  if (!existsSync(data_file)) {
    writeFileSync(data_file, JSON.stringify({}))
  }
  
  const data = readData()

  for (const key in base_data) {
    if (!data.hasOwnProperty(key)) {
      const default_value = base_data[key]
      data[key] = default_value
    }
  }

  delete data.example

  writeData(data)
}

export function readData() {
  const data = readFileSync(data_file)
  return JSON.parse(data)
}

export function writeData(data) {
  const json_string = JSON.stringify(data, null, " ")
  writeFileSync(data_file, json_string, {encoding: 'utf-8'})
}

export function getDataKey(key) {
  return readData()[key]
}

export function hasDataKey(key) {
  return readData().hasOwnProperty(key)
}

export function setDataKey(key, value) {
  const data = readData()
  data[key] = value
  writeData(data)
}

validateStructure()