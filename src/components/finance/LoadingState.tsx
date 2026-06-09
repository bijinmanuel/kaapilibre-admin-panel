interface LoadingStateProps {
  rows?: number;
}

export function LoadingState({ rows = 4 }: LoadingStateProps) {
  return (
    <div className="space-y-4 w-full">
      {/* Search/filter bar skeleton */}
      <div className="h-10 w-full bg-secondary border border-border rounded-xl animate-pulse" />
      
      {/* Table skeleton */}
      <div className="border border-border rounded-2xl overflow-hidden bg-card/20">
        <div className="h-12 bg-secondary border-b border-border w-full animate-pulse" />
        <div className="p-4 space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="h-6 w-1/4 bg-secondary rounded animate-pulse" />
              <div className="h-6 w-1/3 bg-secondary rounded animate-pulse" />
              <div className="h-6 w-1/12 bg-secondary rounded animate-pulse" />
              <div className="h-6 w-1/6 ml-auto bg-secondary rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
