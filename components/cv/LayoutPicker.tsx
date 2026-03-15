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

interface Props {
  cvId: string
  activeLayout: CVLayout
  accentColor: string
}

export default function LayoutPicker({ cvId, activeLayout, accentColor }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleSelect(layout: CVLayout) {
    if (layout === activeLayout || pending) return
    setPending(true)
    await updateCVSettings(cvId, layout, accentColor)
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
          onClick={() => handleSelect(value)}
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
    </div>
  )
}
