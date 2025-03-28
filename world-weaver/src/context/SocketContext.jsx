import { io } from 'socket.io-client'
import React, { createContext, useContext, useState } from 'react'

const SocketContext = createContext(io());

export const useSocket = () => {
  return useContext(SocketContext);
}

export const SocketProvider = ({children}) => {
  const [socket, setSocket] = useState(null)

  const connectTo = (ip_or_domain) => {
    console.log("connecting to socket on ip/domain", ip_or_domain)
    setSocket(io("ws://"+ip_or_domain))
  }

  function asyncEmit(reqEvent, resEvent, data) {
    return new Promise(function (resolve, reject) {
      if (socket === null) {
        reject("socket is null")
      }
      socket.emit(reqEvent, data);
      socket.once(resEvent, result => {
        resolve(result);
      });
      setTimeout(reject, 1000);
    });
  }
  
  return (
    <SocketContext.Provider value={{
      socket,
      connectTo,
      asyncEmit,
      }}>
        {children}
    </SocketContext.Provider>
  )
}