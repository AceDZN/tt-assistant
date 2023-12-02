//working DONOTEDIT
'use strict'
const voices = {
  female: {
    type: 'elevenlabs',
    voice_id: 'zrHiDhphv9ZnVXBqCLjz',
  },
  male: {
    type: 'elevenlabs',
    voice_id: 'yoZ06aMxZJJ28mfd3POQ',
  },
}

const avatars = [
  {
    id: 'firefighter',
    idle_video: 'https://staging-static.tinytap.it/media/avatars/firefighter_idle.mp4',
    image: 'https://staging-static.tinytap.it/media/avatars/firefighter.png',
    type: 'male',
  },
  {
    id: 'elf_boy',
    idle_video: 'https://staging-static.tinytap.it/media/avatars/elf_boy_idle.mp4',
    image: 'https://staging-static.tinytap.it/media/avatars/elf_boy.png',
    type: 'male',
  },
  {
    id: 'ginger_boy',
    idle_video: 'https://staging-static.tinytap.it/media/avatars/ginger_boy_idle.mp4',
    image: 'https://staging-static.tinytap.it/media/avatars/ginger_boy.png',
    type: 'male',
  },
  {
    id: 'panda_girl',
    idle_video: 'https://staging-static.tinytap.it/media/avatars/panda_girl_idle.mp4',
    image: 'https://staging-static.tinytap.it/media/avatars/panda_girl.png',
    type: 'female',
  },
  {
    id: 'doctor_girl',
    idle_video: 'https://staging-static.tinytap.it/media/avatars/doctor_girl_idle.mp4',
    image: 'https://staging-static.tinytap.it/media/avatars/doctor_girl.png',
    type: 'female',
  },
  {
    id: 'fox_girl',
    idle_video: 'https://staging-static.tinytap.it/media/avatars/fox_girl_idle.mp4',
    image: 'https://staging-static.tinytap.it/media/avatars/fox_girl.png',
    type: 'female',
  },
]

const randomIdx = Math.floor(Math.random() * avatars.length)
const chosen_avatar = avatars[randomIdx]

const DID_API = {
  key: import.meta.env.VITE_DID_API_KEY,
  url: 'https://api.d-id.com',
}
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

// OpenAI API endpoint set up new 10/23
async function fetchOpenAIResponse(userMessage) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
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
}

//same  - No edits from Github example for this whole section
const RTCPeerConnection = (
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window)

let peerConnection
let streamId
let sessionId
let sessionClientAnswer

let statsIntervalId
let videoIsPlaying
let lastBytesReceived

const talkVideo = document.getElementById('talk-video')
if (talkVideo) {
  talkVideo.setAttribute('playsinline', '')
}

const idleVideo = document.getElementById('idle-video')
if (idleVideo) {
  idleVideo.setAttribute('playsinline', '')
}
const peerStatusLabel = document.getElementById('peer-status-label')
const iceStatusLabel = document.getElementById('ice-status-label')
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label')
const signalingStatusLabel = document.getElementById('signaling-status-label')
const streamingStatusLabel = document.getElementById('streaming-status-label')

const handleConnect = async () => {
  if (peerConnection && peerConnection.connectionState === 'connected') {
    return
  }

  stopAllStreams()
  closePC()

  const sessionResponse = await fetch(`${DID_API.url}/talks/streams`, {
    method: 'POST',
    headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_url: chosen_avatar.image,
    }),
  })

  const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json()
  streamId = newStreamId
  sessionId = newSessionId

  try {
    sessionClientAnswer = await createPeerConnection(offer, iceServers)
  } catch (e) {
    console.log('error during streaming setup', e)
    stopAllStreams()
    closePC()
    return
  }

  const sdpResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}/sdp`, {
    method: 'POST',
    headers: { Authorization: `Basic ${DID_API.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer: sessionClientAnswer, session_id: sessionId }),
  })
}
window.handleConnect = handleConnect
const connectButton = document.getElementById('connect-button')
if (connectButton) {
  connectButton.onclick = handleConnect
}

// This is changed to accept the ChatGPT response as Text input to D-ID #138 responseFromOpenAI

const handleTalk = async (userPrompt) => {
  if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
    //
    // New from Jim 10/23 -- Get the user input from the text input field get ChatGPT Response
    const userInput = document.getElementById('user-input-field')?.value
    const responseFromOpenAI = userPrompt
      ? userPrompt
      : userInput
      ? userInput
      : `Hello there, how are you today? let's learn something new` // await fetchOpenAIResponse(userInput)
    //
    // Print the openAIResponse to the console
    console.log('OpenAI Response:', responseFromOpenAI)
    //

    const talkResponse = await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: {
          type: 'text',
          subtitles: 'false',
          provider: { ...voices[chosen_avatar.type] },
          ssml: false,
          input: responseFromOpenAI, //send the openAIResponse to D-id
        },
        config: {
          fluent: true,
          pad_audio: 0,
          driver_expressions: {
            expressions: [{ expression: 'neutral', start_frame: 0, intensity: 0 }],
            transition_frames: 0,
          },
          align_driver: true,
          align_expand_factor: 0,
          auto_match: true,
          motion_factor: 0,
          normalization_factor: 0,
          sharpen: true,
          stitch: true,
          result_format: 'mp4',
        },
        driver_url: 'bank://lively/',
        config: {
          stitch: true,
        },
        session_id: sessionId,
      }),
    })
  }
}
window.handleTalk = handleTalk
const talkButton = document.getElementById('talk-button')
if (talkButton) {
  talkButton.onclick = handleTalk
}
// NOTHING BELOW THIS LINE IS CHANGED FROM ORIGNAL D-id File Example
//

const handleDestroy = async () => {
  await fetch(`${DID_API.url}/talks/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${DID_API.key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  })

  stopAllStreams()
  closePC()
}
window.handleDestroy = handleDestroy
const destroyButton = document.getElementById('destroy-button')
if (destroyButton) {
  destroyButton.onclick = handleDestroy
}

function onIceGatheringStateChange() {
  window.iceGatheringState = peerConnection.iceGatheringState
  if (iceGatheringStatusLabel) {
    iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState
    iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState
  }
}
function onIceCandidate(event) {
  console.log('onIceCandidate', event)
  if (event.candidate) {
    const { candidate, sdpMid, sdpMLineIndex } = event.candidate

    fetch(`${DID_API.url}/talks/streams/${streamId}/ice`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${DID_API.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate,
        sdpMid,
        sdpMLineIndex,
        session_id: sessionId,
      }),
    })
  }
}
function onIceConnectionStateChange() {
  window.iceConnectionState = peerConnection.iceConnectionState
  console.log('D-ID ICE connection status change: ', peerConnection.iceConnectionState)
  if (iceStatusLabel) {
    iceStatusLabel.innerText = peerConnection.iceConnectionState
    iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState
  }
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopAllStreams()
    closePC()
  }
}
function isDIDStateConnecting() {
  return !!(window.iceConnectionState === 'checking')
}
window.isDIDStateConnecting = isDIDStateConnecting
function isDIDStateConnected() {
  return !!(window.iceConnectionState === 'connected' && window.peerSignalingState === 'stable')
}
window.isDIDStateConnected = isDIDStateConnected
function onConnectionStateChange() {
  // not supported in firefox
  window.peerConnectionState = peerConnection.connectionState
  if (peerStatusLabel) {
    peerStatusLabel.innerText = peerConnection.connectionState
    peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState
  }
}
function onSignalingStateChange() {
  window.peerSignalingState = peerConnection.signalingState
  if (signalingStatusLabel) {
    signalingStatusLabel.innerText = peerConnection.signalingState
    signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState
  }
}

function onVideoStatusChange(videoIsPlaying, stream) {
  let status
  if (videoIsPlaying) {
    status = 'streaming'
    const remoteStream = stream
    setVideoElement(remoteStream)
  } else {
    status = 'empty'
    playIdleVideo()
  }
  window.streamingStatusLabel = status
  if (streamingStatusLabel) {
    streamingStatusLabel.innerText = status
    streamingStatusLabel.className = 'streamingState-' + status
  }
}

function onTrack(event) {
  /**
   * The following code is designed to provide information about wether currently there is data
   * that's being streamed - It does so by periodically looking for changes in total stream data size
   *
   * This information in our case is used in order to show idle video while no talk is streaming.
   * To create this idle video use the POST https://api.d-id.com/talks endpoint with a silent audio file or a text script with only ssml breaks
   * https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html#break-tag
   * for seamless results use `config.fluent: true` and provide the same configuration as the streaming video
   */

  if (!event.track) return

  statsIntervalId = setInterval(async () => {
    const stats = await peerConnection.getStats(event.track)
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
        const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived

        if (videoStatusChanged) {
          videoIsPlaying = report.bytesReceived > lastBytesReceived
          onVideoStatusChange(videoIsPlaying, event.streams[0])
        }
        lastBytesReceived = report.bytesReceived
      }
    })
  }, 500)
}

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers })
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true)
    peerConnection.addEventListener('icecandidate', onIceCandidate, true)
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true)
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true)
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true)
    peerConnection.addEventListener('track', onTrack, true)
  }

  await peerConnection.setRemoteDescription(offer)
  console.log('set remote sdp OK')

  const sessionClientAnswer = await peerConnection.createAnswer()
  console.log('create local sdp OK')

  await peerConnection.setLocalDescription(sessionClientAnswer)
  console.log('set local sdp OK')

  return sessionClientAnswer
}

function setVideoElement(stream) {
  if (!stream) return
  talkVideo.classList.add('playing')
  talkVideo.srcObject = stream
  talkVideo.loop = false

  // safari hotfix
  if (talkVideo.paused) {
    talkVideo
      .play()
      .then((_) => {})
      .catch((e) => {})
  }
}

function playIdleVideo() {
  talkVideo.classList.remove('playing')
  idleVideo.srcObject = undefined
  idleVideo.src = chosen_avatar.idle_video
  idleVideo.loop = true
}

function stopAllStreams() {
  if (talkVideo.srcObject) {
    console.log('stopping video streams')
    talkVideo.srcObject.getTracks().forEach((track) => track.stop())
    talkVideo.srcObject = null
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return
  console.log('stopping peer connection')
  pc.close()
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true)
  pc.removeEventListener('icecandidate', onIceCandidate, true)
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true)
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true)
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true)
  pc.removeEventListener('track', onTrack, true)
  clearInterval(statsIntervalId)
  if (iceGatheringStatusLabel) {
    iceGatheringStatusLabel.innerText = ''
  }
  if (signalingStatusLabel) {
    signalingStatusLabel.innerText = ''
  }
  if (iceStatusLabel) {
    iceStatusLabel.innerText = ''
  }
  if (peerStatusLabel) {
    peerStatusLabel.innerText = ''
  }
  console.log('stopped peer connection')
  if (pc === peerConnection) {
    peerConnection = null
  }
}

const maxRetryCount = 3
const maxDelaySec = 4
// Default of 1 moved to 5
async function fetchWithRetries(url, options, retries = 3) {
  try {
    return await fetch(url, options)
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000

      await new Promise((resolve) => setTimeout(resolve, delay))

      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`)
      return fetchWithRetries(url, options, retries + 1)
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`)
    }
  }
}

playIdleVideo()

