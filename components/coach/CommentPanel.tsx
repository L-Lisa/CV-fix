'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addComment, resolveComment } from '@/lib/actions/coach'
import { Button } from '@/components/ui/button'
import type { CVComment } from '@/types'

interface Props {
  cvId: string
  sectionType: string
  itemId: string | null
  comments: CVComment[]
  label: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function CommentPanel({
  cvId,
  sectionType,
  itemId,
  comments,
  label,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [open, setOpen] = useState(comments.length > 0)

  const activeComments = comments.filter((c) => !c.is_resolved)
  const resolvedComments = comments.filter((c) => c.is_resolved)

  function handleAdd() {
    if (!text.trim()) return
    setError('')

    startTransition(async () => {
      const result = await addComment(cvId, sectionType, itemId, text.trim())
      if (!result.success) {
        setError(result.error)
        return
      }
      setText('')
      router.refresh()
    })
  }

  function handleResolve(commentId: string) {
    startTransition(async () => {
      await resolveComment(commentId)
      router.refresh()
    })
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
      >
        <span
          className={`inline-block w-4 h-4 rounded-full border text-center leading-4 text-xs ${
            activeComments.length > 0
              ? 'border-amber-400 text-amber-500 bg-amber-50'
              : 'border-gray-300 text-gray-400'
          }`}
        >
          {activeComments.length > 0 ? activeComments.length : '+'}
        </span>
        {activeComments.length > 0
          ? `${activeComments.length} kommentar${activeComments.length > 1 ? 'er' : ''}`
          : `Kommentera ${label.toLowerCase()}`}
      </button>

      {open && (
        <div className="mt-2 pl-3 border-l-2 border-gray-200 space-y-3">
          {/* Active comments */}
          {activeComments.map((c) => (
            <div key={c.id} className="text-sm">
              <p className="text-gray-700">{c.comment}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-400">
                  {formatDate(c.created_at)}
                </span>
                <button
                  type="button"
                  onClick={() => handleResolve(c.id)}
                  disabled={isPending}
                  className="text-xs text-gray-400 hover:text-green-600 disabled:opacity-50"
                >
                  Markera som löst
                </button>
              </div>
            </div>
          ))}

          {/* Resolved comments (collapsed) */}
          {resolvedComments.length > 0 && (
            <p className="text-xs text-gray-400">
              {resolvedComments.length} löst{resolvedComments.length > 1 ? 'a' : ''}
            </p>
          )}

          {/* Add comment */}
          <div className="space-y-1.5">
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Skriv en kommentar…"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              disabled={isPending || !text.trim()}
            >
              {isPending ? 'Sparar…' : 'Spara'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
