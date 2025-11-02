
export const pass_keys_storage_key = "world_weaver_pass_keys"

function encodeData(data) {
  var json_string = JSON.stringify(data)
  return encodeURIComponent(json_string)
}

function decodeData(data) {
  var json_string = decodeURIComponent(data)
  return JSON.parse(json_string)
}

export function setDataKey(key, data) {
  window.localStorage.setItem(key, encodeData(data))
}

export function getDataKey(key) {
  return decodeData(window.localStorage.getItem(key))
}

export function hasDataKey(key) {
  return window.localStorage.getItem(key) != null
}

export function clearDataKey(key) {
  window.localStorage.removeItem(key)
}