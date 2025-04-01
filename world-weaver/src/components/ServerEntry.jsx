import { useNavigate } from 'react-router-dom';

import React from 'react'
import Button from './Button'

import LoginIcon from '@mui/icons-material/Login';
import StartStopButton from './StartStopButton';

export default function ServerEntry({
  manager_ip = "",
  cluster_entry = {},
  socket,
  user_token
  }) {
  const navigate = useNavigate()

  const server_name = cluster_entry?.name
  const cur_players = cluster_entry?.cur_players
  const max_players = cluster_entry?.max_players
  const is_running = cluster_entry?.is_running
  const is_online = cluster_entry?.is_online
  const cluster_id = cluster_entry?.id
  const day = cluster_entry?.day
  const season = cluster_entry?.season
  
  return (
    <div className='flex items-center justify-center
      w-full border-2 border-secondary p-2 rounded-lg'>
        <div className='flex items-start justify-between w-full max-lg:gap-x-2 lg:gap-x-10'>
          <div className='flex flex-col items-start justify-start'>
            <div>{server_name}</div>
            <div>{cur_players}/{max_players}</div>
            <div className={`${season && day ? "" : "hidden"}`}>{season}: day {day}</div>
          </div>
          <div className='w-fit gap-y-2 flex flex-col-reverse items-end justify-center'>
            <div className={`w-full h-4 rounded-full border-2 border-secondary
              ${is_running ? is_online ? "bg-online" : "bg-spooling" : "bg-offline"}`}/>
            <div className='flex items-start justify-end gap-x-2'>
              <Button onClick={() => {navigate(`/manager/${manager_ip}/cluster/${cluster_id}`)}}>
                <div className='text-4xl flex items-center justify-center'>
                  <LoginIcon fontSize='inherit' color='inherit'></LoginIcon>
                </div>
              </Button>
              <StartStopButton
                cluster_id={cluster_id}
                is_running={is_running}
                socket={socket}
                user_token={user_token}
              />
            </div>
          </div>
        </div>
    </div>
  )
}
