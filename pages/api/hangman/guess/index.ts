// pages/api/openai.ts

import fs from 'fs'
import { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'
import { randomUUID } from 'crypto'
import axios from 'axios'
import { SearchGamesParams, ToolCall, RunStatus, MessageForRun } from '../../../../src/types/TTAssistantTypes'
import { createTTS } from '../../utils'

const TT_SERVICE_BASE = `https://openaitests.oa.r.appspot.com/tinytap-games`
const TT_HANGMAN_ID = 'asst_9X99OuEO6NrzWYfegs5piaA3'

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY environment variable')
  process.exit(1)
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function handleToolCall(toolCall: ToolCall) {
  const { type, function: func } = toolCall
  // Check if the action is to start the Hangman game
  if (type === 'function') {
    let args
    switch (func.name) {
      case 'example':
        return {
          event: 'start_hangman_game',
          action: 'send_to_frontend',
          action_id: randomUUID(),
          arguments: JSON.parse(func.arguments),
        }
      default:
        throw new Error(`Unhandled tool call: ${JSON.stringify(toolCall)}`)
    }
  }

  throw new Error(`Unhandled tool call: ${JSON.stringify(toolCall)}`)
}
let actionsToFront = [] as any[]
async function waitForRunCompletion(threadId: string, runId: string, maxRetries = 100) {
  for (let i = 0; i < maxRetries; i++) {
    const runStatus = (await openai.beta.threads.runs.retrieve(threadId, runId)) as RunStatus
    const additionalData = { tools: [] } as any
    console.log('runStatus - ', runStatus.status)

    if (runStatus.status === 'requires_action') {
      const requiredAction = runStatus.required_action!
      //console.log('requiredAction - ', { requiredAction })
      const actionType = requiredAction.type
      console.log('actionType - ', { actionType })
      if (actionType === 'submit_tool_outputs') {
        //console.log('submit_tool_outputs')
        const { tool_calls } = requiredAction.submit_tool_outputs as any
        for (const toolCall of tool_calls) {
          console.log('toolCall: ', { toolCall })
          const result = await handleToolCall(toolCall)
          if (toolCall.type === 'function') {
            actionsToFront.push(result)
          }
          console.log('additionalData <>', actionsToFront)
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
      return { runStatus, additionalData }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  throw new Error('Run did not complete within the specified maxRetries')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const threadId = req.body.threadId
      const shouldGenerateTTS = req.body.tts
      console.log(TT_HANGMAN_ID, threadId, 'assistantId,threadId')
      let thread
      if (!threadId) {
        thread = await openai.beta.threads.create()
      } else {
        thread = await openai.beta.threads.retrieve(threadId)
      }
      const assistant = await openai.beta.assistants.retrieve(TT_HANGMAN_ID)
      const additionalData = {} as any

      const message = {
        role: 'user',
        content: req.body.prompt || '',
      } as any

      await openai.beta.threads.messages.create(thread.id, message)
      const instructions = [] as string[]
      if (req.body.instructions) {
        instructions.push(req.body.instructions)
      }
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.id,
        instructions: instructions.join(' '),
      })

      const completion = await waitForRunCompletion(thread.id, run.id)

      console.log('completion>>>>>>', {
        actions: actionsToFront,
        completion: JSON.stringify(completion.additionalData),
      })
      if (actionsToFront.length > 0) {
        additionalData.actions = actionsToFront
      }

      const messages = (await openai.beta.threads.messages.list(thread.id)) as { data: MessageForRun[] }
      console.log('MESSAGES>>>>>', { messages })

      const lastMessageForRun = messages.data
        .filter((message) => message.run_id === run.id && message.role === 'assistant')
        .pop()
      console.log(lastMessageForRun, '<<<<<<lastMessageForRun')
      additionalData.runId = run.id

      if (lastMessageForRun) {
        if (shouldGenerateTTS) {
          const speechFile = await createTTS(openai, lastMessageForRun.content[0].text.value)
          if (speechFile) {
            additionalData.speechFile = speechFile
          }
        }
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

