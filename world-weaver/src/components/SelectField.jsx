import React, { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * @param {Object} props
 * @param {{value: *, label: String, selected: Boolean | undefined}[]} props.options
 * @param {String} props.label 
 * @param {React.Dispatch<React.SetStateAction<*>>} props.setValue
 * @returns {React.JSX.Element}
 */
export default function SelectField({options=[], label="undefined", setValue=null}) {
  const selected_memo = useMemo(() => {
    let selected_opt = {label: "", value: -1}
    if (options.length > 0) {
      selected_opt = options[0]
    }
    
    for (const i in options) {
      let option = options[i]
      if ("selected" in option) {
        selected_opt = option
        break
      }
    }
    return selected_opt
  }, [options])

  const [cur_label, setCurLabel] = useState(selected_memo.label)
  const [is_open, setIsOpen] = useState(false)

  const setNewValue = useCallback((new_value) => {
    if (setValue != null) {
      setValue(new_value)
    }
  }, [setValue])

  useEffect(() => {
    setNewValue(selected_memo.value)
  }, [selected_memo, setNewValue])

  return (
    <div className='flex justify-center items-start w-fit'>
      <div className='grid grid-cols-2 justify-center items-center gap-1'>
        <label className='h-full text-text bg-secondary p-1 rounded-l-lg
        flex items-center justify-center'>{label}:</label>
        <div className='flex h-full rounded-r-lg bg-secondary
          text-text p-2 relative'
          onClick={() => {setIsOpen(!is_open)}}>
          <div className='flex justify-between items-center w-full gap-x-2'>
            <div>{cur_label}</div>
            <div className={`${is_open ? "rotate-90" : ""} transition-all duration-150`}>
              {">"}
            </div>
          </div>
          <div className={`${is_open ? "" : "hidden"} absolute top-0 left-0 translate-y-1/3 w-full h-fit bg-secondary rounded-lg`}>
            <div className='flex flex-col grow w-full justify-start items-center gap-2 p-2'>
              {options.map((elm, i) => {
                return (
                  <div key={i} className='flex grow w-full justify-start items-center p-2
                    hover:bg-accent transition-all duration-250 rounded-lg'
                  onClick={() => {setIsOpen(false); setNewValue(elm.value); setCurLabel(elm.label)}}>
                    {elm.label}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}
