"use client";

import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { trackVisitor, fetchVisitorCount, getOrCreateVisitorId } from "@/lib/visitorTracking";
import { supabase } from "@/lib/supabase";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef(null);
  const [stats, setStats] = useState({ live: 1, total: null });

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

  // Track visitor, fetch total count, and sync WebSocket presence for live visitors
  useEffect(() => {
    let statsInterval;
    let presenceChannel;

    async function initStats() {
      // 1. Increment total count in DB if new unique visitor
      await trackVisitor();

      // 2. Fetch the current total count
      const countData = await fetchVisitorCount();
      setStats(prev => ({ ...prev, total: countData.total }));

      // 3. Connect to Supabase Presence to track live users in real time via WebSockets
      const visitorId = getOrCreateVisitorId();
      if (!visitorId) return;

      try {
        presenceChannel = supabase.channel('online-visitors', {
          config: {
            presence: {
              key: visitorId, // Deduplicate multiple tabs by using the same visitorId key
            },
          },
        });

        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            const presenceState = presenceChannel.presenceState();
            // Count unique visitorIds currently connected
            const uniqueOnlineCount = Object.keys(presenceState).length;
            setStats(prev => ({
              ...prev,
              live: uniqueOnlineCount || 1
            }));
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await presenceChannel.track({ online_at: new Date().toISOString() });
            }
          });
      } catch (e) {
        console.warn('Realtime Presence subscription failed:', e.message);
      }
    }

    initStats();

    // Refresh total count from database every 60 seconds
    statsInterval = setInterval(async () => {
      if (document.visibilityState === "visible") {
        const countData = await fetchVisitorCount();
        setStats(prev => ({
          ...prev,
          total: countData.total
        }));
      }
    }, 60000);

    return () => {
      clearInterval(statsInterval);
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
    };
  }, []);

  const languages = [
    { code: "en", label: t("lang.english"), short: t("lang.en") },
    { code: "bn", label: t("lang.bengali"), short: t("lang.bn") },
    { code: "hi", label: t("lang.hindi"), short: t("lang.hi") },
  ];

  const currentLanguage = languages.find((lang) => lang.code === locale) || languages[0];

  const [hiddenByFooter, setHiddenByFooter] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Detect when Login / Register modal is opened
  useEffect(() => {
    const checkModal = () => {
      const modalActive = !!document.getElementById('nss-auth-modal');
      setIsAuthModalOpen(modalActive);
    };

    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Hide floating UI only when footer's top reaches the floating elements' position
  useEffect(() => {
    let retryTimer;
    let footerEl;

    const checkOverlap = () => {
      if (!footerEl) return;
      const footerTop = footerEl.getBoundingClientRect().top;
      const threshold = window.innerHeight - 80; // floating UI is ~80px from bottom
      setHiddenByFooter(footerTop < threshold);
    };

    const attach = () => {
      footerEl = document.getElementById('footer');
      if (!footerEl) { retryTimer = setTimeout(attach, 1000); return; }
      checkOverlap();
      window.addEventListener('scroll', checkOverlap, { passive: true });
    };

    attach();
    return () => { clearTimeout(retryTimer); window.removeEventListener('scroll', checkOverlap); };
  }, []);

  const isHidden = hiddenByFooter || isAuthModalOpen;

  return (
    <div
      className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[9999] flex items-center gap-1.5 sm:gap-3 select-none"
      style={{
        transformOrigin: 'right center',
        transform: isHidden ? 'scaleX(0) scaleY(0.75)' : 'scaleX(1) scaleY(1)',
        opacity: isHidden ? 0 : 1,
        pointerEvents: isHidden ? 'none' : 'auto',
        transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Visitor Counter Capsule */}
      <div 
        className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-full py-1 sm:py-1.5 px-2.5 sm:px-3 shadow-xl text-white text-[9px] sm:text-[10px] transition-all hover:border-white/20"
        style={{ 
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
          animation: "confirm-pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Live Count */}
        <div className="flex items-center gap-1 sm:gap-1.5" title="Users currently online">
          <span className="relative flex h-1 w-1 sm:h-1.5 sm:w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1 w-1 sm:h-1.5 sm:w-1.5 bg-emerald-500"></span>
          </span>
          <span className="flex items-baseline gap-0.5">
            <span className="font-bold text-emerald-400 tracking-tight text-[9px] sm:text-[11px]">{stats.live !== null ? stats.live : "..."}</span>
            <span className="text-[6px] sm:text-[7px] text-white/50 font-black uppercase tracking-wider leading-none">{t("stats.live")}</span>
          </span>
        </div>

        {/* Vertical Divider */}
        <div className="h-2 sm:h-2.5 w-[1px] bg-white/20"></div>

        {/* Total Count */}
        <div className="flex items-center gap-0.5 sm:gap-1" title="Total unique visitors">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2.2} 
            stroke="currentColor" 
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="flex items-baseline gap-0.5">
            <span className="font-bold text-white tracking-tight text-[9px] sm:text-[11px]">{stats.total !== null ? stats.total.toLocaleString() : "..."}</span>
            <span className="text-[6px] sm:text-[7px] text-white/50 font-black uppercase tracking-wider leading-none">{t("stats.visitors")}</span>
          </span>
        </div>
      </div>

      {/* Floating Language Switcher Wrapper */}
      <div className="relative" ref={switcherRef}>
        {/* Floating Menu Pop-up (above the button) */}
        {isOpen && (
          <div
            className="absolute bottom-12 sm:bottom-16 right-0 w-32 sm:w-36 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl overflow-hidden mb-2 z-[10000] flex flex-col"
            style={{ 
              animation: "confirm-pop-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
            }}
          >
            <div className="py-1 sm:py-1.5 flex flex-col">
              {languages.map((lang) => {
                const isActive = lang.code === locale;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLocale(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-xs font-bold transition-all flex items-center justify-between border-b border-white/[0.03] last:border-0 ${
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
          className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-95 focus:outline-none border-2 border-white/90 group"
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
              className="w-3.5 h-3.5 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918"
              />
            </svg>
            {/* Short language code indicator below the icon */}
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider leading-none">
              {currentLanguage.short}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
