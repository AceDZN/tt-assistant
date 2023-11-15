// src/components/didStreamingClient.js
import DID_API from '../../config/didApiConfig'

let peerConnection
let streamId
let sessionId
let sessionClientAnswer
let videoElement

// Function to initialize the streaming client
export const initializeStream = () => {
  videoElement = document.getElementById('talk-video')
}

// Create peer connection
const createPeerConnection = async (offer, iceServers) => {
  peerConnection = new RTCPeerConnection({ iceServers })

  peerConnection.onicecandidate = handleIceCandidate
  peerConnection.ontrack = handleTrack
  peerConnection.oniceconnectionstatechange = handleIceConnectionStateChange
  peerConnection.onicegatheringstatechange = handleIceGatheringStateChange
  peerConnection.onsignalingstatechange = handleSignalingStateChange

  await peerConnection.setRemoteDescription(offer)
  sessionClientAnswer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(sessionClientAnswer)

  return sessionClientAnswer
}

// Handle ICE Candidate
const handleIceCandidate = (event) => {
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

// Handle Track event
const handleTrack = (event) => {
  if (event.track.kind === 'video') {
    videoElement.srcObject = event.streams[0]
  }
}

// Handle ICE Connection State Change
const handleIceConnectionStateChange = () => {
  if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
    stopStream()
    closePeerConnection()
  }
}

// Handle ICE Gathering State Change
const handleIceGatheringStateChange = () => {
  // Implement any specific logic needed when the ICE gathering state changes
  console.log(`ICE Gathering State changed to: ${peerConnection.iceGatheringState}`)
}

// Handle Signaling State Change
const handleSignalingStateChange = () => {
  // Implement any specific logic needed when the signaling state changes
  console.log(`Signaling State changed to: ${peerConnection.signalingState}`)
}

// Start the D-ID stream
export const startStream = async (responseFromOpenAI) => {
  if (peerConnection && peerConnection.connectionState === 'connected') {
    return
  }

  stopStream()
  closePeerConnection()

  // omitted for brevity, see previous snippet for the fetch requests and streaming setup
}

// Function to stop the stream
export const stopStream = () => {
  if (videoElement && videoElement.srcObject) {
    const tracks = videoElement.srcObject.getTracks()
    tracks.forEach((track) => track.stop())
    videoElement.srcObject = null
  }
}

// Close the Peer Connection
const closePeerConnection = () => {
  if (peerConnection) {
    peerConnection.close()
    peerConnection = null
  }
}

