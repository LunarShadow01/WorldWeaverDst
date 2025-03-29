import React, { useEffect, useRef, useState } from 'react'

import Button from './Button'

import PublishIcon from '@mui/icons-material/Publish';

export default function Console({console_log, onConsoleSend = () => {}}) {
  const [console_input, setConsoleInput] = useState("")

  const scroll_snap_buffer = 10
  const div_ref = useRef(null)
  const messages_container = useRef(null``)

  useEffect(() => {
    if (div_ref.current) {
      const scroll_container = div_ref.current.parentElement
      const size = scroll_container.offsetHeight
      const position = scroll_container.scrollTop
      if (size - position < scroll_snap_buffer) {
        div_ref.current.scrollIntoView()
      }
    }
  }, [console_log, div_ref])

  const onEnter = () => {
    console.log("enter sent")
    onConsoleSend(console_input)
    setConsoleInput("")
  }

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
              <div ref={div_ref}></div>
          </pre>
          <div className='opacity-0 -z-50'>
            <ConsoleInput onEnter={onEnter} setValue={setConsoleInput}/>
          </div>
        </div>
        <ConsoleInput onEnter={onEnter} setValue={setConsoleInput}/>
      </div>
    </div>
  )
}

function ConsoleInput({
  onEnter,
  setValue = () => {}
}) {
  const registerKeyPress = (event) => {
    if (event.key === "Enter") {
      onEnter()
    }
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
        onChange={(event) => {setValue(event.target.value); setCurValue(event.target.value)}}
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