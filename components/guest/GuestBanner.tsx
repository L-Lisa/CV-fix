'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function GuestBanner() {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="w-full bg-amber-50 border-b border-amber-300 px-4 py-3"
    >
      <div className="max-w-3xl mx-auto flex items-start gap-3">
        <AlertTriangle
          className="h-5 w-5 text-amber-600 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900">
            Du använder gästläge — ditt CV sparas inte
          </p>
          <p className="text-sm text-amber-800 mt-0.5">
            Allt försvinner om du stänger webbläsaren.{' '}
            <Link
              href="/register"
              className="font-semibold underline hover:no-underline"
            >
              Skapa ett gratis konto
            </Link>{' '}
            för att spara ditt CV.
          </p>
        </div>
      </div>
    </div>
  )
}
