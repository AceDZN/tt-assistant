// ControlPanel.tsx
'use client'
import React, { useState } from 'react'

interface ControlPanelProps {
  onConnect: () => void
  onStart: (userInput: string) => void
  onDestroy: () => void
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onConnect, onStart, onDestroy }) => {
  const [userInput, setUserInput] = useState('')

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value)
  }

  const handleStart = () => {
    onStart(userInput)
    setUserInput('')
  }

  return (
    <div className="text-center mt-5">
      <input
        type="text"
        value={userInput}
        onChange={handleInputChange}
        placeholder="Enter your message..."
        className="w-4/5 p-2 block mx-auto"
      />
      <button
        onClick={onConnect}
        className="py-2.5 px-5 rounded border-none text-lg m-2.5 bg-purple-600 text-white hover:bg-purple-400 transition duration-200 ease-out"
      >
        Connect
      </button>
      <button
        onClick={handleStart}
        className="py-2.5 px-5 rounded border-none text-lg m-2.5 bg-purple-600 text-white hover:bg-purple-400 transition duration-200 ease-out"
      >
        Start
      </button>
      <button
        onClick={onDestroy}
        className="py-2.5 px-5 rounded border-none text-lg m-2.5 bg-purple-600 text-white hover:bg-purple-400 transition duration-200 ease-out"
      >
        Destroy
      </button>
    </div>
  )
}

