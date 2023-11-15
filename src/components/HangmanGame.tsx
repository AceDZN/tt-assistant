// HangmanGame.tsx
'use client'
import React, { useEffect, useCallback, useRef } from 'react'
import {
  GameContainer,
  GameSection,
  HangmanContainer,
  WordDisplay,
  AlphabetButtons,
  HangmanFigure,
  GameStateIndicators,
  GameControls,
  GuessedLettersDisplay,
  HintDescription,
} from './styles/StyledComponents'
import { useHangmanContext } from './context/HangmanContext'
import { GameEndCallback, GameStartCallback, GuessCallback } from '../types/HangmanTypes'

const HangmanGame: React.FC<{
  onGameStart?: GameStartCallback
  onGameEnd?: GameEndCallback
  onGuess?: GuessCallback
}> = ({ onGameStart, onGameEnd, onGuess }) => {
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
  const gameStarted = useRef(false)
  const shouldSendEvent = useRef(true)
  useEffect(
    (next, prev) => {
      console.log({ next, prev })
      if (!wordToDiscover) return
      shouldSendEvent.current = true
    },
    [wordToDiscover],
  )
  useEffect(() => {
    if (gameStarted.current === true) return
    onGameStart?.({
      word: wordToDiscover,
      description,
      letters: allowedLetters,
      maxTries,
    })
    gameStarted.current = true
  }, [onGameStart])

  useEffect(() => {
    if (!shouldSendEvent.current) return
    if (errors >= maxTries) {
      setGameOver('Game Over! Try again.')
      onGameEnd?.({ score, guessesCount: guesses.length, correct: right.length, wrong: wrong.length })
      gameStarted.current = false
      shouldSendEvent.current = false
    } else if (wordToDiscover.split('').every((char) => guesses.includes(char.toUpperCase()))) {
      setSuccess('Congratulations! You won!')
      onGameEnd?.({ score, guessesCount: guesses.length, correct: right.length, wrong: wrong.length })
      gameStarted.current = false
      shouldSendEvent.current = false
    }
  }, [guesses, errors, maxTries, wordToDiscover, onGameEnd])

  const handleLetterClick = (letter: string) => {
    if (gameOverState) return
    makeGuess(letter)
    onGuess?.({ guess: letter, correct: wordToDiscover.toUpperCase().includes(letter.toUpperCase()) })
  }
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key.length === 1 && allowedLetters.includes(event.key.toUpperCase())) {
        handleLetterClick(event.key.toUpperCase())
      }
    },
    [handleLetterClick, allowedLetters],
  )

  useEffect(() => {
    if (!!keyboardEnabled) {
      window.addEventListener('keypress', handleKeyPress)
    }
    return () => {
      window.removeEventListener('keypress', handleKeyPress)
    }
  }, [keyboardEnabled, handleKeyPress, wordToDiscover])

  const displayWord = () => {
    return wordToDiscover
      .split('')
      .map((char) => (guesses.includes(char.toUpperCase()) ? char : '_'))
      .join(' ')
  }

  const toggleKeyboard = useCallback(() => {
    setKeyboardEnabled(!keyboardEnabled)
  }, [keyboardEnabled, setKeyboardEnabled])

  return (
    <GameContainer>
      <GameSection>
        <HangmanContainer>
          <HintDescription>{description}</HintDescription>
          <WordDisplay>{displayWord()}</WordDisplay>
          <AlphabetButtons>
            {allowedLetters.map((letter) => (
              <button
                key={'option_key_' + letter + 's'}
                disabled={guesses.includes(letter) || gameOverState}
                onClick={() => handleLetterClick(letter)}
              >
                {letter}
              </button>
            ))}
          </AlphabetButtons>
          <GuessedLettersDisplay>
            {guesses.map((guess) => (
              <span key={guess}>{guess}</span>
            ))}
          </GuessedLettersDisplay>
          <GameStateIndicators>
            <div>
              Errors: {errors} / {maxTries}
            </div>
            <div>Score: {score}</div>
          </GameStateIndicators>
          <GameControls>
            <button onClick={() => resetGame({ keepScore: false })}>Restart Game</button>
            <button onClick={() => revealHintLetter()}>Show Hint</button>
            <button onClick={() => toggleKeyboard()} className={`${!!keyboardEnabled ? 'active' : ''} has-icon`}>
              <img src="images/icons/keyboard.svg" width={24} height={24} />
            </button>
          </GameControls>
        </HangmanContainer>
      </GameSection>
      <HangmanFigure>
        {/* Placeholder for the hangman image. Adjust the path as necessary. */}
        <img src={`/images/hangman/${maxTries}/${errors}.png`} alt="Hangman" />
      </HangmanFigure>
    </GameContainer>
  )
}

export default HangmanGame

