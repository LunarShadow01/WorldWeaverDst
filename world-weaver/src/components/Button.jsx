import React from 'react'

export default function Button({children, onClick=() => {}}) {
  return (
    <div className="bg-secondary
      p-2 gap-2 w-full h-fit
      text-text text-lg rounded-lg
      flex items-center justify-center
      hover:scale-110 hover:bg-accent transition-all duration-300">
      <button className={`flex justify-center items-center
        focus:outline-none focus:ring-0 focus:border-none w-full`}
        onClick={onClick}>
              {children}
      </button>
    </div>
  )
}
