import SettingsPanel from './SettingsPanel'

export default function Sidebar({ chats, currentChatId, onSelectChat, onNewChat, settings, setSettings, theme, toggleTheme }) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <button
        type="button"
        onClick={onNewChat}
        className="mb-3 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        + New Chat
      </button>

      <button
        type="button"
        onClick={toggleTheme}
        className="mb-3 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
      >
        Toggle Theme ({theme})
      </button>

      <div className="mb-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
        {chats.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-2 text-xs text-slate-500 dark:border-slate-700">
            No chats yet.
          </p>
        ) : (
          chats.map((chat) => (
            <button
              type="button"
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-xs ${
                chat.id === currentChatId
                  ? 'bg-indigo-500/20 text-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
              }`}
            >
              {chat.title || 'Untitled chat'}
            </button>
          ))
        )}
      </div>

      <SettingsPanel settings={settings} setSettings={setSettings} />
    </aside>
  )
}
