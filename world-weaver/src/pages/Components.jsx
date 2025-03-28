import React from 'react'
import Button from '../components/Button'
import SelectField from '../components/SelectField'

export default function Components() {
  return (
    <div>
      <h1>components testing board</h1>
      <Button>text</Button>
      <Button><div className='w-8 aspect-square bg-text rounded-lg'></div></Button>
      <SelectField label='test options' options={[
          {label: "test 1", value: 0, selected: false},
          {label: "test 2 with extra text", value: 1, selected: undefined},
          {label: "test 3", value: 2, selected: true},
          {label: "test 4", value: 3},
        ]}></SelectField>
    </div>
  )
}
