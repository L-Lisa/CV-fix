import { Skeleton } from '@/components/ui/skeleton'

export default function CoachCVLoading() {
  return (
    <div>
      <Skeleton className="h-4 w-20 mb-6" />
      <div className="mb-6 space-y-1.5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-lg p-5 space-y-3"
          >
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ))}
      </div>
    </div>
  )
}
