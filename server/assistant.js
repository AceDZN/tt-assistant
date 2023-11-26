// assistant.js

const express = require('express')
const OpenAI = require('openai')
const { v4: uuidv4 } = require('uuid')
const axios = require('axios')
const { extractJSON } = require('./utils')

// Set default axios baseURL
axios.defaults.baseURL = 'http://localhost:3030'

// Initialize Express router
const router = express.Router()

// Constants
const jobsEndpoint = '/assistant/jobs'
const TT_ASSISTANT_ID = `asst_LotLGvLUwWyKueeXGg0Zg3og`
const PROMPT_ASSISTANT_ID = `asst_R9yVGhxeZMgxoVBVBBZpDJRz`

// In-memory store for clients and jobs
const clients = {}
const jobs = {}

// Configurations
const config = {
  OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY,
  DID_API_KEY: process.env.VITE_DID_API_KEY,
}
console.log('Config:', config)
// Initialize OpenAI instance
const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
})

// Helper Functions

/**
 * Posts a job event to a specified endpoint.
 * @param {string} jobId - Unique identifier for the job.
 * @param {object} data - Data to be sent with the job event.
 */
const sendJobEvent = async (jobId, data) => {
  await axios.post(jobsEndpoint, { jobId, ...data })
  console.log(jobsEndpoint, { jobId, ...data })
}

/**
 * Handles tool calls based on the type of function.
 * @param {object} toolCall - The tool call object.
 * @returns {Promise<object>} - The result of the tool call handling.
 */
async function handleToolCall(toolCall, sendJobEventToSSE, runId, threadId) {
  const { type, function: func } = toolCall
  console.log('toolCall', toolCall)
  if (type !== 'function') {
    throw new Error(`Unhandled tool call: ${JSON.stringify(toolCall)}`)
  }

  let args
  switch (func.name) {
    case 'create_images':
      return createImages(func.arguments, sendJobEventToSSE)
    case 'visualize_slide':
      return visualizeSlide(func.arguments, sendJobEventToSSE, runId, threadId)

    //case 'parallel':
    //return handleParrallelTools(func.arguments, sendJobEventToSSE, runId, threadId)
    default:
      return toolCall
      throw new Error(`Unhandled tool call: ${JSON.stringify(toolCall)}`)
  }
}

/**
 * Waits for a run to complete, retrying a specified number of times.
 * @param {string} threadId - ID of the thread.
 * @param {string} runId - ID of the run.
 * @param {number} maxRetries - Maximum number of retries.
 * @returns {Promise<object>} - The status and additional data of the run.
 */
async function waitForRunCompletion(threadId, runId, maxRetries = 100, sendJobEventToSSE) {
  let actionsToFront = []

  for (let i = 0; i < maxRetries; i++) {
    const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId)
    console.log('Run Status:', runStatus.status)
    sendJobEventToSSE({
      message: `Run Status: ${runStatus.status}`,
      data: { runId, threadId, assinstantId: TT_ASSISTANT_ID, status: runStatus.status },
    })

    if (runStatus.status === 'requires_action') {
      const requiredAction = runStatus.required_action
      console.log('Action Type:', requiredAction.type)
      sendJobEventToSSE({
        message: `Require Action Type: ${requiredAction.type}`,
        data: {
          runId,
          threadId,
          assinstantId: TT_ASSISTANT_ID,
          status: runStatus.status,
          actionType: requiredAction.type,
        },
      })

      if (requiredAction.type === 'submit_tool_outputs') {
        const { tool_calls } = requiredAction.submit_tool_outputs

        sendJobEventToSSE({
          message: `submit_tool_outputs: ${JSON.stringify(tool_calls)}`,
          data: { runId, threadId, assinstantId: TT_ASSISTANT_ID, status: 'tool_calls' },
        })

        for (const toolCall of tool_calls) {
          const result = await handleToolCall(toolCall, sendJobEventToSSE, runId, threadId)

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
      return { runStatus, actionsToFront }
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error('Run did not complete within the specified maxRetries')
}

/**
 * Simulates a delay for asynchronous operations.
 * @returns {Promise<void>}
 */
async function doSomeWork() {
  return new Promise((resolve) => {
    setTimeout(resolve, 10000)
  })
}

// Route Handlers

/**
 * POST route handler for '/message'.
 */
router.post('/message', async (req, res) => {
  if (!config.OPENAI_API_KEY) {
    return res.status(500).send('OpenAI API Key Missing')
  }

  const {
    jobId = uuidv4(),
    threadId,
    prompt,
    tts: shouldGenerateTTS,
    images: shouldGenerateImages,
    startConversation,
  } = req.body

  try {
    let step = 0
    const sendJobEventToSSE = async (data = { message: `Step ${step} complete` }) => {
      step = step + 1
      sendJobEvent(jobId, { step: step, ...data })
    }

    sendJobEventToSSE({ message: 'Starting' })
    const additionalData = {}
    let thread = threadId ? await openai.beta.threads.retrieve(threadId) : await openai.beta.threads.create()
    let assistant = await openai.beta.assistants.retrieve(TT_ASSISTANT_ID)
    let run = await initiateAssistantRun(thread, assistant, prompt, startConversation)

    const _runId = run.id
    const _threadId = thread.id
    const _assinstantId = assistant.id

    sendJobEventToSSE({
      message: 'Assistant run initiated',
      data: { runId: _runId, threadId: _threadId, assinstantId: _assinstantId },
    })
    const completion = await waitForRunCompletion(_threadId, _runId, undefined, sendJobEventToSSE)

    sendJobEventToSSE({
      message: 'Completion Ready',
      data: {
        completion: JSON.stringify(completion.additionalData),
        runId: _runId,
        threadId: _threadId,
        assinstantId: _assinstantId,
      },
    })

    console.log('completion>>>>>>', {
      actions: [], //actionsToFront,
      completion: JSON.stringify(completion.additionalData),
    })
    /*
    if (actionsToFront.length > 0) {
      additionalData.actions = actionsToFront
    }
*/
    const messages = await openai.beta.threads.messages.list(thread.id)
    console.log('MESSAGES>>>>>', { messages })

    const lastMessageForRun = messages.data
      .filter((message) => message.run_id === run.id && message.role === 'assistant')
      .pop()
    console.log(lastMessageForRun, '<<<<<<lastMessageForRun')
    additionalData.runId = run.id

    if (lastMessageForRun) {
      if (shouldGenerateTTS) {
        const speechFile = await createTTS(lastMessageForRun.content[0].text.value)
        additionalData.speechFile = speechFile
      }
      sendJobEventToSSE({
        message: 'Completed',
        data: {
          response: lastMessageForRun.content[0].text.value,
          runId: _runId,
          threadId: _threadId,
          assinstantId: _assinstantId,
        },
      })

      res
        .status(200)
        .json({ response: lastMessageForRun.content[0].text.value, threadId: thread.id, ...additionalData })

      delete jobs[jobId]
    }
    //return res.send('Done')
  } catch (err) {
    console.warn('Error:', err)
    return res.status(500).send(err)
  }
})

/**
 * GET route handler for '/ping-pong'.
 */
router.get('/ping-pong', (req, res) => {
  res.send('pong')
})

/**
 * POST route handler for '/jobs'.
 */
router.post('/jobs', (req, res) => {
  const { jobId, step, data } = req.body
  jobs[jobId] = { step, data }

  if (clients[jobId]) {
    clients[jobId].write(`data: ${JSON.stringify(jobs[jobId])}\n\n`)
  }
  return res.end()
})

/**
 * GET route handler for '/jobs/:jobId'.
 */
router.get('/jobs/:jobId', (req, res) => {
  const jobId = req.params.jobId

  if (!clients[jobId]) {
    console.log('New Client', { jobId })
    clients[jobId] = res

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    })

    res.write(`data: ${JSON.stringify(jobs[jobId])}\n\n`)
  } else {
    console.log('Existing Client', { jobId })
    clients[jobId].write(`data: ${JSON.stringify(jobs[jobId])}\n\n`)
  }
})

// Additional Helper Functions

/**
 * Initiates an assistant run with provided parameters.
 * @param {object} thread - Thread object from OpenAI.
 * @param {object} assistant - Assistant object from OpenAI.
 * @param {string} prompt - Prompt for the assistant.
 * @param {boolean} startConversation - Indicates if the conversation is starting.
 * @returns {Promise<object>} - The initiated run.
 */

async function initiateAssistantRun(thread, assistant, prompt, startConversation) {
  let instructions = []
  let messageContent = startConversation
    ? `I'm your moderator, only you can see this message. the user is just connected, he/she is a bit shy, try asking him/her something.`
    : prompt || ''

  let message = {
    role: 'user',
    content: messageContent,
  }
  await openai.beta.threads.messages.create(thread.id, message)
  return openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
    instructions: instructions.join(' '),
  })
}
async function createImages(images = [], sendJobEventToSSE) {
  let thread = await openai.beta.threads.create()
  let assistant = await openai.beta.assistants.retrieve(PROMPT_ASSISTANT_ID)
  let run = await initiateAssistantRun(thread, assistant, JSON.stringify({ images: images }), undefined)
  const completion = await waitForRunCompletion(thread.id, run.id, undefined, sendJobEventToSSE)

  const messages = await openai.beta.threads.messages.list(thread.id)
  console.log('MESSAGES>>>>>', { messages: messages.data })

  const lastMessageForRun = messages.data
    .filter((message) => message.run_id === run.id && message.role === 'assistant')
    .pop()

  console.log(lastMessageForRun, '<<<<<<lastMessageForRun')

  const imageUrls = []
  if (lastMessageForRun) {
    const json = extractJSON(lastMessageForRun.content[0].text.value)
    const msg = json[0]
    const images = msg.prompts
    for (const image of images) {
      const response = await openai.createImage({
        prompt: `${image.prompt}`,
        n: 1,
        size: '256x256',
      })
      imageUrls.push(response.data.data[0].url)
    }
  }

  sendJobEventToSSE({
    message: `createImages`,
    data: { runId: run.id, threadId: thread.id, assinstantId: PROMPT_ASSISTANT_ID, imageUrls: imageUrls },
  })
  return { imageUrls }
}

async function visualizeSlide(slide, sendJobEventToSSE, runId, threadId) {
  console.log(JSON.stringify(slide))

  sendJobEventToSSE({
    message: `visualizeSlide`,
    data: { runId: runId, threadId: threadId, assinstantId: TT_ASSISTANT_ID, slide: slide },
  })
  return slide
}

async function handleParrallelTools(func) {
  return func
  /*
  const tool_calls = func.arguments
  for (const toolCall of tool_calls) {
    const result = await handleToolCall(toolCall)

    await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
      tool_outputs: [
        {
          tool_call_id: toolCall.id,
          output: JSON.stringify(result),
        },
      ],
    })
  }*/
}
// Export the router module
module.exports = router

