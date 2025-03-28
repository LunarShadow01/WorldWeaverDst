import React from 'react'

export default function Modal({children, is_open, setIsOpen, OnClose=()=>{}}) {
  
  const onClickBackground = (event) => {
    if (event.target.getAttribute("data-primary") === "true") {
      setIsOpen(false)
      OnClose()
    }
  }
  
  return (
    <div className={`fixed z-40 flex items-center justify-center bg-black/70 w-full h-full
      top-0 left-0
      ${is_open ? "" : "hidden"}`}
      data-primary="true"
      onClick={onClickBackground}>
      <div className='overflow-y-scroll w-fit h-[90%] flex grow items-start justify-center'>
        {children}
      </div>
    </div>
  )
}
