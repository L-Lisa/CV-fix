'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'cv_ai_mode'

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAIMode(): { aiEnabled: boolean; toggleAI: () => void } {
  // Start false — hydrated from localStorage in useEffect to avoid SSR mismatch
  const [aiEnabled, setAiEnabled] = useState(false)

  useEffect(() => {
    try {
      setAiEnabled(localStorage.getItem(STORAGE_KEY) === 'true')
    } catch {
      // localStorage not available (e.g. private browsing restrictions)
    }
  }, [])

  function toggleAI() {
    setAiEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  return { aiEnabled, toggleAI }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AIToggle() {
  const { aiEnabled, toggleAI } = useAIMode()

  return (
    <button
      type="button"
      onClick={toggleAI}
      aria-pressed={aiEnabled}
      aria-label={aiEnabled ? 'Stäng av AI-hjälp' : 'Slå på AI-hjälp'}
      className={`inline-flex items-center h-8 px-3 rounded-full text-xs font-medium transition-colors ${
        aiEnabled
          ? 'border border-purple-300 bg-purple-50 text-purple-700'
          : 'border border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600'
      }`}
    >
      {aiEnabled && (
        <span className="relative flex h-2 w-2 mr-1.5" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
        </span>
      )}
      AI
    </button>
  )
}
