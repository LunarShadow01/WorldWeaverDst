import React, { useEffect, useState } from 'react'

/**
 * 
 * @param {Object} props
 * @param {String} props.type 
 * @param {String} props.label 
 * @param {String} props.placeholder 
 * @param {String} props.default_value
 * @param {React.Dispatch<React.SetStateAction<String>>} props.setValue
 * @returns {React.JSX.Element}
 */
export default function InputField({
  type="text",
  label="undefined",
  placeholder="placeholder",
  default_value = "",
  setValue=() => {},
  }) {
  const [cur_value, setCurValue] = useState("")

  useEffect(() => {
    setCurValue(default_value)
  }, [default_value])
  
  return (
    <div className="flex justify-center items-start w-full gap-x-1">
      <label className="text-text bg-secondary p-2 rounded-l-lg w-fit whitespace-nowrap">
        {label}:</label>
      <input className="text-text placeholder-text
        placeholder:opacity-50 w-full
        hover:outline-none focus:outline-none
        hover:bg-accent transition-all duration-150
        bg-secondary p-2 rounded-r-lg flex"
        value={cur_value} type={type} name="" placeholder={placeholder}
        onChange={(event) => {
          setValue(event.target.value)
          setCurValue(event.target.value)
        }}/>
    </div>
  )
}
