// src/app/page.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import HangmanGame from '../components/HangmanGame'
import { HangmanProvider } from '../components/context/HangmanContext'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const [SSEClientID, setSSEClientID] = useState(uuidv4())
  const [threadId, setThreadId] = useState<undefined | string>(undefined)
  const [prompt, setPrompt] = useState('')
  const [userName, setUserName] = useState('Alex Sindalovsky')
  const [isPremium, setIsPremium] = useState(false)
  const [response, setResponse] = useState('')
  const [gameStartAlert, setGameStartAlert] = useState('')
  const assistantSent = useRef(false)

  useEffect(() => {
    if (assistantSent.current === true) return
    assistantSent.current = true
    fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sseClientId: SSEClientID, startConversation: true, userName, isPremium }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.threadId) {
          setThreadId(data.threadId)
        }
        setResponse(data.response)
      })
  }, [])

  useEffect(() => {
    if (!SSEClientID) return
    const eventSource = new EventSource(`/api/openai?clientId=${SSEClientID}`)

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'start_hangman_game') {
        setGameStartAlert('Time to start the Hangman Game!')
        // Additional actions to start the game can be implemented here
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      eventSource.close()
    }

    return () => {
      console.log('Closing SSE connection')
      eventSource.close()
    }
  }, [SSEClientID])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const res = await fetch('/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sseClientId: SSEClientID, prompt, userName, isPremium, threadId }),
    })
    const data = await res.json()

    if (data.threadId && !threadId) {
      setThreadId(data.threadId)
    }
    setResponse(data.response)
  }

  return (
    <HangmanProvider>
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
              {gameStartAlert && <p className="text-green-600">{gameStartAlert}</p>}
              <p>{response}</p>
            </div>

            <button
              type="button" // Changed from submit to button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => {
                setThreadId(undefined)
                setResponse('')
                setGameStartAlert('')
              }}
            >
              Clear History
            </button>
          </form>
        </div>
        <div className="w-2/3 p-4">
          <div className="interactive-content">
            <HangmanGame
              onGuess={(data) => {
                console.log('onGuess', { data })
              }}
              onGameEnd={(data) => {
                console.log('onGameEnd', { data })
              }}
              onGameStart={(data) => {
                console.log('onGameStart', { data })
              }}
            />
          </div>
        </div>
      </div>
    </HangmanProvider>
  )
}

