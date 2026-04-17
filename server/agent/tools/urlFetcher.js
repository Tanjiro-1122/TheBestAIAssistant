const axios = require('axios');

function removeTagBlocks(source, tagName) {
  let output = source;
  const open = `<${tagName}`;
  const close = `</${tagName}`;

  while (true) {
    const start = output.toLowerCase().indexOf(open);
    if (start === -1) break;

    const closeStart = output.toLowerCase().indexOf(close, start);
    if (closeStart === -1) {
      output = `${output.slice(0, start)} ${output.slice(start + open.length)}`;
      continue;
    }

    const closeEnd = output.indexOf('>', closeStart);
    if (closeEnd === -1) {
      output = output.slice(0, start);
      break;
    }

    output = `${output.slice(0, start)} ${output.slice(closeEnd + 1)}`;
  }

  return output;
}

function stripHtml(html = '') {
  const withoutScripts = removeTagBlocks(html, 'script');
  const withoutStyles = removeTagBlocks(withoutScripts, 'style');

  return withoutStyles
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function urlFetcher(input) {
  try {
    const url = String(input || '').trim();
    if (!/^https?:\/\//i.test(url)) {
      return { ok: false, error: 'Please provide a valid http(s) URL' };
    }

    const response = await axios.get(url, {
      timeout: 12000,
      headers: {
        'User-Agent': 'TheBestAIAssistant/1.0',
      },
    });

    const text = stripHtml(String(response.data || '')).slice(0, 4000);
    return { ok: true, result: text || 'No readable content found.' };
  } catch (error) {
    return { ok: false, error: `URL fetch error: ${error.message}` };
  }
}

module.exports = { urlFetcher };
