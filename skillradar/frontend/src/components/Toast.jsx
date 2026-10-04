import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const VARIANTS = {
  success: { icon: CheckCircle2, color: "#35D0B5" },
  error: { icon: AlertCircle, color: "#FF5D5D" },
  info: { icon: Info, color: "#8FA8FF" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, variant = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2 items-end">
        {toasts.map((t) => {
          const { icon: Icon, color } = VARIANTS[t.variant] || VARIANTS.info;
          return (
            <div
              key={t.id}
              className="sr-toast-in flex items-center gap-2.5 pl-3.5 pr-3 py-3 rounded-xl shadow-2xl border border-white/10 bg-[#141A2E] text-white max-w-sm"
            >
              <Icon size={16} style={{ color }} className="shrink-0" />
              <span className="text-sm">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="ml-1 text-white/30 hover:text-white/70 transition-colors">
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
