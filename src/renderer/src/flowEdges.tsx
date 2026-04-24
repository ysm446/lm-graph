import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import type { NodeInputHandle } from '../../main/types'

function RoundedSmoothStepEdge({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, markerStart }: EdgeProps) {
  const [path] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 40 })
  return <BaseEdge path={path} style={style} markerEnd={markerEnd} markerStart={markerStart} />
}

export const edgeTypes = { smoothstep: RoundedSmoothStepEdge }

export function edgeStyleForHandle(handle: NodeInputHandle | null) {
  if (handle === 'context') {
    return { strokeWidth: 2.6, stroke: '#6170d8', opacity: 0.84 }
  }
  if (handle === 'instruction') {
    return { strokeWidth: 2.6, stroke: '#a267c8', opacity: 0.84 }
  }
  if (handle === 'image') {
    return { strokeWidth: 2.8, stroke: '#4a8fcb', opacity: 0.9 }
  }
  return { strokeWidth: 4, stroke: '#6a728f', opacity: 0.84 }
}

export function selectedEdgeStyleForHandle(handle: NodeInputHandle | null) {
  if (handle === 'context') {
    return { strokeWidth: 3.5, stroke: '#7b89f0', opacity: 1 }
  }
  if (handle === 'instruction') {
    return { strokeWidth: 3.5, stroke: '#bf79df', opacity: 1 }
  }
  if (handle === 'image') {
    return { strokeWidth: 3.8, stroke: '#79afe8', opacity: 1 }
  }
  return { strokeWidth: 4.5, stroke: '#8b95b8', opacity: 1 }
}
