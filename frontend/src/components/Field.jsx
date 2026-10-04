import React from "react";

export default function Field({ icon: Icon, ...inputProps }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-black/10 focus-within:border-black/30 transition-colors">
      {Icon && <Icon size={16} className="text-black/30 shrink-0" />}
      <input {...inputProps} className="w-full bg-transparent outline-none text-sm placeholder:text-black/30" />
    </div>
  );
}
