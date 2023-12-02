const axios = require('axios')
const { type } = require('os')
const fs = require('fs') // For stream operations
const fsp = require('fs').promises // For promise-based file operations
const path = require('path')

function extractJSON(str) {
  var firstOpen, firstClose, candidate
  firstOpen = str.indexOf('{', firstOpen + 1)
  do {
    firstClose = str.lastIndexOf('}')
    console.log('firstOpen: ' + firstOpen, 'firstClose: ' + firstClose)
    if (firstClose <= firstOpen) {
      return null
    }
    do {
      candidate = str.substring(firstOpen, firstClose + 1)
      console.log('candidate: ' + candidate)
      try {
        var res = JSON.parse(candidate)
        console.log('...found')
        return [res, firstOpen, firstClose + 1]
      } catch (e) {
        console.log('...failed')
      }
      firstClose = str.substr(0, firstClose).lastIndexOf('}')
    } while (firstClose > firstOpen)
    firstOpen = str.indexOf('{', firstOpen + 1)
  } while (firstOpen != -1)
}

// Helper Functions
const jobsEndpoint = '/assistant/jobs'
const sendJobEvent = async (jobId, data) => {
  const dataObject = { jobId, data }
  await axios.post(jobsEndpoint, dataObject)
}
async function getLearningMethod(method) {
  try {
    const filePath = path.join(__dirname, `/prompts/learning_methods/${method}.md`)
    const data = await fsp.readFile(filePath, 'utf8')
    return data
    //return typeof data === 'string' ? JSON.parse(data) : data
  } catch (error) {
    console.error(`Error reading the file: ${error.message}`)
    throw new Error(`Error reading the file: ${error.message}`)
  }
}
async function getActivityJSONStructure(activity_type) {
  try {
    const filePath = path.join(__dirname, `/prompts/activities/${activity_type}.json`)
    const data = await fsp.readFile(filePath, 'utf8')
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch (error) {
    try {
      const filePath = path.join(__dirname, `/prompts/activities/SummaryWithTitle.json`)
      const data = await fsp.readFile(filePath, 'utf8')
      return typeof data === 'string' ? JSON.parse(data) : data
    } catch (error) {
      console.error(`Error reading the file: ${error.message}`)
      throw new Error(`Error reading the file: ${error.message}`)
    }
  }
}
async function downloadAndSaveImage(url, filename) {
  const response = await axios({
    url,
    responseType: 'stream',
  })

  const localPath = path.join(__dirname, 'uploaded/images', filename)
  const writer = fs.createWriteStream(localPath)

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(localPath))
    writer.on('error', reject)
  })
}

async function saveCreatedImageLocally(image) {
  const filename = `image-${image.image_id}-${Date.now()}.png` // Example filename
  const localImagePath = await downloadAndSaveImage(image.image_url, filename)
  // Return the local image path instead of the URL
  return 'http://localhost:3030/uploaded/images/' + filename
}
module.exports = { extractJSON, sendJobEvent, getActivityJSONStructure, getLearningMethod, saveCreatedImageLocally }

