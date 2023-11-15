import path from 'path'
import fs from 'fs'
// pages/api/openai.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'
import axios from 'axios'
import { SearchGamesParams, ToolCall, RunStatus, MessageForRun } from '../../src/types/TTAssistantTypes'
import { sendToClient } from './sse'
import { randomUUID } from 'crypto'

const TT_SERVICE_BASE = `https://openaitests.oa.r.appspot.com/tinytap-games`
const TT_ASSISTANT_ID = 'asst_zODoqd54bED7qv3MLxAAmTHC'

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY environment variable')
  process.exit(1)
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function searchGames({ endpoint, params }: SearchGamesParams) {
  try {
    console.log('searchGames - ', { endpoint, params, full: `${TT_SERVICE_BASE}${endpoint}` })
    const response = await axios.get(`${TT_SERVICE_BASE}${endpoint}`, { params })
    return response.data
  } catch (error: any) {
    console.error('Error searching games:', error.message)
    throw error
  }
}
// (Continuation of pages/api/openai.ts)
const sendToHangman = (sseClientId: string, func: any) => {
  const args = JSON.parse(func.arguments) as any
  console.log('start_game args', { args })
  sendToClient(sseClientId, {
    type: 'start_hangman_game',
    payload: args,
  })
  return {
    status: 'game_started',
    arguments: JSON.stringify(args),
  }
}

async function handleToolCall(toolCall: ToolCall, sseClientId: string) {
  console.log('handleToolCall', sseClientId)
  const { type, function: func } = toolCall
  // Check if the action is to start the Hangman game
  if (type === 'function') {
    let args
    switch (func.name) {
      case 'start_hangman_game':
        return sendToHangman(sseClientId, { type: 'start', func })
      case 'search_games':
        args = JSON.parse(func.arguments) as SearchGamesParams
        return await searchGames(args)
      case 'get_tinytap_games_for_query':
        args = JSON.parse(func.arguments) as SearchGamesParams
        const endpoint = `/${args.endpoint}`
        return await searchGames({ endpoint, params: args.params })
      default:
        throw new Error(`Unhandled tool call: ${JSON.stringify(toolCall)}`)
    }
  }

  throw new Error(`Unhandled tool call: ${JSON.stringify(toolCall)}`)
}

async function waitForRunCompletion(threadId: string, runId: string, sseClientId: any, maxRetries = 100) {
  for (let i = 0; i < maxRetries; i++) {
    const runStatus = (await openai.beta.threads.runs.retrieve(threadId, runId)) as RunStatus
    console.log('runStatus - ', runStatus.status)

    if (runStatus.status === 'requires_action') {
      const requiredAction = runStatus.required_action!
      //console.log('requiredAction - ', { requiredAction })
      const actionType = requiredAction.type

      if (actionType === 'submit_tool_outputs') {
        //console.log('submit_tool_outputs')
        const { tool_calls } = requiredAction.submit_tool_outputs
        for (const toolCall of tool_calls) {
          console.log('toolCall: ', { toolCall, sseClientId })
          const result = await handleToolCall(toolCall, sseClientId)
          console.log('RESULT: ', result)

          await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
            tool_outputs: [
              {
                tool_call_id: toolCall.id,
                output: JSON.stringify(result),
              },
            ],
          })
        }
      }
    }

    if (runStatus.status === 'completed') {
      return runStatus
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  throw new Error('Run did not complete within the specified maxRetries')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const threadId = req.body.threadId
      const isPremium = req.body.isPremium
      const userName = req.body.userName
      const sseClientId = req.body.sseClientId
      let thread
      if (!threadId) {
        thread = await openai.beta.threads.create()
      } else {
        thread = await openai.beta.threads.retrieve(threadId)
      }
      const assistant = await openai.beta.assistants.retrieve(TT_ASSISTANT_ID)
      const additionalData = {} as any

      if (req.body.startConversation) {
        //additionalData.should_get_thread_id = true
      }
      const message = {
        role: 'user',
        content: req.body.startConversation
          ? `I'm your moderator, only you can see this message. the user is just connected, please say hi to the user, introduce yourself as "TinyTap Assistant" and ask him how can you help him. keep your response short and simple, you can make suggestions according to your original instructions - to help users with searching tinytap games, creating game scripts, play a game, or suggest TinyTapAI games for fun.`
          : req.body.prompt || '',
      } as any

      await openai.beta.threads.messages.create(thread.id, message)

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.id,
        instructions: `${
          userName
            ? 'The user you are talking with name is ' + userName + '.'
            : 'user info not found, try asking if its a TinyTap player or creator.'
        } ${isPremium ? 'The user have a premium account' : ''}`,
      })
      console.log('waitForRunCompletion SSEClIENT', { sseClientId })
      await waitForRunCompletion(thread.id, run.id, sseClientId)

      const messages = (await openai.beta.threads.messages.list(thread.id)) as { data: MessageForRun[] }

      const lastMessageForRun = messages.data
        .filter((message) => message.run_id === run.id && message.role === 'assistant')
        .pop()

      if (lastMessageForRun) {
        const uuid = randomUUID()
        const speechFilesFolder = path.resolve('./public/audio-files')
        const speechFileName = `speech-${uuid}.mp3`
        const speechFile = speechFilesFolder + '/' + speechFileName
        const mp3 = await openai.audio.speech.create({
          model: 'tts-1',
          voice: 'alloy',
          input: lastMessageForRun.content[0].text.value,
        })
        console.log(speechFile, 'speechFile')
        const buffer = Buffer.from(await mp3.arrayBuffer())
        await fs.promises.writeFile(speechFile, buffer)
        additionalData.speechFile = speechFile
        res
          .status(200)
          .json({ response: lastMessageForRun.content[0].text.value, threadId: thread.id, ...additionalData })
      } else {
        res.status(404).json({ message: 'No response found.' })
      }
    } catch (error: any) {
      console.error(error)
      res.status(500).json({ message: error.message })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

