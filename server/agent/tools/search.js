const axios = require('axios');

async function braveSearch(query, apiKey) {
  const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
    params: { q: query, count: 5 },
    headers: {
      'X-Subscription-Token': apiKey,
      Accept: 'application/json',
    },
    timeout: 12000,
  });

  const results = response.data?.web?.results || [];
  return results.map((result) => ({
    title: result.title,
    url: result.url,
    snippet: result.description,
  }));
}

async function duckDuckGoSearch(query) {
  const response = await axios.get('https://api.duckduckgo.com/', {
    params: {
      q: query,
      format: 'json',
      no_redirect: 1,
      no_html: 1,
    },
    timeout: 12000,
  });

  const related = response.data?.RelatedTopics || [];
  const results = related
    .flatMap((item) => (item.Topics ? item.Topics : [item]))
    .slice(0, 5)
    .map((item) => ({
      title: item.Text || 'DuckDuckGo result',
      url: item.FirstURL || '',
      snippet: item.Text || '',
    }));

  if (!results.length && response.data?.AbstractText) {
    return [
      {
        title: response.data.Heading || 'DuckDuckGo Abstract',
        url: response.data.AbstractURL || '',
        snippet: response.data.AbstractText,
      },
    ];
  }

  return results;
}

async function searchTool(input, braveApiKey) {
  const query = String(input || '').trim();
  if (!query) {
    return { ok: false, error: 'Search query is required' };
  }

  try {
    if (braveApiKey) {
      const braveResults = await braveSearch(query, braveApiKey);
      return {
        ok: true,
        result: braveResults,
        provider: 'Brave Search',
      };
    }

    const fallbackResults = await duckDuckGoSearch(query);
    return {
      ok: true,
      result: fallbackResults,
      provider: 'DuckDuckGo',
    };
  } catch (error) {
    try {
      const fallbackResults = await duckDuckGoSearch(query);
      return {
        ok: true,
        result: fallbackResults,
        provider: 'DuckDuckGo (fallback)',
      };
    } catch (fallbackError) {
      return {
        ok: false,
        error: `Search failed: ${error.message}. Fallback failed: ${fallbackError.message}`,
      };
    }
  }
}

module.exports = { searchTool };
