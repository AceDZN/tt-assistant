// AvatarStream.tsx
'use client'
import React, { useEffect, useRef, useContext } from 'react'
import { ControlPanel } from './ControlPanel'
import { StatusDisplay } from './StatusDisplay'
import { useOpenAIChat } from '../hooks/useOpenAIChat'
import { useDIDStreaming } from '../hooks/useDIDStreaming'
import StreamingContext from './context/StreamingContext'

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
      <div className="bg-[url('/bg.png')] h-500 bg-top text-center">
        <video ref={videoRef} width="400" height="400" autoPlay className="rounded-full bg-black" />
      </div>
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

