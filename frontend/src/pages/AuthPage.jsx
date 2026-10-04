import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Target } from "lucide-react";
import Logo from "../components/Logo";
import Field from "../components/Field";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", current_role: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await signup(form);
      }
      navigate("/onboarding");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Check the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper text-[#1B1F2E] px-6 relative">
      <div className="absolute top-6 left-6"><Logo /></div>
      <div className="w-full max-w-md sr-fadeup">
        <form onSubmit={submit} className="rounded-3xl p-8 shadow-xl border border-black/5 bg-white">
          <div className="flex gap-1 p-1 rounded-full mb-8 bg-paper2">
            {["login", "signup"].map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-full text-sm font-semibold transition-all capitalize"
                style={mode === m ? { background: "#1B1F2E", color: "#fff" } : { color: "#8A90AC" }}
              >
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <h2 className="font-display text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="text-sm text-black/40 mt-1 mb-6">
            {mode === "login" ? "Pick up where your last scan left off." : "Takes two minutes. No credit card."}
          </p>

          <div className="space-y-3">
            {mode === "signup" && <Field icon={User} placeholder="Full name" value={form.name} onChange={update("name")} required />}
            <Field icon={Mail} type="email" placeholder="Email address" value={form.email} onChange={update("email")} required />
            <Field icon={Lock} type="password" placeholder="Password" value={form.password} onChange={update("password")} required minLength={6} />
            {mode === "signup" && (
              <Field icon={Target} placeholder="Current role or domain (optional)" value={form.current_role} onChange={update("current_role")} />
            )}
          </div>

          {error && <p className="text-xs text-coral mt-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 rounded-full font-semibold text-sm text-white transition-transform hover:scale-[1.02] disabled:opacity-60 bg-[#1B1F2E]"
          >
            {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>

          <p className="text-center text-xs text-black/35 mt-6">
            {mode === "login" ? "New here?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-semibold text-[#1B1F2E]">
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
