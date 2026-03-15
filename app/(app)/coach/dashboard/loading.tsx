import { Skeleton } from '@/components/ui/skeleton'

export default function CoachDashboardLoading() {
  return (
    <div>
      <div className="mb-6 space-y-1.5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-lg p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-2">
              {[1, 2].map((j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-7 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
