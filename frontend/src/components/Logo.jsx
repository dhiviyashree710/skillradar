import React from "react";
import { Target } from "lucide-react";
import { Link } from "react-router-dom";

export default function Logo({ light, to = "/" }) {
  return (
    <Link to={to} className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal">
        <Target size={18} className="text-ink" strokeWidth={2.5} />
      </div>
      <span className={`font-display text-lg font-bold tracking-tight ${light ? "text-white" : "text-[#1B1F2E]"}`}>
        Skill<span className="text-teal">Radar</span>
      </span>
    </Link>
  );
}
