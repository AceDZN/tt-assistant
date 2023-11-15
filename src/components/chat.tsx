// ChatWindow.tsx
'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'

export default function ChatWindow() {
  const [threadId, setThreadId] = useState<undefined | string>(undefined)
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  let peerConnection: RTCPeerConnection | null = null
  let streamId: string | null = null
  let sessionId: string | null = null

  // D-id API details
  const DID_API = {
    key: process.env.NEXT_PUBLIC_DID_API_KEY,
    url: 'https://api.d-id.com',
  }

  // Function to start streaming
  const startStreaming = async () => {
    try {
      const sessionResponse = await fetch(`${DID_API.url}/talks/streams`, {
        method: 'POST',
        headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_url: 'https://replicate.delivery/pbxt/lITb95hPuFJzNt4Oy6B5E67q1lN6Iw1kBA8dtGmoSWpkvIeIA/out.png',
        }),
      })

      const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json()
      streamId = newStreamId
      sessionId = newSessionId

      peerConnection = new RTCPeerConnection({ iceServers })

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          fetch(`${DID_API.url}/talks/streams/${streamId}/ice`, {
            method: 'POST',
            headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              candidate: event.candidate,
              session_id: sessionId,
            }),
          })
        }
      }

      peerConnection.ontrack = (event) => {
        if (videoRef.current && event.track.kind === 'video') {
          videoRef.current.srcObject = event.streams[0]
        }
      }

      peerConnection.oniceconnectionstatechange = () => {
        if (
          peerConnection &&
          (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed')
        ) {
          stopStreaming()
        }
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      await fetch(`${DID_API.url}/talks/streams/${streamId}/sdp`, {
        method: 'POST',
        headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: peerConnection.localDescription, session_id: sessionId }),
      })
    } catch (e) {
      console.error('Error starting streaming:', e)
    }
  }

  // Function to stop streaming
  const stopStreaming = async () => {
    if (peerConnection) {
      peerConnection.close()
      peerConnection = null
    }
    if (streamId && sessionId) {
      await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
        method: 'DELETE',
        headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
    }
    streamId = null
    sessionId = null
  }

  // Function to send text to avatar
  const sendTextToAvatar = async (text: string) => {
    if (!streamId || !sessionId) return

    await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
      method: 'POST',
      headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: {
          type: 'text',
          subtitles: 'false',
          provider: { type: 'microsoft', voice_id: 'en-US-ChristopherNeural' },
          ssml: false,
          input: text,
        },
        config: {
          fluent: true,
          pad_audio: 0,
          driver_expressions: {
            expressions: [{ expression: 'neutral', start_frame: 0, intensity: 0 }],
            transition_frames: 0,
          },
          align_driver: true,
          align_expand_factor: 0,
          auto_match: true,
          motion_factor: 0,
          normalization_factor: 0,
          sharpen: true,
          stitch: true,
          result_format: 'mp4',
        },
        driver_url: 'bank://lively/',
        session_id: sessionId,
      }),
    })
  }

  // Function to handle prompt submission and response
  const handlePromptToAssistant = useCallback(
    async (additionalData = {}) => {
      if (!prompt || prompt === '') return
      try {
        const res = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, threadId, ...additionalData }),
        })
        const data = await res.json()

        if (data.threadId && !threadId) {
          setThreadId(data.threadId)
        }
        setResponse(data.response)
        sendTextToAvatar(data.response)
      } catch (e) {
        console.error('Error sending prompt to assistant:', e)
        throw new Error("Couldn't send prompt to assistant")
      }
    },
    [prompt, threadId],
  )

  // Function to handle form submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      handlePromptToAssistant({ prompt })
    },
    [handlePromptToAssistant, prompt],
  )

  // Effect to manage streaming status
  useEffect(() => {
    if (isStreaming) {
      startStreaming()
    } else {
      stopStreaming()
    }

    return () => {
      stopStreaming()
    }
  }, [isStreaming])

  // Render the component
  return (
    <div className="container mx-auto p-4 flex">
      <div className="w-1/3 p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full p-2 border border-gray-300 rounded text-blue-900"
            rows={4}
            placeholder="Enter your prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Submit
          </button>
          <div className="p-2 border border-gray-300 rounded">
            <p>{response}</p>
          </div>
        </form>
      </div>
      <div className="w-2/3 p-4">
        <video ref={videoRef} width="400" height="400" autoPlay></video>
        <button onClick={() => setIsStreaming(!isStreaming)}>
          {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
        </button>
      </div>
    </div>
  )
}

