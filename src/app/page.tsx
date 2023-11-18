// src/app/page.tsx
'use client'
import AvatarStream from '../components/AvatarStream'
import { HangmanProvider } from '../components/context/HangmanContext'

import GameAssistantWindow from '../components/gameAssistantWindow'

export default function Home() {
  return (
    <HangmanProvider>
      {/*<AvatarStream />*/}
      <GameAssistantWindow />
    </HangmanProvider>
  )
}

