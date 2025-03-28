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
  }) {
  const navigate = useNavigate()

  const server_identifier = "todo"

  return (
    <div className='flex items-center justify-center
      w-full border-2 border-secondary p-2 rounded-lg'>
        <div className='flex items-center justify-between w-full max-lg:gap-x-2 lg:gap-x-20'>
          <div className='flex flex-col items-start justify-start'>
            <div>{server_name}</div>
            <div>{cur_player_count}/{max_player_count}</div>
          </div>
          <div className='w-fit'>
            <div className='flex flex-col items-start justify-end'>
              {is_running ? <div>on</div> : <div>off</div>}
            </div>
            <div className='flex flex-col items-start justify-end'>
              <Button onClick={() => {navigate(`/manager/${manager_ip}/${server_identifier}`)}}>
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
