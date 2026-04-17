import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import MessageBubble from './MessageBubble'
import ThinkingSteps from './ThinkingSteps'
import FileUpload from './FileUpload'
import { getApiUrl } from '../lib/apiBase'

export default function ChatWindow({
  currentChat,
  onSend,
  settings,
  isStreaming,
  steps,
  uploadedFile,
  setUploadedFile,
}) {
  const [input, setInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [inputError, setInputError] = useState('')
  const messagesRef = useRef(null)
  const messages = useMemo(() => currentChat?.messages || [], [currentChat])

  useEffect(() => {
    if (!messagesRef.current) return
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages, steps])

  const submitMessage = () => {
    if (!input.trim() || isStreaming) return

    if (!settings?.apiKey?.trim()) {
      setInputError('Please enter your OpenRouter API key in Agent Settings below.')
      return
    }

    onSend(input)
    setInput('')
    setInputError('')
  }

  const handleUpload = async (file) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await axios.post(getApiUrl('/api/upload'), formData)
      setUploadedFile({ name: data.fileName, text: data.text })
    } catch {
      setUploadedFile({ name: file.name, text: '', error: 'Upload failed.' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="flex h-full flex-col bg-slate-100 dark:bg-slate-950">
      <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-200">
        SuperAgent AI Assistant
      </div>

      <div ref={messagesRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700">
            Ask anything to start your first run.
          </div>
        ) : (
          messages.map((message, index) => <MessageBubble key={index} message={message} />)
        )}

        <ThinkingSteps steps={steps} />

        {isStreaming && (
          <p className="text-xs text-indigo-500 dark:text-indigo-300">Streaming response...</p>
        )}
      </div>

      <div className="space-y-2 border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileUpload onUpload={handleUpload} isLoading={uploading} />
          {uploadedFile?.name && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Attached: {uploadedFile.name}</p>
          )}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            submitMessage()
          }}
        >
          <textarea
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              if (inputError) setInputError('')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submitMessage()
              }
            }}
            placeholder="Message SuperAgent..."
            rows={2}
            aria-invalid={Boolean(inputError)}
            aria-describedby={inputError ? 'chat-input-error' : undefined}
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            Send
          </button>
        </form>
        {inputError && (
          <p id="chat-input-error" className="text-xs text-red-600 dark:text-red-400">
            {inputError}
          </p>
        )}
      </div>
    </section>
  )
}
