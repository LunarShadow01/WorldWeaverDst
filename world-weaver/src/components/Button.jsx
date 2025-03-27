import React from 'react'

export default function Button({children, onClick=() => {}}) {
  return (
    <div className="bg-secondary
      p-2 gap-2 w-fit h-fit
      text-text text-lg rounded-lg
      flex items-center justify-center
      hover:scale-[115%] hover:bg-accent transition-all duration-300">
      <button className={`flex justify-center items-center
        focus:outline-none focus:ring-0 focus:border-none`}
        onClick={onClick}>
              {children}
      </button>
    </div>
  )
}
