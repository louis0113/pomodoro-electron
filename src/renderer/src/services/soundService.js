// Mapping de contextos para sons do FreeSound API v2
// Usando IDs de áudio gratuitos disponíveis no FreeSound

const SOUND_TYPES = {
  // Início de sessão de foco - Som motivador
  FOCUS_START: {
    id: 'focus_start',
    freesoundIds: [376193, 609725], // mechanical timer + microwave ping
    fallback: '/assets/sounds/notification.wav'
  },

  // Transição de foco para pausa - Som de conclusão/sucesso
  FOCUS_TO_BREAK: {
    id: 'focus_to_break',
    freesoundIds: [634089, 215774], // timer complete + bong
    fallback: '/assets/sounds/notification.wav'
  },

  // Transição de pausa para foco - Som de alerta/retorno
  BREAK_TO_FOCUS: {
    id: 'break_to_focus',
    freesoundIds: [633159, 493551], // ringtone alert + UI clicks
    fallback: '/assets/sounds/notification.wav'
  },

  // Sessão completa - Som celebrativo
  SESSION_COMPLETE: {
    id: 'session_complete',
    freesoundIds: [215774, 634089], // bong + timer complete
    fallback: '/assets/sounds/notification.wav'
  },

  // Parar sessão - Som neutro
  SESSION_STOP: {
    id: 'session_stop',
    freesoundIds: [263802, 493551], // on/off switch + UI clicks
    fallback: '/assets/sounds/notification.wav'
  },

  // Cancelar sessão - Som de erro/negação
  SESSION_CANCEL: {
    id: 'session_cancel',
    freesoundIds: [672085, 722375], // error sounds
    fallback: '/assets/sounds/notification.wav'
  }
}

const FREESOUND_API_BASE = 'https://freesound.org/apiv2'

class SoundService {
  constructor() {
    this.audioInstances = new Map()
    this.cache = new Map()
    this.freesoundToken = ''
    this.preloadedSounds = new Map()
    this.apiVersion = 'v2'
    this.initialized = false

    // Inicializa token do IPC (Electron)
    this.initializeToken()
  }

  /**
   * Inicializa o token FreeSound via IPC do Electron
   */
  async initializeToken() {
    try {
      if (typeof window !== 'undefined' && window.settingsAPI?.get) {
        const settings = await window.settingsAPI.get()
        const envToken = (await window.configAPI?.getFreesoundToken?.()) || ''
        this.freesoundToken = settings?.freesoundApiKey || envToken
        this.initialized = true
      } else {
        this.initialized = true
      }
    } catch (error) {
      // Token initialization error - usar fallback local
      this.initialized = true
    }
  }

  /**
   * Obtém o tipo de som baseado no contexto
   */
  getSoundType(soundType) {
    return SOUND_TYPES[soundType] || SOUND_TYPES.FOCUS_START
  }

  /**
   * Carrega um áudio do FreeSound ou usa fallback
   */
  async loadSound(soundType) {
    const config = this.getSoundType(soundType)
    const cacheKey = config.id

    // Se já está em cache, retorna
    if (this.preloadedSounds.has(cacheKey)) {
      return this.preloadedSounds.get(cacheKey)
    }

    try {
      // Tenta carregar do FreeSound se houver token
      if (this.freesoundToken && config.freesoundIds.length > 0) {
        const audioUrl = await this.fetchFromFreeSound(config.freesoundIds)
        if (audioUrl) {
          const audio = new Audio(audioUrl)
          this.preloadedSounds.set(cacheKey, audio)
          return audio
        }
      }
    } catch (error) {
      console.error(`Erro ao carregar som do FreeSound (${config.id}):`, error)
    }

    // Fallback para arquivo local
    const audio = new Audio(config.fallback)
    this.preloadedSounds.set(cacheKey, audio)
    return audio
  }

  /**
   * Aguarda inicialização do token
   */
  async waitForToken() {
    let attempts = 0
    while (!this.initialized && attempts < 50) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }
    return this.freesoundToken
  }

  /**
   * Busca um som do FreeSound API v2
   * @param {number[]} soundIds - Array de IDs de sons do FreeSound
   * @returns {Promise<string|null>} URL do arquivo de áudio ou null
   */
  async fetchFromFreeSound(soundIds) {
    try {
      const token = await this.waitForToken()

      if (!token) {
        return null
      }

      const soundId = soundIds[Math.floor(Math.random() * soundIds.length)]

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${FREESOUND_API_BASE}/sounds/${soundId}/`, {
        method: 'GET',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        cache: 'default',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return null
      }

      const data = await response.json()

      const audioUrl =
        data.previews?.['preview-lq-mp3'] ||
        data.previews?.['preview-hq-mp3'] ||
        null

      return audioUrl || null
    } catch (error) {
      // Silencioso - usar fallback local
      return null
    }
  }

  /**
   * Toca um som específico
   * @param {string} soundType - Tipo de som a tocar
   */
  async play(soundType = 'FOCUS_START') {
    try {
      const cached = await this.loadSound(soundType)

      if (cached) {
        const audio = cached.cloneNode()
        audio.volume = 0.75
        audio.play().catch(() => {
          // Erro silencioso
        })
      }
    } catch (error) {
      // Erro silencioso
    }
  }

  /**
   * Para todos os áudios em reprodução
   */
  stopAll() {
    this.preloadedSounds.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
  }

  /**
   * Define o token do FreeSound API v2
   * @param {string} token - Token de autenticação do FreeSound
   */
  setFreesoundToken(token) {
    this.freesoundToken = token
    // Limpa o cache se houver mudança de token
    this.preloadedSounds.clear()
  }

  /**
   * Pré-carrega todos os sons
   */
  async preloadAllSounds() {
    const promises = Object.keys(SOUND_TYPES).map((key) => this.loadSound(key))
    await Promise.allSettled(promises)
  }

  /**
   * Obtém informações do som do FreeSound API v2 (debug)
   * @param {number} soundId - ID do som no FreeSound
   */
  async getSoundInfo(soundId) {
    try {
      const response = await fetch(`${FREESOUND_API_BASE}/sounds/${soundId}/`, {
        method: 'GET',
        headers: {
          Authorization: `Token ${this.freesoundToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`FreeSound API v2 error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao obter informações do som:', error)
      return null
    }
  }
}

// Singleton instance
export const soundService = new SoundService()

// Export para uso direto
export default SoundService
