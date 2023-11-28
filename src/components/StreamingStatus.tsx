// client.tsx

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import styled from 'styled-components'
import { stat } from 'fs'
import DebugPanel from './DebugPanel'
const CodeBlock = styled.pre`
  white-space: initial;
`
const slideContainer = document.getElementById('slide_content')
const imageContainer = document.getElementById('image_container')
function StreamingStatus(props: any) {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [assistantResponse, setAssistantResponse] = useState<any>(null)
  const [step, setStep] = useState(0)
  const [slide, setSlide] = useState<any>(null)
  const [imageUrls, setImageUrls] = useState<any>(null)
  const [message, setMessage] = useState<any>(null)

  const [age, setAge] = useState('5')
  const [interest, setInterest] = useState('pirates')
  const [subject, setSubject] = useState('new words')

  const sendToOpenAi = useCallback(async (jobId: string, message: string) => {
    await axios.post('http://localhost:3030/assistant/message', {
      prompt: message,
      threadId,
      jobId,
    })
  }, [])

  const handlePostMessage = useCallback(
    (e: any) => {
      if (!e.data || e.data === 'undefined') {
        return
      }
      const data = JSON.parse(e.data)
      if (data) {
        const {
          step: _step = 0,
          status: _status = 'idle',
          slide: _slide,
          message: _message,
          response,
          runId,
          assistantId,
          threadId: _threadId,
          imageUrls: _imageUrls,
        } = data
        if (_step && _step !== step) setStep(_step)

        if (_status && _status !== status) setStatus(_status)

        if (_slide && _slide !== slide) setSlide(_slide)

        if (_imageUrls && _imageUrls !== imageUrls) setImageUrls(_imageUrls)

        if (response && response !== assistantResponse) setAssistantResponse(response)

        if (_message && _message !== message) setMessage(_message)

        //if (_threadId && _threadId !== threadId) setThreadId(_threadId)

        console.log('handlePostMessage', { runId, assistantId, threadId })
      }

      console.log({ data })

      props.onMessage(data)
    },
    [jobId, step, assistantResponse, status, slide, imageUrls, message],
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

  useEffect(() => {
    if (slideContainer && slide) {
      slideContainer.innerHTML = slide || 'SLIDE CONTENT HERE'
    }
  }, [slide])
  useEffect(() => {
    if (imageUrls && imageContainer) {
      imageContainer.innerHTML = ''
      imageUrls.map((image: any) => {
        const { url } = image
        const img = document.createElement('img')
        img.src = url
        imageContainer.appendChild(img)
      })
    }
  }, [imageUrls])
  const startJob = async () => {
    const jobId = uuidv4()
    setJobId(jobId)

    try {
      await sendToOpenAi(
        jobId,
        `This is your moderator, the student is ${age} years old and is interested in ${interest}. The student wants to learn about ${subject}. let's start the lesson.`,
      )
    } catch (err) {
      console.log(err)
      setJobId(null)
    }
  }

  /*****
   * OpenAI flow logic
   */

  return (
    <>
      <DebugPanel
        status={status}
        step={step}
        message={message}
        age={age}
        interest={interest}
        subject={subject}
        onAgeChange={(newAge: string) => setAge(newAge)}
        onInterestChange={(newInterest: string) => setInterest(newInterest)}
        onSubjectChange={(newSubject: string) => setSubject(newSubject)}
      />
      <div>
        {jobId ? (
          <>
            Job {jobId}
            {assistantResponse ? assistantResponse : ''}
            {/*<CodeBlock>{JSON.stringify(status, null, 2)}</CodeBlock>*/}
          </>
        ) : (
          <button onClick={startJob}>Start Job</button>
        )}
      </div>
    </>
  )
}

export default StreamingStatus

