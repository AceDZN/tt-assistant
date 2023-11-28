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
    const filePath = path.join(__dirname, `/prompts/activities/${activity_type}_structure.json`)
    const data = await fs.readFile(filePath, 'utf8')
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch (error) {
    console.error(`Error reading the file: ${error.message}`)
    throw new Error(`Error reading the file: ${error.message}`)
  }
}

module.exports = { extractJSON, sendJobEvent, getActivityJSONStructure }

