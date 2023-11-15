import { useState, useCallback, useRef } from 'react'
import { constants } from '../../constants'

export const useDIDStreaming = () => {
  const [iceGatheringStatus, setIceGatheringStatus] = useState('')
  const [iceConnectionStatus, setIceConnectionStatus] = useState('')
  const [peerConnectionStatus, setPeerConnectionStatus] = useState('')
  const [signalingStatus, setSignalingStatus] = useState('')
  const [streamingStatus, setStreamingStatus] = useState('')
  const [stream, setStream] = useState<MediaStream | null>(null)

  let peerConnection: RTCPeerConnection | null = null
  let streamId: string | null = null
  let sessionId: string | null = null
  let sessionClientAnswer: RTCSessionDescriptionInit | null = null

  const createPeerConnection = useCallback(async (offer: any, iceServers: any) => {
    if (!peerConnection) {
      peerConnection = new RTCPeerConnection({ iceServers })
      peerConnection.addEventListener(
        'icegatheringstatechange',
        () => {
          setIceGatheringStatus(peerConnection?.iceGatheringState ?? '')
        },
        true,
      )
      peerConnection.addEventListener(
        'icecandidate',
        async (event) => {
          if (event.candidate) {
            const { candidate, sdpMid, sdpMLineIndex } = event.candidate
            await fetch(`${constants.DID_API_URL}/talks/streams/${streamId}/ice`, {
              method: 'POST',
              headers: {
                Authorization: `Basic ${process.env.NEXT_PUBLIC_DID_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                candidate,
                sdpMid,
                sdpMLineIndex,
                session_id: sessionId,
              }),
            })
          }
        },
        true,
      )
      peerConnection.addEventListener(
        'iceconnectionstatechange',
        () => {
          setIceConnectionStatus(peerConnection?.iceConnectionState ?? '')
        },
        true,
      )
      peerConnection.addEventListener(
        'connectionstatechange',
        () => {
          setPeerConnectionStatus(peerConnection?.connectionState ?? '')
        },
        true,
      )
      peerConnection.addEventListener(
        'signalingstatechange',
        () => {
          setSignalingStatus(peerConnection?.signalingState ?? '')
        },
        true,
      )
      peerConnection.addEventListener('track', (event) => {
        if (event.track.kind === 'video') {
          setStream(event.streams[0]) // Set the received stream
        }
      })
    }

    await peerConnection.setRemoteDescription(offer)
    sessionClientAnswer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(sessionClientAnswer)

    return sessionClientAnswer
  }, [])

  const connectToStream = useCallback(async () => {
    try {
      const sessionResponse = await fetch(`${constants.DID_API_URL}/talks/streams`, {
        method: 'POST',
        headers: { Authorization: `Basic ${process.env.NEXT_PUBLIC_DID_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: constants.SOURCE_URL,
        }),
      })

      const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json()
      streamId = newStreamId
      sessionId = newSessionId
      sessionClientAnswer = await createPeerConnection(offer, iceServers)

      await fetch(`${constants.DID_API_URL}/talks/streams/${streamId}/sdp`, {
        method: 'POST',
        headers: { Authorization: `Basic ${process.env.NEXT_PUBLIC_DID_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: sessionClientAnswer, session_id: sessionId }),
      })
    } catch (error) {
      console.error('Error during connectToStream:', error)
    }
  }, [createPeerConnection])

  const startStreaming = useCallback(async (responseFromOpenAI: string) => {
    try {
      await fetch(`${constants.DID_API_URL}/talks/streams/${streamId}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${process.env.NEXT_PUBLIC_DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: {
            type: 'text',
            subtitles: 'false',
            provider: { type: 'microsoft', voice_id: 'en-US-ChristopherNeural' },
            ssml: false,
            input: responseFromOpenAI,
          },
          config: constants.STREAMING_CONFIG,
          driver_url: constants.DRIVER_URL,
          session_id: sessionId,
        }),
      })
      setStreamingStatus('streaming')
    } catch (error) {
      console.error('Error during startStreaming:', error)
      setStreamingStatus('error')
    }
  }, [])

  const destroyStream = useCallback(async () => {
    try {
      await fetch(`${constants.DID_API_URL}/talks/streams/${streamId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${process.env.NEXT_PUBLIC_DID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      })
      if (peerConnection) {
        peerConnection.close()
        peerConnection = null
      }
      setStreamingStatus('destroyed')
    } catch (error) {
      console.error('Error during destroyStream:', error)
    }
  }, [])

  return {
    connectToStream,
    startStreaming,
    destroyStream,
    iceGatheringStatus,
    iceConnectionStatus,
    peerConnectionStatus,
    signalingStatus,
    streamingStatus,
    stream,
  }
}

