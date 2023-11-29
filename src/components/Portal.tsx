import React, { ReactNode, useLayoutEffect, useState } from 'react'
import ReactDOM from 'react-dom'

interface PortalProps {
  children: ReactNode
  className?: string
  elementId?: string
}

export const Portal: React.FC<PortalProps> = ({ children, elementId, className = 'tt-portal' }) => {
  const [shouldAppendTo, setShouldAppendTo] = useState<string | undefined>(undefined)

  const [container] = useState(() => {
    let existingElement
    if (elementId) {
      existingElement = document.getElementById(elementId)
    }

    if (existingElement) {
      setShouldAppendTo('element')
    } else {
      setShouldAppendTo('body')
    }

    const element = document.createElement('div')
    element.id = className + '-element'
    return document.createElement('div')
  })

  useLayoutEffect(() => {
    if (!container && shouldAppendTo !== undefined) return
    container.classList.add(className)
    let existingElement
    if (elementId) {
      existingElement = document.getElementById(elementId)
    }

    if (shouldAppendTo === 'element' && existingElement) {
      existingElement.appendChild(container)
    } else {
      document.body.appendChild(container)
    }
    return () => {
      if (shouldAppendTo === 'body') {
        document.body.removeChild(container)
      }
    }
  }, [shouldAppendTo])

  return children && container && shouldAppendTo !== undefined ? ReactDOM.createPortal(children, container) : null
}

