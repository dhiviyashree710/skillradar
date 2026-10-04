import React, { useState } from "react";
import { Download, Save, CheckCircle2 } from "lucide-react";
import AppShell from "../components/AppShell";
import Field from "../components/Field";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

const EXPERIENCE_LEVELS = ["Fresher", "Intermediate", "Experienced"];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || "");
  const [currentRole, setCurrentRole] = useState(user?.current_role || "");
  const [experience, setExperience] = useState(user?.experience_level || EXPERIENCE_LEVELS[0]);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/profile/me", { name, current_role: currentRole });
      await api.put("/profile/target", { experience_level: experience });
      await refreshUser();
      toast.show("Profile updated", "success");
    } catch (err) {
      toast.show(err.response?.data?.error || "Couldn't save your profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/report/gap-report.pdf", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "skillradar-gap-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.show("Report downloaded", "success");
    } catch (err) {
      toast.show(
        err.response?.status === 400
          ? "Set a target role first (finish onboarding)."
          : "Couldn't generate the report.",
        "error"
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-8 sr-fadeup">
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-white/45 mt-1">Update your profile or export your results.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
        <form onSubmit={saveProfile} className="rounded-3xl p-6 border border-white/10 bg-ink2 sr-fadeup">
          <h3 className="font-display font-semibold mb-4">Profile</h3>
          <div className="space-y-3">
            <div className="[&_input]:text-white [&_input]:placeholder:text-white/30 [&>div]:border-white/10">
              <Field placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="[&_input]:text-white [&_input]:placeholder:text-white/30 [&>div]:border-white/10">
              <Field placeholder="Current role (optional)" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-2 block">Experience level</label>
              <div className="flex gap-2">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setExperience(lvl)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors border"
                    style={
                      experience === lvl
                        ? { background: "rgba(53,208,181,0.12)", borderColor: "#35D0B5", color: "#35D0B5" }
                        : { borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }
                    }
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-5 w-full py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-60 bg-teal text-ink"
          >
            {saving ? "Saving…" : <><Save size={14} /> Save changes</>}
          </button>
        </form>

        <div className="rounded-3xl p-6 border border-white/10 bg-ink2 sr-fadeup" style={{ animationDelay: "100ms" }}>
          <h3 className="font-display font-semibold mb-2">Gap report</h3>
          <p className="text-sm text-white/45 mb-5 leading-relaxed">
            Download your current readiness score and skill breakdown as a PDF — handy for sharing with a mentor or
            keeping a record as you close gaps over time.
          </p>
          <button
            onClick={downloadReport}
            disabled={downloading}
            className="w-full py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 border border-white/15 hover:bg-white/5 transition-colors disabled:opacity-60"
          >
            {downloading ? "Generating…" : <><Download size={14} /> Download gap report (PDF)</>}
          </button>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <CheckCircle2 size={13} className="text-teal" />
              Account: {user?.email}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
