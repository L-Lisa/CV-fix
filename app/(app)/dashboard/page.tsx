import Link from 'next/link'
import { listCVs } from '@/lib/actions/cv'
import { Button } from '@/components/ui/button'
import type { CV } from '@/types'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function CVCard({ cv }: { cv: CV }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate">{cv.title}</p>
        <p className="text-sm text-gray-500 mt-0.5">
          Uppdaterad {formatDate(cv.updated_at)} ·{' '}
          <span
            className={
              cv.status === 'complete' ? 'text-green-600' : 'text-amber-600'
            }
          >
            {cv.status === 'complete' ? 'Komplett' : 'Utkast'}
          </span>
        </p>
      </div>
      <Link href={`/cv/${cv.id}/edit/1`} className="shrink-0">
        <Button variant="outline" size="sm">
          Redigera
        </Button>
      </Link>
    </div>
  )
}

export default async function DashboardPage() {
  const cvs = await listCVs()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Mina CV:n</h1>
        <Link href="/cv/new">
          <Button>Skapa nytt CV</Button>
        </Link>
      </div>

      {cvs.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">Du har inga CV:n än.</p>
          <Link href="/cv/new">
            <Button>Skapa ditt första CV</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cvs.map((cv) => (
            <CVCard key={cv.id} cv={cv} />
          ))}
        </div>
      )}
    </div>
  )
}
