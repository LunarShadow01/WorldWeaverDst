import React, { useState } from 'react'

import Button from '../components/Button';
import Modal from '../components/Modal';
import InputField from '../components/InputField';

import AddIcon from '@mui/icons-material/Add';

export default function Main() {
  const [is_modal_open, setModalOpen] = useState(false)

  return (
    <div>
      <AddManagerModal is_open={is_modal_open} setIsOpen={setModalOpen}/>
      <div className='p-2 w-full h-fit
        bg-secondary rounded-b-lg
        text-text font-bold
        flex items-center justify-center'>
        Server managers list
      </div>

      <div className='flex flex-col items-start justify-center
        p-2 overflow-y-scroll w-fit'>

      </div>

      <div className='fixed bottom-0 right-0 p-2'>
        <Button onClick={() => {setModalOpen(true)}}>
          <div className='text-4xl flex items-center justify-center'>
            <AddIcon fontSize='inherit' color='inherit'></AddIcon>
          </div>
        </Button>
      </div>
    </div>
  )
}

function AddManagerModal({is_open=false, setIsOpen=() => {}}) {
  const [mananger_name, setManagerName] = useState("")
  const [mananger_ip, setManagerIp] = useState("")

  const addManager = () => {

  }

  return <Modal
      is_open={is_open}
      OnClose={() => {}}
      setIsOpen={setIsOpen}>
          <div className='flex justify-center items-center p-2 min-h-full h-fit w-fit'>
              <div className='bg-background rounded-2xl p-4 flex gap-4 flex-col w-fit'>
                  <InputField 
                    type={"text"}
                    label={"name"}
                    placeholder={"enter manager name"}
                    setValue={setManagerName}/>
                  <InputField
                    type={"text"}
                    label={"ip/domain"}
                    placeholder={"your manager ip/domain"}
                    setValue={setManagerIp}/>
                  
                  <div className='flex justify-between items-center gap-2'>
                      <Button
                          onClick={() => {setIsOpen(false)}}>
                          Close
                      </Button>
                      <Button onClick={() => {
                          addManager()
                      }}>
                          Add Manager
                      </Button>
                  </div>
              </div>
          </div>
  </Modal>
}