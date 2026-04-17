export default function SettingsPanel({ settings, setSettings }) {
  const update = (partial) => setSettings((prev) => ({ ...prev, ...partial }))

  const updateTools = (tool, value) => {
    setSettings((prev) => ({
      ...prev,
      enabledTools: {
        ...prev.enabledTools,
        [tool]: value,
      },
    }))
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Agent Settings</p>

      <label className="block text-xs text-slate-600 dark:text-slate-400">
        OpenRouter API Key
        <input
          type="password"
          value={settings.apiKey}
          onChange={(event) => update({ apiKey: event.target.value })}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
          placeholder="sk-or-v1-..."
        />
      </label>

      <label className="block text-xs text-slate-600 dark:text-slate-400">
        Brave API Key (optional)
        <input
          type="password"
          value={settings.braveApiKey}
          onChange={(event) => update({ braveApiKey: event.target.value })}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
          placeholder="BSA..."
        />
      </label>

      <label className="block text-xs text-slate-600 dark:text-slate-400">
        Model
        <select
          value={settings.model}
          onChange={(event) => update({ model: event.target.value })}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
        >
          <option value="mistralai/mistral-7b-instruct:free">Mistral 7B Instruct (Free)</option>
          <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B Instruct (Free)</option>
          <option value="google/gemma-3-27b-it:free">Gemma 3 27B IT (Free)</option>
        </select>
      </label>

      <label className="block text-xs text-slate-600 dark:text-slate-400">
        Temperature: {settings.temperature}
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.temperature}
          onChange={(event) => update({ temperature: Number(event.target.value) })}
          className="mt-1 w-full"
        />
      </label>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
        {Object.entries(settings.enabledTools).map(([tool, enabled]) => (
          <label key={tool} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => updateTools(tool, event.target.checked)}
            />
            {tool}
          </label>
        ))}
      </div>
    </div>
  )
}
