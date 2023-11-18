// AvatarStream.tsx
'use client'
import React, { useEffect, useRef, useContext } from 'react'
import styled from 'styled-components'
import { ControlPanel } from './ControlPanel'
import { StatusDisplay } from './StatusDisplay'
import { useOpenAIChat } from '../hooks/useOpenAIChat'
import { useDIDStreaming } from '../hooks/useDIDStreaming'
import StreamingContext from './context/StreamingContext'

const VideoWrapper = styled.div`
  background: url('/bg.png');
  height: 500px;
  background-position: top;
  text-align: center;
`

const VideoElement = styled.video`
  border-radius: 50%;
  background-color: #000;
`

const AvatarStream = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  //const { fetchOpenAIResponse } = useOpenAIChat()
  const {
    connectToStream,
    startStreaming,
    destroyStream,
    iceGatheringStatus,
    iceConnectionStatus,
    peerConnectionStatus,
    signalingStatus,
    streamingStatus,
    stream,
  } = useDIDStreaming()
  const { sessionId, streamId } = useContext(StreamingContext)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const handleConnect = async () => {
    await connectToStream()
  }

  const handleStart = async (userInput: string) => {
    //const responseFromOpenAI = await fetchOpenAIResponse(userInput)

    await startStreaming(userInput)
  }

  const handleDestroy = async () => {
    await destroyStream()
  }

  return (
    <div>
      <VideoWrapper>
        <VideoElement ref={videoRef} width="400" height="400" autoPlay />
      </VideoWrapper>
      <ControlPanel onConnect={handleConnect} onStart={handleStart} onDestroy={handleDestroy} />
      <StatusDisplay
        iceGatheringStatus={iceGatheringStatus}
        iceConnectionStatus={iceConnectionStatus}
        peerConnectionStatus={peerConnectionStatus}
        signalingStatus={signalingStatus}
        streamingStatus={streamingStatus}
      />
    </div>
  )
}

export default AvatarStream

