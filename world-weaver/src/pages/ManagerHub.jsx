import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Socket } from 'socket.io-client'

import { useSocket } from '../context/SocketContext'
import { getDataKey, hasDataKey, setDataKey } from '../scripts/storage'

import ServerEntry from '../components/ServerEntry'

const tokens_storage_key = "manager_tokens"

/**
 * @typedef {{
 * server_name: String,
 * cur_player_count: Number,
 * max_player_count: Number,
 * is_running: Boolean,
 * }} serverEntry
 */
export default function ManagerHub() {
  const navigate = useNavigate()
  const params = useParams()
  const manager_ip = params.manager_ip

  const [user_token, setUserToken] = useState(null)
  /**@type {[server_entries: serverEntry[], setServerEntries: React.Dispatch<React.SetStateAction<serverEntry[]>>]}  */
  const [server_entries, setServerEntries] = useState([])
  
  /**
   * @type {{
   * socket: Socket,
   * connectTo: (ip: String) => {},
   * asyncEmit: (
   *  reqEvent: String,
   *  resEvent: String,
   *  data: *
   *  ) => Promise
   * }}
   */
  const {socket, connectTo, asyncEmit} = useSocket()
  useEffect(() => {
    connectTo(manager_ip)
  }, [manager_ip])

  // every time we first render / the socket is reconnected
  useEffect(async () => {
  // if we have a valid socket
  if (socket) {  
    // make sure we have this object in storage
    if (!hasDataKey(tokens_storage_key)) {
      setDataKey(tokens_storage_key, {})
    }
    
    const tokens = getDataKey(tokens_storage_key)
    if (!(manager_ip in tokens)) {
      // if we don't have a token for this manager -> go to login
      navigate("/manager/"+manager_ip+"/login")
    } else {
      try {

        // if we have a token -> verify it
        const res = await asyncEmit("verify_token", "token_verified", {
          user_token: tokens[manager_ip]
        })
        
        // if the token is invalid for any reason -> go to login
        if (!res.res) {
          delete tokens[manager_ip]
          navigate("/manager/"+manager_ip+"/login")
        }
      } catch (err) {
        console.error(err)
      }
    }
    // if we don't get redirected than
    // we expect to have a valid token for making requests with
    setUserToken(tokens[manager_ip])
  }
  }, [socket])

  useEffect(async () => {
    if (socket && user_token) {
      try {
        const servers_response = await asyncEmit("get_servers", "server_entries", {user_token}) 
        setServerEntries(servers_response.servers)
      } catch (err) {
        console.error(err)
      }
    }
  }, [user_token])

  return (
    <div>
      {server_entries.map((server_entry, i) => {
        return <ServerEntry
          key={i}
          manager_ip={manager_ip}
          server_name={server_entry.server_name}
          cur_player_count={server_entry.cur_player_count}
          max_player_count={server_entry.max_player_count}
          is_running={server_entry.is_running}
          />
      })}
    </div>
  )
}
