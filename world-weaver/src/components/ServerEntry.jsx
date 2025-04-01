import { useNavigate } from 'react-router-dom';

import React from 'react'
import Button from './Button'

import LoginIcon from '@mui/icons-material/Login';

export default function ServerEntry({
  manager_ip = "",
  server_name = "placeholder",
  cur_player_count = 0,
  max_player_count = 20,
  is_running = false,
  is_online = false,
  cluster_id = -1,
  socket,
  user_token
  }) {
  const navigate = useNavigate()

  return (
    <div className='flex items-center justify-center
      w-full border-2 border-secondary p-2 rounded-lg'>
        <div className='flex items-start justify-between w-full max-lg:gap-x-2 lg:gap-x-20'>
          <div className='flex flex-col items-start justify-start'>
            <div>{server_name}</div>
            <div>{cur_player_count}/{max_player_count}</div>
          </div>
          <div className='w-fit gap-y-2 flex flex-col items-end justify-center'>
            <div className={`w-full h-4 rounded-full border-2 border-secondary
              ${is_running ? is_online ? "bg-online" : "bg-spooling" : "bg-offline"}`}/>
            <div className='flex flex-col items-start justify-end'>
              {/* <Button onClick={() => {navigate(`/manager/${manager_ip}/cluster/${cluster_id}`)}}> */}
              <Button onClick={() => {socket.emit("send_server_action", {user_token, action: "start", cluster_id})}}>
                <div className='text-2xl flex items-center justify-center'>
                  <LoginIcon fontSize='inherit' color='inherit'></LoginIcon>
                </div>
              </Button>
            </div>
          </div>
        </div>
    </div>
  )
}
