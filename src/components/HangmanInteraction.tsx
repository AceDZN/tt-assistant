// components/HangmanInteraction.tsx
import React from 'react'
import HangmanGame from './HangmanGame'

type HangmanInteractionProps = {
  tts: boolean
  onGuess: (data: { guess: string; correct: boolean; response: any }) => void
  onGameEnd: (result: any) => void
  onGameStart: (result: any) => void
}

const HangmanInteraction: React.FC<HangmanInteractionProps> = ({ tts, onGuess, onGameEnd, onGameStart }) => {
  return (
    <div className="interactive-content">
      <HangmanGame tts={tts} onGuess={onGuess} onGameEnd={onGameEnd} onGameStart={onGameStart} />
    </div>
  )
}

export default HangmanInteraction

