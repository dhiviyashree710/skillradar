import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Plus, Trash2, Users, Target, Sparkles } from "lucide-react";
import AppShell from "../components/AppShell";
import { SkeletonBlock } from "../components/Skeleton";
import api from "../lib/api";
import { useToast } from "../components/Toast";

const TABS = ["Analytics", "Skills", "Roles", "Courses"];

export default function AdminPage() {
  const [tab, setTab] = useState("Analytics");

  return (
    <AppShell>
      <div className="mb-6 sr-fadeup">
        <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-white/45 mt-1">Manage the skill taxonomy, role templates, and course catalog.</p>
      </div>

      <div className="flex gap-2 mb-6 sr-fadeup" style={{ animationDelay: "60ms" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-full text-xs font-semibold transition-colors"
            style={tab === t ? { background: "#35D0B5", color: "#0C0F1C" } : { background: "#141A2E", color: "rgba(255,255,255,0.5)" }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Analytics" && <AnalyticsTab />}
      {tab === "Skills" && <SkillsTab />}
      {tab === "Roles" && <RolesTab />}
      {tab === "Courses" && <CoursesTab />}
    </AppShell>
  );
}

/* ---------------- Analytics ---------------- */
function AnalyticsTab() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/analytics").then((res) => setData(res.data));
  }, []);

  if (!data) {
    return (
      <div className="grid sm:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} className="h-28 w-full" />)}
      </div>
    );
  }

  const gapChartData = data.most_common_gaps.map(([skill, count]) => ({ skill, count }));

  return (
    <div className="sr-fadeup">
      <div className="grid sm:grid-cols-3 gap-5 mb-6">
        <StatTile icon={Users} label="Total users" value={data.total_users} />
        <StatTile icon={Sparkles} label="Completed onboarding" value={data.onboarded_users} />
        <StatTile icon={Target} label="Roles targeted" value={data.users_by_target_role.length} />
      </div>

      <div className="rounded-3xl p-6 border border-white/10 bg-ink2">
        <h3 className="font-display font-semibold mb-4">Most common skill gaps, platform-wide</h3>
        {gapChartData.length === 0 ? (
          <p className="text-sm text-white/40">No onboarded users yet.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gapChartData} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="skill" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} width={110} />
                <Tooltip contentStyle={{ background: "#0C0F1C", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="count" fill="#FF5D5D" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl p-5 border border-white/10 bg-ink2">
      <Icon size={16} className="text-teal mb-3" />
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-white/45 mt-1">{label}</div>
    </div>
  );
}

/* ---------------- Skills ---------------- */
function SkillsTab() {
  const [skills, setSkills] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", category: "", aliases: "" });
  const toast = useToast();

  const load = () => api.get("/admin/skills").then((res) => setSkills(res.data.skills));
  useEffect(() => { load(); }, []);

  const addSkill = async (e) => {
    e.preventDefault();
    if (!form.id || !form.name || !form.category) return;
    try {
      await api.post("/admin/skills", { ...form, aliases: form.aliases.split(",").map((a) => a.trim()).filter(Boolean) });
      setForm({ id: "", name: "", category: "", aliases: "" });
      toast.show(`Added "${form.name}"`, "success");
      load();
    } catch (err) {
      toast.show(err.response?.data?.error || "Couldn't add skill.", "error");
    }
  };

  const removeSkill = async (id) => {
    await api.delete(`/admin/skills/${id}`);
    toast.show("Skill removed", "info");
    load();
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 sr-fadeup">
      <div className="rounded-3xl border border-white/10 bg-ink2 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 text-xs border-b border-white/10">
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Category</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {skills === null && (
              <tr><td colSpan={4} className="p-4"><SkeletonBlock className="h-5 w-full" /></td></tr>
            )}
            {skills?.map((s) => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-mono text-xs text-white/50">{s.id}</td>
                <td className="p-4 font-medium">{s.name}</td>
                <td className="p-4 text-white/60">{s.category}</td>
                <td className="p-4 text-right">
                  <button onClick={() => removeSkill(s.id)} className="text-white/30 hover:text-coral transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={addSkill} className="rounded-3xl p-5 border border-white/10 bg-ink2 h-fit space-y-3">
        <h3 className="font-display font-semibold text-sm mb-1">Add a skill</h3>
        {["id", "name", "category"].map((field) => (
          <input
            key={field}
            placeholder={field === "id" ? "id (e.g. kubernetes)" : field}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-ink border border-white/10 text-sm outline-none focus:border-white/30"
          />
        ))}
        <input
          placeholder="aliases, comma-separated"
          value={form.aliases}
          onChange={(e) => setForm({ ...form, aliases: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-ink border border-white/10 text-sm outline-none focus:border-white/30"
        />
        <button type="submit" className="w-full py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 bg-teal text-ink">
          <Plus size={13} /> Add skill
        </button>
      </form>
    </div>
  );
}

/* ---------------- Roles ---------------- */
function RolesTab() {
  const [roles, setRoles] = useState(null);
  const [skills, setSkills] = useState([]);
  const [selected, setSelected] = useState(null);
  const toast = useToast();

  const load = () => api.get("/admin/roles").then((res) => setRoles(res.data.roles));
  useEffect(() => {
    load();
    api.get("/admin/skills").then((res) => setSkills(res.data.skills));
  }, []);

  const updateRequired = (skillId, value) => {
    setSelected((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r) => (r.skill_id === skillId ? { ...r, required: Number(value) } : r)),
    }));
  };

  const addSkillToRole = (skillId) => {
    if (selected.requirements.some((r) => r.skill_id === skillId)) return;
    setSelected((prev) => ({ ...prev, requirements: [...prev.requirements, { skill_id: skillId, required: 60 }] }));
  };

  const save = async () => {
    try {
      await api.put(`/admin/roles/${encodeURIComponent(selected.name)}`, { requirements: selected.requirements });
      toast.show(`Saved "${selected.name}"`, "success");
      load();
    } catch {
      toast.show("Couldn't save role.", "error");
    }
  };

  if (roles === null) return <SkeletonBlock className="h-64 w-full" />;

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-6 sr-fadeup">
      <div className="rounded-3xl border border-white/10 bg-ink2 p-3 h-fit">
        {Object.keys(roles).map((name) => (
          <button
            key={name}
            onClick={() => setSelected({ name, requirements: roles[name].requirements })}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm mb-1 transition-colors"
            style={selected?.name === name ? { background: "rgba(53,208,181,0.1)", color: "#35D0B5" } : { color: "rgba(255,255,255,0.6)" }}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-ink2 p-6">
        {!selected ? (
          <p className="text-sm text-white/40">Pick a role on the left to edit its requirements.</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold">{selected.name}</h3>
              <button onClick={save} className="px-4 py-1.5 rounded-full text-xs font-semibold bg-teal text-ink">
                Save changes
              </button>
            </div>
            <div className="space-y-3 mb-5">
              {selected.requirements.map((r) => {
                const skill = skills.find((s) => s.id === r.skill_id);
                return (
                  <div key={r.skill_id} className="flex items-center gap-3">
                    <span className="text-sm w-40 truncate">{skill?.name || r.skill_id}</span>
                    <input
                      type="range" min="0" max="100" value={r.required}
                      onChange={(e) => updateRequired(r.skill_id, e.target.value)}
                      className="flex-1"
                    />
                    <span className="font-mono text-xs w-10 text-right text-white/50">{r.required}</span>
                  </div>
                );
              })}
            </div>
            <select
              onChange={(e) => e.target.value && addSkillToRole(e.target.value)}
              value=""
              className="px-3 py-2 rounded-lg bg-ink border border-white/10 text-sm outline-none"
            >
              <option value="">+ Add a skill requirement…</option>
              {skills.filter((s) => !selected.requirements.some((r) => r.skill_id === s.id)).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Courses ---------------- */
function CoursesTab() {
  const [courses, setCourses] = useState(null);
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState({ skill_id: "", title: "", platform: "", duration_hours: "", difficulty: "Beginner", free: true, url: "" });
  const toast = useToast();

  const load = () => api.get("/admin/courses").then((res) => setCourses(res.data.courses));
  useEffect(() => {
    load();
    api.get("/admin/skills").then((res) => setSkills(res.data.skills));
  }, []);

  const addCourse = async (e) => {
    e.preventDefault();
    if (!form.skill_id || !form.title) return;
    try {
      await api.post("/admin/courses", { ...form, duration_hours: Number(form.duration_hours) || 1 });
      setForm({ skill_id: "", title: "", platform: "", duration_hours: "", difficulty: "Beginner", free: true, url: "" });
      toast.show(`Added "${form.title}"`, "success");
      load();
    } catch (err) {
      toast.show(err.response?.data?.error || "Couldn't add course.", "error");
    }
  };

  const removeCourse = async (title) => {
    await api.delete(`/admin/courses/${encodeURIComponent(title)}`);
    toast.show("Course removed", "info");
    load();
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 sr-fadeup">
      <div className="rounded-3xl border border-white/10 bg-ink2 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 text-xs border-b border-white/10">
              <th className="p-4 font-medium">Title</th>
              <th className="p-4 font-medium">Skill</th>
              <th className="p-4 font-medium">Platform</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {courses === null && <tr><td colSpan={4} className="p-4"><SkeletonBlock className="h-5 w-full" /></td></tr>}
            {courses?.map((c) => (
              <tr key={c.title} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-medium">{c.title}</td>
                <td className="p-4 text-white/60 font-mono text-xs">{c.skill_id}</td>
                <td className="p-4 text-white/60">{c.platform}</td>
                <td className="p-4 text-right">
                  <button onClick={() => removeCourse(c.title)} className="text-white/30 hover:text-coral transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={addCourse} className="rounded-3xl p-5 border border-white/10 bg-ink2 h-fit space-y-3">
        <h3 className="font-display font-semibold text-sm mb-1">Add a course</h3>
        <select
          value={form.skill_id}
          onChange={(e) => setForm({ ...form, skill_id: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-ink border border-white/10 text-sm outline-none"
        >
          <option value="">Skill…</option>
          {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {["title", "platform", "url"].map((field) => (
          <input
            key={field}
            placeholder={field}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-ink border border-white/10 text-sm outline-none focus:border-white/30"
          />
        ))}
        <div className="flex gap-2">
          <input
            type="number" placeholder="hours" value={form.duration_hours}
            onChange={(e) => setForm({ ...form, duration_hours: e.target.value })}
            className="w-1/2 px-3 py-2 rounded-lg bg-ink border border-white/10 text-sm outline-none"
          />
          <select
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            className="w-1/2 px-3 py-2 rounded-lg bg-ink border border-white/10 text-sm outline-none"
          >
            {["Beginner", "Intermediate", "Advanced"].map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs text-white/60">
          <input type="checkbox" checked={form.free} onChange={(e) => setForm({ ...form, free: e.target.checked })} />
          Free course
        </label>
        <button type="submit" className="w-full py-2 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 bg-teal text-ink">
          <Plus size={13} /> Add course
        </button>
      </form>
    </div>
  );
}
