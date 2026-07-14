# CLAUDE.md

## Project Overview

**lm-graph** is an Electron desktop app for building local LLM workflows using a node graph UI. Users connect nodes on a canvas to compose prompts and generate text via a locally running llama.cpp server.

## Architecture

```
src/
  main/          # Electron main process
    index.ts       # IPC handlers, app lifecycle
    database.ts    # SQLite via better-sqlite3 (projects, nodes, edges)
    llamaServer.ts # Manages llama-server.exe subprocess, streaming completions
    types.ts       # Shared TypeScript types
  renderer/src/  # React renderer (single file)
    App.tsx        # Entire UI — ReactFlow canvas, sidebars, node components
    index.css      # CSS variables (theme tokens)
    main.tsx       # React entry point
```

### Key types (`src/main/types.ts`)

- `NodeType`: `'text' | 'context' | 'instruction' | 'image'`
  - **text**: generates output via LLM; has T/C/I/Img input handles
  - **context**: static content fed as context
  - **instruction**: static content fed as system instruction
  - **image**: image asset fed to the connected text node's Img handle; Vision-capable models receive the actual image data, others receive only metadata text
- `GraphNodeRecord`: node with position, size, content, generationMeta
- `GraphEdgeRecord`: edge connecting sourceHandle → targetHandle
- `AppSettings`: llama-server config (model path, context length, temperature)
- `UiPreferences`: sidebar widths, panel visibility, snap-to-grid, edge type, proofread toggle, section open/close state, per-project viewport (`projectViewports`)

### Node handles

Text nodes have four input handles on the left:
- **T** (text) — primary text input
- **C** (context) — context feed
- **I** (instruction) — system instruction
- **Img** (image) — image input (Vision models only)

All nodes have one output handle on the right.

### Data persistence

- SQLite database managed by `database.ts`
- Projects contain nodes and edges; full snapshots loaded on project switch
- UI preferences persisted separately via Electron IPC
- Per-project camera position and zoom are saved in `UiPreferences.projectViewports` and restored on project switch

#### Libraries (root folders)

- A **library** is a self-contained data folder. It holds `graph-chat.db`, `assets/images/`, and `preferences.json`. Everything for one set of projects lives under one root folder, so it is portable (backup / sync / move between machines).
- `GraphRepository` is constructed with a `libraryRoot` and can be repointed in place via `openLibrary(root)` (the instance is reused so IPC handlers that captured it stay valid).
- The active library, plus a recent-libraries list, is tracked in **`app.json`** under `app.getPath('appData')` (`%APPDATA%/graph-chat/app.json`) — independent of any library and of the dev-mode `userData` override. Managed by `appConfig.ts`.
- Startup resolves the library from `app.json`'s `lastLibraryPath`; if unset/missing it falls back to the repo-local `data/` folder (backward compatible; `data/` is still Electron's `userData` for caches).
- Switch libraries in-app via the **Library** bar at the top of the left sidebar (folder picker + recent list). IPC: `library:info` / `library:choose` / `library:switch`.
- Models (`.gguf`) and the llama server stay app/global (under `models/` and `bin/`); libraries only reference the selected model by path, never copy it.

### LLM backend

- `llamaServer.ts` auto-selects and spawns a `llama-server.exe` found under `bin/llama-server/`
- Models are `.gguf` files placed in the `models/` directory
- Communicates via HTTP on localhost (default port 8080)
- Streaming completions via `GenerationMeta` (tokens, speed, duration)
- Generation requests are queued (`generationQueue` state) and executed sequentially
- Proofread requests (`proofread:start` / `proofread:stop` IPC) stream corrected text independently of node generation

## Development

```bash
npm run dev        # Start Electron + Vite dev server
npm run build      # Type-check + build for production
```

- Native module rebuild (if needed): `npm run rebuild:electron`
- Stack: Electron, React 19, ReactFlow (@xyflow/react), Tailwind CSS, TypeScript

## Code Conventions

- The entire renderer UI lives in a single file: `src/renderer/src/App.tsx`
- Styling uses Tailwind utility classes with CSS variable design tokens (e.g. `var(--text)`, `var(--bg-input)`)
- Japanese text must not be garbled — be careful with encoding
- Token estimation uses `estimateTokenCount()` which handles CJK characters correctly
- IPC between main and renderer uses Electron's `ipcMain`/`ipcRenderer`
- Right sidebar has three collapsible sections: **Context and Offload** (model settings), **Interface** (MiniMap, Snap to Grid, Edge Style), **Editing** (Proofread on Select)
- Node titles are shown outside the node at low zoom levels (`zoom < 0.65`) using `useViewport()` with inverse-scale font sizing
- Generating nodes display a pulsing purple glow animation via the `.node-generating-border` CSS class
