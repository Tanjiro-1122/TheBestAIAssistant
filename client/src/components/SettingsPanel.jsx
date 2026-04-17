import { useState } from 'react'

export default function SettingsPanel({ settings, setSettings }) {
  const update = (partial) => setSettings((prev) => ({ ...prev, ...partial }))
  const [isTestingApiKey, setIsTestingApiKey] = useState(false)
  const [apiKeyTestResult, setApiKeyTestResult] = useState(null)

  const updateTools = (tool, value) => {
    setSettings((prev) => ({
      ...prev,
      enabledTools: {
        ...prev.enabledTools,
        [tool]: value,
      },
    }))
  }

  const testApiKey = async () => {
    const apiKey = settings.apiKey.trim()

    if (!apiKey) {
      setApiKeyTestResult({ ok: false, message: 'Enter an OpenRouter API key first.' })
      return
    }

    setIsTestingApiKey(true)

    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      })
      const data = await response.json()

      setApiKeyTestResult({
        ok: Boolean(data?.ok && response.ok),
        message: data?.message || 'Unable to test API key.',
      })
    } catch {
      setApiKeyTestResult({
        ok: false,
        message: 'Unable to reach server. Please try again.',
      })
    } finally {
      setIsTestingApiKey(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Agent Settings</p>

      <label className="block text-xs text-slate-600 dark:text-slate-400">
        OpenRouter API Key
        <input
          id="openrouter-api-key"
          name="apiKey"
          type="password"
          value={settings.apiKey}
          onChange={(event) => {
            update({ apiKey: event.target.value })
            setApiKeyTestResult(null)
          }}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
          placeholder="sk-or-v1-..."
        />
      </label>

      <div className="space-y-1">
        <button
          type="button"
          onClick={testApiKey}
          disabled={isTestingApiKey}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          {isTestingApiKey ? 'Testing...' : 'Test API Key'}
        </button>
        {apiKeyTestResult ? (
          <p className={`text-xs ${apiKeyTestResult.ok ? 'text-emerald-500' : 'text-rose-500'}`}>
            {apiKeyTestResult.message}
          </p>
        ) : null}
      </div>

      <label className="block text-xs text-slate-600 dark:text-slate-400">
        Brave API Key (optional)
        <input
          id="brave-api-key"
          name="braveApiKey"
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
          id="model"
          name="model"
          value={settings.model}
          onChange={(event) => update({ model: event.target.value })}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
        >
          <option value="meta-llama/llama-3.1-8b-instruct:free">Llama 3.1 8B (Free)</option>
          <option value="mistralai/mistral-7b-instruct:free">Mistral 7B (Free)</option>
          <option value="qwen/qwen3-8b:free">Qwen3 8B (Free)</option>
          <option value="google/gemma-2-9b-it:free">Gemma 2 9B (Free)</option>
          <option value="deepseek/deepseek-r1-0528:free">DeepSeek R1 (Free)</option>
        </select>
      </label>

      <label className="block text-xs text-slate-600 dark:text-slate-400">
        Temperature: {settings.temperature}
        <input
          id="temperature"
          name="temperature"
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
              id={`tool-${tool}`}
              name={`tool-${tool}`}
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
