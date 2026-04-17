import { useState } from 'react'

function parseSSEChunk(chunk) {
  const events = []
  const blocks = chunk.split('\n\n').filter(Boolean)

  for (const block of blocks) {
    const lines = block.split('\n')
    const eventLine = lines.find((line) => line.startsWith('event:'))
    const dataLine = lines.find((line) => line.startsWith('data:'))

    if (!eventLine || !dataLine) {
      continue
    }

    const event = eventLine.replace('event:', '').trim()
    const data = JSON.parse(dataLine.replace('data:', '').trim())
    events.push({ event, data })
  }

  return events
}

export function useAgent() {
  const [isStreaming, setIsStreaming] = useState(false)

  const runAgent = async ({ message, history, settings, uploadedText, onEvent }) => {
    setIsStreaming(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history,
          settings,
          uploadedText,
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to start stream')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lastBoundary = buffer.lastIndexOf('\n\n')

        if (lastBoundary !== -1) {
          const complete = buffer.slice(0, lastBoundary)
          buffer = buffer.slice(lastBoundary + 2)

          const events = parseSSEChunk(complete)
          events.forEach(onEvent)
        }
      }
    } finally {
      setIsStreaming(false)
    }
  }

  return {
    isStreaming,
    runAgent,
  }
}
