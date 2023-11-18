'use client'
import React from 'react'
import styled from 'styled-components'

const StatusWrapper = styled.div`
  text-align: center;
  margin-top: 20px;
  color: #fff;
`
const StatusRow = styled.div`
  margin: 5px 0;
`

const StatusLabel = styled.span`
  font-weight: bold;
`

const StatusValue = styled.span`
  margin-left: 10px;
`

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
    <StatusWrapper>
      <StatusRow>
        <StatusLabel>ICE gathering status:</StatusLabel>
        <StatusValue>{iceGatheringStatus}</StatusValue>
      </StatusRow>
      <StatusRow>
        <StatusLabel>ICE connection status:</StatusLabel>
        <StatusValue>{iceConnectionStatus}</StatusValue>
      </StatusRow>
      <StatusRow>
        <StatusLabel>Peer connection status:</StatusLabel>
        <StatusValue>{peerConnectionStatus}</StatusValue>
      </StatusRow>
      <StatusRow>
        <StatusLabel>Signaling status:</StatusLabel>
        <StatusValue>{signalingStatus}</StatusValue>
      </StatusRow>
      <StatusRow>
        <StatusLabel>Streaming status:</StatusLabel>
        <StatusValue>{streamingStatus}</StatusValue>
      </StatusRow>
    </StatusWrapper>
  )
}

