import path from 'path'
import fs from 'fs'
import { OpenAI } from 'openai'
import { randomUUID } from 'crypto'
export const createTTS = async (openai: any, text: string) => {
  if (!openai) {
    return null
  }
  const uuid = randomUUID()
  const speechFilesFolder = path.resolve('./public/audio-files')
  const speechFileName = `speech-${uuid}.mp3`
  const speechFile = speechFilesFolder + '/' + speechFileName
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: text,
  })
  console.log(speechFile, 'speechFile')
  const buffer = Buffer.from(await mp3.arrayBuffer())
  await fs.promises.writeFile(speechFile, buffer)
  return speechFileName
}

