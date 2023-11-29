export {}

declare global {
  interface Window {
    handleConnect: any
    handleTalk: any
    handleDestroy: any
    iceConnectionState: string | undefined
    iceGatheringState: string | undefined
  }
}

