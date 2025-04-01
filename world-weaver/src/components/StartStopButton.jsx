import React from 'react'

import Button from './Button';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

export default function StartStopButton({socket, user_token, is_running, cluster_id}) {
  const onClick = () => {
    let action = "start"
    if (is_running) {
      action = "stop"
    }
    socket.emit("send_server_action", {user_token, action, cluster_id})
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
      <div className='text-2xl flex items-center justify-center'>
        {getIcon()}
      </div>
    </Button>
  )
}
