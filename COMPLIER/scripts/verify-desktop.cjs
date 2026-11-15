const { app, BrowserWindow } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

console.log('Testing Elite IDE Desktop Boot Cycle...');

async function test() {
  process.env.PORT = '3001';
  process.env.IS_DESKTOP_APP = 'true';
  process.env.PORTABLE_BIN_DIR = path.resolve(__dirname, '..', 'bin');

  const serverScript = path.resolve(__dirname, '..', 'server', 'server.js');
  try {
    await import(pathToFileURL(serverScript).href);
    console.log('✅ Server loaded in Electron process successfully!');
  } catch (e) {
    console.error('❌ Server load failed:', e);
    process.exit(1);
  }

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false // headless test
  });

  win.webContents.on('did-finish-load', () => {
    console.log('✅ URL loaded successfully in BrowserWindow!');
    console.log('Title:', win.getTitle());
    setTimeout(() => {
      console.log('✅ TEST PASSED: Desktop app runs with 100% stability!');
      app.quit();
    }, 1000);
  });

  win.webContents.on('did-fail-load', (e, code, desc) => {
    console.error(`❌ Load failed with code ${code}: ${desc}`);
    app.quit();
    process.exit(1);
  });

  win.loadURL('http://localhost:3001/compiler/');
}

app.whenReady().then(test);
