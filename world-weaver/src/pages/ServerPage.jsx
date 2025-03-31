import React, { createElement, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import Console from '../components/Console'
import Button from '../components/Button'
import { io } from 'socket.io-client'

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

  const [is_running, setIsRunning] = useState(false)
  const [console_log, setConsoleLog] = useState([""])
  const [console_paused, setConsolePaused] = useState(false)
  const [count, setCount] = useState(0)

  const messages_container = useRef(null)

  const onConsoleUpdate = ({new_data}) => {
    if (console_paused) {
      // backlog update
      return
    }
    const new_console_log = []// console_log.copyWithin(console_log.length, 0, console_log.length)
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


  // useEffect(() => {
    // setInterval(() => {
    //   setCount(count + 1)
    //   onConsoleUpdate({new_data: "message "+count})
    // }, 500)
  // }, [])

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
        <Button onClick={() => {
          if (is_running) {
            socket.emit("send_server_action", {user_token, action: "stop", cluster_id})
          } else {
            socket.emit("send_server_action", {user_token, action: "start", cluster_id})
          }
        }}>
          {is_running ? "shutdown cluster" : "start cluster"}
        </Button>
        <Button onClick={() => {
          setCount(count + 1)
          onConsoleUpdate({new_data: "message "+count})
          }}>
          WTH
        </Button>
      </div>
      <div>

      </div>
    </div>
  )
}
