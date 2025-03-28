import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Routes, Route, useLocation } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'

import ServerEntry from '../components/ServerEntry'
import ManagerLogin from './ManagerLogin'
import { getDataKey, hasDataKey, setDataKey } from '../scripts/storage'

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
  const location = useLocation()
  const params = useParams()
  const manager_ip = params.manager_ip
  
  const socket = io("ws://"+manager_ip)
  const [user_token, setUserToken] = useState("")

  useEffect(() => {
    if (!hasDataKey(tokens_storage_key)) {
      setDataKey(tokens_storage_key, {})
    }

    const tokens = getDataKey(tokens_storage_key)
    if (!(manager_ip in tokens)) {
      navigate(location.pathname+"/login")
    } else {
      socket.once("token_verified", ({res}) => {
        if (res) {
          setUserToken(tokens[manager_ip])
        } else {
          navigate(location.pathname+"/login")
        }
      })
      socket.emit("verify_token",
        {user_token: tokens[manager_ip]})
    }
  }, [manager_ip])

  return (
    <div>
      <Routes>
        <Route path={`/`} element={<HubMain socket={socket}/>}></Route>
        <Route path={`/login`} element={<ManagerLogin socket={socket} setUserToken={setUserToken}/>}></Route>
      </Routes>
    </div>
  )
}

/**
 * @param {Object} props
 * @param {Socket} props.socket 
 * @returns 
 */
function HubMain({socket}) {
  const params = useParams()
  const manager_ip = params.manager_ip

  /**
   * @type {[
   *   server_entries: serverEntry[],
   *   setServerEntries: React.Dispatch<React.SetStateAction<serverEntry[]>>
   * ]} 
   */
  const [server_entries, setServerEntries] = useState([])
  
  useEffect(() => {
    const tokens = getDataKey(tokens_storage_key)
    const user_token = tokens[manager_ip]

    socket.once("server_entries", ({servers}) => {
      setServerEntries(servers)
    })
    socket.emit("get_servers", {user_token})    
  }, [manager_ip])
  
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