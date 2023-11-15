// StatusDisplay.tsx
'use client'
import React from 'react'

interface StatusDisplayProps {
  iceGatheringStatus: string
  iceConnectionStatus: string
  peerConnectionStatus: string
  signalingStatus: string
  streamingStatus: string
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
  iceGatheringStatus,
  iceConnectionStatus,
  peerConnectionStatus,
  signalingStatus,
  streamingStatus,
}) => {
  return (
    <div className="text-center mt-5 text-white">
      <div className="my-1.5">
        <span className="font-bold">ICE gathering status:</span>
        <span className="ml-2.5">{iceGatheringStatus}</span>
      </div>
      <div className="my-1.5">
        <span className="font-bold">ICE connection status:</span>
        <span className="ml-2.5">{iceConnectionStatus}</span>
      </div>
      <div className="my-1.5">
        <span className="font-bold">Peer connection status:</span>
        <span className="ml-2.5">{peerConnectionStatus}</span>
      </div>
      <div className="my-1.5">
        <span className="font-bold">Signaling status:</span>
        <span className="ml-2.5">{signalingStatus}</span>
      </div>
      <div className="my-1.5">
        <span className="font-bold">Streaming status:</span>
        <span className="ml-2.5">{streamingStatus}</span>
      </div>
    </div>
  )
}

