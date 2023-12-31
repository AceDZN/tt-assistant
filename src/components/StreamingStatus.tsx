// client.tsx
import '@dotlottie/player-component'

import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import styled from 'styled-components'
import Markdown from 'react-markdown'

//import { stat } from 'fs'
import DebugPanel from './DebugPanel'
import { Portal } from './Portal'
import { SlideContent } from './SlideContent'
export const SideBarContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
`
export const TextBlock = styled.div`
  background-color: #fff; // White background for the text block
  color: #333; // Dark text color
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
  font-size: 16px; // Adjust font size as needed
  max-height: 200px;
  overflow: auto;
`

export const StartButton = styled.button`
  background-color: #34a853; // Example green color
  color: white;
  border: none;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2);
`
const Message = styled.div`
  font-size: 11px;
  font-weight: bold;
  color: #e6d9ff;
  text-shadow: 0px 1px 1px #321567;
  font-family: monospace;
`
const CodeBlock = styled.code`
  white-space: initial;
  font-size: 13px;
  line-height: 1.2;
  display: block;
  text-align: left;
  p {
    margin-top: 0;
  }
`

const SlidesNavigation = styled.ul`
  background-color: #312841;
  list-style: none;
  text-align: center;
  margin: 0;
  padding: 0;
  border-radius: 20px;
`
const SlidesNavigationItem = styled.li`
  color: #fff;
  font-weight: bold;
  padding-top: 100%;
  height: 0;
  position: relative;
  &.pointer {
    cursor: pointer;
  }
  & span {
    display: block;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`
//const slideContainer = document.getElementById('slide_content')
const imageContainer = document.getElementById('image_container')

const AVATAR_CALL_DELAY = 5000
function StreamingStatus(props: any) {
  const [threadId, setThreadId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [assistantResponse, setAssistantResponse] = useState<any>(null)
  const [step, setStep] = useState(0)
  const [slides, setSlides] = useState<any>([])
  const [slide, setSlide] = useState<any>(null)
  const [imageUrls, setImageUrls] = useState<any>(null)
  const [message, setMessage] = useState<any>(null)
  const [progressType, setProgressType] = useState('idle')
  const [age, setAge] = useState('5')
  const [interest, setInterest] = useState('pirates')
  const [subject, setSubject] = useState('new words')
  const [style, setStyle] = useState('Pixar')
  const [runtimeList, setRuntimeList] = useState<any>([])
  const [lessonStarted, setLessonStarted] = useState(false)
  const lastTimeAvatarCalled = useRef<any>(null)
  const addRunTime = useCallback(
    (run: any) => {
      const currentRuns = [...runtimeList]
      setRuntimeList([...currentRuns, { ...run }])
    },
    [runtimeList],
  )
  const addSlide = useCallback(
    (slide: any) => {
      setSlides((slides: any) => [...slides, slide])
    },
    [slides],
  )

  useEffect(() => {
    if ((!slides || slides.length === 0) && slide === slides.length - 1) return
    setSlide(slides.length - 1)
  }, [slides])

  const sendToOpenAi = useCallback(
    async (jobId: string, message: string) => {
      const res = await axios.post('http://localhost:3030/assistant/message', {
        prompt: message,
        threadId,
        jobId,
      })
      const { data } = res
      const response = data.response
      if (data.threadId && data.threadId !== threadId) setThreadId(data.threadId)
      if (response && response !== assistantResponse) setAssistantResponse(response)
      setJobId(null)
    },
    [threadId],
  )

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
          slides: _slides,
          message: _message,
          response,
          threadId: _threadId,
          imageUrls: _imageUrls,
          run_time,
        } = data
        if (_step && _step !== step) setStep(_step)

        if (_status && _status !== status) {
          if (_status !== 'idle') {
            //handleMessageTalk(`I just changed my status to ${_status}`)
          }

          setStatus(_status)
          if (run_time) {
            addRunTime({
              run_time: run_time,
              action: _status,
            })
          }
        }

        if (_slides) {
          const slidesObject = JSON.parse(_slides)
          if (slidesObject.slides) {
            for (const slide of slidesObject.slides) {
              const structure = typeof slide.structure === 'string' ? JSON.parse(slide.structure) : slide.structure
              addSlide({ ...slide, structure })
            }
          }
        }

        if (_imageUrls && _imageUrls !== imageUrls) {
          const _imageUrls_2 = (_imageUrls || []) as any
          const imageUrls_2 = (imageUrls || []) as any
          const n_imageUrls = Object.values(
            [..._imageUrls_2, ...imageUrls_2].reduce((acc, obj) => ({ ...acc, [obj.id]: obj }), {}),
          )
          console.log({ n_imageUrls })
          setImageUrls(n_imageUrls)
        }

        if (response && response !== assistantResponse) setAssistantResponse(response)

        if (_message && _message !== message) setMessage(_message)

        if (_threadId && _threadId !== threadId) setThreadId(_threadId)

        console.log('handlePostMessage', { ...data })
      }

      console.log({ data })

      props.onMessage(data)
    },
    [jobId, step, assistantResponse, status, slide, slides, imageUrls, message],
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
    if (!status) return
    let loaderStatus = 'idle'
    switch (status.toLowerCase()) {
      case 'starting':
      case 'initiated':
      case 'getlessonplan':
        loaderStatus = 'loading'
        break
      case 'createslide':
      case 'createslides':
      case 'getactivitystructure':
      case 'createimages':
      case 'visualizeslides':
        loaderStatus = 'working'
        break
      case 'completion':
      case 'failed':
      default:
        loaderStatus = 'idle'
        break
    }
    if (loaderStatus !== progressType) {
      setProgressType(loaderStatus)
    }
  }, [status, progressType, setProgressType])

  useEffect(() => {
    if (imageUrls && imageContainer) {
      imageContainer.innerHTML = ''
      imageUrls.map((image: any) => {
        const { image_url: url } = image
        const img = document.createElement('img')
        img.src = url
        imageContainer.appendChild(img)
      })
    }
  }, [imageUrls])

  const handleMessageTalk = useCallback(
    async (text: string) => {
      if (!text || text === '') {
        return
      }
      let isConnected = window.isDIDStateConnected && window.isDIDStateConnected()
      let isConnecting = window.isDIDStateConnecting && window.isDIDStateConnecting()
      const now = new Date().getTime()
      if (lastTimeAvatarCalled.current && now - lastTimeAvatarCalled.current <= AVATAR_CALL_DELAY) {
        console.log('handleMessageTalk: too soon to call avatar again')
        return
      }
      lastTimeAvatarCalled.current = new Date().getTime()

      if (window.handleConnect && !isConnected && !isConnecting) {
        await window.handleConnect()
      }

      if (window.handleTalk && isConnected) {
        console.log('window.handleTalk', { text, iceConnectionState: window.iceConnectionState })
        await window.handleTalk(text)
      }
      /*
      return () => {
        if (window.handleDestroy) {
          await window.handleDestroy()
        }
      }
      */
    },
    [assistantResponse, status],
  )

  useEffect(() => {
    /*
    if (!!message && message !== '' && status && status === 'completion') {
      handleMessageTalk(message)
    }
    */
    /*
    return () => {
      if (window.handleDestroy) {
        window.handleDestroy()
      }
    }*/
  }, [status, message])

  const startJob = async (_prompt?: string, onJobStart?: (e: boolean) => void) => {
    if ((window.handleConnect && !window.iceConnectionState) || window.iceConnectionState !== 'connected') {
      //window.handleConnect()
    }
    onJobStart?.(true)
    const jobId = uuidv4()
    setJobId(jobId)
    let prompt = `This is your moderator, the student is ${age} years old and is interested in ${interest}. The student wants to learn about ${subject}. ${
      style ? 'for the graphics use this style: "' + style + '".' : ''
    }. let's start the lesson.`

    if (_prompt) {
      prompt = _prompt
    }

    try {
      await sendToOpenAi(jobId, prompt)
    } catch (err) {
      console.log(err)
      setJobId(null)
    }
  }

  const handleContinue = async () => {
    startJob(
      `This is your moderator, Continue to the next slide.`,
      //reminder: the student is ${age} years old and is interested in ${interest}.${ style ? 'for the graphics use this style: "' + style + '".' : '' }.
    )
  }

  /*****
   * OpenAI flow logic
   */

  return (
    <>
      <Portal elementId="slide_content">
        <SlideContent slide={slides[slide]} startAIJob={startJob} />
      </Portal>
      <DebugPanel
        runtimeList={runtimeList}
        status={status}
        step={`${step}`}
        message={message}
        age={age}
        interest={interest}
        subject={subject}
        onAgeChange={(newAge: string) => setAge(newAge)}
        onInterestChange={(newInterest: string) => setInterest(newInterest)}
        onSubjectChange={(newSubject: string) => setSubject(newSubject)}
        onStyleChange={(newStyle: string) => setStyle(newStyle)}
      />
      <SideBarContainer>
        {progressType !== 'idle' && (
          <TextBlock>
            {progressType === 'loading' ? (
              <dotlottie-player src="/icons/brain.lottie" autoplay loop style={{ height: '100%', width: '100%' }} />
            ) : null}
            {progressType === 'working' ? (
              <dotlottie-player src="/icons/toolset.lottie" autoplay loop style={{ height: '100%', width: '100%' }} />
            ) : null}
          </TextBlock>
        )}

        {assistantResponse && progressType === 'idle' ? (
          <>
            <TextBlock>
              <CodeBlock>
                <Markdown>{assistantResponse}</Markdown>
              </CodeBlock>
            </TextBlock>
          </>
        ) : null}

        {!lessonStarted && !jobId ? (
          <StartButton onClick={() => startJob(undefined, setLessonStarted)}>New Lesson</StartButton>
        ) : progressType === 'idle' ? (
          <StartButton onClick={handleContinue}>Continue</StartButton>
        ) : null}

        {message ? <Message>{message}</Message> : null}
      </SideBarContainer>
      {slides && slides.length ? (
        <Portal elementId="slides_navigation">
          <SlidesNavigation>
            {slides.map((_slide: any, idx: number) => (
              <SlidesNavigationItem className={idx === slide ? 'disabled' : 'pointer'} onClick={() => setSlide(idx)}>
                <span>{idx + 1}</span>
              </SlidesNavigationItem>
            ))}
          </SlidesNavigation>
        </Portal>
      ) : null}
    </>
  )
}

export default StreamingStatus

