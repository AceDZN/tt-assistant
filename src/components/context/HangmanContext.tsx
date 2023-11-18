// HangmanContext.ts
import React, { createContext, useState, useContext } from 'react'
import { HangmanContextProps, HangmanGameState, ResetGameConfig } from '../../types/HangmanTypes'

const defaultValues: HangmanGameState = {
  keyboardEnabled: false,
  guesses: [],
  right: [],
  wrong: [],
  score: 0,
  maxTries: 6,
  wordToDiscover: 'House',
  description: 'A place you live in',
  allowedLetters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  errors: 0,
  gameOverState: false,
}

export const HangmanContext = createContext<HangmanContextProps>({
  ...defaultValues,
  setKeyboardEnabled: () => {},
  resetGame: () => {},
  setHint: () => {},
  setLetters: () => {},
  addToScore: () => {},
  reduceScore: () => {},
  setGameOver: () => {},
  setSuccess: () => {},
  makeGuess: () => {},
  revealHintLetter: () => {},
})

export const useHangmanContext = () => useContext(HangmanContext)

export const HangmanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<HangmanGameState>(defaultValues)

  const updateState = (newState: Partial<HangmanGameState>) => {
    setState((prevState) => ({ ...prevState, ...newState }))
  }
  const setKeyboardEnabled = (enabled: boolean) => {
    updateState({ keyboardEnabled: enabled })
  }
  const resetGame = ({
    word = defaultValues.wordToDiscover,
    maxTries = defaultValues.maxTries,
    letters = defaultValues.allowedLetters,
    description = defaultValues.description,
    keepScore = false,
  }: ResetGameConfig) => {
    updateState({
      guesses: [],
      right: [],
      wrong: [],
      score: keepScore ? state.score : 0,
      maxTries,
      wordToDiscover: word,
      allowedLetters: letters.map((letter) => letter.toUpperCase()),
      errors: 0,

      gameOverState: false, // Reset the gameOverState on game restart
      description: description, // Reset the description to default
    })
  }

  const revealHintLetter = () => {
    // Find a letter in the word that has not been guessed yet
    const unguessedLetters = state.wordToDiscover
      .toUpperCase()
      .split('')
      .filter((letter) => !state.guesses.includes(letter))
    if (unguessedLetters.length > 0) {
      // Choose a random unguessed letter to reveal
      const hintLetter = unguessedLetters[Math.floor(Math.random() * unguessedLetters.length)]
      makeGuess(hintLetter, true) // true indicates this is a hint guess
    }
  }

  const setHint = (newDescription: string) => {
    updateState({ description: newDescription })
  }

  const setLetters = (letters: string[]) => {
    const fixedLetters = letters.map((letter) => letter.toUpperCase())
    updateState({ allowedLetters: fixedLetters })
  }

  const addToScore = (points: number) => {
    updateState({ score: state.score + points })
  }

  const reduceScore = (points: number) => {
    updateState({ score: state.score - points })
  }

  const setGameOver = (message: string, staticScore?: number) => {
    updateState({
      description: message,
      score: staticScore !== undefined ? staticScore : state.score,
      gameOverState: true,
    })
  }

  const setSuccess = (message: string, staticScore?: number) => {
    updateState({
      description: message,
      score: staticScore !== undefined ? staticScore : state.score,
      gameOverState: true,
    })
  }

  const makeGuess = (letter: string, isHint: boolean = false) => {
    const isCorrect = state.wordToDiscover.toUpperCase().includes(letter.toUpperCase())
    const newGuesses = [...state.guesses, letter.toUpperCase()]
    updateState({
      guesses: newGuesses,
      right: isCorrect ? [...state.right, letter.toUpperCase()] : state.right,
      wrong: isCorrect ? state.wrong : [...state.wrong, letter.toUpperCase()],
      errors: isCorrect || isHint ? state.errors : state.errors + 1, // Do not increment errors if isHint is true
    })
  }

  return (
    <HangmanContext.Provider
      value={{
        ...state,
        setKeyboardEnabled,
        resetGame,
        setHint,
        revealHintLetter,
        setLetters,
        addToScore,
        reduceScore,
        setGameOver,
        setSuccess,
        makeGuess,
      }}
    >
      {children}
    </HangmanContext.Provider>
  )
}

export default HangmanProvider

