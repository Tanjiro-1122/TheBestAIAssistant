# ⚡ TheBestAIAssistant — Free SuperAgent AI Assistant

A polished, production-ready **React + Node.js** AI assistant inspired by Base44 and Emergent-style autonomous agents.

It is designed to run fully on free tiers by combining **OpenRouter free models**, **Brave Search free API**, and **DuckDuckGo fallback**.

---

## ✨ Features

- 🧠 **Multi-step ReAct loop** (plan → tool call → observation → reflection)
- 🔍 **Web Search tool** (Brave Search API + DuckDuckGo fallback)
- 💻 **Sandboxed JS Code Execution** (`vm2`)
- 📄 **File & Document Analysis** (PDF/TXT/MD upload via `pdf-parse`)
- 🧮 **Calculator tool** (`mathjs` symbolic evaluation)
- 🌐 **URL Fetcher tool** (fetch and summarize webpage text)
- 🧠 **Short-term memory** (last N conversation messages)
- ⚡ **Real-time streaming responses** with SSE
- 🎨 **Modern chat UI** (dark-mode first, light-mode toggle, markdown + code highlighting)
- 📚 **Chat history persistence** (`/api/history`, local JSON storage)

---

## 🖼️ Screenshots

> Add screenshots after running locally:

- `docs/screenshots/chat-dark.png`
- `docs/screenshots/thinking-steps.png`
- `docs/screenshots/settings-and-tools.png`
- `docs/screenshots/mobile-layout.png`

---

## 🏗️ Architecture

```text
┌───────────────────────────── Client (React + Vite) ─────────────────────────────┐
│ Sidebar (history + settings) | ChatWindow | ThinkingSteps | FileUpload           │
│ - useMemory hook (history state)                                                  │
│ - useAgent hook (SSE stream parser)                                               │
└───────────────────────────────┬───────────────────────────────────────────────────┘
                                │ HTTP + SSE
                                ▼
┌──────────────────────────── Server (Node + Express) ──────────────────────────────┐
│ /api/chat    -> ReAct agent loop + OpenRouter                                     │
│ /api/history -> local JSON persistence                                             │
│ /api/upload  -> PDF/TXT/MD parsing                                                 │
│                                                                                     │
│ Agent Tools: search | calculator | coderunner | urlfetcher | fileanalysis         │
└───────────────────────────────┬───────────────────────────────────────────────────┘
                                │
                  ┌─────────────┴─────────────┐
                  ▼                           ▼
        OpenRouter (free models)      Brave / DuckDuckGo
```

---

## 📁 Project Structure

```text
TheBestAIAssistant/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── ThinkingSteps.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── SettingsPanel.jsx
│   │   │   └── FileUpload.jsx
│   │   ├── hooks/
│   │   │   ├── useAgent.js
│   │   │   └── useMemory.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── server/
│   ├── agent/
│   │   ├── index.js
│   │   ├── tools/
│   │   │   ├── search.js
│   │   │   ├── calculator.js
│   │   │   ├── codeRunner.js
│   │   │   └── urlFetcher.js
│   │   └── memory.js
│   ├── routes/
│   │   ├── chat.js
│   │   ├── history.js
│   │   └── upload.js
│   ├── data/history.json
│   ├── index.js
│   └── package.json
├── .env.example
└── README.md
```

---

## 🆓 Free API Setup

| Service | Free Tier | Used For |
|---|---|---|
| OpenRouter.ai | Free models (no CC needed for free models) | LLM inference |
| Brave Search API | 2,000 req/month free | Web search |
| DuckDuckGo Instant Answer API | Unlimited, no key | Search fallback |

### 1) Get a free OpenRouter API key

1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Sign up / sign in
3. Open **Keys** page
4. Create a new key
5. Paste it in the app settings panel (`OpenRouter API Key`)

### 2) Get a free Brave Search API key (optional)

1. Go to [https://api.search.brave.com](https://api.search.brave.com)
2. Create account + generate API key
3. Paste it in the app settings panel (`Brave API Key`)

If Brave key is missing or fails, the app auto-falls back to DuckDuckGo.

---

## 🤖 OpenRouter Free Models (examples)

- `mistralai/mistral-7b-instruct:free`
- `meta-llama/llama-3.3-70b-instruct:free`
- `google/gemma-3-27b-it:free`

> OpenRouter free model availability can change over time. Check OpenRouter model list for latest.

---

## 🚀 Local Setup

### Prerequisites

- Node.js **18+**
- npm **9+**

### Install

```bash
# from repository root
cd server && npm install
cd ../client && npm install
```

### Run backend

```bash
cd server
npm run dev
```

Backend starts on `http://localhost:3001`.

### Run frontend

```bash
cd client
npm run dev
```

Frontend starts on `http://localhost:5173` and proxies `/api/*` to backend.

---

## 🧪 Build / Validate

```bash
cd client && npm run lint && npm run build
cd ../server && npm test
```

---

## 🔄 Agent Prompt Format

The server uses this structure:

```text
You are a powerful AI SuperAgent. You have access to tools and can use multi-step reasoning to solve complex problems.

Available tools: [list of enabled tools]

To use a tool, respond with:
TOOL: <tool_name>
INPUT: <tool_input>

After observing the tool output, continue reasoning. When you have the final answer, respond with:
FINAL ANSWER: <your answer>
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch
3. Keep changes focused and tested
4. Open a PR with clear description and screenshots for UI changes

---

## 📜 License

Use your preferred OSS license for this repository (MIT recommended).
