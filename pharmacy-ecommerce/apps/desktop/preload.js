const { contextBridge, ipcRenderer } = require('electron')

// Minimal context bridge — the app runs entirely in the browser (tu-farmacia.cl)
// This preload intentionally exposes nothing to maintain security isolation.
// Add entries here if/when native Electron features are needed (e.g., print, notifications).
contextBridge.exposeInMainWorld('electronApp', {
  platform: process.platform,
})
