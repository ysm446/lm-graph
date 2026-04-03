# Graph Chat

Graph Chat is a desktop app for building local LLM workflows as a directed acyclic graph.
It uses Electron + React + React Flow for the UI, SQLite for project storage, and a local `llama.cpp` OpenAI-compatible server for generation.

## Current Features

- Project list with manual save
- Graph canvas with `text`, `context`, `global instruction`, and `local instruction` nodes
- Resizable left and right sidebars
- Upstream context collection for generation
- Streaming generation through local `llama.cpp`
- SQLite-backed project persistence
- JSON-backed UI preference persistence

## Requirements

- Windows
- Node.js 24.x
- npm 11.x
- Local GGUF model files under `models/`
- `llama.cpp` server files under `bin/llama-server/`

## Local Model Setup

This project expects local runtime assets that are intentionally not committed:

- `models/`
  - example: `models/Qwen3.5-27B-GGUF/Qwen3.5-27B-Q6_K.gguf`
- `bin/llama-server/llama-b8466-bin-win-cuda-13.1-x64/`
  - must contain `llama-server.exe` and related DLLs

The app scans `models/` for GGUF files and lets you choose them from the header model selector.

## Install

```powershell
npm install
npm run rebuild:electron
```

## Start

Recommended:

```powershell
.\start.bat
```

Manual development start:

```powershell
npm run rebuild:electron
npm run dev
```

Production build:

```powershell
npm run build
```

## Usage

1. Launch the app.
2. Create nodes from the canvas context menu.
3. Connect upstream nodes into a target `text` node.
4. Select the target `text` node and press `生成`.
5. Press `Save` in the left sidebar when you want to persist the current project snapshot.

## Node Types

- `text`: draft or generated prose
- `context`: reference material and background facts
- `global instruction`: shared instructions that continue to affect downstream nodes
- `local instruction`: instructions that apply only to the directly connected target node

## Generation Behavior

- Generation always targets a `text` node.
- Upstream `text` nodes are treated as text history/source material.
- Upstream `context` nodes are treated as reference context.
- `global instruction` nodes are included as shared system instructions.
- `local instruction` nodes affect only the directly connected target node.
- Unsaved edits on the current graph are used for generation even before pressing `Save`.

## Saving

- Project graph edits are kept locally until you press `Save`.
- A dirty indicator appears when the current project has unsaved changes.
- Switching projects or closing the app warns before discarding unsaved work.
- UI preferences such as sidebar state, minimap visibility, and context length are stored separately in a JSON preferences file under Electron `userData`.

## Keyboard Shortcuts

- `Delete`: delete selected node or edge
- `Ctrl + C` / `Cmd + C`: copy selected node
- `Ctrl + V` / `Cmd + V`: paste copied node near the current viewport center

Pasted `text` nodes start with empty content so they can be reused as a new generation target.

## Important Files

- `GRAPH_CHAT_SPEC.md`: feature spec
- `src/main/index.ts`: Electron main process and IPC
- `src/main/database.ts`: SQLite repository
- `src/main/llamaServer.ts`: local `llama.cpp` server management
- `src/preload/index.ts`: renderer bridge
- `src/renderer/src/App.tsx`: main UI
- `src/renderer/src/index.css`: shared renderer styling
- `start.bat`: Windows startup helper

## Notes

- `node_modules/`, `out/`, `bin/`, and `models/` are local-only and should not be committed.
- The SQLite database is stored under Electron `userData`, not in the repository.
- `better-sqlite3` must be rebuilt for the Electron runtime, so `npm run rebuild:electron` is included.
