import React, { useEffect, useState } from "react";
import { Circle, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import AppShell from "../components/AppShell";
import ProgressBar from "../components/ProgressBar";
import api from "../lib/api";

const COLUMNS = [
  { id: "to_learn", label: "To Learn", icon: Circle, color: "rgba(255,255,255,0.4)", next: "in_progress" },
  { id: "in_progress", label: "In Progress", icon: Loader2, color: "#FFB020", next: "completed" },
  { id: "completed", label: "Completed", icon: CheckCircle2, color: "#35D0B5", next: null },
];

export default function TrackerPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const load = () => {
    api.get("/tracker").then((res) => setItems(res.data.items)).catch((err) =>
      setError(err.response?.data?.error || "Couldn't load your tracker.")
    );
  };

  useEffect(load, []);

  const move = async (skill_id, nextStatus) => {
    setItems((prev) => prev.map((it) => (it.skill_id === skill_id ? { ...it, status: nextStatus } : it)));
    try {
      await api.post("/tracker", { skill_id, status: nextStatus });
    } catch {
      load(); // revert to server truth on failure
    }
  };

  const total = items.length;
  const done = items.filter((i) => i.status === "completed").length;

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8 sr-fadeup flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Progress Tracker</h1>
          <p className="text-sm text-white/45 mt-1">Move a skill forward as you finish its course.</p>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-white/40">{done}/{total} closed</span>
            <div className="w-28"><ProgressBar value={(done / total) * 100} color="#35D0B5" /></div>
          </div>
        )}
      </div>

      {error && <p className="text-coral text-sm mb-4">{error}</p>}
      {total === 0 && !error && (
        <p className="text-white/40 text-sm">
          Nothing on your board yet — add a course from Recommendations and it'll show up here.
        </p>
      )}

      <div className="grid sm:grid-cols-3 gap-5">
        {COLUMNS.map((col, ci) => {
          const colItems = items.filter((i) => i.status === col.id);
          return (
            <div key={col.id} className="rounded-2xl border border-white/10 p-4 sr-fadeup bg-ink2" style={{ animationDelay: `${ci * 100}ms` }}>
              <div className="flex items-center gap-2 mb-4 px-1">
                <col.icon size={14} style={{ color: col.color }} />
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="font-mono text-[11px] text-white/35 ml-auto">{colItems.length}</span>
              </div>
              <div className="flex flex-col gap-2 min-h-[80px]">
                {colItems.map((item) => (
                  <div key={item.skill_id} className="rounded-xl p-3 border border-white/10 sr-fadeup bg-ink">
                    <span className="text-sm font-medium">{item.skill_id.replace(/_/g, " ")}</span>
                    {col.next ? (
                      <button onClick={() => move(item.skill_id, col.next)} className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-teal">
                        Move forward <ArrowRight size={11} />
                      </button>
                    ) : (
                      <span className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-teal">
                        <CheckCircle2 size={11} /> Skill closed
                      </span>
                    )}
                  </div>
                ))}
                {colItems.length === 0 && <p className="text-xs text-white/25 italic px-1 py-3">Nothing here yet.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
