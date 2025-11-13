export default function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-muted flex h-10 w-full animate-pulse rounded-md" />
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="bg-muted flex h-16 w-full animate-pulse rounded-md"
          />
        ))}
      </div>
    </div>
  )
}
