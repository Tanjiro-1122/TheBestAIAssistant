const axios = require('axios');

const GITHUB_API_BASE = 'https://api.github.com';

function parseRepo(repoInput) {
  const repo = String(repoInput || '').trim();
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    return null;
  }
  return repo;
}

function parseInput(input) {
  const text = String(input || '').trim();
  let match = text.match(/^list\s+files:\s*([^\s]+)$/i);
  if (match) {
    return { action: 'list', repo: parseRepo(match[1]) };
  }

  match = text.match(/^read\s+file:\s*([^\s]+)\s+(.+)$/i);
  if (match) {
    return {
      action: 'read',
      repo: parseRepo(match[1]),
      path: String(match[2] || '').trim(),
    };
  }

  match = text.match(/^search:\s*([^\s]+)\s+(.+)$/i);
  if (match) {
    return {
      action: 'search',
      repo: parseRepo(match[1]),
      query: String(match[2] || '').trim(),
    };
  }

  return null;
}

function createClient(token) {
  return axios.create({
    baseURL: GITHUB_API_BASE,
    timeout: 15000,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'TheBestAIAssistant',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
}

async function getDefaultBranch(client, repo) {
  const response = await client.get(`/repos/${repo}`);
  return response.data?.default_branch || 'main';
}

async function listFiles(client, repo) {
  const branch = await getDefaultBranch(client, repo);
  const response = await client.get(`/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  const tree = Array.isArray(response.data?.tree) ? response.data.tree : [];

  return {
    repository: repo,
    branch,
    total: tree.length,
    files: tree.slice(0, 1000).map((entry) => ({
      path: entry.path,
      type: entry.type,
      size: entry.size ?? null,
    })),
  };
}

async function readFile(client, repo, path) {
  const filePath = String(path || '').trim().replace(/^\/+/, '');
  if (!filePath) {
    return { ok: false, error: 'File path is required. Use: read file: owner/repo path/to/file.js' };
  }

  const response = await client.get(`/repos/${repo}/contents/${filePath}`);
  const content = response.data?.content || '';
  const encoding = response.data?.encoding || 'unknown';

  if (encoding !== 'base64') {
    return {
      ok: true,
      result: {
        repository: repo,
        path: response.data?.path || filePath,
        encoding,
        content: '',
        note: 'File is not base64-encoded. It may be binary.',
      },
    };
  }

  return {
    ok: true,
    result: {
      repository: repo,
      path: response.data?.path || filePath,
      encoding,
      content: Buffer.from(content, 'base64').toString('utf8'),
      size: response.data?.size ?? null,
      sha: response.data?.sha || '',
    },
  };
}

async function searchCode(client, repo, query) {
  const q = String(query || '').trim();
  if (!q) {
    return { ok: false, error: 'Search query is required. Use: search: owner/repo your query' };
  }

  const response = await client.get('/search/code', {
    params: { q: `${q} repo:${repo}`, per_page: 20 },
  });

  const items = Array.isArray(response.data?.items) ? response.data.items : [];
  return {
    ok: true,
    result: {
      repository: repo,
      totalCount: response.data?.total_count ?? items.length,
      items: items.map((item) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        url: item.html_url,
      })),
    },
  };
}

function formatGithubError(error) {
  const status = error.response?.status;
  const message = error.response?.data?.message;
  const remaining = error.response?.headers?.['x-ratelimit-remaining'];

  if (status === 401) {
    return 'GitHub authentication failed. Check your Personal Access Token.';
  }
  if (status === 403 && remaining === '0') {
    return 'GitHub API rate limit exceeded. Please wait and try again.';
  }
  if (status === 403) {
    return 'Access denied. Your token may not have permission for this repository.';
  }
  if (status === 404) {
    return 'Repository or file not found, or token does not have access.';
  }
  if (status === 422) {
    return `Invalid GitHub request: ${message || 'unprocessable request'}`;
  }

  return `GitHub API error: ${message || error.message}`;
}

async function githubRepoTool(input, { token, repos = [], activeRepos = [] } = {}) {
  const parsed = parseInput(input);
  if (!parsed) {
    return {
      ok: false,
      error: 'Invalid input. Use one of: list files: owner/repo | read file: owner/repo path/to/file | search: owner/repo query',
    };
  }

  if (!token) {
    return { ok: false, error: 'GitHub token is required. Add your token in the GitHub Repos panel.' };
  }

  if (!parsed.repo) {
    return { ok: false, error: 'Repository must be in owner/repo format.' };
  }

  const normalizedRepos = Array.isArray(repos) ? repos : [];
  const normalizedActiveRepos = Array.isArray(activeRepos) ? activeRepos : [];

  if (normalizedRepos.length && !normalizedRepos.includes(parsed.repo)) {
    return { ok: false, error: `Repository ${parsed.repo} is not in your configured GitHub repos list.` };
  }

  if (normalizedRepos.length && !normalizedActiveRepos.includes(parsed.repo)) {
    return { ok: false, error: `Repository ${parsed.repo} is not active. Enable it in the GitHub Repos panel first.` };
  }

  const client = createClient(token);

  try {
    if (parsed.action === 'list') {
      return { ok: true, result: await listFiles(client, parsed.repo) };
    }
    if (parsed.action === 'read') {
      return readFile(client, parsed.repo, parsed.path);
    }
    if (parsed.action === 'search') {
      return searchCode(client, parsed.repo, parsed.query);
    }

    return { ok: false, error: 'Unsupported githubrepo action.' };
  } catch (error) {
    return {
      ok: false,
      error: formatGithubError(error),
      meta: {
        configuredRepos: normalizedRepos,
        activeRepos: normalizedActiveRepos,
      },
    };
  }
}

module.exports = {
  githubRepoTool,
};
