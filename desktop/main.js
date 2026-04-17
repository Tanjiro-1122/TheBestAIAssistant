const { app, BrowserWindow, Menu, Tray, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const http = require('http');
const isDev = require('electron-is-dev');

const APP_NAME = 'SuperAgent AI Assistant';
const START_PORT = 3001;
const MAX_PORT_TRIES = 10;
const HEALTH_TIMEOUT_MS = 15_000;
const HEALTH_POLL_INTERVAL_MS = 500;
const MAX_STDERR_BUFFER_SIZE = 4000;

let loadingWindow;
let mainWindow;
let tray;
let backendProcess;
let backendPort = START_PORT;
let isQuitting = false;
let backendStderr = '';

function getBackendScriptPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'server', 'index.js');
  }

  return path.join(__dirname, '..', 'server', 'index.js');
}

function getClientDistPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'client', 'dist', 'index.html');
  }

  return path.join(__dirname, '..', 'client', 'dist', 'index.html');
}

function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '127.0.0.1');
  });
}

async function findAvailablePort(startPort) {
  for (let offset = 0; offset < MAX_PORT_TRIES; offset += 1) {
    const port = startPort + offset;
    // eslint-disable-next-line no-await-in-loop
    const available = await checkPortAvailable(port);
    if (available) {
      return port;
    }
  }

  throw new Error(`No available port found in range ${startPort}-${startPort + MAX_PORT_TRIES - 1}`);
}

function waitForBackendHealth(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';

  return new Promise((resolve, reject) => {
    const poll = () => {
      const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
        if (res.statusCode === 200) {
          res.resume();
          resolve();
          return;
        }

        res.resume();
        if (Date.now() > deadline) {
          reject(new Error('Backend health check timed out'));
          return;
        }

        setTimeout(poll, HEALTH_POLL_INTERVAL_MS);
      });

      req.on('error', (error) => {
        lastError = error?.message || lastError;
        if (Date.now() > deadline) {
          reject(new Error(`Backend health check timed out${lastError ? `: ${lastError}` : ''}`));
          return;
        }

        setTimeout(poll, HEALTH_POLL_INTERVAL_MS);
      });

      req.setTimeout(2_000, () => {
        req.destroy(new Error('Backend health request timed out'));
      });
    };

    poll();
  });
}

function stopBackendProcess() {
  if (!backendProcess || backendProcess.killed) {
    return;
  }

  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t']);
  } else {
    backendProcess.kill('SIGTERM');
  }
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        {
          label: 'DevTools',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow() || mainWindow;
            focusedWindow?.webContents.toggleDevTools();
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  tray = new Tray(iconPath);
  tray.setToolTip(APP_NAME);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Show',
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        },
      },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]),
  );

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 420,
    height: 260,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    show: true,
    title: APP_NAME,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });

  loadingWindow.loadFile(path.join(__dirname, 'loading.html'));
}

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: APP_NAME,
    titleBarStyle: 'default',
    autoHideMenuBar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      additionalArguments: [`--superagent-backend=http://127.0.0.1:${backendPort}`],
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    if (loadingWindow && !loadingWindow.isDestroyed()) {
      loadingWindow.close();
      loadingWindow = null;
    }
  });

  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  if (isDev) {
    await mainWindow.loadURL(`http://localhost:5173/?backendPort=${backendPort}`);
  } else {
    await mainWindow.loadFile(getClientDistPath(), { query: { backendPort: String(backendPort) } });
  }
}

async function startBackendProcess() {
  backendPort = await findAvailablePort(START_PORT);

  backendProcess = spawn(process.execPath, [getBackendScriptPath()], {
    cwd: app.isPackaged ? process.resourcesPath : path.join(__dirname, '..', 'server'),
    env: {
      ...process.env,
      PORT: String(backendPort),
      ELECTRON_RUN_AS_NODE: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  backendProcess.stdout.on('data', (chunk) => {
    const output = chunk.toString();
    process.stdout.write(`[backend] ${output}`);
  });

  backendProcess.stderr.on('data', (chunk) => {
    const output = chunk.toString();
    backendStderr = `${backendStderr}${output}`.slice(-MAX_STDERR_BUFFER_SIZE);
    process.stderr.write(`[backend] ${output}`);
  });

  backendProcess.on('exit', (code) => {
    if (!isQuitting && code !== 0) {
      dialog.showErrorBox('Backend stopped unexpectedly', backendStderr || `Exit code: ${code}`);
      app.quit();
    }
  });
}

async function bootApp() {
  createMenu();
  createTray();
  createLoadingWindow();

  try {
    await startBackendProcess();
    await waitForBackendHealth(backendPort, HEALTH_TIMEOUT_MS);
    await createMainWindow();
  } catch (error) {
    dialog.showErrorBox(
      'Unable to start SuperAgent',
      `${error.message}\n\n${backendStderr || 'No backend stderr output captured.'}`,
    );
    stopBackendProcess();
    app.quit();
  }
}

app.whenReady().then(bootApp);

app.on('before-quit', () => {
  isQuitting = true;
  stopBackendProcess();
});

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
    return;
  }

  bootApp();
});
