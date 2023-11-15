import React, { createContext, useState, useContext, ReactNode } from 'react'

interface StreamingContextProps {
  sessionId: string | null
  setSessionId: (sessionId: string | null) => void
  streamId: string | null
  setStreamId: (streamId: string | null) => void
}

const StreamingContext = createContext<StreamingContextProps>({
  sessionId: null,
  setSessionId: () => {},
  streamId: null,
  setStreamId: () => {},
})

export const useStreamingContext = () => useContext(StreamingContext)

interface StreamingProviderProps {
  children: ReactNode // Define the children prop as ReactNode
}

export const StreamingProvider: React.FC<StreamingProviderProps> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [streamId, setStreamId] = useState<string | null>(null)

  return (
    <StreamingContext.Provider value={{ sessionId, setSessionId, streamId, setStreamId }}>
      {children}
    </StreamingContext.Provider>
  )
}

export default StreamingContext

