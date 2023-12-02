export {}

declare global {
  interface Window {
    handleConnect: any
    handleTalk: any
    handleDestroy: any
    isDIDStateConnected: any
    isDIDStateConnecting: any
    iceConnectionState: string | undefined
    iceGatheringState: string | undefined
  }
}

