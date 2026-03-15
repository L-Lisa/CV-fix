'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Något gick fel
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Ett oväntat fel uppstod. Försök igen.
          </p>
          <Button onClick={reset}>Försök igen</Button>
        </div>
      </body>
    </html>
  )
}
