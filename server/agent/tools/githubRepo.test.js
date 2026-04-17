const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { githubRepoTool } = require('./githubRepo');

test('githubRepoTool returns validation error for invalid command', async () => {
  const result = await githubRepoTool('unknown command', { token: 'token' });
  assert.equal(result.ok, false);
  assert.match(result.error, /Invalid input/i);
});

test('githubRepoTool requires token', async () => {
  const result = await githubRepoTool('list files: owner/repo', {});
  assert.equal(result.ok, false);
  assert.match(result.error, /token is required/i);
});

test('githubRepoTool lists files for repo', async () => {
  const originalCreate = axios.create;
  let createConfig;

  try {
    axios.create = (config) => {
      createConfig = config;
      return {
        get: async (url) => {
          if (url === '/repos/owner/repo') {
            return { data: { default_branch: 'main' } };
          }
          if (url === '/repos/owner/repo/git/trees/main?recursive=1') {
            return {
              data: {
                tree: [
                  { path: 'README.md', type: 'blob', size: 100 },
                  { path: 'src', type: 'tree' },
                ],
              },
            };
          }
          throw new Error(`Unexpected URL: ${url}`);
        },
      };
    };

    const result = await githubRepoTool('list files: owner/repo', { token: 'token' });
    assert.equal(result.ok, true);
    assert.equal(result.result.repository, 'owner/repo');
    assert.equal(result.result.branch, 'main');
    assert.equal(result.result.files.length, 2);

    assert.equal(createConfig.baseURL, 'https://api.github.com');
    assert.equal(createConfig.timeout, 15000);
    assert.equal(createConfig.headers.Authorization, 'Bearer token');
    assert.equal(createConfig.headers.Accept, 'application/vnd.github+json');
  } finally {
    axios.create = originalCreate;
  }
});

test('githubRepoTool blocks non-active repository', async () => {
  const result = await githubRepoTool('list files: owner/repo', {
    token: 'token',
    repos: ['owner/repo'],
    activeRepos: [],
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /not active/i);
});
