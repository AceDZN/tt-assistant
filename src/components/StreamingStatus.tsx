// client.tsx

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import styled from 'styled-components'
const CodeBlock = styled.pre`
  white-space: initial;
`
const slideContainer = document.getElementById('slide_content')
function StreamingStatus(props: any) {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<any>(null)

  const sendToOpenAi = useCallback(async (jobId: string, message: string) => {
    await axios.post('http://localhost:3030/assistant/message', {
      prompt: message,
      threadId,
      jobId,
    })
  }, [])

  const handlePostMessage = useCallback(
    (e: any) => {
      const data = JSON.parse(e.data)
      if (slideContainer && data?.data?.slide) {
        slideContainer.innerHTML = data?.data?.slide || 'SLIDE CONTENT HERE'
      }
      console.log({ data })

      setStatus(data)
      props.onMessage(data)
    },
    [jobId],
  )

  useEffect(() => {
    if (!jobId) return
    const eventSource = new EventSource(`http://localhost:3030/assistant/jobs/${jobId}`)
    eventSource.onmessage = handlePostMessage
    return () => {
      eventSource.close()
      setJobId(null)
    }
  }, [jobId])

  const startJob = async () => {
    const jobId = uuidv4()
    setJobId(jobId)

    try {
      await sendToOpenAi(jobId, `Hello, I want to learn some new words`)
    } catch (err) {
      console.log(err)
      setJobId(null)
    }
  }

  /*****
   * OpenAI flow logic
   */

  return (
    <div>
      {jobId ? (
        <>
          Job {jobId} Running:
          <CodeBlock>{JSON.stringify(status, null, 2)}</CodeBlock>
        </>
      ) : (
        <button onClick={startJob}>Start Job</button>
      )}
    </div>
  )
}

export default StreamingStatus

