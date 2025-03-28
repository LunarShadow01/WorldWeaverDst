import React from 'react'
import Button from '../components/Button'
import SelectField from '../components/SelectField'
import InputField from '../components/InputField'

export default function Components() {
  return (
    <div className='flex items-center justify-center'>
      <div className='flex flex-col justify-center items-center gap-y-2 w-fit'>
        <h1>components testing board</h1>
        <Button>text</Button>
        <Button><div className='w-8 aspect-square bg-text rounded-lg'></div></Button>
        <SelectField label='test options' options={[
            {label: "test 1", value: 0, selected: false},
            {label: "test 2 with extra text", value: 1, selected: undefined},
            {label: "test 3", value: 2, selected: true},
            {label: "test 4", value: 3},
          ]}></SelectField>
        <InputField label='input' placeholder='your input' default_value='empty' type='text'></InputField>
      </div>
    </div>
  )
}
