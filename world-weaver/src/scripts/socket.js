/**
 * @param {Socket} socket 
 * @param {() => {}} cb 
 */
export const doSocketCb = (socket, cb) => {
  if (socket != null) {
    if (socket.connected) {
      cb()
    } else {
      socket.once("connect", cb)
    }
  }
}