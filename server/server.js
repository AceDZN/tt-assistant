// server.js
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const path = require('path')

const corsOption = {
  origin: ['http://localhost:5173'],
}
const assistantRouter = require('./assistant')

const app = express()
app.use(cors(corsOption))
app.use(express.json())

app.use('/assets', express.static(path.join(__dirname, 'assets')))
app.use('/uploaded', express.static(path.join(__dirname, 'uploaded')))

app.get('/', (req, res) => {
  res.send('alive')
})
app.get('/ping', (req, res) => {
  res.send('pong')
})

app.get('/html', function (request, response) {
  response.sendFile(path.join(__dirname, 'html') + '/index.html')
})

let pings = 0

app.get('/ping-counter', (req, res) => {
  pings++
  res.send(`${pings} pings so far`)
})

app.use('/assistant', assistantRouter)
//app.use('/dalle', dalleRoutes)

const PORT = 3030
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
  //console.log(`Env params `, JSON.stringify(process.env))
})

