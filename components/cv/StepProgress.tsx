interface Props {
  current: number
  total: number
  labels: string[]
}

export default function StepProgress({ current, total, labels }: Props) {
  return (
    <nav aria-label="Formulärsteg" className="mb-8">
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gray-900 rounded-full transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>

      {/* Step dots — hidden on xs, visible from sm */}
      <ol className="hidden sm:flex items-start justify-between">
        {labels.map((label, i) => {
          const stepNum = i + 1
          const isDone = stepNum < current
          const isCurrent = stepNum === current

          return (
            <li key={stepNum} className="flex flex-col items-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ${
                  isDone
                    ? 'bg-gray-900 text-white'
                    : isCurrent
                    ? 'bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2'
                    : 'bg-gray-200 text-gray-500'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isDone ? '✓' : stepNum}
              </div>
              <span
                className={`text-xs text-center leading-tight ${
                  isCurrent ? 'text-gray-900 font-medium' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>

      {/* Mobile: simple "Steg X av Y" text */}
      <p className="sm:hidden text-sm text-gray-500">
        Steg {current} av {total} — {labels[current - 1]}
      </p>
    </nav>
  )
}
