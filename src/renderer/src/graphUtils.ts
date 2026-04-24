import type { GraphEdgeRecord, GraphNodeRecord, NodeInputHandle, NodeType, ProjectSnapshot } from '../../main/types'
import { GRID_SIZE } from './constants'

type FlowNodeLike = {
  id: string
  position: { x: number; y: number }
  width?: number | null
  height?: number | null
}

type MiniMapNodeLike = {
  data?: {
    graphNode?: GraphNodeRecord
  }
}

export function defaultTitle(type: NodeType): string {
  switch (type) {
    case 'context':
      return 'Context'
    case 'instruction':
      return 'Instruction'
    case 'image':
      return 'Image'
    default:
      return 'Text'
  }
}

export function collectDownstreamTextNodes(sourceNodeId: string, nodes: GraphNodeRecord[], edges: GraphEdgeRecord[]): string[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const adjacency = new Map<string, string[]>()
  for (const edge of edges) {
    const targets = adjacency.get(edge.sourceId) ?? []
    targets.push(edge.targetId)
    adjacency.set(edge.sourceId, targets)
  }

  const visited = new Set<string>([sourceNodeId])
  const queue = [sourceNodeId]
  const textNodes: string[] = []
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const targetId of adjacency.get(current) ?? []) {
      if (visited.has(targetId)) continue
      visited.add(targetId)
      if (nodeMap.get(targetId)?.type === 'text') {
        textNodes.push(targetId)
        queue.push(targetId)
      }
    }
  }

  return sortTextNodesByDependencies(textNodes, edges)
}

function sortTextNodesByDependencies(textNodes: string[], edges: GraphEdgeRecord[]): string[] {
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()
  const nodeSet = new Set(textNodes)
  for (const id of textNodes) {
    inDegree.set(id, 0)
    adjacency.set(id, [])
  }
  for (const edge of edges) {
    if (!nodeSet.has(edge.sourceId) || !nodeSet.has(edge.targetId)) continue
    adjacency.get(edge.sourceId)!.push(edge.targetId)
    inDegree.set(edge.targetId, (inDegree.get(edge.targetId) ?? 0) + 1)
  }

  const sorted: string[] = []
  const ready = textNodes.filter((id) => inDegree.get(id) === 0)
  while (ready.length > 0) {
    const id = ready.shift()!
    sorted.push(id)
    for (const next of adjacency.get(id) ?? []) {
      const nextDegree = (inDegree.get(next) ?? 1) - 1
      inDegree.set(next, nextDegree)
      if (nextDegree === 0) ready.push(next)
    }
  }
  return sorted
}

export function displayNodeTypeLabel(type: NodeType, isLocal = false): string {
  if (type === 'instruction') return isLocal ? 'local instruction' : 'global instruction'
  if (type === 'context') return isLocal ? 'local context' : 'global context'
  if (type === 'image') return 'image'
  return type
}

export function getMiniMapNodeColor(node: MiniMapNodeLike): string {
  const graphNode = node.data?.graphNode
  const type = graphNode?.type
  if (type === 'context') return graphNode?.isLocal ? '#2e4f82' : '#1e3a6b'
  if (type === 'instruction') return graphNode?.isLocal ? '#6c3d63' : '#5b2d5d'
  if (type === 'image') return '#4a8fcb'
  return '#3f4150'
}

export function snapPositionToGrid(position: { x: number; y: number }) {
  return {
    x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(position.y / GRID_SIZE) * GRID_SIZE
  }
}

export function snapSizeToGrid(size: { width: number; height: number }) {
  return {
    width: Math.max(GRID_SIZE, Math.round(size.width / GRID_SIZE) * GRID_SIZE),
    height: Math.max(GRID_SIZE, Math.round(size.height / GRID_SIZE) * GRID_SIZE)
  }
}

export function normalizeNodeBounds(
  bounds: { position: { x: number; y: number }; size: { width: number; height: number } },
  shouldSnap: boolean
) {
  if (!shouldSnap) return bounds
  return {
    position: snapPositionToGrid(bounds.position),
    size: snapSizeToGrid(bounds.size)
  }
}

export function normalizePosition(position: { x: number; y: number }, shouldSnap: boolean) {
  return shouldSnap ? snapPositionToGrid(position) : position
}

export function buildSnapshotFromCanvas(snapshot: ProjectSnapshot, flowNodes: FlowNodeLike[], shouldSnap: boolean): ProjectSnapshot {
  const flowNodeMap = new Map(flowNodes.map((node) => [node.id, node]))
  return {
    ...snapshot,
    nodes: snapshot.nodes.map((node) => {
      const flowNode = flowNodeMap.get(node.id)
      if (!flowNode) return node
      return {
        ...node,
        position: normalizePosition(flowNode.position, shouldSnap),
        size: {
          width: typeof flowNode.width === 'number' ? flowNode.width : node.size.width,
          height: typeof flowNode.height === 'number' ? flowNode.height : node.size.height
        }
      }
    })
  }
}

export function wouldCreateCycle(sourceId: string, targetId: string, edges: GraphEdgeRecord[]): boolean {
  const childMap = new Map<string, string[]>()
  for (const edge of edges) {
    const children = childMap.get(edge.sourceId) ?? []
    children.push(edge.targetId)
    childMap.set(edge.sourceId, children)
  }

  const stack = [targetId]
  const visited = new Set<string>()
  while (stack.length > 0) {
    const nodeId = stack.pop()
    if (!nodeId || visited.has(nodeId)) continue
    if (nodeId === sourceId) return true
    visited.add(nodeId)
    for (const childId of childMap.get(nodeId) ?? []) stack.push(childId)
  }
  return false
}

export function resolveTargetHandleForEdge(edge: GraphEdgeRecord, nodes: GraphNodeRecord[] | Map<string, GraphNodeRecord>): NodeInputHandle | null {
  if (edge.targetHandle) return edge.targetHandle
  const nodeMap = nodes instanceof Map ? nodes : new Map(nodes.map((node) => [node.id, node]))
  const sourceType = nodeMap.get(edge.sourceId)?.type
  return sourceType ? defaultTargetHandleForNodeType(sourceType) : null
}

export function defaultTargetHandleForNodeType(type: NodeType): NodeInputHandle {
  if (type === 'text') return 'text'
  if (type === 'context') return 'context'
  if (type === 'image') return 'image'
  return 'instruction'
}

export function targetHandleLabel(handle: NodeInputHandle): string {
  if (handle === 'text') return 'Text'
  if (handle === 'context') return 'Context'
  if (handle === 'image') return 'Image'
  return 'Instruction'
}
