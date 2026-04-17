import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { MAX_CHAT_TITLE_LENGTH } from '../constants'

function createChat() {
  const id = crypto.randomUUID()
  return {
    id,
    title: 'New chat',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function useMemory() {
  const [chats, setChats] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)

  useEffect(() => {
    async function loadHistory() {
      try {
        const { data } = await axios.get('/api/history')
        setChats(data)
        setCurrentChatId(data[0]?.id || null)
      } catch {
        setChats([])
      }
    }
    loadHistory()
  }, [])

  const currentChat = useMemo(
    () => chats.find((chat) => chat.id === currentChatId) || null,
    [chats, currentChatId],
  )

  const persistChat = async (chat) => {
    try {
      await axios.post('/api/history', chat)
    } catch {
      // Keep UI responsive even if persistence fails.
    }
  }

  const newChat = () => {
    const chat = createChat()
    setChats((prev) => [chat, ...prev])
    setCurrentChatId(chat.id)
    persistChat(chat)
  }

  const updateCurrentChat = (updater) => {
    setChats((prev) => {
      const source = prev.find((chat) => chat.id === currentChatId) || createChat()
      const next = updater(source)
      const normalized = {
        ...next,
        title:
          next.title ||
          (next.messages?.[0]?.content || 'New chat').slice(0, MAX_CHAT_TITLE_LENGTH),
        updatedAt: new Date().toISOString(),
      }

      const exists = prev.some((chat) => chat.id === normalized.id)
      const updated = exists
        ? prev.map((chat) => (chat.id === normalized.id ? normalized : chat))
        : [normalized, ...prev]

      persistChat(normalized)
      return updated
    })
  }

  return {
    chats,
    currentChat,
    currentChatId,
    setCurrentChatId,
    newChat,
    updateCurrentChat,
  }
}
