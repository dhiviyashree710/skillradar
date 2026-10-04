import React, { useEffect, useState } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import AppShell from "../components/AppShell";
import ReadinessRing from "../components/ReadinessRing";
import ProgressBar from "../components/ProgressBar";
import { SkeletonDashboard } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import api from "../lib/api";

const STATUS_COLOR = { Strong: "#35D0B5", Developing: "#FFB020", Missing: "#FF5D5D" };

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    api.get("/analysis").then((res) => setData(res.data)).catch((err) => {
      const message = err.response?.data?.error || "Couldn't load your analysis.";
      setError(message);
      toast.show(message, "error");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <AppShell>
        <p className="text-coral text-sm sr-fadeup">{error}</p>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <SkeletonDashboard />
      </AppShell>
    );
  }

  const radarData = data.breakdown.map((b) => ({ skill: b.skill_name, required: b.required, user: b.user_score }));

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sr-fadeup">
        <div>
          <h1 className="font-display text-2xl font-bold">Gap Analysis</h1>
          <p className="text-sm text-white/45 mt-1">
            Measured against <span className="text-white/80 font-medium">{data.target_role}</span> ({data.experience_level})
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-3xl p-6 border border-white/10 flex flex-col items-center text-center sr-fadeup bg-ink2" style={{ animationDelay: "80ms" }}>
          <ReadinessRing score={data.readiness_score} />
          <p className="text-sm text-white/50 mt-4 max-w-[220px]">
            {data.readiness_score >= 70
              ? "Strong match — polish a few gaps and apply."
              : data.readiness_score >= 45
              ? "Solid foundation, a few real gaps to close."
              : "Early stage — focus on the missing basics first."}
          </p>
        </div>

        <div className="lg:col-span-2 rounded-3xl p-6 border border-white/10 sr-fadeup bg-ink2" style={{ animationDelay: "160ms" }}>
          <h3 className="font-display font-semibold mb-2">Your skills vs. required</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                <Radar name="Required" dataKey="required" stroke="rgba(255,255,255,0.4)" fill="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                <Radar name="You" dataKey="user" stroke="#35D0B5" fill="#35D0B5" fillOpacity={0.35} strokeWidth={2} />
                <Tooltip contentStyle={{ background: "#0C0F1C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl p-6 border border-white/10 sr-fadeup bg-ink2" style={{ animationDelay: "220ms" }}>
        <h3 className="font-display font-semibold mb-5">Skill-by-skill breakdown</h3>
        <div className="space-y-4">
          {data.breakdown.map((b, i) => (
            <div key={b.skill_id}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium flex items-center gap-2">
                  {b.skill_name}
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono"
                    style={{ background: `${STATUS_COLOR[b.status]}22`, color: STATUS_COLOR[b.status] }}
                  >
                    {b.status}
                  </span>
                </span>
                <span className="font-mono text-xs text-white/40">{b.user_score} / {b.required}</span>
              </div>
              <ProgressBar value={b.user_score} color={STATUS_COLOR[b.status]} delay={i * 90} />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
