import {
  app,
  BrowserWindow,
  ipcMain,
  powerMonitor,
  powerSaveBlocker,
  Notification,
  Tray,
  Menu,
  nativeImage,
  shell
} from 'electron'

import { join } from 'node:path'
import { spawn } from 'node:child_process'
import icon from '../../resources/icon.png?asset'
import dotenv from 'dotenv'

dotenv.config()

export let mainWindow = null
export let secondaryWindow = null

let bloqueadorFocoId = null
let tray = null

Menu.setApplicationMenu(null)

function createSettingsWindow() {
  if (secondaryWindow) {
    secondaryWindow.focus()
    return
  }

  secondaryWindow = new BrowserWindow({
    parent: mainWindow,
    show: false,
    width: 450,
    height: 550,
    minWidth: 350,
    minHeight: 450,
    maxWidth: 600,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false
    }
  })

  secondaryWindow.loadFile(join(__dirname, '../renderer/settings.html'))

  secondaryWindow.once('ready-to-show', () => {
    secondaryWindow.show()
  })

  secondaryWindow.on('closed', () => {
    secondaryWindow = null
  })
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: true,
    resizable: true,
    icon: nativeImage.createFromPath(icon),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  const menu = Menu.buildFromTemplate([
    { label: 'Resetar app', role: 'reload' },
    { label: 'Forçar resetar app', role: 'forceReload' },
    { label: 'Debug', role: 'toggleDevTools' },
    { type: 'separator' },
    { label: 'Aumentar zoom', role: 'zoomIn' },
    { label: 'Diminuir zoom', role: 'zoomOut' },
    { label: 'Tamanho original', role: 'resetZoom' },
    { label: 'Tela cheia', role: 'togglefullscreen' }
  ])

  mainWindow.webContents.on('context-menu', () => {
    menu.popup()
  })

  mainWindow.loadFile(join(__dirname, '../renderer/index.html'))

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.commandLine.appendSwitch('log-level', '3')

app.whenReady().then(() => {
  createMainWindow()

  const trayIcon = nativeImage.createFromPath(icon)
  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Minimizar',
      click: () => mainWindow?.minimize()
    },
    {
      label: 'Maximizar/Restaurar',
      click: () => {
        if (!mainWindow) return
        mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
      }
    },
    { type: 'separator' },
    { label: 'Fechar', click: () => app.quit() }
  ])

  tray.setContextMenu(contextMenu)

  powerMonitor.on('on-battery', () => {
    mainWindow?.webContents.send('alerta-energia', 'bateria')
  })

  powerMonitor.on('on-ac', () => {
    mainWindow?.webContents.send('alerta-energia', 'tomada')
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

ipcMain.on('fechar-janela', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close()
})

ipcMain.on('minimizar-janela', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize()
})

ipcMain.on('maximizar-janela', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    win.isMaximized() ? win.unmaximize() : win.maximize()
  }
})

ipcMain.on('menu-comando', (event, comando) => {
  if (!mainWindow) return

  const wc = mainWindow.webContents

  switch (comando) {
    case 'reload':
      wc.reload()
      break
    case 'force-reload':
      wc.reloadIgnoringCache()
      break
    case 'debug':
      wc.toggleDevTools()
      break
    case 'zoom-in':
      wc.setZoomLevel(wc.getZoomLevel() + 1)
      break
    case 'zoom-out':
      wc.setZoomLevel(wc.getZoomLevel() - 1)
      break
    case 'zoom-reset':
      wc.setZoomLevel(0)
      break
    case 'fullscreen':
      mainWindow.setFullScreen(!mainWindow.isFullScreen())
      break
    case 'quit':
      app.quit()
      break
    case 'help':
      shell.openExternal('https://github.com/louis0113/pomodoro-electron')
      break
    case 'secondary':
      createSettingsWindow()
      break
  }
})

ipcMain.on('update-settings', (event, settings) => {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send('settings-changed', settings)
    }
  }
})

ipcMain.handle('iniciar-foco', () => {
  if (bloqueadorFocoId === null) {
    bloqueadorFocoId = powerSaveBlocker.start('prevent-app-suspension')
    return true
  }
  return false
})

ipcMain.handle('parar-foco', () => {
  if (bloqueadorFocoId !== null) {
    powerSaveBlocker.stop(bloqueadorFocoId)
    bloqueadorFocoId = null
    return true
  }
  return false
})

ipcMain.on('show-notification', (event, { title, body }) => {
  new Notification({ title, body, icon: nativeImage.createFromPath(icon) }).show()
})

ipcMain.on('play-sound', () => {
  if (process.platform !== 'linux') return

  const tryPlay = (cmd, args, next) => {
    const p = spawn(cmd, args)
    p.on('error', () => next && next())
  }

  tryPlay('canberra-gtk-play', ['--id=message'], () => {
    tryPlay('paplay', ['/usr/share/sounds/freedesktop/stereo/message.oga'], () => {
      tryPlay('aplay', ['/usr/share/sounds/alsa/Noise.wav'])
    })
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
