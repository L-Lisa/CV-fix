import type { ATSResult } from '@/lib/ats/validate'

interface Props {
  result: ATSResult
}

export default function ATSPanel({ result }: Props) {
  const { hard, soft } = result
  const allClear = hard.length === 0 && soft.length === 0

  if (allClear) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-semibold text-green-800">ATS-check klar</p>
        <p className="text-sm text-green-700 mt-0.5">
          Inga problem hittades. CV:t är redo att exporteras.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {hard.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800 mb-2">
            {hard.length} fel blockerar export
          </p>
          <ul className="space-y-1">
            {hard.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="mt-0.5 shrink-0">✕</span>
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {soft.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">
            {soft.length} rekommendation{soft.length !== 1 ? 'er' : ''}
          </p>
          <ul className="space-y-1">
            {soft.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                <span className="mt-0.5 shrink-0">!</span>
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
