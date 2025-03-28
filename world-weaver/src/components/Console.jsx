import React, { useState } from 'react'

import Button from './Button'

import PublishIcon from '@mui/icons-material/Publish';

export default function Console() {
  const [console_input, setConsoleInput] = useState("")

  const onEnter = () => {
    console.log("enter sent")
  }

  return (
    <div className='flex items-start justify-center'>
      <div className='flex flex-col items-start justify-start'>
        
      </div>
      <div className='grid items-end justify-center h-screen max-w-40
        bg-background rounded-lg'>
        
        <div className='col-start-1 row-start-1
          flex items-end justify-end flex-col
          border-2 border-secondary rounded-lg h-screen
          w-full'>
          <pre className='p-2 overflow-y-scroll
            whitespace-normal break-words'>
            dogjdpsjg
            dsighdsojg
            dsighdspo
            dgokdsgodsjpgodsgij
            sdgkndsogjpdsojg
            sdgkndsogjpdsojg
            sdgkndsogjpdsojg
            sdgkndsogjpdsojg
            sdgkndsogjpdsojg
            sdgkndsogjpdsojg
            sdgkndsogjpdsojg
            sdgkndsogjpdsojg
            sdgkndsogjpdsojg
            sdgkndsogjpdsojg
            sdgkndsogjpdsojg
            sdgkndsogjpdsojg
            sdgkndsogjpdsojg
            sdgkndsogjpdsojg
            sdkgndso
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

  return (
    <div className='col-start-1 row-start-1 bg-background
      w-full min-h-10 border-2 rounded-lg border-secondary p-2
      flex items-center justify-center gap-x-2'>
      <input className='w-fit h-full
        focus:outline-0 placeholder:opacity-50
        placeholder:text-text placeholder:font-bold
        font-bold' 
        type="text"
        onKeyDown={registerKeyPress}
        onChange={(event) => {setValue(event.target.value)}}
        placeholder='terminal commands...'
        />
        <Button onClick={onEnter}>
          <div className='text-2xl text-text
            flex items-center justify-center'>
            <PublishIcon color='inherit' fontSize='inherit'></PublishIcon>
          </div>
        </Button>
    </div>
  )
}