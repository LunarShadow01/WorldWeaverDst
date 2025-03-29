import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

import Console from '../components/Console'
import Button from '../components/Button'

export default function ServerPage({socket}) {
  const params = useParams()
  // const manager_ip = params.ip
  const cluster_id = params.id

  const max_console_messages = 50

  const [is_running, setIsRunning] = useState(false)
  const [console_log, setConsoleLog] = useState([""])
  const [count, setCount] = useState(0)

  const onConsoleUpdate = ({new_data}) => {
    const new_console_log = []// console_log.copyWithin(console_log.length, 0, console_log.length)
    for (const log of console_log) {
      new_console_log.push(log)
    }
    new_console_log.push(new_data)

    if (new_console_log.length > max_console_messages) {
      new_console_log.shift()
    }
    
    setConsoleLog(new_console_log)
  }

  const onSendCommand = (cmd) => {

  }

  // useEffect(() => {
    // setInterval(() => {
    //   setCount(count + 1)
    //   onConsoleUpdate({new_data: "message "+count})
    // }, 500)
  // }, [])

  return (
    <div className='grid grid-cols-5 h-full'>
      <div className='col-start-1 col-span-3 h-full w-full'>
        <Console console_log={console_log} onConsoleSend={onSendCommand}>

        </Console>
      </div>
      <div className='flex flex-col p-2
        items-center justify-end w-full h-full'>
        <Button>
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
