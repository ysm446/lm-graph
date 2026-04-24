import type { CSSProperties } from 'react'
import type { ProofreadPreset, TextStylePreset, TextStyleTarget } from '../../main/types'

export const DEFAULT_PROOFREAD_SYSTEM_PROMPT = 'あなたは校正者です。説明は付けず、修正後の文章だけを返してください。Markdown は使わず、余計なコメントも付けないでください。元の言語と文体は維持してください。'

export const PROOFREAD_PRESETS: Record<Exclude<ProofreadPreset, 'custom'>, { label: string; description: string; prompt: string }> = {
  light: {
    label: 'Light',
    description: 'Minimal corrections for typos and awkward phrasing.',
    prompt: 'あなたは日本語の校正者です。元の意味と文体をできるだけ保ちながら、誤字脱字、表記ゆれ、不自然な言い回しだけを最小限に修正してください。説明は付けず、修正後の文章だけを返してください。'
  },
  standard: {
    label: 'Standard',
    description: 'Natural cleanup while preserving meaning and tone.',
    prompt: 'あなたは優秀な日本語エディタです。文章の意味と筆者の意図を保ったまま、より自然で読みやすい日本語に整えてください。必要に応じて語順や表現を調整し、不自然な言い回し、冗長さ、重複を改善してください。説明は付けず、修正後の文章だけを返してください。Markdown は使わないでください。'
  },
  aggressive: {
    label: 'Aggressive',
    description: 'More active rewriting for clarity and flow.',
    prompt: 'あなたはプロの編集者です。元の意図を保ちながら、文章をより明快で洗練された日本語に書き直してください。冗長な表現は簡潔にし、曖昧な箇所は自然な範囲で補い、全体の流れが良くなるように整えてください。説明は不要です。完成した文章だけを返してください。Markdown は使わないでください。'
  }
}

export const DEFAULT_LEFT_SIDEBAR_WIDTH = 288
export const DEFAULT_SETTINGS_PANEL_WIDTH = 340
export const DEFAULT_RIGHT_INSPECTOR_WIDTH = 520
export const MIN_LEFT_SIDEBAR_WIDTH = 220
export const MAX_LEFT_SIDEBAR_WIDTH = 520
export const MIN_RIGHT_INSPECTOR_WIDTH = 380
export const MAX_RIGHT_INSPECTOR_WIDTH = 840
export const GRID_SIZE = 20
export const DEFAULT_TITLE_FONT_SIZE = 18
export const DEFAULT_CONTENT_FONT_SIZE = 14

export type GeneralSectionKey = 'context' | 'interface' | 'textStyle' | 'editing' | 'debug'

export const TEXT_STYLE_PRESETS: Record<TextStylePreset, { label: string; description: string; titleFamily: string; titleWeight: number; titleLetterSpacing: string; contentFamily: string; contentWeight: number; contentLineHeight: number; contentLetterSpacing: string }> = {
  standard: {
    label: 'Standard',
    description: 'Balanced default for general work and notes.',
    titleFamily: '"Georgia", "Times New Roman", serif',
    titleWeight: 600,
    titleLetterSpacing: '0em',
    contentFamily: '"Segoe UI", "Noto Sans JP", sans-serif',
    contentWeight: 400,
    contentLineHeight: 1.65,
    contentLetterSpacing: '0em'
  },
  business: {
    label: 'Business',
    description: 'Clean and structured for business writing and planning.',
    titleFamily: '"Segoe UI", "Noto Sans JP", sans-serif',
    titleWeight: 700,
    titleLetterSpacing: '0.01em',
    contentFamily: '"Segoe UI", "Noto Sans JP", sans-serif',
    contentWeight: 400,
    contentLineHeight: 1.58,
    contentLetterSpacing: '0.005em'
  },
  reading: {
    label: 'Reading',
    description: 'Relaxed spacing for long reading sessions.',
    titleFamily: '"Yu Mincho", "Hiragino Mincho ProN", "Times New Roman", serif',
    titleWeight: 700,
    titleLetterSpacing: '0.01em',
    contentFamily: '"Yu Mincho", "Hiragino Mincho ProN", "Times New Roman", serif',
    contentWeight: 400,
    contentLineHeight: 1.82,
    contentLetterSpacing: '0.01em'
  },
  dense: {
    label: 'Dense',
    description: 'Tighter spacing when information density matters.',
    titleFamily: '"Segoe UI", "Noto Sans JP", sans-serif',
    titleWeight: 650,
    titleLetterSpacing: '0em',
    contentFamily: '"Segoe UI", "Noto Sans JP", sans-serif',
    contentWeight: 400,
    contentLineHeight: 1.45,
    contentLetterSpacing: '-0.005em'
  }
}

export function getActiveTextSize(target: TextStyleTarget, titleFontSize: number, contentFontSize: number): number {
  if (target === 'title') return titleFontSize
  if (target === 'content') return contentFontSize
  return Math.round((titleFontSize + contentFontSize) / 2)
}

export function getActiveTextPreset(target: TextStyleTarget, titleTextStylePreset: TextStylePreset, contentTextStylePreset: TextStylePreset): TextStylePreset {
  if (target === 'title') return titleTextStylePreset
  if (target === 'content') return contentTextStylePreset
  return titleTextStylePreset === contentTextStylePreset ? titleTextStylePreset : 'standard'
}

export function getTextStyleCssVars(titlePreset: TextStylePreset, contentPreset: TextStylePreset, titleFontSize: number, contentFontSize: number): CSSProperties {
  const titleConfig = TEXT_STYLE_PRESETS[titlePreset]
  const contentConfig = TEXT_STYLE_PRESETS[contentPreset]
  return {
    '--node-title-font-family': titleConfig.titleFamily,
    '--node-title-font-size': `${titleFontSize}px`,
    '--node-title-font-weight': String(titleConfig.titleWeight),
    '--node-title-letter-spacing': titleConfig.titleLetterSpacing,
    '--node-content-font-family': contentConfig.contentFamily,
    '--node-content-font-size': `${contentFontSize}px`,
    '--node-content-font-weight': String(contentConfig.contentWeight),
    '--node-content-line-height': String(contentConfig.contentLineHeight),
    '--node-content-letter-spacing': contentConfig.contentLetterSpacing
  } as CSSProperties
}
