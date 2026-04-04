import { contextBridge, ipcRenderer } from 'electron'

const apiPomodoro = {
  fechar: () => ipcRenderer.send('fechar-janela'),
  maximizar: () => ipcRenderer.send('maximizar-janela'),
  minimizar: () => ipcRenderer.send('minimizar-janela'),
  iniciarSessao: () => ipcRenderer.invoke('iniciar-foco'),
  pararSessao: () => ipcRenderer.invoke('parar-foco'),
  onMudancaEnergia: (callback) => {
    const handler = (_event, onBattery) => callback(onBattery)
    ipcRenderer.on('alerta-energia', handler)
    return () => ipcRenderer.removeListener('alerta-energia', handler)
  },
  onMaximizeChange: (callback) => {
    const handler = (_, isMax) => callback(isMax)
    ipcRenderer.on('window-maximize-changed', handler)
    return () => ipcRenderer.removeListener('window-maximize-changed', handler)
  }
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
  onSettings: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('settings-changed', handler)
    return () => ipcRenderer.removeListener('settings-changed', handler)
  },
  sendTimerState: (state) => ipcRenderer.send('send-timer-state', state),
  onTimerState: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('timer-state', handler)
    return () => ipcRenderer.removeListener('timer-state', handler)
  }
}

const apiConfig = {
  getFreesoundToken: () => ipcRenderer.invoke('get-freesound-token')
}

const apiSettings = {
  get: () => ipcRenderer.invoke('get-settings'),
  set: (settings) => ipcRenderer.invoke('set-settings', settings)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('widgetAPI', apiPomodoro)
    contextBridge.exposeInMainWorld('notifyAPI', apiNotify)
    contextBridge.exposeInMainWorld('menuAPI', apiMenu)
    contextBridge.exposeInMainWorld('themeAPI', apiTheme)
    contextBridge.exposeInMainWorld('settingsAPI', apiSettings)
    contextBridge.exposeInMainWorld('configAPI', apiConfig)
  } catch (error) {
    console.error(error)
  }
} else {
  window.widgetAPI = apiPomodoro
  window.notifyAPI = apiNotify
  window.menuAPI = apiMenu
  window.themeAPI = apiTheme
  window.settingsAPI = apiSettings
  window.configAPI = apiConfig
}

const apiSound = {
  getCustomSound: () => ipcRenderer.invoke('get-custom-sound')
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('soundAPI', apiSound)
} else {
  window.soundAPI = apiSound
}
