'use client'

// Reusable disclosure for AI-driven UI surfaces — UX_PATTERNS_v1.md §3.
// A small "Hur fungerar det här?" link that expands to a 3–5 sentence
// explanation. Use sparingly; not every button needs it.

import { useState } from 'react'
import { Info } from 'lucide-react'

interface Props {
  text: string
  // Optional override — defaults to the Swedish standard label.
  label?: string
}

export default function HowDoesThisWork({ text, label = 'Hur fungerar det här?' }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
      >
        <Info className="h-4 w-4" />
        {label}
      </button>
      {open && (
        <p className="mt-2 text-gray-600 bg-gray-50 border border-gray-200 p-3 rounded-md leading-relaxed">
          {text}
        </p>
      )}
    </div>
  )
}
