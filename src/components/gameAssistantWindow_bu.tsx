// componeents/gameAssistantWindow.tsx
'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useHangmanContext } from './context/HangmanContext'
import HangmanGame from './HangmanGame'
import { useGlobalAudioPlayer } from 'react-use-audio-player'
import { GameEndCallback } from '@/types/HangmanTypes'
const SPEECH_PATH = 'audio-files/'
const moderatorPrefix = `this is your moderator, only you can see this message.`
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
  const { load } = useGlobalAudioPlayer()
  const [threadId, setThreadId] = useState<undefined | string>(undefined)
  const [prompt, setPrompt] = useState('')
  const [userName, setUserName] = useState('Alex Sindalovsky')
  const [isPremium, setIsPremium] = useState(false)
  const [response, setResponse] = useState('')
  const [gameStartAlert, setGameStartAlert] = useState('')
  const [shouldGenerateTTS, setGenerateTTS] = useState(false)
  const [shouldPlayTTS, setPlayTTS] = useState(false)
  const assistantSent = useRef(false)
  const handleFrontEvent = (func: any) => {
    switch (func.event) {
      case 'start_hangman_game':
        setGameStartAlert('Time to start the Hangman Game!')
        const args = func.arguments.word ? func.arguments : JSON.parse(func.arguments)
        console.log('start hangman game', { args })

        resetGame({ ...args })
        break
    }
  }
  const handleAudioEvent = (filename: string) => {
    if (!shouldPlayTTS) return
    requestAnimationFrame(() => {
      load(`${SPEECH_PATH}/${filename}`, {
        autoplay: true,
      })
    })
  }

  const handlePromptToAssistant = useCallback(
    async (additionalData = {} as any) => {
      if (!additionalData.prompt && (!prompt || prompt === '')) return
      let res
      try {
        res = await fetch('/api/hangman', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt, userName, isPremium, threadId, tts: shouldGenerateTTS, ...additionalData }),
        })
      } catch (e) {
        console.log(e)
        throw new Error("Couldn't send prompt to assistant")
      }
      if (!res) throw new Error('No response from assistant')
      const data = await res.json()
      if (data.actions) {
        for (let i = 0; i < data.actions.length; i++) {
          if (data.actions[i].action === 'send_to_frontend') {
            handleFrontEvent(data.actions[i])
          }
        }
      }
      if (data.speechFile) {
        handleAudioEvent(data.speechFile)
      }
      if (data.threadId && !threadId) {
        setThreadId(data.threadId)
      }
      setResponse(data.response)
    },
    [shouldGenerateTTS, prompt, userName, isPremium, threadId],
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    handlePromptToAssistant({ prompt, tts: shouldGenerateTTS })
  }

  useEffect(() => {
    if (assistantSent.current === true) return
    assistantSent.current = true
    fetch('/api/hangman', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startConversation: true,
        userName,
        isPremium,
        tts: shouldGenerateTTS,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.threadId) {
          setThreadId(data.threadId)
        }
        setResponse(data.response)
      })
  }, [])

  const handleHangmanUserGuess = useCallback(
    (data: { guess: string; correct: boolean; response: any }) => {
      console.log('onGuess', { data })
      if (!threadId) return
      const { response } = data
      const guessPrompt = `this is your moderator, only you can see this message.
    the user have just guesses "${data.guess}", and it was ${
        data.correct ? 'correct' : 'wrong'
      }, just a reminder, the word is "${wordToDiscover}"`
      if (response.speechFile) {
        handleAudioEvent(response.speechFile)
      }
      //handlePromptToAssistant({ prompt: guessPrompt })
    },
    [shouldGenerateTTS, threadId, wordToDiscover],
  )

  const handleHangmanGameEnd = useCallback(
    (result: any) => {
      console.log('GameEndCallback', { result })

      const { action, score, guessesCount, correct, wrong } = result as any
      const isWin = action === 'win'
      const gameStatusPrompt = isWin
        ? `won the game and guessed correctly the word ${wordToDiscover}`
        : `lost the game, the word was ${wordToDiscover}}`
      const endGamePrompt = `${moderatorPrefix}
      the user have just finished the hangman game, ${gameStatusPrompt}, ${guessesCount} guesses were made (${correct} corerct, ${wrong} wrong), the finish score of the game is: ${score}, you should respond to the user.`
      if (!threadId) return
      handlePromptToAssistant({ prompt: endGamePrompt })
    },
    [shouldGenerateTTS, threadId, wordToDiscover],
  )

  const handleGenerateTTSToggle = useCallback(
    (e: any) => {
      const nextGenerateState = !shouldGenerateTTS
      if (nextGenerateState === false) {
        setPlayTTS(false)
      }
      setGenerateTTS(nextGenerateState)
    },
    [shouldPlayTTS, setPlayTTS, setGenerateTTS],
  )

  const handlePlayTTSToggle = useCallback(
    (e: any) => {
      const nextPlayState = !shouldPlayTTS
      if (nextPlayState === false) {
        setGenerateTTS(false)
      }
      setPlayTTS(nextPlayState)
    },
    [shouldPlayTTS, setPlayTTS, setGenerateTTS],
  )

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
          <div>
            <label>
              <input type="checkbox" checked={shouldGenerateTTS} onChange={handleGenerateTTSToggle} />
              Generate TTS
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                disabled={!shouldGenerateTTS}
                checked={shouldPlayTTS && shouldGenerateTTS}
                onChange={handlePlayTTSToggle}
              />
              Play TTS
            </label>
          </div>
          <div className="p-2 border border-gray-300 rounded">
            {gameStartAlert && <p className="text-green-600">{gameStartAlert}</p>}
            <p>{response}</p>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              setThreadId(undefined)
            }}
          >
            Delete History
          </button>
        </form>
      </div>
      <div className="w-2/3 p-4">
        <div className="interactive-content">
          <HangmanGame
            tts={shouldGenerateTTS}
            onGuess={handleHangmanUserGuess}
            onGameEnd={handleHangmanGameEnd}
            onGameStart={(result) => {
              console.log('onGameStart', { result })
            }}
          />
        </div>
      </div>
    </div>
  )
}

