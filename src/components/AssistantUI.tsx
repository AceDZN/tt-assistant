import styled from 'styled-components'
import StreamingStatus from './StreamingStatus'
import { useState } from 'react'

// Styled components
const AssistantContainer = styled.div`
  height: 100%;
  display: block;
  overflow: hidden;
`

// Main React Component
export const TTAssistantUI = () => {
  //const [isPlaying, setIsPlaying] = useState(false)
  const [message, setMessage] = useState(undefined)
  console.log('TTAssistantUI message', message)
  /*
  const handleStartPlaying = () => {
    setIsPlaying(true)
  }
  const handleStopPlaying = () => {
    setIsPlaying(false)
  }
  */
  const handleMessageReceived = (data: any) => {
    if (data.message) {
      setMessage(data.message)
    } else if (data.response) {
      setMessage(data.response)
    }
  }
  return (
    <AssistantContainer>
      <StreamingStatus onMessage={handleMessageReceived} />
    </AssistantContainer>
  )
}

