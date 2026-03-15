import Link from 'next/link'
import { listCVs } from '@/lib/queries/cv'
import { formatDate } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import GuestImportBanner from '@/components/cv/GuestImportBanner'
import type { CV } from '@/types'

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
      <div className="flex gap-2 shrink-0">
        <Link href={`/cv/${cv.id}/preview`}>
          <Button variant="outline" size="sm">
            Visa
          </Button>
        </Link>
        <Link href={`/cv/${cv.id}/edit/1`}>
          <Button variant="outline" size="sm">
            Redigera
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const cvs = await listCVs()

  return (
    <div>
      <GuestImportBanner />
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
