// components/gameAssistantWindow.tsx
'use client'
import { useEffect, useState } from 'react'
import { useHangmanContext } from './context/HangmanContext'
import HangmanGame from './HangmanGame'
import { useGameAssistant } from './useGameAssistant'
import AssistantForm from './AssistantForm'
import HangmanInteraction from './HangmanInteraction'

export default function GameAssistantWindow() {
  const {
    guesses,
    right,
    wrong,
    score,
    maxTries,
    wordToDiscover,
    description,
    allowedLetters,
    errors,
    gameOverState,
    keyboardEnabled,
    setKeyboardEnabled,
    resetGame,
    revealHintLetter,
    makeGuess,
    setGameOver,
    setSuccess,
  } = useHangmanContext()

  const [userName, setUserName] = useState('Alex Sindalovsky')
  const [isPremium, setIsPremium] = useState(false)
  const [
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
  ] = useGameAssistant(userName, isPremium)

  useEffect(() => {
    handleSubmit({ startConversation: true })
  }, [handleSubmit]) // Depend only on handleSubmit
  return (
    <div className="container mx-auto p-4 flex">
      <div className="w-1/3 p-4">
        <AssistantForm
          prompt={response}
          onPromptChange={setResponse}
          onSubmit={handleSubmit}
          shouldGenerateTTS={shouldGenerateTTS}
          onGenerateTTSChange={setGenerateTTS}
          shouldPlayTTS={shouldPlayTTS}
          onPlayTTSChange={setPlayTTS}
          gameStartAlert={gameStartAlert}
        />
      </div>
      <div className="w-2/3 p-4">
        <HangmanInteraction
          tts={shouldGenerateTTS}
          onGuess={(data) => handleSubmit({ guessData: data })}
          onGameEnd={(result) => handleSubmit({ gameEndData: result })}
          onGameStart={(result) => console.log('onGameStart', { result })}
        />
      </div>
    </div>
  )
}

