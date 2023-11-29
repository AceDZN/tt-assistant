async function createImages(openai, images = [], sendJobEventToSSE) {
  if (!openai) return
  let thread = await openai.beta.threads.create()
  let assistant = await openai.beta.assistants.retrieve(PROMPT_ASSISTANT_ID)
  let run = await initiateAssistantRun(
    thread,
    assistant,
    `here is my input: ${JSON.stringify({ images: images })}`,
    undefined,
  )
  sendJobEventToSSE({
    status: `createImages`,
    message: 'starting image generation',
    runId: run.id,
    threadId: thread.id,
    assistantId: PROMPT_ASSISTANT_ID,
  })

  const completion = await waitForRunCompletion(thread.id, run.id, undefined, sendJobEventToSSE)

  const messages = await openai.beta.threads.messages.list(thread.id)
  //console.log('MESSAGES>>>>>', { messages: messages.data })

  const lastMessageForRun = messages.data
    .filter((message) => message.run_id === run.id && message.role === 'assistant')
    .pop()

  //console.log(lastMessageForRun, '<<<<<<lastMessageForRun')

  if (lastMessageForRun) {
    const json = extractJSON(lastMessageForRun.content[0].text.value)
    if (json && json.length) {
      const msg = json[0]
      console.log('createImages - lastMessageForRun', msg)
      const images = msg.prompts

      // Create an array of promises for each image request
      const imageRequests = images.map((image) => {
        return openai.images
          .generate({
            model: 'dall-e-3',
            prompt: image.prompt,
            quality: 'hd',
            n: 1,
            //size: "1024x1024",
            //size: '512x512',
          })
          .then((response) => {
            const { data } = response
            const imageUrl = data.data ? data.data[0].url : data[0].url
            return { image_id: image.id, image_url: imageUrl, image_prompt: image.prompt }
          })
      })

      // Wait for all promises to resolve
      const imageUrls = await Promise.all(imageRequests)

      // Send event to SSE
      sendJobEventToSSE({
        status: `createImages`,
        message: 'ended image generation',
        runId: run.id,
        threadId: thread.id,
        assistantId: PROMPT_ASSISTANT_ID,
        imageUrls: imageUrls,
      })

      return { success: true, images: imageUrls }
    }
  }

  return { success: false, images: [] }
}

module.exports = { createImages }

