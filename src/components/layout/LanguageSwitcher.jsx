"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { trackVisitor, fetchVisitorCount, getOrCreateVisitorId } from "@/lib/visitorTracking";
import { supabase } from "@/lib/supabase";

export default function VisitorCounter() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ live: 1, total: null });

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
        // Clean up any stale channel before creating or subscribing
        const existing = supabase.getChannels().find(ch => ch.topic === 'realtime:online-visitors');
        if (existing) {
          await supabase.removeChannel(existing);
        }

        const channel = supabase.channel('online-visitors', {
          config: {
            presence: {
              key: visitorId, // Deduplicate multiple tabs by using the same visitorId key
            },
          },
        });

        channel
          .on('presence', { event: 'sync' }, () => {
            const presenceState = channel.presenceState();
            // Count unique visitorIds currently connected
            const uniqueOnlineCount = Object.keys(presenceState).length;
            setStats(prev => ({
              ...prev,
              live: uniqueOnlineCount || 1
            }));
          })
          .on('presence', { event: 'join' }, () => {
            const presenceState = channel.presenceState();
            const uniqueOnlineCount = Object.keys(presenceState).length;
            setStats(prev => ({
              ...prev,
              live: uniqueOnlineCount || 1
            }));
          })
          .on('presence', { event: 'leave' }, () => {
            const presenceState = channel.presenceState();
            const uniqueOnlineCount = Object.keys(presenceState).length;
            setStats(prev => ({
              ...prev,
              live: uniqueOnlineCount || 1
            }));
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel.track({
                online_at: new Date().toISOString(),
              });
            }
          });

        presenceChannel = channel;
      } catch (err) {
        console.error("Presence error:", err);
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

  const [isFooterVisible, setIsFooterVisible] = useState(false);

  // Detect when footer enters the viewport to hide the widget without layout thrashing
  useEffect(() => {
    let ticking = false;

    const handleCheckFooter = () => {
      ticking = false;
      const footer = document.getElementById('footer');
      if (!footer) {
        setIsFooterVisible(false);
        return;
      }
      const rect = footer.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const isVisible = rect.top <= windowHeight;
      setIsFooterVisible(prev => prev !== isVisible ? isVisible : prev);
    };

    const onScrollOrResize = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(handleCheckFooter);
      }
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    handleCheckFooter();

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);


  return (
    <div 
      className={`fixed bottom-[60px] left-4 sm:bottom-5 sm:left-5 z-40 flex items-center select-none transition-all duration-300 ease-in-out ${
        isFooterVisible 
          ? 'opacity-0 translate-y-4 pointer-events-none' 
          : 'opacity-100 translate-y-0 pointer-events-auto'
      }`}
    >
      {/* Visitor Counter Capsule */}
      <div 
        className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-md border border-white/15 rounded-full py-1.5 px-3 shadow-xl text-white text-[10px] sm:text-xs transition-all hover:border-white/30"
        style={{ 
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
          animation: "confirm-pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Live Count */}
        <div className="flex items-center gap-1.5" title="Users currently online">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="flex items-baseline gap-1">
            <span className="font-bold text-emerald-400 tracking-tight text-[10px] sm:text-xs">{stats.live !== null ? stats.live : "1"}</span>
            <span className="text-[7px] sm:text-[8px] text-white/60 font-black uppercase tracking-wider leading-none">{t("stats.live")}</span>
          </span>
        </div>

        {/* Vertical Divider */}
        <div className="h-3 w-[1px] bg-white/20"></div>

        {/* Total Count */}
        <div className="flex items-center gap-1" title="Total unique visitors">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2.2} 
            stroke="currentColor" 
            className="w-3 h-3 text-blue-400 shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="flex items-baseline gap-1">
            <span className="font-bold text-white tracking-tight text-[10px] sm:text-xs">{stats.total !== null ? stats.total.toLocaleString() : "..."}</span>
            <span className="text-[7px] sm:text-[8px] text-white/60 font-black uppercase tracking-wider leading-none">{t("stats.visitors")}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
