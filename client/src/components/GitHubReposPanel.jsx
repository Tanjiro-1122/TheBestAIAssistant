import { useState } from 'react'

const REPO_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/

export default function GitHubReposPanel({ settings, setSettings }) {
  const [isOpen, setIsOpen] = useState(true)
  const [repoInput, setRepoInput] = useState('')
  const [error, setError] = useState('')

  const githubRepos = Array.isArray(settings.githubRepos) ? settings.githubRepos : []
  const activeGithubRepos = Array.isArray(settings.activeGithubRepos) ? settings.activeGithubRepos : []

  const update = (partial) => setSettings((prev) => ({ ...prev, ...partial }))

  const addRepo = () => {
    const repo = repoInput.trim()
    if (!REPO_PATTERN.test(repo)) {
      setError('Use owner/repo format (example: Tanjiro-1122/TheBestAIAssistant)')
      return
    }

    if (githubRepos.includes(repo)) {
      setError('Repository already added.')
      return
    }

    update({
      githubRepos: [...githubRepos, repo],
      activeGithubRepos: [...new Set([...activeGithubRepos, repo])],
    })
    setRepoInput('')
    setError('')
  }

  const removeRepo = (repoToRemove) => {
    update({
      githubRepos: githubRepos.filter((repo) => repo !== repoToRemove),
      activeGithubRepos: activeGithubRepos.filter((repo) => repo !== repoToRemove),
    })
  }

  const toggleRepo = (repo, checked) => {
    const nextActive = checked
      ? [...new Set([...activeGithubRepos, repo])]
      : activeGithubRepos.filter((item) => item !== repo)

    update({ activeGithubRepos: nextActive })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300"
      >
        GitHub Repos
        <span>{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Add repos so the agent can browse and read your code.
          </p>

          <label className="block text-xs text-slate-600 dark:text-slate-400">
            GitHub Personal Access Token
            <input
              id="github-token"
              name="githubToken"
              type="password"
              value={settings.githubToken || ''}
              onChange={(event) => update({ githubToken: event.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
              placeholder="ghp_..."
            />
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-[11px] text-indigo-500 hover:text-indigo-400"
            >
              Get a token from github.com/settings/tokens
            </a>
          </label>

          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                id="github-repo-input"
                name="githubRepoInput"
                type="text"
                value={repoInput}
                onChange={(event) => {
                  setRepoInput(event.target.value)
                  if (error) setError('')
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
                placeholder="owner/repo"
              />
              <button
                type="button"
                onClick={addRepo}
                className="rounded-md bg-indigo-600 px-2 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Add Repo
              </button>
            </div>

            {error ? (
              <p className="text-[11px] text-red-500">{error}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            {githubRepos.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No repositories added yet.</p>
            ) : (
              githubRepos.map((repo) => (
                <div
                  key={repo}
                  className="flex items-center justify-between rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700"
                >
                  <span className="truncate text-slate-700 dark:text-slate-300">{repo}</span>
                  <div className="ml-2 flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <input
                        id={`repo-active-${repo}`}
                        name={`repo-active-${repo}`}
                        type="checkbox"
                        checked={activeGithubRepos.includes(repo)}
                        onChange={(event) => toggleRepo(repo, event.target.checked)}
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => removeRepo(repo)}
                      className="rounded px-1 text-xs text-red-500 hover:bg-red-500/10"
                      aria-label={`Remove ${repo}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
