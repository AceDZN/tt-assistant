// ControlPanel.tsx
'use client'
import React, { useState } from 'react'
import styled from 'styled-components'

const PanelWrapper = styled.div`
  text-align: center;
  margin-top: 20px;
`

const InputField = styled.input`
  color: #000;
  width: 80%;
  padding: 8px;
  margin: 0 auto;
  display: block;
`

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  font-size: 16px;
  margin: 10px 5px;
  background-color: #7459fe;
  color: #fff;

  &:hover {
    background-color: #9480ff;
    cursor: pointer;
    transition: all 0.2s ease-out;
  }
`

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
    <PanelWrapper>
      <InputField type="text" value={userInput} onChange={handleInputChange} placeholder="Enter your message..." />
      <Button onClick={onConnect}>Connect</Button>
      <Button onClick={handleStart}>Start</Button>
      <Button onClick={onDestroy}>Destroy</Button>
    </PanelWrapper>
  )
}

