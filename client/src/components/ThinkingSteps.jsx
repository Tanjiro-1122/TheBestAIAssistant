import { useState } from 'react'

export default function ThinkingSteps({ steps }) {
  const [open, setOpen] = useState(true)

  if (!steps.length) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-300 bg-white/80 dark:border-slate-700 dark:bg-slate-900/80">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300"
      >
        Thinking... ({steps.length} steps) {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="space-y-2 border-t border-slate-300 p-3 dark:border-slate-700">
          {steps.map((step, index) => (
            <div key={`${step.step}-${index}`} className="rounded-md bg-slate-100/80 p-2 text-xs dark:bg-slate-800/80">
              <p className="font-medium text-slate-800 dark:text-slate-200">{step.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-slate-400">{step.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
