'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadGuestCV, clearGuestCV, hasGuestCV, type GuestCV } from '@/lib/guest/storage'
import { migrateGuestCV } from '@/lib/actions/guest'
import { Button } from '@/components/ui/button'

export default function GuestImportBanner() {
  const router = useRouter()
  const [guestCV, setGuestCV] = useState<GuestCV | null>(null)
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (hasGuestCV()) {
      setGuestCV(loadGuestCV())
    }
  }, [])

  if (!guestCV) return null

  function dismiss() {
    clearGuestCV()
    setGuestCV(null)
  }

  async function handleImport() {
    setError('')
    setMigrating(true)

    const result = await migrateGuestCV(guestCV!)

    if (!result.success) {
      setError(result.error)
      setMigrating(false)
      return
    }

    clearGuestCV()
    router.push(`/cv/${result.cvId}/preview`)
  }

  return (
    <div className="mb-5 border border-amber-200 bg-amber-50 rounded-lg p-4">
      <p className="text-sm font-semibold text-amber-900">
        Vi hittade ett sparat CV-utkast
      </p>
      <p className="text-sm text-amber-800 mt-0.5">
        &ldquo;{guestCV.title}&rdquo; — vill du importera det till ditt konto?
      </p>
      {error && (
        <p className="text-sm text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={handleImport} disabled={migrating}>
          {migrating ? 'Importerar…' : 'Ja, importera'}
        </Button>
        <Button variant="outline" size="sm" onClick={dismiss}>
          Nej tack
        </Button>
      </div>
    </div>
  )
}
