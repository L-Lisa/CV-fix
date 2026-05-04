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
        <span
          aria-disabled="true"
          title="Tillfälligt avstängt under testperioden"
          className="text-sm text-gray-300 cursor-not-allowed select-none"
        >
          Logga in
        </span>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-lg text-center">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Skapa ett CV som<br />tar dig vidare
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Steg-för-steg-guide, ATS-kontroll och fyra layouter — klart på
            under 20 minuter.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/cv/guest"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-700"
            >
              Starta utan konto
            </Link>
            <span
              aria-disabled="true"
              title="Tillfälligt avstängt under testperioden"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-400 cursor-not-allowed select-none"
            >
              Skapa konto
            </span>
          </div>

          <p className="mt-6 text-sm text-gray-600 leading-relaxed">
            Detta är en testversion — du är välkommen att testa appen genom
            att fylla i formuläret och ladda ned CV:t i PDF-format. Ingen
            information sparas.
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
            <p className="font-medium text-gray-900 text-sm">4 layouter</p>
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
