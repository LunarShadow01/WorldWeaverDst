import React, { useEffect, useState } from 'react'

import Button from '../components/Button';
import Modal from '../components/Modal';
import InputField from '../components/InputField';

import AddIcon from '@mui/icons-material/Add';
import { getDataKey, hasDataKey, setDataKey } from '../scripts/storage';
import ManagerEntry from '../components/ManagerEntry';

const managers_storage_key = "registered_managers"

export default function Main() {
  const [is_modal_open, setModalOpen] = useState(false)
  const [managers, setManagers] = useState([])

  useEffect(() => {
    if (!hasDataKey(managers_storage_key)) {
      setDataKey(managers_storage_key, [])
    }

    setManagers(getDataKey(managers_storage_key))
  }, [])

  return (
    <div>
      <AddManagerModal is_open={is_modal_open} setIsOpen={setModalOpen}/>
      <div className='p-2 w-full h-fit
        bg-secondary rounded-b-lg
        text-text font-bold
        flex items-center justify-center'>
        Server managers list
      </div>

      <div className='flex items-start justify-center w-full'>
        <div className='flex flex-col items-start justify-center
          p-2 overflow-y-scroll max-lg:w-full lg:w-fit'>
            {managers.map((manager_entry, i) => {
              return <ManagerEntry key={i}
                manager_name={manager_entry.manager_name}
                manager_ip={manager_entry.manager_ip}/>
              })}
        </div>
      </div>

      <div className='fixed bottom-0 right-0 p-2 shadow-lg shadow-background'>
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
  const [manager_name, setManagerName] = useState("")
  const [manager_ip, setManagerIp] = useState("")

  const addManager = () => {
    const manager_entry = {
      manager_name,
      manager_ip
    }

    if (!hasDataKey(managers_storage_key)) {
      setDataKey(managers_storage_key, [])
    }

    /**@type {{mananger_name: String, mananger_ip: String}[]} */
    const managers = getDataKey(managers_storage_key)

    managers.push(manager_entry)

    setDataKey(managers_storage_key, managers)
    setIsOpen(false)
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