// types/OpenAITypes.ts

export interface OpenAIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Choice[]
}

interface Choice {
  text: string
  index: number
  logprobs: number | null
  finish_reason: string
}

export interface ToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

// Add more types as needed

