function getBackendBaseUrlFromQuery() {
  if (typeof window === 'undefined') {
    return '';
  }

  const value = new URLSearchParams(window.location.search).get('backendPort');
  if (!value) {
    return '';
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return '';
  }

  return `http://127.0.0.1:${port}`;
}

export function getApiUrl(path) {
  const electronBase =
    typeof window !== 'undefined' &&
    typeof window.superagentDesktop?.getBackendBaseUrl === 'function'
      ? window.superagentDesktop.getBackendBaseUrl()
      : '';

  const baseUrl = electronBase || getBackendBaseUrlFromQuery();
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl}${path}`;
}
