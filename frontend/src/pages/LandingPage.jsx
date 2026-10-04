import React from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { ArrowRight, Upload, Target, GraduationCap, Brain, ShieldCheck, FileDown } from "lucide-react";
import Logo from "../components/Logo";
import Reveal from "../components/Reveal";

const SAMPLE_RADAR = [
  { skill: "SQL", required: 85, user: 70 },
  { skill: "Python", required: 75, user: 78 },
  { skill: "Excel", required: 80, user: 88 },
  { skill: "Statistics", required: 70, user: 40 },
  { skill: "Data Viz", required: 75, user: 35 },
  { skill: "Power BI", required: 65, user: 15 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink text-white">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <Logo light />
        <div className="flex items-center gap-6">
          <a href="#how" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">How it works</a>
          <Link to="/auth" className="text-sm px-4 py-2 rounded-full border border-white/15 hover:border-white/40 transition-colors">
            Log in
          </Link>
        </div>
      </nav>

      <section className="relative max-w-6xl mx-auto px-6 pt-14 pb-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="sr-fadeup">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 mb-6 font-mono text-[11px] tracking-widest uppercase text-white/50">
            <span className="w-1.5 h-1.5 rounded-full sr-blink bg-teal" />
            Scanning your career readiness
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
            Find the exact skills<br />standing between you<br />and <span className="text-teal">the job you want</span>.
          </h1>
          <p className="mt-6 text-white/60 text-lg max-w-md leading-relaxed">
            Upload a resume or list your skills. SkillRadar compares you against real role requirements and builds a learning plan for what's missing.
          </p>
          <div className="mt-9 flex items-center gap-4">
            <Link
              to="/onboarding"
              className="group px-6 py-3.5 rounded-full font-semibold text-sm flex items-center gap-2 transition-transform hover:scale-[1.03] bg-teal text-ink"
            >
              Analyze My Skills
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/auth" className="px-6 py-3.5 rounded-full font-semibold text-sm border border-white/15 hover:bg-white/5 transition-colors">
              Sign up free
            </Link>
          </div>
        </div>

        <div className="relative flex items-center justify-center sr-float">
          <div className="relative w-[360px] h-[360px] sr-rings rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div
                className="absolute inset-0 sr-sweep origin-center"
                style={{ background: "conic-gradient(from 0deg, #35D0B555, transparent 35%)" }}
              />
            </div>
            <div
              className="relative w-[300px] h-[300px] rounded-full border border-white/10 flex items-center justify-center"
              style={{ background: "radial-gradient(circle, rgba(53,208,181,0.06), transparent 70%)" }}
            >
              <ResponsiveContainer width="90%" height="90%">
                <RadarChart data={SAMPLE_RADAR} outerRadius="78%">
                  <PolarGrid stroke="rgba(255,255,255,0.12)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10 }} />
                  <Radar dataKey="required" stroke="rgba(255,255,255,0.35)" fill="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <Radar dataKey="user" stroke="#35D0B5" fill="#35D0B5" fillOpacity={0.35} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="max-w-6xl mx-auto px-6 pb-24 grid sm:grid-cols-3 gap-5">
        {[
          { icon: Upload, title: "Drop in a resume", body: "Or add skills by hand — either way, parsing takes seconds." },
          { icon: Target, title: "See the exact gap", body: "A readiness score plus a color-coded breakdown, skill by skill." },
          { icon: GraduationCap, title: "Close it with a plan", body: "Courses matched to what's missing, tracked to completion." },
        ].map((f, i) => (
          <Reveal key={f.title} delay={i * 100}>
            <div className="p-6 rounded-2xl border border-white/10 sr-card-hover bg-ink2 h-full">
              <f.icon size={20} className="text-teal" />
              <h3 className="font-display font-semibold mt-4">{f.title}</h3>
              <p className="text-sm text-white/50 mt-2 leading-relaxed">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <Reveal>
          <p className="font-mono text-[11px] tracking-widest uppercase text-white/40 mb-6">Under the hood</p>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: Brain, title: "Model-assisted parsing", body: "A trained classifier catches skill phrases plain keyword matching misses, layered on top of it." },
            { icon: ShieldCheck, title: "Admin panel", body: "Edit the skill taxonomy, role templates and course catalog, and see gaps aggregated across every user." },
            { icon: FileDown, title: "Exportable report", body: "Download your readiness score and skill breakdown as a PDF to share or keep." },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 100}>
              <div className="p-6 rounded-2xl border border-white/10 sr-card-hover bg-ink2 h-full">
                <f.icon size={20} className="text-teal" />
                <h3 className="font-display font-semibold mt-4">{f.title}</h3>
                <p className="text-sm text-white/50 mt-2 leading-relaxed">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/30 font-mono">
        SKILLRADAR — CAREER READINESS, MEASURED
      </footer>
    </div>
  );
}
