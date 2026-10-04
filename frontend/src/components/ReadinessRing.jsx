import React from "react";

export default function ReadinessRing({ score }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative w-40 h-40 shrink-0">
      <svg viewBox="0 0 128 128" className="w-40 h-40 -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx="64" cy="64" r={r} fill="none" stroke="#35D0B5" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.16,.84,.44,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold text-white">{score}%</span>
        <span className="font-mono text-[10px] tracking-widest text-white/50 uppercase mt-1">Ready</span>
      </div>
    </div>
  );
}
