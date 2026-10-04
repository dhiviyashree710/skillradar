import React, { useEffect, useState } from "react";
import { SlidersHorizontal, Clock, Star, ExternalLink } from "lucide-react";
import AppShell from "../components/AppShell";
import api from "../lib/api";

export default function RecommendationsPage() {
  const [filter, setFilter] = useState("all");
  const [courses, setCourses] = useState([]);
  const [saved, setSaved] = useState(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = filter === "all" ? {} : { free: filter === "free" };
    api
      .get("/recommendations", { params })
      .then((res) => setCourses(res.data.courses))
      .catch((err) => setError(err.response?.data?.error || "Couldn't load recommendations."))
      .finally(() => setLoading(false));
  }, [filter]);

  const toggleSave = async (course) => {
    const next = new Set(saved);
    next.has(course.title) ? next.delete(course.title) : next.add(course.title);
    setSaved(next);
    // Persist to the tracker board as a "to_learn" item for this skill.
    try {
      await api.post("/tracker", { skill_id: course.skill_id, status: "to_learn" });
    } catch {
      /* non-fatal for the UI */
    }
  };

  return (
    <AppShell>
      <div className="mb-8 sr-fadeup">
        <h1 className="font-display text-2xl font-bold">Recommendations</h1>
        <p className="text-sm text-white/45 mt-1">Matched to the skills your dashboard flagged as gaps.</p>
      </div>

      <div className="flex items-center gap-2 mb-6 sr-fadeup" style={{ animationDelay: "80ms" }}>
        <SlidersHorizontal size={14} className="text-white/40" />
        {["all", "free", "paid"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors"
            style={filter === f ? { background: "#35D0B5", color: "#0C0F1C" } : { background: "#141A2E", color: "rgba(255,255,255,0.5)" }}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="text-coral text-sm mb-4">{error}</p>}
      {loading && <p className="text-white/40 text-sm">Loading…</p>}
      {!loading && !error && courses.length === 0 && (
        <p className="text-white/40 text-sm">No gaps here — nice work, or set a target role on the onboarding page first.</p>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {courses.map((c, i) => (
          <div key={c.title} className="rounded-2xl p-5 border border-white/10 sr-card-hover sr-fadeup flex flex-col bg-ink2" style={{ animationDelay: `${i * 90}ms` }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full font-mono uppercase bg-teal/10 text-teal">
                {c.skill_id.replace(/_/g, " ")}
              </span>
              <span className={`text-xs font-semibold ${c.free ? "text-teal" : "text-white/50"}`}>{c.free ? "Free" : "Paid"}</span>
            </div>
            <h3 className="font-display font-semibold mt-4 leading-snug">{c.title}</h3>
            <div className="flex items-center gap-3 mt-3 text-xs text-white/45">
              <span>{c.platform}</span>
              <span className="flex items-center gap-1"><Clock size={12} />{c.duration_hours}h</span>
              <span>{c.difficulty}</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-white/60">
              <Star size={12} fill="#FFB020" stroke="none" /> {c.rating}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => toggleSave(c)}
                className="flex-1 py-2 rounded-full text-xs font-semibold transition-colors"
                style={saved.has(c.title) ? { background: "#35D0B5", color: "#0C0F1C" } : { background: "rgba(255,255,255,0.08)", color: "white" }}
              >
                {saved.has(c.title) ? "Added ✓" : "Add to plan"}
              </button>
              <a
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 text-white/50 hover:text-white transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
