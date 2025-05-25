import { Skeleton } from "@/components/ui/skeleton"

export default function EditQuizLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center mb-6">
        <Skeleton className="h-10 w-10 mr-2" />
        <Skeleton className="h-8 w-48" />
      </div>

      <Skeleton className="h-64 w-full" />

      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-20 w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      <Skeleton className="h-64 w-full" />

      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
