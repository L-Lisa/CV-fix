'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AIKeywordSuggestion, CVLanguage } from '@/types'

interface Props {
  cvId: string
  language?: CVLanguage
}

export default function KeywordMatchPanel({ cvId, language = 'sv' }: Props) {
  const [jobPosting, setJobPosting] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AIKeywordSuggestion[] | null>(null)
  const [error, setError] = useState('')

  async function handleAnalyze() {
    if (!jobPosting.trim()) return
    setLoading(true)
    setError('')
    setSuggestions(null)

    try {
      const res = await fetch('/api/ai/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvId, jobPosting, language }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      const parsed: AIKeywordSuggestion[] = JSON.parse(data.result)
      setSuggestions(parsed)
    } catch {
      setError('Något gick fel. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
          Förslag på CV-tips · prompt under utveckling
        </span>
      </div>

      <textarea
        value={jobPosting}
        onChange={(e) => setJobPosting(e.target.value)}
        placeholder="Klistra in jobbannonsen här…"
        rows={5}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading || !jobPosting.trim()}
        onClick={handleAnalyze}
        className="w-full text-purple-600 border-purple-200 hover:bg-purple-50 gap-2 disabled:opacity-50"
      >
        <Search className="h-4 w-4" />
        {loading ? 'Analyserar…' : 'Matcha mot annons'}
      </Button>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {suggestions !== null && (
        <div className="mt-2 space-y-2">
          {suggestions.length === 0 ? (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
              Bra jobbat! Inga viktiga nyckelord verkar saknas mot den här annonsen.
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-600 leading-relaxed">
                Vi föreslår att du lägger till följande nyckelord med tanke på ATS-granskning och matching mot annonsen.
              </p>
              <ul className="space-y-2">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0 inline-block h-2 w-2 rounded-full bg-purple-400" />
                    <span>
                      <span className="font-medium text-gray-900">{s.keyword}</span>
                      <span className="text-gray-400"> · {s.section}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
