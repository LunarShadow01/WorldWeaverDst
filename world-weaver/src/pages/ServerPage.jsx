import React, { createElement, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import Console from '../components/Console'
import Button from '../components/Button'
import StartStopButton from '../components/StartStopButton'

/**
 * 
 * @param {Object} props
 * @param {Socket} props.socket
 * @returns 
 */
export default function ServerPage({user_token, socket}) {
  const params = useParams()
  // const manager_ip = params.ip
  const cluster_id = params.id

  const max_console_messages = 50
  const scroll_snap_buffer = 40

  const [minimal_entry, setMinimalEntry] = useState({})
  const [console_log, setConsoleLog] = useState([""])

  const is_running = minimal_entry?.is_running
  const is_online = minimal_entry?.is_online

  console.log("is_running: "+is_running+" is_online: "+is_online)

  const messages_container = useRef(null)

  const onConsoleUpdate = (new_data) => {
    const new_console_log = []
    for (const log of console_log) {
      new_console_log.push(log)
    }
    new_console_log.push(new_data)

    if (new_console_log.length > max_console_messages) {
      new_console_log.shift()
    }
    
    const current = messages_container.current
    if (current) {
      const div = document.createElement("div")
      div.innerHTML = new_data
      current.appendChild(div)
      if (current.childNodes.length > max_console_messages) {
          current.removeChild(
            current.firstElementChild
        )
      }

      const size = current.scrollHeight
      const offset = current.offsetHeight
      const pos = current.scrollTop
      const diff = Math.abs(size - (pos + offset))
      if (-scroll_snap_buffer < diff
        && diff < scroll_snap_buffer) {
        current.lastElementChild.scrollIntoView()
      }
    }

    setConsoleLog(new_console_log)
  }

  const onSendCommand = (cmd) => {

  }

  useEffect(() => {
    const current = messages_container.current
    if (current
      && current.childNodes.length < console_log.length) {
      current.innerHTML = ""
      for (const log of console_log) {
        const div = document.createElement("div")
        div.innerHTML = log
        current.appendChild(div)
      }
    }
    
  }, [console_log, messages_container])

  useEffect(() => {
    if (user_token !== "") {
      socket.emit("join_min_updates", {user_token})
      socket.emit("join_full_updates", {user_token, cluster_id})
      socket.emit("push_minimal_update", {user_token, cluster_id})

      socket.on("std_updates", ({shard, data}) => {
        const composed = `(${shard.shard_name}): ${data}`
        onConsoleUpdate(composed)
      })
      setMinimalEntry({})
    }
  }, [user_token])

  useEffect(() => {
    const onMinUpdate = ({id, entry}) => {
      if (Number(cluster_id) === id) {
        setMinimalEntry(entry)
      }
    }

    if (socket.listeners("min_update").length <= 0) {
      socket.on("min_update", onMinUpdate)
    }
  }, [minimal_entry])

  return (
    <div className='grid grid-cols-5 h-full'>
      <div className='grid grid-cols-1 grid-rows-1
        col-start-1 col-span-3 h-full w-full'>
        <div className='col-start-1 row-start-1
          flex items-start justify-end p-2'>
            <div className='p-2 w-10 h-10 z-10
            rounded-full bg-secondary hover:bg-accent
            hover:scale-110 transition-all duration-150'>

            </div>

        </div>
        <div className='col-start-1 row-start-1'>
          <Console messages_container={messages_container} onConsoleSend={onSendCommand}/>
        </div>
      </div>
      <div className='flex flex-col p-2
        items-center justify-end w-full h-full'>
        <StartStopButton 
          cluster_id={cluster_id}
          is_running={is_running}
          socket={socket}
          user_token={user_token}>
            {is_running
              ? is_online ? "shutdown"
              : "spooling"
              : "startup"
            }
        </StartStopButton>
      </div>
      <div>

      </div>
    </div>
  )
}
