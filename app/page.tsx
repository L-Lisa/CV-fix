import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <span className="font-semibold text-gray-900">CV-byggaren</span>
        <Link
          href="/login"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Logga in
        </Link>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-lg text-center">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Skapa ett CV som<br />tar dig vidare
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Steg-för-steg-guide, ATS-kontroll och tre layouter — klart på
            under 20 minuter.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700"
            >
              Skapa konto
            </Link>
            <Link
              href="/cv/guest"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Starta utan konto
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Inget konto krävs — ditt CV sparas tillfälligt i din webbläsare.
          </p>
        </div>
      </div>

      {/* Feature strip */}
      <div className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <p className="font-medium text-gray-900 text-sm">ATS-säkert</p>
            <p className="text-xs text-gray-500 mt-1">
              Automatisk kontroll mot vanliga ATS-krav
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">3 layouter</p>
            <p className="text-xs text-gray-500 mt-1">
              Välj den stil som passar din bransch
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">PDF-export</p>
            <p className="text-xs text-gray-500 mt-1">
              Ladda ner direkt — redo att skickas
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
