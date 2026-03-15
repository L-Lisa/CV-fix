'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCVLanguage } from '@/lib/actions/cv'
import type { CVLanguage } from '@/types'

interface Props {
  cvId: string
  activeLanguage: CVLanguage
}

const LABELS: Record<CVLanguage, string> = {
  sv: 'Svenska',
  en: 'English',
}

export default function LanguageToggle({ cvId, activeLanguage }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleSelect(lang: CVLanguage) {
    if (lang === activeLanguage || pending) return
    setPending(true)
    await updateCVLanguage(cvId, lang)
    router.refresh()
    setPending(false)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {(['sv', 'en'] as CVLanguage[]).map((lang) => (
        <button
          key={lang}
          type="button"
          disabled={pending}
          onClick={() => handleSelect(lang)}
          className={`py-2 rounded-md border text-sm font-medium transition-colors disabled:opacity-60 ${
            activeLanguage === lang
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 text-gray-700 hover:border-gray-400'
          }`}
        >
          {LABELS[lang]}
        </button>
      ))}
    </div>
  )
}
