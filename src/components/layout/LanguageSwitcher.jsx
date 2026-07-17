"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (switcherRef.current && !switcherRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: "en", label: t("lang.english"), short: t("lang.en") },
    { code: "bn", label: t("lang.bengali"), short: t("lang.bn") },
    { code: "hi", label: t("lang.hindi"), short: t("lang.hi") },
  ];

  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];

  return (
    <div className="fixed bottom-6 right-6 z-[9999]" ref={switcherRef}>
      {/* Floating Menu Pop-up (above the button) */}
      {isOpen && (
        <div
          className="absolute bottom-16 right-0 w-36 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden mb-2 z-[10000] flex flex-col"
          style={{ 
            animation: "confirm-pop-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
          }}
        >
          <div className="py-1.5 flex flex-col">
            {languages.map((lang) => {
              const isActive = lang.code === locale;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLocale(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-xs font-bold transition-all flex items-center justify-between border-b border-white/[0.03] last:border-0 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{lang.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Circular Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-95 focus:outline-none border-2 border-white/90 group"
        aria-label="Change Language"
        title="Change Language"
      >
        <div className="flex flex-col items-center justify-center gap-0.5">
          {/* Modern Translation Globe Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.2}
            stroke="currentColor"
            className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918"
            />
          </svg>
          {/* Short language code indicator below the icon */}
          <span className="text-[9px] font-black uppercase tracking-wider leading-none">
            {currentLanguage.short}
          </span>
        </div>
      </button>
    </div>
  );
}
