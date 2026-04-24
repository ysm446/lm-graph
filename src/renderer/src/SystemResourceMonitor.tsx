import { useEffect, useState } from 'react'
import { Panel } from '@xyflow/react'

type SystemResources = {
  cpuUsage: number
  ramUsed: number
  ramTotal: number
  gpuUsage: number | null
  vramUsed: number | null
  vramTotal: number | null
}

function ResourceBar({ label, pct, detail }: { label: string; pct: number; detail: string }) {
  const clampedPct = Math.min(100, Math.max(0, pct))
  const barColor = clampedPct > 85 ? '#ef4444' : clampedPct > 65 ? '#f97316' : 'var(--accent)'
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-medium opacity-50">{label}</span>
      <div className="h-[3px] w-10 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${clampedPct}%`, backgroundColor: barColor }}
        />
      </div>
      <span className="text-[10px] tabular-nums opacity-60">{detail}</span>
    </div>
  )
}

function fmtBytes(bytes: number): string {
  const gb = bytes / (1024 ** 3)
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 ** 2)).toFixed(0)} MB`
}

function fmtMb(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`
}

export function SystemResourceMonitor() {
  const [res, setRes] = useState<SystemResources | null>(null)

  useEffect(() => {
    const off = window.graphChat.onSystemResources((payload) => setRes(payload))
    return off
  }, [])

  if (!res) return null

  const hasGpu = res.gpuUsage !== null
  const hasVram = res.vramUsed !== null && res.vramTotal !== null

  return (
    <Panel position="bottom-right">
      <div className="mb-1 mr-1 flex items-center gap-3 rounded-md border border-white/10 bg-black/45 px-3 py-2 text-[var(--text)] backdrop-blur-sm">
        <ResourceBar label="CPU" pct={res.cpuUsage} detail={`${res.cpuUsage}%`} />
        <ResourceBar
          label="RAM"
          pct={(res.ramUsed / res.ramTotal) * 100}
          detail={`${fmtBytes(res.ramUsed)} / ${fmtBytes(res.ramTotal)}`}
        />
        {hasGpu && <ResourceBar label="GPU" pct={res.gpuUsage!} detail={`${res.gpuUsage}%`} />}
        {hasVram && (
          <ResourceBar
            label="VRAM"
            pct={(res.vramUsed! / res.vramTotal!) * 100}
            detail={`${fmtMb(res.vramUsed!)} / ${fmtMb(res.vramTotal!)}`}
          />
        )}
      </div>
    </Panel>
  )
}
