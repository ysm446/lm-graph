export type NodeType = 'text' | 'context' | 'instruction' | 'image' | 'textSwitch' | 'contextSwitch' | 'instructionSwitch'
export type NodeInputHandle = 'text' | 'context' | 'instruction' | 'image' | `text:${number}` | `context:${number}` | `instruction:${number}`
export type NodeOutputHandle = 'output'
export type TextStyleTarget = 'both' | 'title' | 'content'
export type TextStylePreset = 'standard' | 'business' | 'reading' | 'dense'
export type ProofreadPreset = 'light' | 'standard' | 'aggressive' | 'custom'

export interface ImageAsset {
  path: string
  thumbnailPath: string | null
  thumbnailDataUrl: string | null
  originalName: string
  mimeType: string | null
  width: number | null
  height: number | null
}

export interface ProjectRecord {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface LibraryRecentEntry {
  path: string
  name: string
  exists: boolean
}

export interface LibraryInfo {
  currentPath: string
  currentName: string
  recent: LibraryRecentEntry[]
}

export interface GenerationMeta {
  promptTokens: number | null
  completionTokens: number | null
  totalTokens: number | null
  tokensPerSecond: number | null
  durationSeconds: number | null
  finishReason: string | null
  systemPrompt?: string | null
  userMessage?: string | null
}

export interface GraphNodeRecord {
  id: string
  projectId: string
  type: NodeType
  title: string
  content: string
  instruction: string | null
  isLocal: boolean
  model: string | null
  isGenerated: boolean
  generationMeta: GenerationMeta | null
  image: ImageAsset | null
  createdAt: string
  updatedAt: string
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
}

export interface GraphEdgeRecord {
  id: string
  projectId: string
  sourceId: string
  targetId: string
  sourceHandle: NodeOutputHandle | null
  targetHandle: NodeInputHandle | null
}

export interface ProjectSnapshot {
  project: ProjectRecord
  nodes: GraphNodeRecord[]
  edges: GraphEdgeRecord[]
}

export interface ModelOption {
  name: string
  path: string
  sizeBytes: number
  metadata: ModelMetadata
}

export interface ModelMetadata {
  quantizationLabel: string | null
  parameterCount: number | null
  parameterLabel: string | null
  source: 'filename' | 'server' | null
}

export interface AppSettings {
  llamaBaseUrl: string
  llamaModelAlias: string
  selectedModelPath: string
  selectedModelName: string
  contextLength: number
  temperature: number
  availableModels: ModelOption[]
  resolvedModelPath: string
  resolvedMmprojPath: string | null
  resolvedServerPath: string
  supportsVision: boolean
  isModelLoaded: boolean
  isServerInstalled: boolean
  serverBuild: string | null
}

export type LlamaBackendFamily = 'cuda' | 'cpu' | 'vulkan' | 'hip' | 'sycl' | 'other'

export interface LlamaReleaseVariant {
  key: string
  label: string
  family: LlamaBackendFamily
  assetName: string
  assetUrl: string
  sizeBytes: number
  cudartName: string | null
  cudartUrl: string | null
  cudartSizeBytes: number | null
}

export interface LlamaRelease {
  tag: string
  name: string
  publishedAt: string | null
  htmlUrl: string
  variants: LlamaReleaseVariant[]
}

export interface LlamaServerInstall {
  build: string | null
  dir: string
  path: string
}

export interface LlamaServerStatus {
  installed: boolean
  build: string | null
  path: string | null
  installDir: string | null
  installRoot: string
  installs: LlamaServerInstall[]
}

export type LlamaInstallProgress =
  | { phase: 'download'; fileLabel: string; received: number; total: number | null; percent: number | null }
  | { phase: 'extract'; fileLabel: string }
  | { phase: 'done'; build: string | null; path: string }
  | { phase: 'error'; message: string }
  | { phase: 'canceled' }

export interface UiPreferences {
  contextLength: number
  temperature: number
  isSidebarOpen: boolean
  isInspectorOpen: boolean
  isSettingsPanelOpen: boolean
  isPropertiesPanelOpen: boolean
  isMiniMapVisible: boolean
  isSnapToGridEnabled: boolean
  edgeType: 'default' | 'smoothstep' | 'step'
  isProofreadEnabled: boolean
  proofreadPreset: ProofreadPreset
  proofreadSystemPrompt: string
  leftSidebarWidth: number
  rightInspectorWidth: number
  nodeFontSize: number
  textStyleTarget: TextStyleTarget
  textStylePreset: TextStylePreset
  titleTextStylePreset: TextStylePreset
  contentTextStylePreset: TextStylePreset
  titleFontSize: number
  contentFontSize: number
  isPromptLogEnabled: boolean
  isSystemMonitorVisible: boolean
  generalSections: {
    server: boolean
    context: boolean
    interface: boolean
    textStyle: boolean
    editing: boolean
    debug: boolean
  }
  lastUsedModelPath: string | null
  projectViewports: Record<string, { x: number; y: number; zoom: number }>
}




