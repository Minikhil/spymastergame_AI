'use client'

export function BetaBadge() {
  return (
    <div className="relative inline-flex items-center">
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
      <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
      <span className="relative px-2.5 py-1 text-xs font-medium bg-emerald-400/10 text-emerald-400 rounded-full border border-emerald-400/20">
        BETA
      </span>
    </div>
  );
}