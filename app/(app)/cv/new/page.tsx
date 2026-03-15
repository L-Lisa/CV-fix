'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCV } from '@/lib/actions/cv'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CVLanguage } from '@/types'

export default function NewCVPage() {
  const router = useRouter()
  const [language, setLanguage] = useState<CVLanguage>('sv')
  const [title, setTitle] = useState('Mitt CV')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await createCV(language, title.trim() || 'Mitt CV')

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(`/cv/${result.cvId}/edit/1`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Skapa nytt CV
      </h1>
      <p className="text-gray-500 mb-8">
        Välj språk — du kan ändra det senare.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Language */}
        <div>
          <Label className="mb-2 block">Språk</Label>
          <div className="grid grid-cols-2 gap-3">
            {(['sv', 'en'] as CVLanguage[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`py-3 rounded-lg border text-sm font-medium transition-colors ${
                  language === lang
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                {lang === 'sv' ? 'Svenska' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* CV title */}
        <div>
          <Label htmlFor="title" className="mb-2 block">
            Namn på CV:t
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mitt CV"
            maxLength={80}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Skapar CV…' : 'Fortsätt'}
        </Button>
      </form>
    </div>
  )
}
