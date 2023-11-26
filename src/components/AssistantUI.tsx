import styled from 'styled-components'
import StreamingStatus from './StreamingStatus'
import { useCallback, useEffect, useState } from 'react'

// Styled components
const AssistantContainer = styled.div`
  display: block;
  overflow: hidden;
`
const TextBlock = styled.div`
  background-color: #fff; // White background for the text block
  color: #333; // Dark text color
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
  font-size: 16px; // Adjust font size as needed
`

const StartButton = styled.button`
  background-color: #34a853; // Example green color
  color: white;
  border: none;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2);
`

// Main React Component
export const TTAssistantUI = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [message, setMessage] = useState(undefined)
  useEffect(() => {}, [])

  const handleStartPlaying = () => {
    setIsPlaying(true)
  }
  const handleStopPlaying = () => {
    setIsPlaying(false)
  }
  const handleMessageReceived = (data: any) => {
    if (data.message) {
      setMessage(data.message)
    }
  }
  return (
    <AssistantContainer>
      {message && <TextBlock>{message}</TextBlock>}
      <StreamingStatus onMessage={handleMessageReceived} />
      <StartButton>New Lesson</StartButton>
    </AssistantContainer>
  )
}

