const cardsPerColumn = [4, 3, 2, 1, 2, 3];

export function BoardSkeleton() {
  return (
    <div className="flex flex-1 gap-3 overflow-hidden bg-canvas p-4" aria-busy aria-label="Loading board">
      {cardsPerColumn.map((count, column) => (
        <div key={column} className="w-[280px] shrink-0">
          <div className="flex h-8 items-center gap-2 px-1.5">
            <div className="skeleton size-3.5 rounded-full" />
            <div className="skeleton h-3.5 w-20" />
          </div>
          <div className="mt-1 space-y-1.5 p-0.5">
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className="rounded-lg border border-line bg-surface px-3 py-2.5">
                <div className="skeleton h-3 w-12" />
                <div className="skeleton mt-2 h-3.5" style={{ width: `${85 - ((i + column) % 3) * 15}%` }} />
                <div className="skeleton mt-2.5 h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
