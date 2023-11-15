// hooks/useOpenAIChat.ts
import { useState } from 'react'
import { constants } from '../../constants'

export const useOpenAIChat = () => {
  const fetchOpenAIResponse = async (userMessage: string) => {
    try {
      const response = await fetch(constants.OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: userMessage }],
          temperature: 0.7,
          max_tokens: 25,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API request failed with status ${response.status}`)
      }
      const data = await response.json()
      return data.choices[0].message.content.trim()
    } catch (error) {
      console.error('Error in fetchOpenAIResponse:', error)
      throw error
    }
  }

  return { fetchOpenAIResponse }
}

