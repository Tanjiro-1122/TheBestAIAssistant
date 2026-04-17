import { useRef } from 'react'

export default function FileUpload({ onUpload, isLoading }) {
  const inputRef = useRef(null)

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Upload File
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            onUpload(file)
          }
        }}
      />
    </>
  )
}
