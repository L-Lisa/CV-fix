'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { updateCVSettings } from '@/lib/actions/cv'
import type { CVLayout } from '@/types'

const LAYOUTS: Array<{ value: CVLayout; label: string; description: string }> = [
  { value: 1, label: 'Layout 1', description: 'Enkel, svartvit' },
  { value: 2, label: 'Layout 2', description: 'Färgad rubrik' },
  { value: 3, label: 'Layout 3', description: 'Med sidofält' },
]

const PRESET_COLORS = [
  { hex: '#2563eb', label: 'Blå' },
  { hex: '#16a34a', label: 'Grön' },
  { hex: '#dc2626', label: 'Röd' },
  { hex: '#9333ea', label: 'Lila' },
  { hex: '#d97706', label: 'Amber' },
  { hex: '#0f172a', label: 'Mörkblå' },
]

interface Props {
  cvId: string
  activeLayout: CVLayout
  accentColor: string
}

export default function LayoutPicker({ cvId, activeLayout, accentColor }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [localColor, setLocalColor] = useState(accentColor)

  async function handleSelectLayout(layout: CVLayout) {
    if (layout === activeLayout || pending) return
    setPending(true)
    await updateCVSettings(cvId, layout, localColor)
    router.refresh()
    setPending(false)
  }

  async function handleColorChange(color: string) {
    if (color === localColor || pending) return
    setLocalColor(color)
    setPending(true)
    await updateCVSettings(cvId, activeLayout, color)
    router.refresh()
    setPending(false)
  }

  return (
    <div className="space-y-2">
      {LAYOUTS.map(({ value, label, description }) => (
        <button
          key={value}
          type="button"
          disabled={pending}
          onClick={() => handleSelectLayout(value)}
          className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-sm transition-colors disabled:opacity-60 ${
            activeLayout === value
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 text-gray-700 hover:border-gray-400'
          }`}
        >
          <span className="font-medium">{label}</span>
          <span className={activeLayout === value ? 'text-gray-300' : 'text-gray-400'}>
            {description}
          </span>
        </button>
      ))}

      {/* Accent color picker — only relevant for Layout 2 */}
      {activeLayout === 2 && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">Accentfärg</p>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map(({ hex, label }) => (
              <button
                key={hex}
                type="button"
                disabled={pending}
                title={label}
                onClick={() => handleColorChange(hex)}
                className={`h-6 w-6 rounded-full border-2 transition-transform disabled:opacity-60 ${
                  localColor === hex
                    ? 'border-gray-900 scale-110'
                    : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: hex }}
                aria-label={label}
                aria-pressed={localColor === hex}
              />
            ))}
            {/* Custom color — fires on commit (mouseup / Enter), not on every drag tick */}
            <label
              className="relative h-6 w-6 cursor-pointer rounded-full border-2 overflow-hidden"
              style={{
                borderColor: PRESET_COLORS.some((p) => p.hex === localColor)
                  ? 'transparent'
                  : '#111827',
              }}
              title="Anpassad färg"
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                }}
              />
              <input
                type="color"
                className="sr-only"
                value={localColor}
                disabled={pending}
                onChange={(e) => setLocalColor(e.target.value)}
                onBlur={(e) => handleColorChange(e.target.value)}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
