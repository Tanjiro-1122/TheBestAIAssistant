import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import { useMemory } from './hooks/useMemory'
import { useAgent } from './hooks/useAgent'
import { MAX_CHAT_TITLE_LENGTH } from './constants'

const defaultSettings = {
  apiKey: '',
  braveApiKey: '',
  model: 'meta-llama/llama-3.1-8b-instruct:free',
  temperature: 0.4,
  enabledTools: {
    search: true,
    calculator: true,
    coderunner: true,
    urlfetcher: true,
    fileanalysis: true,
  },
}

function App() {
  const { chats, currentChat, currentChatId, setCurrentChatId, newChat, updateCurrentChat } = useMemory()
  const { isStreaming, runAgent } = useAgent()
  const [steps, setSteps] = useState([])
  const [uploadedFile, setUploadedFile] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('agentSettings')
    if (!saved) return defaultSettings

    const parsed = JSON.parse(saved)
    return {
      ...defaultSettings,
      ...parsed,
      enabledTools: {
        ...defaultSettings.enabledTools,
        ...(parsed.enabledTools || {}),
      },
    }
  })

  useEffect(() => {
    localStorage.setItem('agentSettings', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    if (!currentChatId) {
      newChat()
    }
  }, [currentChatId, newChat])

  const handleSend = async (content) => {
    const userMessage = { role: 'user', content }

    updateCurrentChat((chat) => ({
      ...chat,
      messages: [...(chat.messages || []), userMessage],
      title: chat.messages?.length ? chat.title : content.slice(0, MAX_CHAT_TITLE_LENGTH),
    }))

    let assistantBuffer = ''
    setSteps([])

    await runAgent({
      message: content,
      history: currentChat?.messages || [],
      settings: {
        apiKey: settings.apiKey,
        braveApiKey: settings.braveApiKey,
        model: settings.model,
        temperature: settings.temperature,
        enabledTools: settings.enabledTools,
      },
      uploadedText: uploadedFile?.text || '',
      onEvent: ({ event, data }) => {
        if (event === 'thinking') {
          setSteps((prev) => [...prev, data])
          return
        }

        if (event === 'token') {
          assistantBuffer += data.token
          updateCurrentChat((chat) => {
            const baseMessages = [...(chat.messages || [])]
            const last = baseMessages[baseMessages.length - 1]

            if (last?.role === 'assistant') {
              baseMessages[baseMessages.length - 1] = { role: 'assistant', content: assistantBuffer }
            } else {
              baseMessages.push({ role: 'assistant', content: assistantBuffer })
            }

            return {
              ...chat,
              messages: baseMessages,
            }
          })
          return
        }

        if (event === 'error') {
          updateCurrentChat((chat) => ({
            ...chat,
            messages: [
              ...(chat.messages || []),
              { role: 'assistant', content: `Error: ${data.error}` },
            ],
          }))
        }
      },
    })
  }

  return (
    <div className="h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:grid md:grid-cols-[320px_1fr]">
      <div className="max-h-[42vh] md:hidden">
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={setCurrentChatId}
          onNewChat={newChat}
          settings={settings}
          setSettings={setSettings}
          theme={theme}
          toggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        />
      </div>

      <div className="hidden md:block">
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={setCurrentChatId}
          onNewChat={newChat}
          settings={settings}
          setSettings={setSettings}
          theme={theme}
          toggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        />
      </div>

      <div className="h-full">
        <ChatWindow
          currentChat={currentChat}
          onSend={handleSend}
          settings={settings}
          isStreaming={isStreaming}
          steps={steps}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
        />
      </div>
    </div>
  )
}

export default App
