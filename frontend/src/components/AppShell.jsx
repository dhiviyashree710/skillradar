import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, GraduationCap, ListChecks, Settings, LogOut, ShieldCheck } from "lucide-react";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Gap Analysis", icon: LayoutDashboard },
  { to: "/recommendations", label: "Recommendations", icon: GraduationCap },
  { to: "/tracker", label: "Progress Tracker", icon: ListChecks },
];

function navLinkClass({ isActive }) {
  return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
    isActive ? "bg-teal/10 text-teal translate-x-0.5" : "text-white/55 hover:text-white hover:translate-x-0.5"
  }`;
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-ink text-white">
      <aside className="w-60 shrink-0 border-r border-white/10 p-5 hidden md:flex flex-col">
        <div className="mb-10"><Logo light to="/" /></div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          {user?.is_admin && (
            <NavLink to="/admin" className={navLinkClass}>
              <ShieldCheck size={16} />
              Admin Panel
            </NavLink>
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-1 pt-6 border-t border-white/10">
          <NavLink to="/settings" className={navLinkClass}>
            <Settings size={16} /> Settings
          </NavLink>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white transition-colors"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
    </div>
  );
}
