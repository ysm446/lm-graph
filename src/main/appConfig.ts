import { app } from 'electron'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/**
 * App-level configuration that is independent of any single library.
 * Stored under `appData` (NOT `userData`), so it survives library switches
 * and is unaffected by the dev-mode `userData` override in index.ts.
 */
export interface AppConfig {
  recentLibraries: string[]
  lastLibraryPath: string | null
}

const RECENT_LIMIT = 10

function configPath(): string {
  return join(app.getPath('appData'), 'graph-chat', 'app.json')
}

export function loadAppConfig(): AppConfig {
  try {
    const raw = readFileSync(configPath(), 'utf8')
    const parsed = JSON.parse(raw) as Partial<AppConfig>
    return {
      recentLibraries: Array.isArray(parsed.recentLibraries) ? parsed.recentLibraries.filter((entry): entry is string => typeof entry === 'string') : [],
      lastLibraryPath: typeof parsed.lastLibraryPath === 'string' ? parsed.lastLibraryPath : null
    }
  } catch {
    return { recentLibraries: [], lastLibraryPath: null }
  }
}

export function saveAppConfig(config: AppConfig): void {
  const path = configPath()
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(config, null, 2), 'utf8')
}

/** Mark a library as the active one and move it to the front of the recent list. */
export function recordRecentLibrary(libraryRoot: string): AppConfig {
  const normalized = resolve(libraryRoot)
  const previous = loadAppConfig()
  const recentLibraries = [normalized, ...previous.recentLibraries.filter((entry) => resolve(entry) !== normalized)].slice(0, RECENT_LIMIT)
  const next: AppConfig = { recentLibraries, lastLibraryPath: normalized }
  saveAppConfig(next)
  return next
}
