// components/useGameAssistant.ts
import { useState, useCallback } from 'react'
import { GameEndCallback } from '@/types/HangmanTypes'

export const useGameAssistant = (userName: string, isPremium: boolean) => {
  const [threadId, setThreadId] = useState<undefined | string>(undefined)
  const [response, setResponse] = useState('')
  const [gameStartAlert, setGameStartAlert] = useState('')
  const [shouldGenerateTTS, setGenerateTTS] = useState(false)
  const [shouldPlayTTS, setPlayTTS] = useState(false)

  const handlePromptToAssistant = useCallback(
    async (additionalData: any) => {
      let res
      try {
        res = await fetch('/api/hangman', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userName, isPremium, threadId, tts: shouldGenerateTTS, ...additionalData }),
        })
      } catch (e) {
        console.error(e)
        throw new Error("Couldn't send prompt to assistant")
      }
      if (!res) throw new Error('No response from assistant')
      const data = await res.json()
      if (data.threadId && !threadId) {
        setThreadId(data.threadId)
      }
      setResponse(data.response)
    },
    [shouldGenerateTTS, userName, isPremium, threadId],
  )

  const handleSubmit = useCallback(
    (formData: any) => {
      handlePromptToAssistant(formData)
    },
    [handlePromptToAssistant], // Only recreate handleSubmit when handlePromptToAssistant changes
  )

  return [
    threadId,
    setThreadId,
    response,
    setResponse,
    gameStartAlert,
    setGameStartAlert,
    shouldGenerateTTS,
    setGenerateTTS,
    shouldPlayTTS,
    setPlayTTS,
    handleSubmit,
  ]
}

export default useGameAssistant

