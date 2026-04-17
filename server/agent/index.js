const axios = require('axios');
const { buildShortTermMemory } = require('./memory');
const { searchTool } = require('./tools/search');
const { calculator } = require('./tools/calculator');
const { codeRunner } = require('./tools/codeRunner');
const { urlFetcher } = require('./tools/urlFetcher');
const { githubRepoTool } = require('./tools/githubRepo');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Five steps balances depth and latency: enough for plan->tool->observation cycles,
// while avoiding expensive runaway loops. If this limit is reached, the agent returns
// a fallback asking the user to refine the request.
const MAX_REASONING_STEPS = 5;

function buildSystemPrompt(enabledTools, activeGithubRepos) {
  const githubRepoInstructions = `

githubrepo — Browse and read GitHub repositories.
  Usage:
    TOOL: githubrepo
    INPUT: list files: owner/repo
    
    TOOL: githubrepo
    INPUT: read file: owner/repo src/index.js
    
    TOOL: githubrepo
    INPUT: search: owner/repo function handleAuth`;

  const activeReposText = activeGithubRepos.length
    ? `\n\nActive GitHub repos: ${activeGithubRepos.join(', ')}`
    : '';

  return `You are a powerful AI SuperAgent. You have access to tools and can use multi-step reasoning to solve complex problems.

Available tools: ${enabledTools.join(', ') || 'none'}
${activeReposText}

To use a tool, respond with:
TOOL: <tool_name>
INPUT: <tool_input>

${githubRepoInstructions}

After observing the tool output, continue reasoning. When you have the final answer, respond with:
FINAL ANSWER: <your answer>`;
}

function parseToolCall(content) {
  const text = String(content || '');
  const toolMatch = text.match(/TOOL:\s*([^\n]+)/i);
  const inputMatch = text.match(/INPUT:\s*([\s\S]*)$/i);

  if (!toolMatch) {
    return null;
  }

  return {
    tool: toolMatch[1].trim().toLowerCase(),
    input: (inputMatch?.[1] || '').trim(),
  };
}

function parseFinalAnswer(content) {
  const match = String(content || '').match(/FINAL ANSWER:\s*([\s\S]*)$/i);
  return match ? match[1].trim() : null;
}

function sendEvent(send, event, payload) {
  send(event, payload);
}

function streamTextTokens(send, text) {
  const parts = String(text || '').split(/(\s+)/).filter(Boolean);
  for (const part of parts) {
    send('token', { token: part });
  }
}

async function queryModel({ messages, model, temperature, apiKey }) {
  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model,
        temperature,
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://thebestaiassistant.local',
          'X-Title': 'TheBestAIAssistant',
        },
        timeout: 30000,
      }
    );

    return response.data?.choices?.[0]?.message?.content || '';
  } catch (error) {
    const status = error?.response?.status;

    if (status === 401) {
      throw new Error('OpenRouter authentication failed (401). Please check your API key.');
    }

    if (status === 404) {
      throw new Error(`OpenRouter model not found (404): "${model}". Please choose a valid model.`);
    }

    if (status === 429) {
      throw new Error('OpenRouter rate limit exceeded (429). Please wait and try again.');
    }

    throw new Error(
      error?.response?.data?.error?.message || 'OpenRouter request failed. Please try again.'
    );
  }
}

async function runAgent({
  message,
  history,
  settings,
  uploadedText,
  send,
}) {
  const {
    apiKey,
    braveApiKey,
    githubToken,
    githubRepos = [],
    activeGithubRepos = [],
    model = 'meta-llama/llama-3.1-8b-instruct:free',
    temperature = 0.4,
    enabledTools = {
      search: true,
      calculator: true,
      coderunner: true,
      urlfetcher: true,
      fileanalysis: true,
      githubrepo: true,
    },
  } = settings || {};

  if (!apiKey) {
    throw new Error('OpenRouter API key is required');
  }

  const normalizedRepos = Array.isArray(githubRepos) ? githubRepos : [];
  const normalizedActiveRepos = Array.isArray(activeGithubRepos)
    ? activeGithubRepos
    : normalizedRepos;

  const shortMemory = buildShortTermMemory(history, 8);
  const enabledToolNames = Object.entries(enabledTools)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);

  const messages = [
    { role: 'system', content: buildSystemPrompt(enabledToolNames, normalizedActiveRepos) },
    ...shortMemory,
    {
      role: 'user',
      content: uploadedText
        ? `${message}\n\nUploaded document context:\n${uploadedText.slice(0, 4000)}`
        : message,
    },
  ];

  const toolHandlers = {
    search: (input) => searchTool(input, braveApiKey),
    calculator: async (input) => calculator(input),
    coderunner: async (input) => codeRunner(input),
    urlfetcher: (input) => urlFetcher(input),
    githubrepo: (input) => githubRepoTool(input, {
      token: githubToken,
      repos: normalizedRepos,
      activeRepos: normalizedActiveRepos,
    }),
    fileanalysis: async () => ({
      ok: true,
      result: uploadedText ? uploadedText.slice(0, 4000) : 'No uploaded file context available.',
    }),
  };

  for (let step = 1; step <= MAX_REASONING_STEPS; step += 1) {
    sendEvent(send, 'thinking', {
      step,
      title: `Reasoning step ${step}`,
      content: 'Planning next action...',
    });

    const output = await queryModel({ messages, model, temperature, apiKey });
    const finalAnswer = parseFinalAnswer(output);

    if (finalAnswer) {
      sendEvent(send, 'thinking', {
        step,
        title: `Finalized at step ${step}`,
        content: 'Prepared final answer.',
      });
      streamTextTokens(send, finalAnswer);
      return finalAnswer;
    }

    const toolCall = parseToolCall(output);

    if (!toolCall || !enabledTools[toolCall.tool]) {
      sendEvent(send, 'thinking', {
        step,
        title: `Fallback at step ${step}`,
        content: 'Model did not return a valid tool request. Returning direct answer.',
      });
      streamTextTokens(send, output);
      return output;
    }

    const handler = toolHandlers[toolCall.tool];

    if (!handler) {
      const unavailable = `Tool ${toolCall.tool} is unavailable.`;
      sendEvent(send, 'thinking', {
        step,
        title: `Tool unavailable at step ${step}`,
        content: unavailable,
      });
      messages.push({ role: 'assistant', content: output });
      messages.push({ role: 'user', content: `Observation: ${unavailable}` });
      continue;
    }

    sendEvent(send, 'thinking', {
      step,
      title: `Tool call: ${toolCall.tool}`,
      content: `Input: ${toolCall.input || '(empty)'}`,
    });

    const toolResult = await handler(toolCall.input);
    const observation = toolResult.ok
      ? JSON.stringify(toolResult.result)
      : toolResult.error;

    sendEvent(send, 'thinking', {
      step,
      title: `Observation from ${toolCall.tool}`,
      content: observation.slice(0, 1200),
    });

    messages.push({ role: 'assistant', content: output });
    messages.push({
      role: 'user',
      content: `Observation: ${observation}\nContinue reasoning and return FINAL ANSWER when ready.`,
    });
  }

  const fallback = 'I reached the reasoning limit before finishing. Please refine the request.';
  streamTextTokens(send, fallback);
  return fallback;
}

module.exports = {
  runAgent,
};
