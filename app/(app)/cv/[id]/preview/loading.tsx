import { Skeleton } from '@/components/ui/skeleton'

export default function PreviewLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>

        {/* PDF preview area */}
        <div className="lg:col-span-2">
          <div className="border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center h-[700px]">
            <p className="text-sm text-gray-400">Laddar förhandsvisning…</p>
          </div>
        </div>
      </div>
    </div>
  )
}
