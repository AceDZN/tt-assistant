// components/audioUtils.ts
import { useGlobalAudioPlayer } from 'react-use-audio-player'

const SPEECH_PATH = 'audio-files/'

export const useAudioHandler = () => {
  const { load } = useGlobalAudioPlayer()

  const handleAudioEvent = (filename: string, shouldPlay: boolean) => {
    if (!shouldPlay) return
    requestAnimationFrame(() => {
      load(`${SPEECH_PATH}/${filename}`, {
        autoplay: true,
      })
    })
  }

  return handleAudioEvent
}

