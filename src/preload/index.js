import { contextBridge, ipcRenderer } from 'electron'

const apiPomodoro = {
  fechar: () => ipcRenderer.send('fechar-janela'),
  maximizar: () => ipcRenderer.send('maximizar-janela'),
  minimizar: () => ipcRenderer.send('minimizar-janela'),
  iniciarSessao: () => ipcRenderer.invoke('iniciar-foco'),
  pararSessao: () => ipcRenderer.invoke('parar-foco'),
  onMudancaEnergia: (callback) => ipcRenderer.on('alerta-energia', callback)
}

const apiNotify = {
  send: (title, body) => ipcRenderer.send('show-notification', { title, body }),
  playSound: (url) => ipcRenderer.send('play-sound', url)
}

const apiMenu = {
  send: (comando) => ipcRenderer.send('menu-comando', comando)
}

const apiTheme = {
  sendSettings: (settings) => ipcRenderer.send('update-settings', settings),
  onSettings: (callback) => ipcRenderer.on('settings-changed', (_, data) => callback(data))
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('widgetAPI', apiPomodoro)
    contextBridge.exposeInMainWorld('notifyAPI', apiNotify)
    contextBridge.exposeInMainWorld('menuAPI', apiMenu)
    contextBridge.exposeInMainWorld('themeAPI', apiTheme)
  } catch (error) {
    console.error(error)
  }
} else {
  window.widgetAPI = apiPomodoro
  window.notifyAPI = apiNotify
  window.menuAPI = apiMenu
  window.themeAPI = apiTheme
}

const apiSound = {
  getCustomSound: () => ipcRenderer.invoke('get-custom-sound')
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('soundAPI', apiSound)
} else {
  window.soundAPI = apiSound
}