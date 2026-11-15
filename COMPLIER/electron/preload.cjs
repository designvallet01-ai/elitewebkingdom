const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('eliteDesktop', {
  isDesktop: true,
  platform: process.platform,
  toggleKioskMode: (enabled) => ipcRenderer.send('toggle-kiosk-mode', enabled)
});
