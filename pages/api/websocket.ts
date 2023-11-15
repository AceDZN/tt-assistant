// pages/api/websocket.ts
import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiRequest, NextApiResponse } from 'next'
import { OpenAI } from 'openai'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'
import axios from 'axios'
import { SearchGamesParams, ToolCall, RunStatus, MessageForRun } from '../../src/types/TTAssistantTypes'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const config = {
  api: {
    bodyParser: false,
  },
}

let io: SocketIOServer

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (res.socket?.server && !res.socket.server.io) {
    console.log('Initializing Socket.IO server...')
    const httpServer = res.socket.server as unknown as NetServer
    io = new SocketIOServer(httpServer, {
      path: '/api/socket.io',
    })
    res.socket.server.io = io

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)
      // Socket event listeners go here
    })
  }

  res.end()
}

// Continuation of websocket.ts

async function searchGames({ endpoint, params }: SearchGamesParams) {
  try {
    const response = await axios.get(`https://openaitests.oa.r.appspot.com/tinytap-games/${endpoint}`, { params })
    return response.data
  } catch (error: any) {
    throw new Error(`Error searching games: ${error.message}`)
  }
}

async function processMessage(data: any, socketId: string) {
  const { type, payload } = data
  let response: any

  switch (type) {
    case 'start_hangman_game':
      // Implement the logic for starting the hangman game
      response = { status: 'game_started', payload }
      break
    case 'search_games':
      // Implement the logic for searching games
      response = await searchGames(payload as SearchGamesParams)
      break
    // Add other cases as necessary
    default:
      throw new Error(`Unhandled message type: ${type}`)
  }

  return response
}

io.on('connection', (socket) => {
  console.log('Connected to', socket.id)

  // Handle incoming messages from the client
  socket.on('message', async (data) => {
    try {
      const response = await processMessage(data, socket.id)
      socket.emit('message', response)
    } catch (error: any) {
      socket.emit('error', error.message)
    }
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id)
  })
})

