import { nativeImage, contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { GraphChatApi } from './bridge'

function subscribe<T>(channel: string, callback: (payload: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, payload: T): void => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.off(channel, listener)
}

const api: GraphChatApi = {
  bootstrap: () => ipcRenderer.invoke('bootstrap'),
  getLibraryInfo: () => ipcRenderer.invoke('library:info'),
  chooseLibrary: () => ipcRenderer.invoke('library:choose'),
  switchLibrary: (libraryRoot) => ipcRenderer.invoke('library:switch', libraryRoot),
  listModels: () => ipcRenderer.invoke('models:list'),
  selectModel: (modelPath) => ipcRenderer.invoke('models:select', modelPath),
  ejectModel: () => ipcRenderer.invoke('models:eject'),
  getLlamaStatus: () => ipcRenderer.invoke('llama:status'),
  fetchLlamaReleases: () => ipcRenderer.invoke('llama:releases'),
  installLlamaServer: (variant) => ipcRenderer.invoke('llama:install', variant),
  cancelLlamaInstall: () => ipcRenderer.invoke('llama:install-cancel'),
  onLlamaInstallProgress: (callback) => subscribe('llama:install-progress', callback),
  updateSettings: (input) => ipcRenderer.invoke('settings:update', input),
  savePreferences: (input) => ipcRenderer.invoke('preferences:save', input),
  resetWindowSize: () => ipcRenderer.invoke('window:resetSize'),
  setProjectDirty: (isDirty) => ipcRenderer.invoke('project:setDirty', isDirty),
  createProject: (name) => ipcRenderer.invoke('project:create', name),
  renameProject: (id, name) => ipcRenderer.invoke('project:rename', id, name),
  duplicateProject: (id, newName) => ipcRenderer.invoke('project:duplicate', id, newName),
  deleteProject: (id) => ipcRenderer.invoke('project:delete', id),
  openProject: (id) => ipcRenderer.invoke('project:open', id),
  saveProjectSnapshot: (snapshot) => ipcRenderer.invoke('project:saveSnapshot', snapshot),
  createNode: (input) => ipcRenderer.invoke('node:create', input),
  createImageNode: (input) => ipcRenderer.invoke('node:createImage', input),
  replaceImageNode: (nodeId) => ipcRenderer.invoke('node:replaceImage', nodeId),
  updateNode: (input) => ipcRenderer.invoke('node:update', input),
  duplicateImageAsset: (nodeId, duplicatedNodeId) => ipcRenderer.invoke('node:duplicateImageAsset', nodeId, duplicatedNodeId),
  deleteNode: (id) => ipcRenderer.invoke('node:delete', id),
  createEdge: (projectId, sourceId, targetId, sourceHandle, targetHandle) => ipcRenderer.invoke('edge:create', projectId, sourceId, targetId, sourceHandle, targetHandle),
  deleteEdge: (id, projectId) => ipcRenderer.invoke('edge:delete', id, projectId),
  startGeneration: (payload) => ipcRenderer.invoke('generation:start', payload),
  stopGeneration: (generationId) => ipcRenderer.invoke('generation:stop', generationId),
  exportReader: (name, content) => ipcRenderer.invoke('reader:export', name, content),
  toImageDataUrl: (filePath) => {
    const image = nativeImage.createFromPath(filePath)
    return image.isEmpty() ? null : image.toDataURL()
  },
  onGenerationDelta: (callback) => subscribe('generation:delta', callback),
  onGenerationDone: (callback) => subscribe('generation:done', callback),
  onGenerationError: (callback) => subscribe('generation:error', callback),
  startProofread: (proofreadId, text, systemPrompt) => ipcRenderer.invoke('proofread:start', { proofreadId, text, systemPrompt }),
  stopProofread: (proofreadId) => ipcRenderer.invoke('proofread:stop', proofreadId),
  onProofreadDelta: (callback) => subscribe('proofread:delta', callback),
  onProofreadDone: (callback) => subscribe('proofread:done', callback),
  onProofreadError: (callback) => subscribe('proofread:error', callback),
  onPromptLog: (callback) => subscribe('debug:promptLog', callback),
  onSystemResources: (callback) => subscribe('system:resources', callback)
}

contextBridge.exposeInMainWorld('graphChat', api)
