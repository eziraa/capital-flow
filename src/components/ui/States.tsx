import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
      <p className="text-sm font-medium text-fg">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-danger/30 bg-danger-soft px-6 py-10 text-center">
      <p className="text-sm font-medium text-danger">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-danger/30 bg-surface px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-soft"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-surface" aria-hidden="true">
      <div className="animate-pulse divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((__, colIndex) => (
              <div key={colIndex} className="h-4 flex-1 rounded bg-bg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse rounded-md border border-border bg-surface p-4" aria-hidden="true">
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="h-4 rounded bg-bg" style={{ width: `${90 - index * 15}%` }} />
        ))}
      </div>
    </div>
  );
}
