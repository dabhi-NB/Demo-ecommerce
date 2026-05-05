import { Skeleton } from '@/components/ui/skeleton'

export default function ProductCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-2.5 w-14 rounded-md" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-20 rounded-lg mt-0.5" />
        <Skeleton className="h-5 w-24 rounded-lg" />
        <Skeleton className="h-9 w-full rounded-xl mt-1" />
      </div>
    </div>
  )
}
