import React from "react";

export function SkeletonBlock({ className = "" }) {
  return <div className={`sr-skeleton rounded-xl ${className}`} />;
}

export function SkeletonDashboard() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <SkeletonBlock className="h-7 w-44 mb-2" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-3xl p-6 border border-white/10 bg-ink2 flex items-center justify-center">
          <SkeletonBlock className="h-40 w-40 rounded-full" />
        </div>
        <div className="lg:col-span-2 rounded-3xl p-6 border border-white/10 bg-ink2">
          <SkeletonBlock className="h-72 w-full" />
        </div>
      </div>
      <div className="mt-6 rounded-3xl p-6 border border-white/10 bg-ink2 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonCards({ count = 6 }) {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 border border-white/10 bg-ink2">
          <SkeletonBlock className="h-4 w-20 mb-4" />
          <SkeletonBlock className="h-5 w-full mb-3" />
          <SkeletonBlock className="h-3 w-3/4 mb-5" />
          <SkeletonBlock className="h-8 w-full" />
        </div>
      ))}
    </div>
  );
}
