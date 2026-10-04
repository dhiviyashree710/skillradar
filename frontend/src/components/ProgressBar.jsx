import React from "react";

export default function ProgressBar({ value, color, delay = 0 }) {
  return (
    <div className="w-full h-2 rounded-full bg-white/8 overflow-hidden">
      <div
        className="sr-bar-fill h-full rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color, animationDelay: `${delay}ms` }}
      />
    </div>
  );
}
