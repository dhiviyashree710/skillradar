import React, { useEffect, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, Plus, X, Upload } from "lucide-react";
import Logo from "../components/Logo";
import api from "../lib/api";

const EXPERIENCE_LEVELS = ["Fresher", "Intermediate", "Experienced"];
const STEPS = ["Your skills", "Resume (optional)", "Target role", "Experience"];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [catalog, setCatalog] = useState({ skills: [], roles: [] });
  const [skills, setSkills] = useState([]);
  const [input, setInput] = useState("");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState(EXPERIENCE_LEVELS[0]);
  const [fileName, setFileName] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/profile/skills-catalog").then(({ data }) => {
      setCatalog(data);
      if (data.roles.length) setRole(data.roles[0]);
    });
  }, []);

  const addSkill = () => {
    const v = input.trim();
    if (v && !skills.includes(v)) setSkills([...skills, v]);
    setInput("");
  };

  const onResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("resume", file);
    try {
      const { data } = await api.post("/profile/resume", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const names = data.detected_skill_ids
        .map((id) => catalog.skills.find((s) => s.id === id)?.name || id)
        .filter((name) => !skills.includes(name));
      setSkills([...skills, ...names]);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't read that file.");
    } finally {
      setUploading(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    setError("");
    try {
      await api.put("/profile/skills", { skills });
      await api.put("/profile/target", { target_role: role, experience_level: experience });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't save your profile. Are you logged in?");
    } finally {
      setSaving(false);
    }
  };

  const next = () => (step === STEPS.length - 1 ? finish() : setStep(step + 1));

  return (
    <div className="min-h-screen bg-paper text-[#1B1F2E] px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <Logo />
          <span className="font-mono text-xs text-black/40">Step {step + 1} of {STEPS.length}</span>
        </div>

        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => (
            <Fragment key={s}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                  style={i <= step ? { background: "#35D0B5", color: "#0C0F1C" } : { background: "#EEEAE0", color: "#8A90AC" }}
                >
                  {i < step ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className="text-[11px] text-black/40 hidden sm:block w-20 text-center">{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-[2px] mx-2 mb-5" style={{ background: i < step ? "#35D0B5" : "#EEEAE0" }} />
              )}
            </Fragment>
          ))}
        </div>

        <div className="rounded-3xl p-8 bg-white border border-black/5 shadow-lg sr-fadeup" key={step}>
          {step === 0 && (
            <div>
              <h2 className="font-display text-xl font-bold">What can you already do?</h2>
              <p className="text-sm text-black/40 mt-1">Add skills one at a time — tools, languages, or soft skills.</p>
              <div className="flex gap-2 mt-6">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="e.g. SQL"
                  list="skill-options"
                  className="flex-1 px-4 py-3 rounded-xl border border-black/10 outline-none text-sm focus:border-black/30"
                />
                <datalist id="skill-options">
                  {catalog.skills.map((s) => <option key={s.id} value={s.name} />)}
                </datalist>
                <button type="button" onClick={addSkill} className="px-4 rounded-xl flex items-center justify-center text-white bg-[#1B1F2E]">
                  <Plus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-5">
                {skills.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-medium bg-paper2">
                    {s}
                    <button onClick={() => setSkills(skills.filter((x) => x !== s))} className="opacity-40 hover:opacity-100">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display text-xl font-bold">Have a resume handy?</h2>
              <p className="text-sm text-black/40 mt-1">We'll pull skills from it automatically — this step is optional.</p>
              <label className="mt-6 flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-14 cursor-pointer transition-colors hover:border-black/30 border-black/15">
                <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={onResumeUpload} />
                <Upload size={22} className="text-black/30" />
                <span className="text-sm font-medium">
                  {uploading ? "Reading your resume…" : fileName || "Drag & drop, or click to upload"}
                </span>
                <span className="text-xs text-black/35">PDF, DOCX, or TXT — up to 5MB</span>
              </label>
              {error && <p className="text-xs text-coral mt-3">{error}</p>}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-xl font-bold">Where are you headed?</h2>
              <p className="text-sm text-black/40 mt-1">Pick the role you're measuring yourself against.</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                {catalog.roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="p-4 rounded-xl border text-left text-sm font-semibold transition-all"
                    style={role === r ? { borderColor: "#35D0B5", background: "rgba(53,208,181,0.08)" } : { borderColor: "rgba(0,0,0,0.1)" }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-display text-xl font-bold">How far along are you?</h2>
              <p className="text-sm text-black/40 mt-1">This calibrates how strict the readiness score is.</p>
              <div className="flex flex-col gap-3 mt-6">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setExperience(lvl)}
                    className="flex items-center justify-between p-4 rounded-xl border transition-all"
                    style={experience === lvl ? { borderColor: "#35D0B5", background: "rgba(53,208,181,0.08)" } : { borderColor: "rgba(0,0,0,0.1)" }}
                  >
                    <span className="text-sm font-semibold">{lvl}</span>
                    {experience === lvl && <CheckCircle2 size={16} className="text-teal" />}
                  </button>
                ))}
              </div>
              {error && <p className="text-xs text-coral mt-4">{error}</p>}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => (step === 0 ? navigate("/auth") : setStep(step - 1))}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-black/50 hover:text-black transition-colors"
          >
            Back
          </button>
          <button
            onClick={next}
            disabled={saving}
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white flex items-center gap-2 transition-transform hover:scale-[1.03] disabled:opacity-60 bg-[#1B1F2E]"
          >
            {saving ? "Saving…" : step === STEPS.length - 1 ? "See my results" : "Continue"}
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
