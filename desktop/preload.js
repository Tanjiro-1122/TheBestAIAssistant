const { contextBridge } = require('electron');

function readBackendBaseUrl() {
  const arg = process.argv.find((value) => value.startsWith('--superagent-backend='));
  if (!arg) {
    return '';
  }

  return arg.replace('--superagent-backend=', '');
}

contextBridge.exposeInMainWorld('superagentDesktop', {
  getBackendBaseUrl: () => readBackendBaseUrl(),
});
