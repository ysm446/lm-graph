import type { ModelOption } from '../../main/types'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function displayModelName(modelName: string): string {
  return modelName.split(/[\\/]/).pop() ?? modelName
}

export function estimateTokenCount(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0

  const segments = trimmed.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]|[A-Za-z0-9]+(?:['_-][A-Za-z0-9]+)*|[^\s]/gu) ?? []
  let total = 0

  for (const segment of segments) {
    if (/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(segment)) {
      total += 1
      continue
    }
    if (/^[A-Za-z0-9]+(?:['_-][A-Za-z0-9]+)*$/u.test(segment)) {
      total += Math.max(1, Math.ceil(segment.length / 4))
      continue
    }
    total += 1
  }

  return total
}

export function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
}

export function getModelParameterLabel(model: ModelOption): string | null {
  return model.metadata.parameterLabel
}

export function getModelQuantizationLabel(model: ModelOption): string | null {
  return model.metadata.quantizationLabel
}

export function formatModelSize(sizeBytes: number): string {
  const gib = sizeBytes / 1024 ** 3
  return `${gib.toFixed(2)} GB`
}

export function formatImageDimensions(width: number | null | undefined, height: number | null | undefined): string | null {
  if (!width || !height) return null
  return `${width} x ${height}`
}
