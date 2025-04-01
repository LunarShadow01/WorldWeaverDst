import React from 'react'

import Button from './Button';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

export default function StartStopButton({children, socket, user_token, is_running, cluster_id}) {
  const onClick = () => {
    let action = "start"
    if (is_running) {
      action = "stop"
    }
    if (action === "start" || confirm("please confirm to proceed with shutting down this server")) {
      socket.emit("send_server_action", {user_token, action, cluster_id})
    }
  }

  const getIcon = () => {
    if (is_running) {
      return <StopIcon fontSize='inherit' color='inherit'></StopIcon>
    } else {
      return <PlayArrowIcon fontSize='inherit' color='inherit'></PlayArrowIcon>
    }
  }

  return (
    <Button onClick={onClick}>
      <div className='text-4xl flex w-full items-center justify-between gap-x-4'>
        <div className='text-2xl'>
          {children}
        </div>
        {getIcon()}
      </div>
    </Button>
  )
}
