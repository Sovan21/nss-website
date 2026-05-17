"use client";
import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

// ─── Config per toast type ────────────────────────────────────────────────────
const TYPE_CONFIG = {
  success: {
    gradient: "linear-gradient(135deg, #059669, #10b981)",
    glow: "rgba(16,185,129,0.35)",
    progress: "#6ee7b7",
    label: "Success",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  error: {
    gradient: "linear-gradient(135deg, #dc2626, #ef4444)",
    glow: "rgba(239,68,68,0.35)",
    progress: "#fca5a5",
    label: "Error",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    gradient: "linear-gradient(135deg, #d97706, #f59e0b)",
    glow: "rgba(245,158,11,0.35)",
    progress: "#fde68a",
    label: "Warning",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    gradient: "linear-gradient(135deg, #2563eb, #3b82f6)",
    glow: "rgba(59,130,246,0.35)",
    progress: "#93c5fd",
    label: "Info",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

// ─── Individual Toast Card ────────────────────────────────────────────────────
const ToastItem = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const cfg = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;

  const dismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 350);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    const duration = toast.duration || 4000;
    const interval = 30;
    const step = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) { clearInterval(timer); dismiss(); return 0; }
        return prev - step;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [toast.duration, dismiss]);

  return (
    <div
      style={{
        animation: isExiting ? "none" : "toast-in 0.45s cubic-bezier(0.16,1,0.3,1) forwards",
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? "translateX(110%) scale(0.88)" : undefined,
        transition: isExiting ? "all 0.35s cubic-bezier(0.4,0,1,1)" : undefined,
      }}
      className="relative flex items-start gap-3.5 min-w-[300px] max-w-[400px] overflow-hidden rounded-2xl"
      style={{
        background: "rgba(15,23,42,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: `0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.06)`,
        padding: "14px 16px 16px",
        animation: isExiting ? "none" : "toast-in 0.45s cubic-bezier(0.16,1,0.3,1) forwards",
        opacity: isExiting ? 0 : undefined,
        transform: isExiting ? "translateX(110%) scale(0.88)" : undefined,
        transition: isExiting ? "all 0.35s cubic-bezier(0.4,0,1,1)" : undefined,
      }}
    >
      {/* Left accent bar */}
      <div
        style={{ background: cfg.gradient, width: "3px", borderRadius: "99px", flexShrink: 0, marginTop: "2px", alignSelf: "stretch" }}
      />

      {/* Icon badge */}
      <div
        style={{
          background: cfg.gradient,
          boxShadow: `0 4px 14px ${cfg.glow}`,
          width: "34px", height: "34px",
          borderRadius: "10px",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, color: "white",
          marginTop: "1px",
        }}
      >
        {cfg.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>
          {cfg.label}
        </p>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9", lineHeight: "1.45" }}>
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={dismiss}
        style={{ color: "#475569", flexShrink: 0, padding: "4px", borderRadius: "8px", transition: "color 0.15s, background 0.15s", marginTop: "1px" }}
        onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "transparent"; }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "rgba(255,255,255,0.05)" }}>
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: cfg.gradient,
            borderRadius: "99px",
            transition: "none",
          }}
        />
      </div>
    </div>
  );
};

// ─── Confirm / Alert Modal ────────────────────────────────────────────────────
const CONFIRM_CONFIG = {
  danger: {
    gradient: "linear-gradient(135deg, #dc2626, #ef4444)",
    glow: "rgba(239,68,68,0.2)",
    iconBg: "#fef2f2",
    iconColor: "#dc2626",
    btnClass: "bg-red-600 hover:bg-red-700 shadow-red-600/30",
    accentBar: "linear-gradient(90deg, #dc2626, #f87171)",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  warning: {
    gradient: "linear-gradient(135deg, #d97706, #f59e0b)",
    glow: "rgba(245,158,11,0.2)",
    iconBg: "#fffbeb",
    iconColor: "#d97706",
    btnClass: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30",
    accentBar: "linear-gradient(90deg, #d97706, #fbbf24)",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    gradient: "linear-gradient(135deg, #2563eb, #3b82f6)",
    glow: "rgba(59,130,246,0.2)",
    iconBg: "#eff6ff",
    iconColor: "#2563eb",
    btnClass: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30",
    accentBar: "linear-gradient(90deg, #2563eb, #60a5fa)",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const ConfirmModal = ({ config, onResult }) => {
  const [isExiting, setIsExiting] = useState(false);
  const c = CONFIRM_CONFIG[config.type] || CONFIRM_CONFIG.info;

  const handleResult = (result) => {
    setIsExiting(true);
    setTimeout(() => onResult(result), 220);
  };

  if (!config) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        transition: "all 0.22s ease",
        opacity: isExiting ? 0 : 1,
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute", inset: 0,
          background: "rgba(2,6,23,0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onClick={() => handleResult(false)}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          background: "#ffffff",
          borderRadius: "24px",
          width: "100%", maxWidth: "420px",
          overflow: "hidden",
          boxShadow: `0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06), 0 8px 32px ${c.glow}`,
          transform: isExiting ? "scale(0.88) translateY(12px)" : "scale(1) translateY(0)",
          transition: "transform 0.22s cubic-bezier(0.4,0,1,1), opacity 0.22s ease",
          animation: isExiting ? "none" : "confirm-in 0.38s cubic-bezier(0.16,1,0.3,1) forwards",
        }}
      >
        {/* Gradient accent top bar */}
        <div style={{ height: "4px", background: c.accentBar }} />

        <div style={{ padding: "32px 28px 28px" }}>
          {/* Icon */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            <div
              style={{
                width: "64px", height: "64px",
                borderRadius: "18px",
                background: c.iconBg,
                color: c.iconColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 8px 24px ${c.glow}`,
              }}
            >
              {c.icon}
            </div>
          </div>

          {/* Title */}
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", textAlign: "center", marginBottom: "10px", letterSpacing: "-0.02em" }}>
            {config.title || "Confirm Action"}
          </h3>

          {/* Message */}
          <p style={{ fontSize: "14px", color: "#64748b", textAlign: "center", lineHeight: 1.6, marginBottom: "28px", fontWeight: 500 }}>
            {config.message}
          </p>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => handleResult(false)}
              style={{
                flex: 1, padding: "13px 0",
                background: "#f1f5f9",
                color: "#475569",
                fontWeight: 700, fontSize: "14px",
                borderRadius: "14px",
                border: "none",
                cursor: "pointer",
                transition: "background 0.15s, transform 0.1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
              onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              {config.cancelText || "Cancel"}
            </button>
            <button
              onClick={() => handleResult(true)}
              style={{
                flex: 1, padding: "13px 0",
                background: c.gradient,
                color: "white",
                fontWeight: 700, fontSize: "14px",
                borderRadius: "14px",
                border: "none",
                cursor: "pointer",
                boxShadow: `0 6px 20px ${c.glow}`,
                transition: "filter 0.15s, transform 0.1s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.08)"; e.currentTarget.style.boxShadow = `0 10px 28px ${c.glow}`; }}
              onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.boxShadow = `0 6px 20px ${c.glow}`; }}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.97)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              {config.confirmText || "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [confirmResolve, setConfirmResolve] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback({
    success: (msg, duration) => addToast(msg, "success", duration),
    error:   (msg, duration) => addToast(msg, "error",   duration),
    warning: (msg, duration) => addToast(msg, "warning", duration),
    info:    (msg, duration) => addToast(msg, "info",    duration),
  }, [addToast]);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmConfig({
        message,
        title:       options.title       || "Confirm Action",
        type:        options.type        || "info",
        confirmText: options.confirmText || "Confirm",
        cancelText:  options.cancelText  || "Cancel",
      });
      setConfirmResolve(() => resolve);
    });
  }, []);

  const handleConfirmResult = useCallback((result) => {
    if (confirmResolve) confirmResolve(result);
    setConfirmConfig(null);
    setConfirmResolve(null);
  }, [confirmResolve]);

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}
      {mounted && createPortal(
        <>
          {/* Toast stack — bottom-right */}
          <div
            style={{
              position: "fixed", bottom: "20px", right: "20px",
              zIndex: 99998,
              display: "flex", flexDirection: "column-reverse", gap: "10px",
              pointerEvents: "none",
            }}
          >
            {toasts.map((t) => (
              <div key={t.id} style={{ pointerEvents: "auto" }}>
                <ToastItem toast={t} onDismiss={removeToast} />
              </div>
            ))}
          </div>

          {/* Confirm modal */}
          {confirmConfig && <ConfirmModal config={confirmConfig} onResult={handleConfirmResult} />}
        </>,
        document.body
      )}

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes toast-in {
          0%   { opacity: 0; transform: translateX(110%) scale(0.85); }
          60%  { transform: translateX(-4%) scale(1.02); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes confirm-in {
          0%   { opacity: 0; transform: scale(0.82) translateY(16px); }
          70%  { transform: scale(1.02) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
