import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  NodeResizeControl,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { AppSettings, GraphEdgeRecord, GraphNodeRecord, ModelOption, NodeType, ProjectRecord, ProjectSnapshot } from '../../main/types'
import type { ReaderState } from './types'

type AppNodeData = {
  graphNode: GraphNodeRecord
  isSelected: boolean
  onSelect: (id: string) => void
  onGenerate: (id: string) => void
  onOpenReader: (id: string) => void
  onResize: (id: string, input: { position: { x: number; y: number }; size: { width: number; height: number } }) => void
}

type CanvasMenuState = {
  x: number
  y: number
  flowX: number
  flowY: number
} | null

type NodeMenuState = {
  x: number
  y: number
  nodeId: string
} | null

type ProjectDialogState =
  | {
      mode: 'create' | 'rename'
      projectId?: string
      value: string
    }
  | null

type ProjectMenuState = {
  projectId: string
} | null

function App() {
  return (
    <ReactFlowProvider>
      <GraphChatApp />
    </ReactFlowProvider>
  )
}

function GraphChatApp() {
  const reactFlow = useReactFlow()
  const mainRef = useRef<HTMLElement | null>(null)
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [activeProjectId, setActiveProjectId] = useState('')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [status, setStatus] = useState('Loading...')
  const [error, setError] = useState<string | null>(null)
  const [reader, setReader] = useState<ReaderState | null>(null)
  const [generation, setGeneration] = useState<{ generationId: string; nodeId: string } | null>(null)
  const [canvasMenu, setCanvasMenu] = useState<CanvasMenuState>(null)
  const [nodeMenu, setNodeMenu] = useState<NodeMenuState>(null)
  const [isModelModalOpen, setIsModelModalOpen] = useState(false)
  const [isModelSwitching, setIsModelSwitching] = useState(false)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)
  const [modelFilter, setModelFilter] = useState('')
  const [projectDialog, setProjectDialog] = useState<ProjectDialogState>(null)
  const [projectMenu, setProjectMenu] = useState<ProjectMenuState>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<AppNodeData>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const snapshotRef = useRef<ProjectSnapshot | null>(null)

  useEffect(() => {
    void window.graphChat.bootstrap().then(({ projects, snapshot, settings }) => {
      setProjects(projects)
      setSettings(settings)
      setActiveProjectId(snapshot.project.id)
      applySnapshot(snapshot)
      setStatus('Ready')
    }).catch((err) => {
      setError(err instanceof Error ? err.message : String(err))
      setStatus('Failed to load')
    })
  }, [])

  useEffect(() => {
    const offDelta = window.graphChat.onGenerationDelta(({ nodeId, content }) => {
      setNodes((current) => current.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, graphNode: { ...node.data.graphNode, content } } } : node))
    })
    const offDone = window.graphChat.onGenerationDone(({ snapshot, projects }) => {
      setProjects(projects)
      applySnapshot(snapshot)
      setGeneration(null)
      setStatus('Generation completed')
    })
    const offError = window.graphChat.onGenerationError(({ message }) => {
      setGeneration(null)
      setError(message)
      setStatus('Generation failed')
    })
    return () => {
      offDelta()
      offDone()
      offError()
    }
  }, [])

  useEffect(() => {
    const closeMenu = () => {
      setCanvasMenu(null)
      setNodeMenu(null)
      setProjectMenu(null)
    }
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  useEffect(() => {
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isSelected: node.id === selectedNodeId
        }
      }))
    )
  }, [selectedNodeId, setNodes])

  const selectedNode = useMemo(() => snapshotRef.current?.nodes.find((node) => node.id === selectedNodeId) ?? null, [selectedNodeId, nodes])
  const nodeTypes = useMemo(() => ({ graphNode: GraphNodeCard }), [])

  function applySnapshot(snapshot: ProjectSnapshot) {
    snapshotRef.current = snapshot
    setActiveProjectId(snapshot.project.id)
    setNodes(snapshot.nodes.map((node) => ({
      id: node.id,
      type: 'graphNode',
      position: node.position,
      style: { width: node.size.width, height: node.size.height },
      data: {
        graphNode: node,
        isSelected: node.id === selectedNodeId,
        onSelect: setSelectedNodeId,
        onGenerate: handleGenerate,
        onOpenReader: openReader,
        onResize: handleResize
      }
    })))
    setEdges(snapshot.edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      selected: edge.id === selectedEdgeId,
      animated: false,
      style: edge.id === selectedEdgeId
        ? { strokeWidth: 3, stroke: '#7c5af7' }
        : { strokeWidth: 2, stroke: '#3a3f50' }
    })))
    setSelectedNodeId((current) => snapshot.nodes.some((node) => node.id === current) ? current : snapshot.nodes[0]?.id ?? null)
    setSelectedEdgeId((current) => snapshot.edges.some((edge) => edge.id === current) ? current : null)
  }

  async function switchProject(projectId: string) {
    const snapshot = await window.graphChat.openProject(projectId)
    applySnapshot(snapshot)
    setStatus(`Project: ${snapshot.project.name}`)
  }

  async function createProject() {
    setProjectDialog({
      mode: 'create',
      value: `Project ${projects.length + 1}`
    })
  }

  async function submitCreateProject(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const result = await window.graphChat.createProject(trimmed)
    setProjects(result.projects)
    applySnapshot(result.snapshot)
    setProjectDialog(null)
  }

  async function renameProject(project: ProjectRecord) {
    setProjectDialog({
      mode: 'rename',
      projectId: project.id,
      value: project.name
    })
  }

  async function submitRenameProject(projectId: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const result = await window.graphChat.renameProject(projectId, trimmed)
    setProjects(result.projects)
    applySnapshot(result.snapshot)
    setProjectDialog(null)
  }

  async function deleteProject(project: ProjectRecord) {
    if (!confirm(`"${project.name}" を削除しますか？`)) return
    const result = await window.graphChat.deleteProject(project.id)
    setProjects(result.projects)
    applySnapshot(result.snapshot)
  }

  async function addNode(type: NodeType, position?: { x: number; y: number }) {
    if (!activeProjectId) return
    const base = position ?? (selectedNode?.position ?? { x: 120, y: 120 })
    const result = await window.graphChat.createNode({
      projectId: activeProjectId,
      type,
      title: defaultTitle(type),
      position: position ? base : { x: base.x + 40, y: base.y + 160 }
    })
    setProjects(result.projects)
    applySnapshot(result.snapshot)
    setSelectedNodeId(result.node.id)
    setSelectedEdgeId(null)
    setCanvasMenu(null)
    setNodeMenu(null)
    setStatus(`${defaultTitle(type)} node created`)
  }

  async function persistNode(node: GraphNodeRecord) {
    const updated = await window.graphChat.updateNode({
      id: node.id,
      title: node.title,
      content: node.content,
      instruction: node.instruction,
      position: node.position,
      size: node.size,
      model: node.model,
      isGenerated: node.isGenerated
    })
    mutateLocalNode(updated)
  }

  async function handleResize(nodeId: string, input: { position: { x: number; y: number }; size: { width: number; height: number } }) {
    const graphNode = snapshotRef.current?.nodes.find((node) => node.id === nodeId)
    if (!graphNode) return
    const updated = { ...graphNode, position: input.position, size: input.size }
    mutateLocalNode(updated)
    await persistNode(updated)
    setStatus('Node resized')
  }

  async function onConnect(connection: Connection) {
    if (!activeProjectId || !connection.source || !connection.target) return
    try {
      const result = await window.graphChat.createEdge(activeProjectId, connection.source, connection.target)
      setProjects(result.projects)
      applySnapshot(result.snapshot)
      setSelectedNodeId(null)
      setStatus('Connection added')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleGenerate(nodeId: string) {
    if (generation || !activeProjectId) return
    setError(null)
    setStatus('Starting generation...')
    try {
      const result = await window.graphChat.startGeneration({ projectId: activeProjectId, sourceNodeId: nodeId })
      setProjects(result.projects)
      applySnapshot(result.snapshot)
      const created = result.snapshot.nodes.find((node) => node.id === result.targetNodeId)
      if (created) {
        setSelectedNodeId(created.id)
        setGeneration({ generationId: result.generationId, nodeId: created.id })
      }
      setIsModelLoaded(true)
      setStatus(`Generating with ${displayModelName(settings?.selectedModelName ?? 'current model')}...`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function stopGeneration() {
    if (!generation) return
    await window.graphChat.stopGeneration(generation.generationId)
    setStatus('Generation stopped')
    setGeneration(null)
  }

  function openReader(nodeId: string) {
    const snapshot = snapshotRef.current
    if (!snapshot) return
    const content = collectReaderText(nodeId, snapshot.nodes, snapshot.edges)
    const title = snapshot.nodes.find((node) => node.id === nodeId)?.title || 'Reader View'
    setReader({ nodeId, title, content })
  }

  async function exportReader() {
    if (!reader) return
    await window.graphChat.exportReader(reader.title, reader.content)
  }

  function copyReader() {
    if (!reader) return
    void navigator.clipboard.writeText(reader.content)
  }

  async function removeSelected() {
    if (!selectedNode) return
    const result = await window.graphChat.deleteNode(selectedNode.id)
    setProjects(result.projects)
    applySnapshot(result.snapshot)
    setNodeMenu(null)
    setStatus('Node deleted')
  }

  async function removeNode(nodeId: string) {
    const result = await window.graphChat.deleteNode(nodeId)
    setProjects(result.projects)
    applySnapshot(result.snapshot)
    setNodeMenu(null)
    setStatus('Node deleted')
  }

  async function clearNode(nodeId: string) {
    const graphNode = snapshotRef.current?.nodes.find((node) => node.id === nodeId)
    if (!graphNode) return
    const updated = await window.graphChat.updateNode({
      id: nodeId,
      content: '',
      isGenerated: false
    })
    mutateLocalNode(updated)
    if (reader?.nodeId === nodeId) {
      setReader({ ...reader, content: '' })
    }
    setNodeMenu(null)
    setStatus('Node content cleared')
  }

  async function duplicateNode(nodeId: string) {
    const graphNode = snapshotRef.current?.nodes.find((node) => node.id === nodeId)
    if (!graphNode) return
    const result = await window.graphChat.createNode({
      projectId: graphNode.projectId,
      type: graphNode.type,
      title: `${graphNode.title} copy`,
      content: graphNode.content,
      instruction: graphNode.instruction,
      model: graphNode.model,
      isGenerated: false,
      position: { x: graphNode.position.x + 60, y: graphNode.position.y + 60 },
      size: graphNode.size
    })
    setProjects(result.projects)
    applySnapshot(result.snapshot)
    setSelectedNodeId(result.node.id)
    setNodeMenu(null)
    setStatus('Node duplicated')
  }

  async function removeEdge(edgeId: string) {
    if (!activeProjectId) return
    const result = await window.graphChat.deleteEdge(edgeId, activeProjectId)
    setProjects(result.projects)
    applySnapshot(result.snapshot)
    setSelectedEdgeId(null)
    setStatus('Connection removed')
  }

  async function openModelModal() {
    setError(null)
    try {
      const latestSettings = await window.graphChat.listModels()
      setSettings(latestSettings)
      setModelFilter('')
      setIsModelModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleSelectModel(model: ModelOption) {
    setIsModelSwitching(true)
    setError(null)
    setStatus(`Loading model ${displayModelName(model.name)}...`)
    try {
      const result = await window.graphChat.selectModel(model.path)
      setSettings(result.settings)
      setIsModelLoaded(true)
      setIsModelModalOpen(false)
      setStatus(`Model switched to ${displayModelName(model.name)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsModelSwitching(false)
    }
  }

  const handleNodeChanges: OnNodesChange<Node<AppNodeData>> = async (changes) => {
    onNodesChange(changes)
    const positionChanges = changes.filter((change) => change.type === 'position' && change.position && !change.dragging)
    for (const change of positionChanges) {
      const graphNode = snapshotRef.current?.nodes.find((node) => node.id === change.id)
      if (!graphNode || !change.position) continue
      const updated = { ...graphNode, position: change.position }
      mutateLocalNode(updated)
      await persistNode(updated)
    }
  }

  const handleEdgeChanges: OnEdgesChange<Edge> = async (changes) => {
    onEdgesChange(changes)
    for (const change of changes) {
      if (change.type === 'remove' && activeProjectId) {
        await removeEdge(change.id)
      }
      if (change.type === 'select') {
        setSelectedEdgeId(change.selected ? change.id : null)
        if (change.selected) {
          setSelectedNodeId(null)
          setStatus('Connection selected. Press Delete to remove.')
        }
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd' && selectedNode) {
        event.preventDefault()
        void duplicateNode(selectedNode.id)
      }
      if (event.key === 'Delete' && selectedEdgeId) {
        event.preventDefault()
        void removeEdge(selectedEdgeId)
      } else if (event.key === 'Delete' && selectedNode) {
        event.preventDefault()
        void removeSelected()
      }
      if (event.key === 'Escape') {
        setCanvasMenu(null)
        setNodeMenu(null)
        setSelectedEdgeId(null)
        setIsModelModalOpen(false)
        setProjectDialog(null)
        setProjectMenu(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode, selectedEdgeId])

  function mutateLocalNode(updated: GraphNodeRecord) {
    snapshotRef.current = snapshotRef.current ? { ...snapshotRef.current, nodes: snapshotRef.current.nodes.map((node) => node.id === updated.id ? updated : node) } : snapshotRef.current
    setNodes((current) => current.map((node) => node.id === updated.id ? { ...node, position: updated.position, style: { width: updated.size.width, height: updated.size.height }, data: { ...node.data, graphNode: updated, isSelected: updated.id === selectedNodeId } } : node))
  }

  function openCanvasMenu(event: React.MouseEvent) {
    event.preventDefault()
    const bounds = mainRef.current?.getBoundingClientRect()
    const position = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY })
    setCanvasMenu({
      x: bounds ? event.clientX - bounds.left : event.clientX,
      y: bounds ? event.clientY - bounds.top : event.clientY,
      flowX: position.x,
      flowY: position.y
    })
    setNodeMenu(null)
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
  }

  function openNodeMenu(event: React.MouseEvent, nodeId: string) {
    event.preventDefault()
    event.stopPropagation()
    const bounds = mainRef.current?.getBoundingClientRect()
    setSelectedNodeId(nodeId)
    setSelectedEdgeId(null)
    setCanvasMenu(null)
    setNodeMenu({
      x: bounds ? event.clientX - bounds.left : event.clientX,
      y: bounds ? event.clientY - bounds.top : event.clientY,
      nodeId
    })
  }

  const hasNodes = nodes.length > 0
  const nodeMenuNode = nodeMenu ? snapshotRef.current?.nodes.find((node) => node.id === nodeMenu.nodeId) ?? null : null
  const filteredModels = settings?.availableModels.filter((model) => model.name.toLowerCase().includes(modelFilter.toLowerCase())) ?? []

  return (
    <div className="flex h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <header className="relative z-30 h-10 border-b border-[var(--border)] bg-[var(--bg-sidebar)] px-3">
        <div className="relative flex h-full items-center justify-center">
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <IconButton onClick={() => setIsSidebarOpen((current) => !current)} label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'} active={isSidebarOpen}>
              <SidebarToggleIcon className="h-4 w-4" />
            </IconButton>
          </div>
          <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2">
            <IconButton onClick={() => setIsInspectorOpen((current) => !current)} label={isInspectorOpen ? 'Hide inspector' : 'Show inspector'} active={isInspectorOpen}>
              <SidebarToggleIcon className="h-4 w-4 rotate-180" />
            </IconButton>
            {generation && (
              <ToolbarButton onClick={() => void stopGeneration()} label="Stop" />
            )}
          </div>
          <div className="max-w-full">
            <ModelSelectorButton
              onClick={() => void openModelModal()}
              label={settings ? (isModelLoaded ? displayModelName(settings.selectedModelName) : 'Load model') : 'Load model'}
            />
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
      {isSidebarOpen && (
      <aside className="flex w-72 flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div className="text-sm font-semibold tracking-[0.02em] text-[var(--text-dim)]">Projects</div>
          <IconButton onClick={() => void createProject()} label="Create project">
            <NewFolderIcon className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {projects.map((project) => (
            <div key={project.id} className={`relative mb-2 rounded-2xl border px-3 py-3 ${project.id === activeProjectId ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--text)]' : 'border-[var(--border)] bg-[var(--bg-card)]/80 text-[var(--text)]'}`}>
              <div className="flex items-start gap-3">
                <button className="flex-1 text-left" onClick={() => void switchProject(project.id)}>
                  <div className="font-medium">{project.name}</div>
                  <div className={`text-xs ${project.id === activeProjectId ? 'text-[var(--text-dim)]' : 'text-[var(--text-faint)]'}`}>{new Date(project.updatedAt).toLocaleString()}</div>
                </button>
                <button
                  className={`rounded-full border px-3 py-1 text-sm ${project.id === activeProjectId ? 'border-[var(--border-strong)] text-[var(--text)] hover:bg-white/5' : 'border-[var(--border-strong)] text-[var(--text-dim)] hover:bg-white/5'}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    setProjectMenu((current) => current?.projectId === project.id ? null : { projectId: project.id })
                  }}
                >
                  ...
                </button>
              </div>
              {projectMenu?.projectId === project.id && (
                <div
                  className="absolute right-3 top-12 z-30 w-36 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-card)] p-1 text-sm text-[var(--text)] shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <MenuAction label="Rename" onClick={() => void renameProject(project)} />
                  <MenuAction label="Delete" onClick={() => void deleteProject(project)} />
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>
      )}

      <main ref={mainRef} className="relative flex-1">
        <div className="absolute bottom-4 left-4 z-20 rounded-full border border-[var(--border-strong)] bg-[rgba(28,31,43,0.92)] px-4 py-2 text-sm shadow-sm">
          <span>{status}</span>
          {settings && <span className="ml-3 text-[var(--text-dim)]">{settings.llamaModelAlias}</span>}
        </div>
        {error && <div className="absolute right-4 top-4 z-20 max-w-md rounded-2xl border border-red-500/40 bg-red-950/70 px-4 py-3 text-sm text-red-200 shadow">{error}</div>}
        {!hasNodes && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-10">
            <div className="max-w-xl rounded-[2rem] border border-[var(--border-strong)] bg-[rgba(17,19,24,0.9)] p-8 shadow-xl backdrop-blur-sm">
              <div className="text-xs uppercase tracking-[0.3em] text-[var(--text-dim)]">Getting Started</div>
              <h2 className="mt-2 font-serif text-3xl font-semibold">最初のノードを置いて流れを作り始めます。</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-dim)]">上部ボタンかキャンバス右クリックでノードを追加できます。`context` と `instruction` を `text` の上流につないで、生成の文脈を組み立てていきます。</p>
            </div>
          </div>
        )}
        {canvasMenu && (
          <div
            className="absolute z-30 w-52 rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-card)] p-2 shadow-2xl"
            style={{ left: canvasMenu.x, top: canvasMenu.y }}
            onClick={(event) => event.stopPropagation()}
          >
            <MenuAction label="Add Text" onClick={() => void addNode('text', { x: canvasMenu.flowX, y: canvasMenu.flowY })} />
            <MenuAction label="Add Context" onClick={() => void addNode('context', { x: canvasMenu.flowX, y: canvasMenu.flowY })} />
            <MenuAction label="Add Instruction" onClick={() => void addNode('instruction', { x: canvasMenu.flowX, y: canvasMenu.flowY })} />
          </div>
        )}
        {nodeMenu && nodeMenuNode && (
          <div
            className="absolute z-30 w-56 rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-card)] p-2 shadow-2xl"
            style={{ left: nodeMenu.x, top: nodeMenu.y }}
            onClick={(event) => event.stopPropagation()}
          >
            {nodeMenuNode.type === 'text' && (
              <MenuAction
                label="Open Reader"
                onClick={() => {
                  openReader(nodeMenuNode.id)
                  setNodeMenu(null)
                  setStatus('Reader opened')
                }}
              />
            )}
            {nodeMenuNode.type === 'text' && (
              <MenuAction
                label="Generate From Here"
                onClick={() => {
                  void handleGenerate(nodeMenuNode.id)
                  setNodeMenu(null)
                }}
              />
            )}
            <MenuAction
              label="Duplicate Node"
              onClick={() => {
                void duplicateNode(nodeMenuNode.id)
              }}
            />
            <MenuAction
              label="Clear Content"
              onClick={() => {
                void clearNode(nodeMenuNode.id)
              }}
            />
            <MenuAction
              label="Delete Node"
              onClick={() => {
                void removeNode(nodeMenuNode.id)
              }}
            />
          </div>
        )}
        {isModelModalOpen && settings && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/35 p-6" onClick={() => !isModelSwitching && setIsModelModalOpen(false)}>
            <div className="w-full max-w-2xl rounded-[2rem] border border-[var(--border-strong)] bg-[var(--bg-sidebar)] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-[var(--text-dim)]">Model Picker</div>
                  <h3 className="mt-2 font-serif text-2xl font-semibold">`models/` の GGUF を選択</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-dim)]">小さいモデルほど生成は速くなりやすいです。選択すると llama.cpp サーバーを次回生成時の設定で切り替えます。</p>
                </div>
                <button className="rounded-full border border-[var(--border-strong)] px-3 py-1 text-sm text-[var(--text)]" onClick={() => setIsModelModalOpen(false)} disabled={isModelSwitching}>Close</button>
              </div>
              <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {settings.availableModels.map((model) => {
                  const isActive = model.path === settings.selectedModelPath
                  return (
                    <button
                      key={model.path}
                      className={`block w-full rounded-3xl border px-5 py-4 text-left transition ${isActive ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--text)]' : 'border-[var(--border-strong)] bg-[rgba(28,31,43,0.84)] text-[var(--text)] hover:border-[var(--accent-border)] hover:bg-white/5'}`}
                      onClick={() => void handleSelectModel(model)}
                      disabled={isModelSwitching || generation !== null}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <CpuIcon className="h-4 w-4 text-sky-300" />
                          <div className="font-medium">{displayModelName(model.name)}</div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs ${isActive ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-white/5 text-[var(--text-dim)]'}`}>{isActive ? 'current' : 'switch'}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
              {generation && <p className="mt-4 text-sm text-amber-300">生成中はモデルを切り替えられません。</p>}
            </div>
          </div>
        )}
        {projectDialog && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/35 p-6" onClick={() => setProjectDialog(null)}>
            <div className="w-full max-w-md rounded-[2rem] border border-[var(--border-strong)] bg-[var(--bg-sidebar)] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="text-xs uppercase tracking-[0.28em] text-[var(--text-dim)]">Project</div>
              <h3 className="mt-2 font-serif text-2xl font-semibold">{projectDialog.mode === 'create' ? '新しいプロジェクト' : 'プロジェクト名を変更'}</h3>
              <input
                autoFocus
                value={projectDialog.value}
                onChange={(event) => setProjectDialog((current) => current ? { ...current, value: event.target.value } : current)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    if (projectDialog.mode === 'create') {
                      void submitCreateProject(projectDialog.value)
                    } else if (projectDialog.projectId) {
                      void submitRenameProject(projectDialog.projectId, projectDialog.value)
                    }
                  }
                }}
                className="mt-4 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 outline-none"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm text-[var(--text)]" onClick={() => setProjectDialog(null)}>Cancel</button>
                <button
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-white hover:bg-[var(--accent-hover)]"
                  onClick={() => {
                    if (projectDialog.mode === 'create') {
                      void submitCreateProject(projectDialog.value)
                    } else if (projectDialog.projectId) {
                      void submitRenameProject(projectDialog.projectId, projectDialog.value)
                    }
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          proOptions={{ hideAttribution: true }}
          fitView
          onPaneContextMenu={openCanvasMenu}
            onPaneClick={() => {
              setCanvasMenu(null)
              setNodeMenu(null)
              setSelectedNodeId(null)
              setSelectedEdgeId(null)
            }}
          onNodesChange={handleNodeChanges}
          onEdgesChange={handleEdgeChanges}
          onConnect={(connection) => void onConnect(connection)}
          onNodeClick={(_, node) => {
            setSelectedNodeId(node.id)
            setSelectedEdgeId(null)
            setCanvasMenu(null)
            setNodeMenu(null)
          }}
          onNodeContextMenu={(event, node) => {
            openNodeMenu(event, node.id)
          }}
          onEdgeClick={(_, edge) => {
            setSelectedNodeId(null)
            setSelectedEdgeId(edge.id)
            setCanvasMenu(null)
            setNodeMenu(null)
            setStatus('Connection selected. Press Delete to remove.')
          }}
          onEdgeDoubleClick={(_, edge) => {
            void removeEdge(edge.id)
          }}
          defaultEdgeOptions={{ style: { strokeWidth: 2, stroke: '#3a3f50' } }}
        >
          <MiniMap pannable zoomable style={{ backgroundColor: '#111318' }} />
          <Background gap={18} color="#1f2937" />
          <Controls />
        </ReactFlow>
      </main>

      {isInspectorOpen && (
      <section className="flex w-[380px] flex-col border-l border-[var(--border)] bg-[var(--bg-sidebar)]">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-serif text-xl font-semibold">{selectedNode?.title || 'Node Editor'}</h2>
          <p className="mt-1 text-sm text-[var(--text-dim)]">{selectedNode ? selectedNode.type : 'Select a node'}</p>
        </div>
        {selectedNode ? (
          <NodeEditor
            node={selectedNode}
            disabled={generation?.nodeId === selectedNode.id}
            currentModelName={settings?.selectedModelName ?? null}
            onChange={(updated) => {
              mutateLocalNode(updated)
              void persistNode(updated)
            }}
            onDuplicate={() => void duplicateNode(selectedNode.id)}
            onClear={() => void clearNode(selectedNode.id)}
            onDelete={() => void removeSelected()}
          />
        ) : (
          <div className="p-5 text-sm text-[var(--text-dim)]">Select a node to edit. Connections can be removed by clicking an edge and pressing Delete.</div>
        )}
        {reader && (
          <div className="border-t border-[var(--border)] bg-[rgba(28,31,43,0.84)] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold">{reader.title}</h3>
              <button className="text-sm text-[var(--text-dim)]" onClick={() => setReader(null)}>Close</button>
            </div>
            <div className="mb-3 flex gap-2">
              <ToolbarButton onClick={copyReader} label="Copy" />
              <ToolbarButton onClick={() => void exportReader()} label="Export" />
            </div>
            <textarea readOnly value={reader.content} className="h-56 w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--bg)] p-3 text-sm text-[var(--text)]" />
          </div>
          )}
        </section>
      )}
      </div>
    </div>
  )
}

function GraphNodeCard({ data }: { data: AppNodeData }) {
  const node = data.graphNode
  const colors = {
    text: 'border-[var(--border-strong)] bg-[var(--bg-card)]',
    context: 'border-[var(--accent-border)] bg-[rgba(124,90,247,0.08)]',
    instruction: 'border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.08)]'
  } as const

  return (
    <div className={`relative h-full w-full rounded-3xl border-2 px-4 py-3 shadow-lg shadow-black/30 transition ${colors[node.type]} ${data.isSelected ? 'ring-4 ring-[var(--accent-border)]' : ''}`}>
      <NodeResizeControl
        position="bottom-right"
        className={`${data.isSelected ? 'opacity-100' : 'opacity-0 pointer-events-none'} !h-4 !w-4 !rounded-md !border !border-[var(--text-faint)] !bg-[var(--text)] shadow`}
        minWidth={220}
        minHeight={140}
        color="#44403c"
        onResizeEnd={(_event, params) => {
          data.onResize(node.id, {
            position: { x: params.x, y: params.y },
            size: { width: params.width, height: params.height }
          })
        }}
      >
        <div className="h-full w-full rounded-md bg-white" />
      </NodeResizeControl>
      <Handle type="target" position={Position.Left} className="!h-4 !w-4 !border-2 !border-[var(--text-faint)] !bg-[var(--text)]" />
      <Handle type="source" position={Position.Right} className="!h-4 !w-4 !border-2 !border-[var(--text-faint)] !bg-[var(--text)]" />
      <div className="flex h-full flex-col">
        <div className="mb-2 flex items-start justify-between gap-2">
          <button className="nodrag nopan text-left" onClick={() => data.onSelect(node.id)}>
            <div className="text-xs uppercase tracking-[0.24em] text-[var(--text-dim)]">{node.type}</div>
            <div className="font-serif text-lg font-semibold">{node.title || 'Untitled'}</div>
          </button>
          {node.type === 'text' && <button className="nodrag nopan rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--accent-hover)]" onClick={() => data.onGenerate(node.id)}>生成 -&gt;</button>}
        </div>
        <div className="flex-1 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-[var(--text)]">{node.content || 'No content yet.'}</div>
        <div className="mt-3 flex justify-between text-xs text-[var(--text-dim)]">
          <button className="nodrag nopan" onClick={() => data.onOpenReader(node.id)}>Reader</button>
          <span>{Math.round(node.size.width)} x {Math.round(node.size.height)}</span>
        </div>
      </div>
    </div>
  )
}

function NodeEditor({
  node,
  disabled,
  currentModelName,
  onChange,
  onDuplicate,
  onClear,
  onDelete
}: {
  node: GraphNodeRecord
  disabled: boolean
  currentModelName: string | null
  onChange: (node: GraphNodeRecord) => void
  onDuplicate: () => void
  onClear: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex-1 overflow-y-auto p-5">
      <label className="mb-4 block">
        <div className="mb-2 text-sm font-medium text-[var(--text-dim)]">Title</div>
        <input value={node.title} disabled={disabled} onChange={(event) => onChange({ ...node, title: event.target.value })} className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 outline-none" />
      </label>
      <label className="mb-4 block">
        <div className="mb-2 text-sm font-medium text-[var(--text-dim)]">Content</div>
        <textarea value={node.content} disabled={disabled} onChange={(event) => onChange({ ...node, content: event.target.value })} className="h-72 w-full rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 outline-none" />
      </label>
      {node.type !== 'instruction' && (
        <label className="mb-4 block">
          <div className="mb-2 text-sm font-medium text-[var(--text-dim)]">Local Instruction</div>
          <textarea value={node.instruction ?? ''} disabled={disabled} onChange={(event) => onChange({ ...node, instruction: event.target.value })} className="h-40 w-full rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 outline-none" />
        </label>
      )}
      <div className="text-xs text-[var(--text-dim)]">Current model: {currentModelName ? displayModelName(currentModelName) : (node.model || 'default')}</div>
      <button className="mt-6 w-full rounded-2xl border border-[var(--border-strong)] px-4 py-3 text-sm text-[var(--text)] hover:bg-white/5" onClick={onDuplicate} disabled={disabled}>Duplicate Node</button>
      <button className="mt-6 w-full rounded-2xl border border-[var(--border-strong)] px-4 py-3 text-sm text-[var(--text)] hover:bg-white/5" onClick={onClear} disabled={disabled}>Clear Content</button>
      <button className="mt-6 w-full rounded-2xl border border-red-500/40 px-4 py-3 text-sm text-red-300 hover:bg-red-950/40" onClick={onDelete}>Delete Node</button>
    </div>
  )
}

function ToolbarButton({ onClick, label }: { onClick: () => void; label: string }) {
  return <button className="rounded-full border border-[var(--border-strong)] bg-[rgba(28,31,43,0.92)] px-4 py-2 text-sm font-medium text-[var(--text)] shadow-sm hover:bg-white/5" onClick={onClick}>{label}</button>
}

function IconButton({ onClick, label, children, active = false }: { onClick: () => void; label: string; children: ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`flex h-[30px] w-[30px] items-center justify-center rounded-[10px] text-[var(--text-faint)] transition hover:bg-white/5 hover:text-[var(--text-dim)] ${active ? 'text-[var(--accent)]' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function ModelSelectorButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      className="flex max-w-[480px] items-center gap-2 rounded-[8px] border border-[var(--border-strong)] bg-white/5 px-3.5 py-1.5 text-[13px] font-medium text-[var(--text-dim)] transition hover:border-[var(--accent)] hover:bg-white/10 hover:text-[var(--text)]"
      onClick={onClick}
    >
      <CpuIcon className="h-[15px] w-[15px] shrink-0" />
      <span className="truncate text-center">{label}</span>
      <ChevronDownIcon className="h-3 w-3 shrink-0" />
    </button>
  )
}

function CpuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 3v2" />
      <path d="M15 3v2" />
      <path d="M9 19v2" />
      <path d="M15 19v2" />
      <path d="M3 9h2" />
      <path d="M3 14h2" />
      <path d="M19 9h2" />
      <path d="M19 14h2" />
      <rect x="5" y="5" width="14" height="14" rx="3" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
    </svg>
  )
}

function SidebarToggleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M9 5v14" />
      <path d="M6 9l-2 3 2 3" />
    </svg>
  )
}

function NewFolderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <path d="M12 11v6" />
      <path d="M9 14h6" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function MenuAction({ onClick, label }: { onClick: () => void; label: string }) {
  return <button className="block w-full rounded-2xl px-4 py-3 text-left text-sm text-[var(--text)] hover:bg-white/5" onClick={onClick}>{label}</button>
}

function defaultTitle(type: NodeType): string {
  switch (type) {
    case 'context':
      return 'Context'
    case 'instruction':
      return 'Instruction'
    default:
      return 'Text'
  }
}

function displayModelName(modelName: string): string {
  return modelName.split(/[\\/]/).pop() ?? modelName
}

function collectReaderText(nodeId: string, nodes: GraphNodeRecord[], edges: GraphEdgeRecord[]): string {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const parentMap = new Map<string, string[]>()
  for (const edge of edges) {
    const parents = parentMap.get(edge.targetId) ?? []
    parents.push(edge.sourceId)
    parentMap.set(edge.targetId, parents)
  }
  return traverse(nodeId, nodeMap, parentMap, new Set<string>())
    .filter((node) => node.type === 'text')
    .map((node) => node.content.trim())
    .filter(Boolean)
    .join('\n\n')
}

function traverse(nodeId: string, nodeMap: Map<string, GraphNodeRecord>, parentMap: Map<string, string[]>, visited: Set<string>): GraphNodeRecord[] {
  if (visited.has(nodeId)) return []
  visited.add(nodeId)
  const node = nodeMap.get(nodeId)
  if (!node) return []
  const parents = (parentMap.get(nodeId) ?? []).flatMap((parentId) => traverse(parentId, nodeMap, parentMap, visited))
  return [...parents, node]
}

export default App
