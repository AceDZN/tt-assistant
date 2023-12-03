require('dotenv').config()
const express = require('express')
const OpenAI = require('openai')
const { v4: uuidv4 } = require('uuid')
const Replicate = require('replicate')

const {
  extractJSON,
  sendJobEvent,
  getActivityJSONStructure,
  saveCreatedImageLocally,
  getLearningMethod,
} = require('./utils')
const axios = require('axios')

axios.defaults.baseURL = 'http://localhost:3030'

const router = express.Router()
const IMAGE_GENERATION_WITH_DALLE_3 = true
const SHOULD_GENERATE_PROMPTS = true
const SHOULD_GENERATE_IMAGES = true
const TT_ASSISTANT_ID = `asst_LotLGvLUwWyKueeXGg0Zg3og`
const PROMPT_ASSISTANT_ID = `asst_AggoXrI7AiRjM4vwvCF0pPDF` //``asst_R9yVGhxeZMgxoVBVBBZpDJRz`
const TT_SLIDE_CREATOR_ASSISTANT_ID = `asst_395QmAPVTuZMnwvxxmD4EaEd` //`asst_24H0hGMLf4gyfrLbzBIArsRJ`

const NEW_TT_MAIN_ASSISTANT_ID = `asst_RWxoRwUrX1LaF0djoiebz5qn` //`asst_IyB81iGnTpnDC41Srqimiemj`

const clients = {}
const jobs = {}

const config = {
  OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY,
  DID_API_KEY: process.env.VITE_DID_API_KEY,
}
console.log('Config:', config)

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
})

const replicate = new Replicate({
  auth: process.env.VITE_REPLICATE_API_TOKEN,
})

const handleToolCall = async (toolCall, sendJobEventToSSE) => {
  const { type, function: func } = toolCall
  console.log('toolCall', toolCall)
  if (type !== 'function') {
    throw new Error(`Unhandled tool call: ${JSON.stringify(toolCall)}`)
  }

  switch (func.name) {
    case 'create_slides':
      return createSlides(func.arguments, sendJobEventToSSE)
    case 'get_lesson_plan':
      return getLessonPlan(func.arguments, sendJobEventToSSE)
    case 'get_activity_structure':
      return getActivityStructure(func.arguments, sendJobEventToSSE)
    case 'create_images':
      return createImages(func.arguments, sendJobEventToSSE)
    case 'visualize_slides':
      return visualizeSlides(func.arguments, sendJobEventToSSE)
    case 'parallel':
      return handleParallelTools(toolCall, sendJobEventToSSE)
    default:
      throw new Error(`Unhandled tool call: ${JSON.stringify(toolCall)}`)
  }
}

async function waitForRunCompletion(threadId, runId, maxRetries = 200, sendJobEventToSSE) {
  let actionsToFront = []

  for (let i = 0; i < maxRetries; i++) {
    const runStatus = await openai.beta.threads.runs.retrieve(threadId, runId)
    console.log('Run Status:', runStatus.status, 'Retry:', i)

    if (runStatus.status === 'requires_action') {
      const requiredAction = runStatus.required_action
      console.log('Action Type:', requiredAction.type)

      const { tool_calls } = requiredAction.submit_tool_outputs
      //console.log('Tool Calls:', tool_calls)

      const results = await Promise.all(tool_calls.map((toolCall) => handleToolCall(toolCall, sendJobEventToSSE)))

      const tools_output = results.map((result, index) => ({
        tool_call_id: tool_calls[index].id,
        output: JSON.stringify(result),
      }))

      if (requiredAction.type === 'submit_tool_outputs') {
        await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
          tool_outputs: tools_output,
        })
      }
    }

    if (runStatus.status === 'completed') {
      return { runStatus, actionsToFront }
    }

    if (runStatus.status === 'failed') {
      //console.log('Run failed', { runStatus })
      const message = runStatus.last_error
        ? runStatus.last_error.message
        : 'Run failed due to unknown reason, please refresh and try again'
      const code = runStatus.last_error ? runStatus.last_error.code : 'unknown'
      throw new Error(`[${code}] ${message}`)
    }

    if (runStatus.status === 'failed') {
      return { runStatus, error: 'Run failed due to unknown reason, please refresh and try again' }
    }

    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error('Run did not complete within the specified maxRetries')
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
  let step = 0

  const sendJobEventToSSE = async (data = { message: `Step ${step} complete` }) => {
    step = step + 1
    await sendJobEvent(jobId, { ...data, step })
  }

  try {
    sendJobEventToSSE({ status: 'Starting' })
    const additionalData = {}
    let thread = threadId ? await openai.beta.threads.retrieve(threadId) : await openai.beta.threads.create()
    let assistant = await openai.beta.assistants.retrieve(NEW_TT_MAIN_ASSISTANT_ID)
    let run = await initiateAssistantRun(thread, assistant, prompt, startConversation)

    sendJobEventToSSE({
      status: 'initiated',
      message: 'Assistant run initiated',
      threadId: thread.id,
    })
    const completion = await waitForRunCompletion(thread.id, run.id, undefined, sendJobEventToSSE)

    sendJobEventToSSE({
      status: 'completion',
      message: 'Completion Ready',
      completion: completion.additionalData,
    })

    const messages = await openai.beta.threads.messages.list(thread.id)

    const lastMessageForRun = messages.data
      .filter((message) => message.run_id === run.id && message.role === 'assistant')
      .pop()
    //console.log(lastMessageForRun, '<<<<<<lastMessageForRun')
    additionalData.runId = run.id

    if (lastMessageForRun) {
      if (shouldGenerateTTS) {
        sendJobEventToSSE({
          status: 'tts',
          message: 'TTS Started',
        })
        const speechFile = await createTTS(lastMessageForRun.content[0].text.value)
        additionalData.speechFile = speechFile
        sendJobEventToSSE({
          status: 'tts',
          message: 'TTS Ready',
        })
      }
      await sendJobEventToSSE({
        status: 'finish',
        message: 'Generation Ready',
        response: lastMessageForRun.content[0].text.value,
        //completion: JSON.stringify(completion.additionalData)
      })
      await res
        .status(200)
        .json({ response: lastMessageForRun.content[0].text.value, threadId: thread.id, ...additionalData })

      delete jobs[jobId]
    }
    //return res.send('Done')
  } catch (err) {
    sendJobEventToSSE({
      status: 'failed',
      message: 'Generation Failed',
      response: 'Something went wrong, please try again',
    })
    delete jobs[jobId]
    console.warn('Error:', err)
    return res.status(500).send(err)
  }
})

/**
 * POST route handler for '/jobs'.
 */
router.post('/jobs', (req, res) => {
  const { jobId, data } = req.body
  jobs[jobId] = data
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
async function createSlides(data = {}, sendJobEventToSSE) {
  // Function to handle the creation of a single slide
  async function handleSingleSlide(slideConfig, add_data) {
    let assistant = await openai.beta.assistants.retrieve(TT_SLIDE_CREATOR_ASSISTANT_ID)
    let thread = await openai.beta.threads.create()

    let run = await initiateAssistantRun(
      thread,
      assistant,
      `${JSON.stringify({ slideConfig, ...additionalData })}`,
      undefined,
    )

    sendJobEventToSSE({
      status: `createSlides`,
      message: 'slide generation started',
    })
    // Wait for prompt generation to complete
    const completion = await waitForRunCompletion(thread.id, run.id, undefined, sendJobEventToSSE)
    const messages = await openai.beta.threads.messages.list(thread.id)
    const lastMessage = messages.data.find((message) => message.run_id === run.id && message.role === 'assistant')

    // Extract the generated prompt from the message
    const generatedSlide = lastMessage ? lastMessage.content[0].text.value : ''

    const slideObject = { slides: generatedSlide }

    sendJobEventToSSE({
      status: `createSlides`,
      message: 'slide generation ended',
      //slides: JSON.stringify(slideObject),
    })

    return { status: true }
  }

  const fixedData = typeof data === 'string' ? JSON.parse(data) : data
  const { slides, student_age, student_interest, style } = fixedData
  const additionalData = { student_age, student_interest, style }
  // Map each slide request to a promise and execute in parallel
  const slidePromises = slides.map((slideConfig) => handleSingleSlide(slideConfig, additionalData))
  const slideResults = await Promise.all(slidePromises)

  // Return the array of slide objects
  return { success: true, slides: slideResults, ...additionalData }
}
async function getLessonPlan(data = {}, sendJobEventToSSE) {
  const fixedData = typeof data === 'string' ? JSON.parse(data) : data
  const { activity, student_age, student_interests, style, subject, history, tutor_request } = fixedData
  const additionalData = { student_age, student_interests, style, subject, history, tutor_request }
  console.log('getLessonPlan additionalData', { additionalData })

  const response = await getLearningMethod('default')
    .then((content) => {
      return { success: true, learning_plan: content }
    })
    .catch((error) => {
      console.error(error)
      return { success: false }
    })
  console.log(response)
  sendJobEventToSSE({
    status: `getLessonPlan`,
    message: 'returned lesson plan',
  })

  return { success: true, lesson_plan: response }
}
async function getActivityStructure(_activity, sendJobEventToSSE) {
  sendJobEventToSSE({
    status: `getActivityStructure`,
    message: 'checking activity structure',
  })
  const activity = typeof _activity === 'string' ? JSON.parse(_activity) : _activity
  console.log(activity.activity_type, typeof _activity)
  const response = await getActivityJSONStructure(activity.activity_type)
    .then((content) => {
      if (!content.id) {
        content.id = uuidv4()
      }
      return { success: true, activity_structure: content }
    })
    .catch((error) => {
      console.error(error)
      return { success: false }
    })
  console.log(response)
  sendJobEventToSSE({
    status: `getActivityStructure`,
    message: 'returned activity structure',
  })
  return response
}
async function createImages(data = {}, sendJobEventToSSE) {
  // Function to handle the creation of a single image

  async function handleSingleImage(image, props) {
    // Create a new thread for each image
    let generatedPrompt = image.keywords
    sendJobEventToSSE({
      status: `createImages`,
      message: 'image generation started',
    })
    if (SHOULD_GENERATE_PROMPTS) {
      let thread = await openai.beta.threads.create()
      let assistant = await openai.beta.assistants.retrieve(PROMPT_ASSISTANT_ID)

      // Generate prompt for the image
      let run = await initiateAssistantRun(
        thread,
        assistant,
        `here is my input: ${JSON.stringify({ ...props, image: image })}`,
        undefined,
      )

      // Wait for prompt generation to complete
      const completion = await waitForRunCompletion(thread.id, run.id, undefined, sendJobEventToSSE)
      const messages = await openai.beta.threads.messages.list(thread.id)
      const lastMessage = messages.data.find((message) => message.run_id === run.id && message.role === 'assistant')

      // Extract the generated prompt from the message
      generatedPrompt = lastMessage ? lastMessage.content[0].text.value : ''
    }

    let imageUrl
    const imageObject = { image_id: image.id, image_url: imageUrl, image_prompt: generatedPrompt }
    if (SHOULD_GENERATE_IMAGES) {
      if (IMAGE_GENERATION_WITH_DALLE_3) {
        // Create the image using the generated prompt
        const imageResponse = await openai.images.generate({
          model: 'dall-e-3',
          prompt: generatedPrompt + ' NO TEXT',
          //size: '256x256',
          //quality: 'hd',
          n: 1,
        })
        imageObject.image_url = imageResponse.data[0].url
      } else {
        const output = await replicate.run(
          'dhanushreddy291/sdxl-turbo:53a8078c87ad900402a246bf5e724fa7538cf15c76b0a22753594af58850a0e3',
          {
            input: {
              prompt: generatedPrompt,
              negative_prompt: 'text, fonts, 3d, cgi, render, bad quality, normal quality',
            },
          },
        )
        console.log(output)
        imageObject.image_url = output[0]
      }
      const savedImagePath = await saveCreatedImageLocally(imageObject)
      if (savedImagePath) {
        imageObject.image_url = savedImagePath
      }
    } else {
      imageObject.image_url = 'https://picsum.photos/seed/picsum/300/300'
    }
    // Return the image object
    // Send event to SSE
    /*
    sendJobEventToSSE({
      status: `createImages`,
      message: 'image generation ended',
      runId: run.id,
      threadId: thread.id,
      assistantId: PROMPT_ASSISTANT_ID,
      image: imageObject,
    })*/

    return imageObject
  }
  const fixedData = typeof data === 'string' ? JSON.parse(data) : data
  const { images, student_age, student_interest, style } = fixedData
  const additionalData = { student_age, student_interest, style }
  // Map each image request to a promise and execute in parallel
  const imagePromises = images.map((image) => handleSingleImage(image, additionalData))
  const imageResults = await Promise.all(imagePromises)

  sendJobEventToSSE({
    status: `createImages`,
    message: 'image generation ended',
    images: imageResults,
  })

  // Return the array of image objects
  return { success: true, images: imageResults }
}

async function visualizeSlides(slides, sendJobEventToSSE) {
  sendJobEventToSSE({
    status: `visualizeSlides`,
    message: `visualizing slides`,
    slides: typeof slides !== 'string' ? JSON.stringify(slides) : slides,
  })

  return slides
}

async function handleParallelTools(_toolCall, sendJobEventToSSE) {
  // Parse the function argument to extract the tool uses
  const { function: func, id: toolCallId } = _toolCall
  const parsedArguments = JSON.parse(func.arguments)

  const toolUses = parsedArguments.tool_uses

  // Map each tool use to a function call using returnToolCall
  const parallelRequests = toolUses.map((toolUse) => {
    // Construct the function call object
    console.log('TOOL USE', toolUse)

    const n_function = {
      name: toolUse.recipient_name.split('.')[1], // Extract function name from recipient_name
      arguments: toolUse.parameters,
    }
    const toolCall = { type: 'function', function: n_function, id: toolCallId }
    console.log('Parallel Tool Call', toolCall)
    // Use returnToolCall to initiate the correct async function
    return handleToolCall(toolCall, sendJobEventToSSE)
  })

  // Wait for all promises to resolve and return the results
  return Promise.all(parallelRequests)
}

// Export the router module
module.exports = router

