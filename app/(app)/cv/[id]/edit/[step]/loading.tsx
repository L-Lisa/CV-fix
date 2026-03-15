import { Skeleton } from '@/components/ui/skeleton'

export default function StepLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Title */}
      <Skeleton className="h-4 w-40 mb-1" />

      {/* Step progress */}
      <div className="flex gap-2 my-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-1.5 flex-1" />
        ))}
      </div>

      {/* Step heading */}
      <Skeleton className="h-7 w-56 mb-6" />

      {/* Form fields */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-8">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  )
}
