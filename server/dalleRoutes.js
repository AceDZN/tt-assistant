const express = require('express')
const { Configuration, OpenAIApi } = require('openai')

const router = express.Router()

console.log(process.env.OPENAI_API_KEY)

const openAIApiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(openAIApiConfig)

router.route('/').get((req, res) => {
  res.status(200).json({ message: 'Hello from DALL-E!' })
})

router.route('/create').post(async (req, res) => {
  try {
    const { prompt, bar } = req.body
    console.log(req.body)
    console.log('prompt : ', prompt)
    console.log('bar : ', bar)

    const aiResponse = await openai.createImage({
      prompt: 'an astronaut lounging in a tropical resort in space, vaporwave',
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    })

    console.log('aiResponse : ', aiResponse)

    const image = aiResponse.data.data[0].b64_json
    res.status(200).json({ success: true, photo: image })
  } catch (error) {
    // console.error(error);
    res.status(500).send(error?.response.data.error.message || 'Something went wrong')
  }
})

module.exports = router

