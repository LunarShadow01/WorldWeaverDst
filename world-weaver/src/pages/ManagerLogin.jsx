import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Socket } from 'socket.io-client'

import InputField from '../components/InputField'
import Button from '../components/Button'
import { getDataKey, hasDataKey, setDataKey, tokens_storage_key } from '../scripts/storage'

/**
 * @param {Object} props
 * @param {Socket} props.socket  
 * @returns 
 */
export default function ManagerLogin({
  socket,
  setUserToken
}) {
  const navigate = useNavigate()
  const params = useParams()
  const manager_ip = params.ip

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  const login = () => {
    if (socket === undefined) {
      console.log("socket undefined")
      return
    }
    console.log("login,", socket)
    socket.once("new_token", onLogin)
    socket.emit("login", {email, password})
  }

  const onLogin = ({user_token}) => {
    if (user_token) {
      if (!hasDataKey(tokens_storage_key)) {
        setDataKey(tokens_storage_key, {})
      }

      const tokens = getDataKey(tokens_storage_key)
      tokens[manager_ip] = user_token

      setDataKey(tokens_storage_key, tokens)
      setUserToken(user_token)
      navigate("/manager/"+manager_ip)
    }
  }

  return (
    <div className='h-full w-full
      flex items-center justify-center
      p-4'>
        <div className='flex flex-col items-start justify-center
          w-fit p-2 gap-y-2 border-2 border-secondary rounded-lg'>
          <InputField
            default_value=''
            type='email'
            label='email'
            placeholder='your login email'
            setValue={setEmail}
            />
          <InputField
            default_value=''
            type='text'
            label='password'
            placeholder='your login password'
            setValue={setPassword}
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
