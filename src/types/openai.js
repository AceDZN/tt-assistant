const { OpenAI } = require('openai')
const axios = require('axios')

// Validate environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY environment variable')
  process.exit(1)
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

let sseResponse // Global variable to store the SSE connection

function sendSSEMessage(data) {
  if (sseResponse) {
    sseResponse.write(`data: ${JSON.stringify(data)}\n\n`)
  }
}

async function searchGames(endpoint, params) {
  try {
    console.log('searchGames - ', { endpoint, params, full: `${TT_SERVICE_BASE}${endpoint}` })
    const response = await axios.get(`${TT_SERVICE_BASE}${endpoint}`, { params })
    return response.data
  } catch (error) {
    console.error('Error searching games:', error.message)
    throw error
  }
}

const TT_SERVICE_BASE = `https://openaitests.oa.r.appspot.com/tinytap-games`

async function handleToolCall(toolCall) {
  console.log('handleToolCall ')
  const { type, function: func } = toolCall

  if (type === 'function' && func.name === 'search_games') {
    const args = JSON.parse(func.arguments)
    return await searchGames(args.endpoint, args.params)
  }
  if (type === 'function' && func.name === 'get_tinytap_games_for_query') {
    const args = JSON.parse(func.arguments)
    const endpoint = `/${args.query}`
    return await searchGames(endpoint, args.params)
  }
  throw new Error(`Unhandled tool call: ${JSON.stringify(toolCall)}`)
}
async function waitForRunCompletion(threadId, runId, maxRetries = 100) {
  for (let i = 0; i < maxRetries; i++) {
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId)
    console.log('runStatus - ', runStatus.status)
    if (runStatus.status === 'requires_action') {
      const requiredAction = runStatus.required_action
      console.log('requiredAction - ', { requiredAction })
      const actionType = requiredAction.type

      if (actionType === 'submit_tool_outputs') {
        console.log('submit_tool_outputs')
        const { tool_calls } = requiredAction.submit_tool_outputs
        for (const toolCall of tool_calls) {
          console.log('toolCall: ', toolCall)
          const result = await handleToolCall(toolCall)
          console.log('RESULT: ', result)

          if (result.action === 'start_hangman_game') {
            sendSSEMessage({ action: 'start_hangman_game' })
          }

          // Submit the result back to the run (implementation depends on your API requirements)
          const run = await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
            tool_outputs: [
              {
                tool_call_id: toolCall.id,
                output: JSON.stringify(result),
              },
            ],
          })
          console.log('RUN: ', { run })
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

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const assistant = await openai.beta.assistants.retrieve('asst_zODoqd54bED7qv3MLxAAmTHC')

      // Create a thread
      const thread = await openai.beta.threads.create()

      // Add user message to the thread
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: req.body.prompt,
      })

      // Create and wait for run completion
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.id,
      })

      await waitForRunCompletion(thread.id, run.id)

      // Retrieve messages
      const messages = await openai.beta.threads.messages.list(thread.id)

      const lastMessageForRun = messages.data
        .filter((message) => message.run_id === run.id && message.role === 'assistant')
        .pop()

      if (lastMessageForRun) {
        res.status(200).json({ response: lastMessageForRun.content[0].text.value })
      } else {
        res.status(404).json({ message: 'No response found.' })
      }
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  } else if (req.method === 'GET' && req.url === '/sse') {
    sseResponse = res
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    // Keep the connection open
    const intervalId = setInterval(() => {
      res.write(': keep-alive\n\n')
    }, 15000)

    req.on('close', () => {
      clearInterval(intervalId)
      sseResponse = null
      res.end()
    })
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

