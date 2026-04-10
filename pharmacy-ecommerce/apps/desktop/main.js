const { app, BrowserWindow, Menu, shell, globalShortcut } = require('electron')
const path = require('path')

const APP_URL = 'https://tu-farmacia.vercel.app'
const POS_URL = `${APP_URL}/admin/pos`

const isPOS = process.argv.includes('--pos')
const isKiosk = process.argv.includes('--kiosk')

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: isPOS ? 1280 : 1400,
    height: isPOS ? 800 : 900,
    minWidth: 800,
    minHeight: 600,
    title: isPOS ? 'Tu Farmacia — Punto de Venta' : 'Tu Farmacia',
    // Use default electron icon until assets/icon.ico is added
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    kiosk: isKiosk,
    fullscreen: isKiosk,
    autoHideMenuBar: isPOS,
    backgroundColor: '#f8fafc',
  })

  const startUrl = isPOS || isKiosk ? POS_URL : APP_URL
  mainWindow.loadURL(startUrl)

  // Open external links in system browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') && !url.startsWith(APP_URL)) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

function buildMenu() {
  const template = [
    {
      label: 'Navegación',
      submenu: [
        {
          label: 'Punto de Venta (POS)',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.loadURL(POS_URL),
        },
        {
          label: 'Panel Admin',
          accelerator: 'CmdOrCtrl+A',
          click: () => mainWindow?.loadURL(`${APP_URL}/admin`),
        },
        {
          label: 'Tienda',
          click: () => mainWindow?.loadURL(APP_URL),
        },
        { type: 'separator' },
        {
          label: 'Recargar',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.webContents.reload(),
        },
        {
          label: 'Atrás',
          accelerator: 'Alt+Left',
          click: () => { if (mainWindow?.webContents.canGoBack()) mainWindow.webContents.goBack() },
        },
      ],
    },
    {
      label: 'Pantalla',
      submenu: [
        {
          label: 'Pantalla completa',
          accelerator: 'F11',
          click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()),
        },
        {
          label: 'Modo kiosk (POS pantalla completa)',
          accelerator: 'CmdOrCtrl+Shift+K',
          click: () => {
            mainWindow?.loadURL(POS_URL)
            mainWindow?.setKiosk(!mainWindow.isKiosk())
          },
        },
        { type: 'separator' },
        {
          label: 'Herramientas de desarrollo',
          accelerator: 'F12',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: 'Impresión',
      submenu: [
        {
          label: 'Imprimir',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => mainWindow?.webContents.print({ silent: false, printBackground: true }),
        },
      ],
    },
  ]
  return Menu.buildFromTemplate(template)
}

app.whenReady().then(() => {
  createWindow()
  Menu.setApplicationMenu(isPOS ? null : buildMenu())

  // F5 to reload, Escape to exit kiosk
  globalShortcut.register('F5', () => mainWindow?.webContents.reload())
  globalShortcut.register('Escape', () => {
    if (mainWindow?.isKiosk()) mainWindow.setKiosk(false)
  })
})

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
