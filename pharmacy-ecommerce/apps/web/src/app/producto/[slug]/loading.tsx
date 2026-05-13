export default function Loading() {
  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="h-12 w-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse mb-4" />
        <div className="grid sm:grid-cols-2 gap-6 lg:gap-12 items-start">
          <div className="aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="space-y-4">
            <div className="h-5 w-32 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="h-8 w-3/4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-9 w-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-9 w-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="h-12 w-40 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="rounded-2xl border-2 border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="h-12 bg-slate-50 dark:bg-slate-800 animate-pulse" />
              <div className="h-12 bg-slate-50 dark:bg-slate-800 animate-pulse" />
              <div className="h-12 bg-slate-50 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="space-y-3 pt-4 border-t-2 border-slate-100 dark:border-slate-700">
              <div className="h-6 w-2/3 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-6 w-1/2 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="h-16 w-full rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
