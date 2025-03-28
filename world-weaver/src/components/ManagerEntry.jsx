import { useNavigate } from 'react-router-dom';

import React from 'react'
import Button from './Button'

import LoginIcon from '@mui/icons-material/Login';

export default function ManagerEntry({manager_name, manager_ip}) {
  const navigate = useNavigate()

  return (
    <div className='flex items-center justify-center
      w-full border-2 border-secondary p-2 rounded-lg'>
        <div className='flex items-center justify-between w-full max-lg:gap-x-2 lg:gap-x-20'>
          <div className='flex flex-col items-start justify-start'>
            <div>{manager_name}</div>
            <div>{manager_ip}</div>
          </div>
          <div className='w-fit'>
            <Button onClick={() => {navigate(`/manager/${manager_ip}`)}}>
              <div className='text-2xl flex items-center justify-center'>
                <LoginIcon fontSize='inherit' color='inherit'></LoginIcon>
              </div>
            </Button>
          </div>
        </div>
    </div>
  )
}
