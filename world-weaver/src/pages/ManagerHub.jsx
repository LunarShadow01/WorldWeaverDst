import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Routes, Route, useLocation } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'

import ServerEntry from '../components/ServerEntry'
import ManagerLogin from './ManagerLogin'
import { getDataKey, hasDataKey, setDataKey, tokens_storage_key } from '../scripts/storage'
import ServerPage from './ServerPage'

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
  const manager_ip = params.ip
  
  const socket = io("ws://"+manager_ip)
  const [user_token, setUserToken] = useState("")

  useEffect(() => {
    if (!hasDataKey(tokens_storage_key)) {
      setDataKey(tokens_storage_key, {})
    }

    const tokens = getDataKey(tokens_storage_key)
    if (!(tokens.hasOwnProperty(manager_ip))) {
      console.log(manager_ip)
      console.log(tokens)
      navigate(`/manager/${manager_ip}/login`)
      console.log("could not find token in storage")
    } else {
      socket.once("token_verified", ({res}) => {
        if (res) {
          setUserToken(tokens[manager_ip])
          console.log("using token from storage")
        } else {
          navigate(`/manager/${manager_ip}/login`)
          console.log("token from storage could not be verified")
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
        <Route path={`/cluster/:id`} element={<ServerPage/>}></Route>
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
  const manager_ip = params.ip

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
    <div className='flex flex-col items-center justify-center w-full gap-y-2'>
      <div className='flex items-center justify-center
        bg-secondary p-4 w-full rounded-b-lg font-bold'>Servers list</div>
      <div className='lg:grid grid-cols-3 max-lg:flex flex-col
        items-center justify-center gap-2
        lg:w-fit max-lg:w-full px-2'>
        <ServerEntry manager_ip={manager_ip}/>
        <ServerEntry manager_ip={manager_ip}/>
        <ServerEntry manager_ip={manager_ip}/>
        <ServerEntry manager_ip={manager_ip}/>
        <ServerEntry manager_ip={manager_ip}/>
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
    </div>
  )
}