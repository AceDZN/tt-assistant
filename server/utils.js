const axios = require('axios')
const { type } = require('os')
const fs = require('fs').promises // If you're using a recent version of Node.js
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

async function getActivityJSONStructure(activity_type) {
  try {
    const filePath = path.join(__dirname, `/prompts/activities/${activity_type}.json`)
    const data = await fs.readFile(filePath, 'utf8')
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch (error) {
    console.error(`Error reading the file: ${error.message}`)
    throw new Error(`Error reading the file: ${error.message}`)
  }
}
async function downloadAndSaveImage(url, filename) {
  const response = await axios({
    url,
    responseType: 'stream',
  })

  const localPath = path.join(__dirname, 'images', filename)
  response.data.pipe(fs.createWriteStream(localPath))

  return new Promise((resolve, reject) => {
    response.data.on('end', () => resolve(localPath))
    response.data.on('error', (err) => reject(err))
  })
}

async function saveCreatedImageLocally(image) {
  const filename = `image-${image.image_id}-${Date.now()}.png` // Example filename
  const localImagePath = await downloadAndSaveImage(image.image_url, filename)
  // Return the local image path instead of the URL
  return localImagePath
}
module.exports = { extractJSON, sendJobEvent, getActivityJSONStructure, saveCreatedImageLocally }

