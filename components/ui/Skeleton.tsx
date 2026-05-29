type SkeletonProps = {
  className?: string;
};

function Bone({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200/80 ${className}`}
      aria-hidden
    />
  );
}

export function SkeletonLine({ className = "h-4 w-full" }: SkeletonProps) {
  return <Bone className={className} />;
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
      role="status"
      aria-label="Loading content"
    >
      <Bone className="h-5 w-1/3" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Bone key={index} className="h-4 w-full" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function SkeletonCardList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading list">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} rows={2} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div
      className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
      role="status"
      aria-label="Loading form"
    >
      <Bone className="h-6 w-48" />
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Bone className="h-10 w-full" />
        <Bone className="h-10 w-full" />
        <Bone className="h-10 w-full sm:col-span-2" />
        <Bone className="h-24 w-full sm:col-span-2" />
      </div>
      <Bone className="mt-6 h-10 w-32" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
      role="status"
      aria-label="Loading table"
    >
      <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
        <Bone className="h-4 w-1/4" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-4">
            <Bone className="h-4 flex-1" />
            <Bone className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Loading grid"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <Bone className="h-5 w-2/3" />
          <Bone className="mt-4 h-4 w-full" />
          <Bone className="mt-2 h-4 w-4/5" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
