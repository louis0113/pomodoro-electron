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

function createSettingsWindow() {
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
      contextIsolation: true
    }
  })

  secondaryWindow.loadFile(join(__dirname, '../renderer/settings.html'))

  secondaryWindow.once('ready-to-show', () => {
    secondaryWindow.show()
  })
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: true,
    resizable: true,
    icon: nativeImage.createFromPath(icon),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  const menu = Menu.buildFromTemplate([
    { label: 'Resetar app', role: 'reload' },
    { label: 'Forçar resear app', role: 'forceReload' },
    { label: 'Debug', role: 'toggleDevTools' },
    { label: 'Aumentar zoom', role: 'zoomIn' },
    { label: 'Diminuir zoom', role: 'zoomOut' },
    { label: 'Tamanho original', role: 'resetZoom' },
    { label: 'Tela cheia', role: 'togglefullscreen' }
  ])

  mainWindow.webContents.on('context-menu', () => {
    menu.popup()
  })

  mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
}

app.commandLine.appendSwitch('log-level', '3')

app.whenReady().then(() => {
  createMainWindow()

  tray = new Tray(nativeImage.createFromPath(icon))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Minimizar',
      type: 'normal',
      click: () => mainWindow.minimize()
    },
    {
      label: 'Maximizar',
      type: 'normal',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMaximized()) {
            mainWindow.unmaximize()
          } else {
            mainWindow.maximize()
          }
        }
      }
    },
    { label: 'Fechar', type: 'normal', click: () => mainWindow.close() }
  ])
  tray.setContextMenu(contextMenu)

  powerMonitor.on('on-battery', () => {
    mainWindow.webContents.send('alerta-energia', 'bateria')
  })

  powerMonitor.on('on-ac', () => {
    mainWindow.webContents.send('alerta-energia', 'tomada')
  })

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

ipcMain.on('fechar-janela', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.close()
})

ipcMain.on('minimizar-janela', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.minimize()
})

ipcMain.on('maximizar-janela', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  }
})

ipcMain.on('menu-comando', (event, comando) => {
  if (!mainWindow) return

  switch (comando) {
    case 'reload':
      mainWindow.reload()
      break
    case 'force-reload':
      mainWindow.webContents.reloadIgnoringCache()
      break
    case 'debug':
      mainWindow.webContents.toggleDevTools()
      break
    case 'zoom-in':
      mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 1)
      break
    case 'zoom-out':
      mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 1)
      break
    case 'zoom-reset':
      mainWindow.webContents.setZoomLevel(0)
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
  }
})

ipcMain.on('update-settings', (event, settings) => {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('settings-changed', settings)
  })
})

ipcMain.handle('iniciar-foco', () => {
  if (bloqueadorFocoId === null) {
    bloqueadorFocoId = powerSaveBlocker.start('prevent-app-suspension')
    return true
  }
  return false
})

ipcMain.handle('parar-foco', () => {
  if (bloqueadorFocoId !== null && powerSaveBlocker.isStarted(bloqueadorFocoId)) {
    powerSaveBlocker.stop(bloqueadorFocoId)
    bloqueadorFocoId = null
    return true
  }
  return false
})

ipcMain.on('show-notification', (event, { title, body }) => {
  new Notification({ title, body }).show()
})

ipcMain.on('play-sound', (event, url) => {
  if (process.platform === 'linux') {
    const canberra = spawn('canberra-gtk-play', ['--id=message', '--description=Pomodoro'])
    canberra.on('error', () => {
      spawn('paplay', ['/usr/share/sounds/freedesktop/stereo/message.oga']).on('error', () => {
        spawn('aplay', ['/usr/share/sounds/alsa/Noise.wav'])
      })
    })
  }

  const urlString = fetch(url)
    .then((audio) => audio.toString())
    .catch(() => console.log('Error'))

  return urlString.href
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
