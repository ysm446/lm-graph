import type { GraphNodeRecord } from '../../main/types'

export function getImageAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return window.graphChat.toImageDataUrl(path)
}

export function getImagePreviewUrl(node: GraphNodeRecord): string | null {
  if (!node.image) return null
  if (node.image.thumbnailDataUrl) return node.image.thumbnailDataUrl
  return getImageAssetUrl(node.image.thumbnailPath ?? node.image.path)
}
