# Pomodoro Electron

Aplicação desktop de **Pomodoro Timer** desenvolvida com **Electron**, **React** e **Vite**.  
Projetada para ajudar na **gestão de tempo e produtividade** utilizando a técnica Pomodoro, com suporte a múltiplos temas, janela de configurações separada, histórico de sessões e notificações de sistema.

---

## Sobre o Projeto

O **Pomodoro Timer** alterna automaticamente entre ciclos de foco e descanso, com controle total via interface gráfica.

Fluxo padrão:

1. Iniciar sessão de **foco** (padrão: 25 min)
2. Pausa automática de **descanso** (padrão: 5 min)
3. Repetir conforme o número de **loops** configurados
4. Ao completar todos os ciclos, sessão encerrada com notificação

---

## Tecnologias

- [Electron](https://www.electronjs.org/) — framework desktop
- [React 19](https://react.dev/) — interface declarativa
- [Vite](https://vite.dev/) via [electron-vite](https://electron-vite.org/) — build e dev server
- [Sequelize](https://sequelize.org/) + [PostgreSQL](https://www.postgresql.org/) — persistência de dados
- [electron-builder](https://www.electron.build/) — empacotamento e distribuição

---

## Estrutura do Projeto

```text
pomodoro-electron/
├── src/
│   ├── main/              # Processo principal do Electron (IPC, janelas, sessão)
│   ├── preload/           # Scripts de preload (bridges IPC expostas ao renderer)
│   ├── renderer/
│   │   └── src/
│   │       ├── components/
│   │       │   ├── Buttons/       # Botões de controle (start, stop, cancel, settings...)
│   │       │   ├── Selects/       # Selects de configuração (temas, minutos, loops)
│   │       │   ├── Template/      # Componentes base de layout
│   │       │   ├── Calendar.jsx   # Histórico visual de sessões
│   │       │   ├── Config.jsx     # Painel de configurações
│   │       │   ├── History.jsx    # Lista de histórico
│   │       │   ├── Options.jsx    # Opções de sessão
│   │       │   ├── Timer.jsx      # Display principal do cronômetro
│   │       │   ├── Window.jsx     # Frame da janela (controles minimize/max/close)
│   │       │   └── WindowControls.jsx
│   │       ├── context/
│   │       │   └── TimerContext.jsx  # Context API com estado global separado (state/config/actions)
│   │       ├── hooks/
│   │       │   └── useSound.js    # Hook para sons de transição entre fases
│   │       ├── services/
│   │       │   └── soundService.js
│   │       ├── App.jsx            # Raiz da aplicação (janela principal)
│   │       ├── settings.jsx       # Raiz da janela de configurações
│   │       └── WindowSettings.jsx
│   └── models/            # Modelos Sequelize
├── resources/             # Recursos estáticos (ícones, sons)
├── build/                 # Assets para empacotamento
├── electron.vite.config.mjs
├── electron-builder.json
└── package.json
```

---

## Funcionalidades

- Iniciar, pausar, retomar e cancelar sessão Pomodoro
- Alternância automática entre fases de foco e descanso
- Configuração de duração de foco e descanso
- Configuração do número de loops por sessão
- Múltiplos temas visuais
- Janela de configurações separada com sincronização via IPC
- Histórico de sessões persistido em banco de dados PostgreSQL com fallback para `localStorage`
- Calendário visual de produtividade com anotações por dia
- Notificações de sistema ao fim de cada fase
- Sons de transição entre fases (foco, descanso, sessão completa)
- Alerta de bateria (avisa quando rodando em energia de bateria)
- Controles nativos de janela personalizados (minimizar, maximizar, fechar)

---

## Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/)

### 1. Clonar o repositório

```bash
git clone https://github.com/louis0113/pomodoro-electron.git
cd pomodoro-electron
```

### 2. Instalar dependências

```bash
pnpm install
```

### 3. Executar em modo de desenvolvimento

```bash
pnpm dev
```

### 4. Pré-visualizar o build

```bash
pnpm start
```

---

## Gerar Build

```bash
# Build para a plataforma atual
pnpm build

# Empacotamento sem instalador (diretório)
pnpm build:unpack

# Windows (NSIS installer + portable)
pnpm build:win

# macOS (DMG universal)
pnpm build:mac

# Linux (AppImage + .deb)
pnpm build:linux
```

Os artefatos são gerados na pasta `dist/`.

---

## Distribuição

| Plataforma | Formatos                                           |
| ---------- | -------------------------------------------------- |
| Windows    | NSIS installer (x64, arm64), Portable (x64, arm64) |
| macOS      | DMG Universal                                      |
| Linux      | AppImage (x64, arm64), .deb (x64, arm64)           |

---

## Licença

Este projeto está sob a licença **MIT**. Consulte o arquivo [LICENSE.md](LICENSE.md) para mais detalhes.

---

## Autores

- **Luiz Henrique Ferreira** — [lhrds0113@proton.me](mailto:lhrds0113@proton.me)
- **Matheus Henrique**
