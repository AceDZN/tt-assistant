// types/HangmanTypes.ts

// Callback type for when the game starts
export interface GameStartCallback {
  (gameInfo: { word: string; maxTries: number; letters: string[]; description: string }): void
}

// Callback type for when the game ends
export interface GameEndCallback {
  (result: { action: 'game-over' | 'win'; score: number; guessesCount: number; correct: number; wrong: number }): void
}

// Callback type for each guess
export interface GuessCallback {
  (guessInfo: { guess: string; correct: boolean; response: any }): void
}

// Hangman game state
export interface HangmanGameState {
  keyboardEnabled: boolean
  guesses: string[]
  right: string[]
  wrong: string[]
  score: number
  maxTries: number
  wordToDiscover: string
  description: string
  allowedLetters: string[]
  errors: number
  gameOverState: boolean
}

// Configuration for resetting the game
export interface ResetGameConfig {
  word?: string
  maxTries?: number
  letters?: string[]
  keepScore?: boolean
  description?: string
}

// Hangman game context
export interface HangmanContextProps extends HangmanGameState {
  setKeyboardEnabled: (enabled: boolean) => void
  resetGame: (config: ResetGameConfig) => void
  setHint: (hint: string) => void
  setLetters: (letters: string[]) => void
  addToScore: (points: number) => void
  reduceScore: (points: number) => void
  setGameOver: (message: string, staticScore?: number, icon?: string) => void
  setSuccess: (message: string, staticScore?: number, icon?: string) => void
  makeGuess: (letter: string) => void
  revealHintLetter: () => void
}

