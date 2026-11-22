const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { pathToFileURL } = require('url');

// Global safeguard: never show uncaught exception dialog for port reuse
process.on('uncaughtException', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.warn('⚠️ [Elite IDE] Port 3001 already active. Reusing instance smoothly.');
    return;
  }
  console.error('[Elite IDE Uncaught Exception]:', err);
});

let mainWindow = null;
const BACKEND_PORT = 3001;

function isPortActive(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(350);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Function to start the embedded backend server directly in Electron's main process
async function startBackendServer() {
  if (process.platform === 'darwin') {
    const standardMacPaths = ['/usr/local/bin', '/opt/homebrew/bin', '/opt/homebrew/sbin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'];
    const curPaths = (process.env.PATH || '').split(path.delimiter);
    for (const p of standardMacPaths) {
      if (fs.existsSync(p) && !curPaths.includes(p)) {
        curPaths.unshift(p);
      }
    }
    process.env.PATH = curPaths.join(path.delimiter);
  }

  // Pre-check: if port is already active, don't crash, smoothly reuse it
  const active = await isPortActive(BACKEND_PORT);
  if (active) {
    console.log(`⚡ [Elite IDE] Backend server already active on port ${BACKEND_PORT}. Reusing running engine.`);
    return;
  }

  const portableBinDir = app.isPackaged 
    ? path.join(process.resourcesPath, 'bin')
    : path.resolve(__dirname, '..', 'bin');

  process.env.PORT = String(BACKEND_PORT);
  process.env.IS_DESKTOP_APP = 'true';
  process.env.PORTABLE_BIN_DIR = portableBinDir;
  process.env.RESOURCES_PATH = process.resourcesPath;

  const serverScript = path.resolve(__dirname, '..', 'server', 'server.js');
  try {
    const serverUrl = pathToFileURL(serverScript).href;
    await import(serverUrl);
    console.log('⚡ [Elite IDE] Backend compiler execution server is live on port', BACKEND_PORT);
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.warn('⚠️ [Elite IDE] Port in use during launch, reusing server smoothly.');
    } else {
      console.error('❌ [Elite IDE] Failed to initialize backend server:', err);
    }
  }
}

function createWindow() {
  const appIcon = [
    path.join(__dirname, '..', 'build', 'icon.png'),
    path.join(__dirname, '..', 'build', 'icon.ico'),
    path.join(__dirname, '..', 'public', 'icon-512.png'),
    path.join(__dirname, '..', 'public', 'icon.ico'),
    process.resourcesPath ? path.join(process.resourcesPath, 'compiler', 'icon-512.png') : null
  ].find(p => p && fs.existsSync(p));

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    title: 'Elite IDE - Professional Offline Developer Studio',
    backgroundColor: '#070b15',
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false
    }
  });

  // Modern borderless/clean presentation
  Menu.setApplicationMenu(null);

  const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';
  const appUrl = isDev ? 'http://localhost:5173/compiler/' : `http://localhost:${BACKEND_PORT}/compiler/`;

  // Auto-retry if webContents fails load on boot
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.warn(`[Window load retry] ${errorCode}: ${errorDescription}. Retrying...`);
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(appUrl);
      }
    }, 400);
  });

  mainWindow.loadURL(appUrl);

  // Handle Exam Kiosk Mode lockdown toggle
  ipcMain.on('toggle-kiosk-mode', (event, enable) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setKiosk(enable);
      mainWindow.setFullScreen(enable);
      mainWindow.setAlwaysOnTop(enable, 'screen-saver');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await startBackendServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
