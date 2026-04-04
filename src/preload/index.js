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

const apiDb = {
  available: () => ipcRenderer.invoke('db:available'),

  session: {
    create: (data) => ipcRenderer.invoke('db:session:create', data),
    update: (id, data) => ipcRenderer.invoke('db:session:update', id, data),
    complete: (id, completedLoops) => ipcRenderer.invoke('db:session:complete', id, completedLoops),
    stop: (id) => ipcRenderer.invoke('db:session:stop', id),
    cancel: (id) => ipcRenderer.invoke('db:session:cancel', id),
    list: (opts) => ipcRenderer.invoke('db:session:list', opts),
    delete: (id) => ipcRenderer.invoke('db:session:delete', id)
  },

  timestamp: {
    create: (data) => ipcRenderer.invoke('db:timestamp:create', data),
    complete: (id) => ipcRenderer.invoke('db:timestamp:complete', id),
    list: (opts) => ipcRenderer.invoke('db:timestamp:list', opts),
    delete: (id) => ipcRenderer.invoke('db:timestamp:delete', id)
  },

  history: {
    get: () => ipcRenderer.invoke('db:history:get')
  },

  settings: {
    get: () => ipcRenderer.invoke('db:settings:get'),
    set: (data) => ipcRenderer.invoke('db:settings:set', data)
  },

  calendar: {
    get: () => ipcRenderer.invoke('db:calendar:get'),
    set: (date, note) => ipcRenderer.invoke('db:calendar:set', date, note),
    delete: (date) => ipcRenderer.invoke('db:calendar:delete', date)
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('soundAPI', apiSound)
  contextBridge.exposeInMainWorld('dbAPI', apiDb)
} else {
  window.soundAPI = apiSound
  window.dbAPI = apiDb
}
