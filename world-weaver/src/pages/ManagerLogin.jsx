import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Socket } from 'socket.io-client'

import InputField from '../components/InputField'
import Button from '../components/Button'
import { getDataKey, hasDataKey, setDataKey, pass_keys_storage_key } from '../scripts/storage'

export default function ManagerLogin() {
  const navigate = useNavigate()
  const params = useParams()
  const manager_ip = params.ip

  const [pass_key, setPassKey] = useState("")
  
  const login = () => {
    const pass_keys = getDataKey(pass_keys_storage_key)
    pass_keys[manager_ip] = pass_key
    setDataKey(pass_keys_storage_key, pass_keys)
    navigate(`/manager/${manager_ip}`)
  }
  return (
    <div className='h-full w-full
      flex items-center justify-center
      p-4'>
        <div className='flex flex-col items-start justify-center
          w-fit p-2 gap-y-2 border-2 border-secondary rounded-lg'>
          <InputField
            default_value=''
            type='text'
            label='pass key'
            placeholder='your manager pass key'
            setValue={setPassKey}
            />
          <div className='w-fit'>
            <Button onClick={login}>
              Login
            </Button>
          </div>
        </div>
    </div>
  )
}
