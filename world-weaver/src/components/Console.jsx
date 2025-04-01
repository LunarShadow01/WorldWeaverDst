import React, { useEffect, useRef, useState } from 'react'

import Button from './Button'

import PublishIcon from '@mui/icons-material/Publish';
import { getDataKey, hasDataKey, setDataKey } from '../scripts/storage';

export default function Console({messages_container, onConsoleSend = (cmd) => {}}) {

  return (
    <div className='flex items-start justify-center w-full h-full'>
      {/* <div className='flex flex-col items-start justify-start w-full'>
        
      </div> */}
      <div className='grid grid-cols-1 grid-rows-1
        items-end justify-center h-screen
        bg-background rounded-lg w-full grow'>
          
        <div className='col-start-1 row-start-1
          flex items-start justify-end flex-col
          border-2 border-secondary rounded-lg h-screen
          w-full'>
          <pre className='p-2 overflow-y-scroll
            whitespace-normal break-words w-full'
            ref={messages_container}>
              {/* {console_log.map((text, i) => {
                return <div key={i}>
                  {text}
                </div>
              })} */}
          </pre>
          <div className='opacity-0 -z-50'>
            <ConsoleInput onConsoleSend={onConsoleSend}/>
          </div>
        </div>
        <ConsoleInput onConsoleSend={onConsoleSend}/>
      </div>
    </div>
  )
}

const max_history = 20
const history_storage_key = "cmd_history"

function ConsoleInput({
  onConsoleSend = (cmd) => {}
}) {
  const [history_page, setHistoryPage] = useState(-1);
  const [history_cache, setHistoryCache] = useState("")

  const registerKeyPress = (event) => {
    if (event.key === "Enter") {
      onEnter()
    } else if (event.key === "ArrowUp") {
      onPage(1)
    } else if (event.key === "ArrowDown") {
      onPage(-1)
    }
  }

  const onPage = (dir) => {
    const new_page = Math.max(-1, (Math.min(max_history, history_page + dir)))
    if (history_page === -1 && new_page !== -1) {
      setHistoryCache(cur_value)
      setCurValue("")
    } else if (history_page !== -1 && new_page === -1) {
      setCurValue(history_cache)
      setHistoryCache("")
    }
    
    if (new_page !== -1) {
      const history = getDataKey(history_storage_key)
      if (history.length <= new_page) {
        return
      }

      setCurValue(history[new_page])
    }

    setHistoryPage(new_page)
  }

  const onEnter = () => {
    if (!hasDataKey(history_storage_key)) {
      setDataKey(history_storage_key, [])
    }

    const history = getDataKey(history_storage_key)
    history.reverse()
    history.push(cur_value)
    history.reverse()
    if (history.length > max_history) {
      history.shift()
    }
    setDataKey(history_storage_key, history)
    onConsoleSend(cur_value)

    setCurValue("")
  }

  const [cur_value, setCurValue] = useState("")

  return (
    <div className='col-start-1 row-start-1 bg-background
      w-full min-h-10 border-2 rounded-lg border-secondary p-2
      flex items-center justify-center gap-x-2 '>
      <input className='w-full h-full
        focus:outline-0 placeholder:opacity-50
        placeholder:text-text placeholder:font-bold
        font-bold' 
        type="text"
        value={cur_value}
        onKeyDown={registerKeyPress}
        onChange={(event) => {setCurValue(event.target.value); setHistoryPage(-1)}}
        placeholder='terminal commands...'
        />
        <div className='w-fit'>
          <Button onClick={onEnter}>
            <div className='text-2xl text-text
              flex items-center justify-center'>
              <PublishIcon color='inherit' fontSize='inherit'></PublishIcon>
            </div>
          </Button>
        </div>
    </div>
  )
}