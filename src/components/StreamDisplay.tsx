// components/StreamDisplay.tsx

import { useState, useEffect } from 'react'
//import EventSource from 'eventsource'

function StreamDisplay() {
  const [steps, setSteps] = useState<{ step: number }[]>([])

  useEffect(() => {
    const source = new EventSource('/api/stream')

    source.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.step) {
        setSteps((prev) => [...prev, data])
      }
    }

    source.onerror = () => {
      source.close()
    }

    return () => {
      source.close()
    }
  }, [])

  return (
    <div>
      {steps.map((step) => (
        <div key={step.step}>Step {step.step}</div>
      ))}
    </div>
  )
}

export default StreamDisplay

