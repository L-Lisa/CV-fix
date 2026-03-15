'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">
        Något gick fel
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Ett oväntat fel uppstod. Försök igen eller gå tillbaka till startsidan.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          Försök igen
        </Button>
        <Link href="/dashboard">
          <Button>Startsidan</Button>
        </Link>
      </div>
    </div>
  )
}
