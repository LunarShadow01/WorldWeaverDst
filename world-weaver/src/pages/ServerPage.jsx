import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

import Console from '../components/Console'
import Button from '../components/Button'

export default function ServerPage({socket}) {
  const params = useParams()
  // const manager_ip = params.ip
  const cluster_id = params.id

  const max_console_characters = 10000

  const [is_running, setIsRunning] = useState(false)
  const [console_log, setConsoleLog] = useState("pdsgjddsgjdspojpdsojgpodsjgpdjspfojdspjf sdgdspjfpodjfpoj  ")

  const onConsoleUpdate = ({new_data}) => {
    const console_length = console_log.length
    const new_data_length = new_data.length
    if (console_length + new_data_length < max_console_characters) {
      setConsoleLog(console_log + new_data)
      return
    }
    const cut_console = console_log.slice(0, new_data_length)
    setConsoleLog(cut_console + new_data)
  }

  const onSendCommand = (cmd) => {

  }

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
      </div>
      <div>

      </div>
    </div>
  )
}
