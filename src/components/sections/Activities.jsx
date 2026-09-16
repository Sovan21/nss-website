"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { Icons } from "@/components/Icons";
import LoadingScreen from "@/components/layout/LoadingScreen";
import { useLanguage } from "@/context/LanguageContext";
import useScrollLock from '@/lib/useScrollLock';
import { getOptimizedImageUrl } from '@/lib/cloudinary';

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [_, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear());
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
};

export default function ActivitiesPage({ prefetchedEvents }) {
  const { t } = useLanguage();
  const [events, setEvents] = useState(prefetchedEvents || []);
  const [loading, setLoading] = useState(!prefetchedEvents);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleGlobalSearch = (e) => {
      if (e.detail) {
        setSearchQuery(e.detail);
      }
    };
    const handleOpenEvent = (e) => {
      if (e?.detail) {
        const target = events.find(ev => String(ev.id) === String(e.detail) || ev.title === e.detail);
        if (target) {
          setSelectedEvent(target);
        }
      }
    };
    window.addEventListener("nss_search", handleGlobalSearch);
    window.addEventListener("nss_open_event", handleOpenEvent);
    return () => {
      window.removeEventListener("nss_search", handleGlobalSearch);
      window.removeEventListener("nss_open_event", handleOpenEvent);
    };
  }, [events]);

  useEffect(() => {
    // If data was already provided by the parent, skip fetching
    if (prefetchedEvents) {
      setEvents(prefetchedEvents);
      setLoading(false);
      return;
    }
    const fetchEvents = async () => {
      try {
        const { data } = await supabase.from("events").select("*").order("start_date", { ascending: false });
        if (data) setEvents(data);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [prefetchedEvents]);

  useScrollLock(!!selectedEvent);

  if (loading) return <LoadingScreen />;

  const getEventStatus = (start, end) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    if (today < startDate) return { text: t("activities.upcoming"), color: "bg-amber-400 text-slate-950 border-amber-300 font-extrabold" };
    if (today > endDate) return { text: t("activities.past"), color: "bg-slate-800 text-slate-200 border-slate-700 font-bold" };
    return { text: t("activities.activeNow"), color: "bg-emerald-400 text-slate-950 border-emerald-300 font-extrabold animate-pulse" };
  };

  const getCount = (text) => {
    if (!text || text.trim() === "") return 0;
    return text.split(",").filter((name) => name.trim() !== "").length;
  };

  const filteredEvents = searchQuery
    ? events.filter(e => 
        (e.title && e.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : events;

  return (
    <section className="w-full bg-[#faf9f6] py-8 sm:py-10 px-4 sm:px-6 lg:px-8 flex-grow">
      <div className="max-w-7xl mx-auto flex flex-col">
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#004899] text-xs font-black uppercase tracking-widest shadow-xs mb-2.5">
            <Icons.Sparkles className="w-4 h-4 text-blue-600" />
            <span>{t("activities.badge")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight font-poppins">
            {t("activities.heading")} <span className="text-[#004899] underline decoration-amber-400 decoration-4 underline-offset-8">{t("activities.headingAccent")}</span>
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            {t("activities.subtitle")}
          </p>

          {searchQuery && (
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs">
              <span>Showing results for: &ldquo;<strong className="font-bold">{searchQuery}</strong>&rdquo;</span>
              <button 
                onClick={() => setSearchQuery("")}
                className="ml-1 w-4 h-4 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-900 flex items-center justify-center text-[10px] cursor-pointer font-bold"
                title="Clear search"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-white p-10 sm:p-12 rounded-3xl text-center border border-slate-200/80 shadow-sm my-2">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-100 text-slate-400">
              <Icons.Calendar className="w-7 h-7" />
            </div>
            <p className="text-slate-600 font-bold text-sm">
              {searchQuery ? `No activities found matching "${searchQuery}"` : t("activities.noEvents")}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 bg-[#004899] hover:bg-[#003366] text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-colors"
              >
                View All Activities
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredEvents.map((evt) => {
              const status = getEventStatus(evt.start_date, evt.end_date);
              
              return (
                <div
                  key={evt.id}
                  className="group bg-white rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-xl overflow-hidden border border-slate-200/90 transition-all duration-300 hover:-translate-y-1 flex flex-col cursor-pointer"
                  onClick={() => setSelectedEvent(evt)}
                >
                  {/* 16:9 Aspect Ratio Banner Container with zero cropping */}
                  <div className="w-full aspect-video bg-slate-950 relative overflow-hidden flex items-center justify-center">
                    {/* Ambient blurred backdrop to seamlessly fill any aspect differences */}
                    <div className="absolute inset-0 blur-xl opacity-35 scale-110 pointer-events-none">
                      <img
                        src={getOptimizedImageUrl(evt.banner_url, { width: 400, quality: 'auto' })}
                        alt="Background Blur"
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* 100% Complete & Uncropped Banner */}
                    <img
                      src={getOptimizedImageUrl(evt.banner_url, { width: 720, quality: 'auto' })}
                      alt={evt.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Status Pill (Top Left) */}
                    <div className="absolute top-3 left-3 z-20">
                      <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border shadow-md backdrop-blur-md ${status.color}`}>
                        {status.text}
                      </div>
                    </div>

                    {/* Date Pill (Top Right) */}
                    <div className="absolute top-3 right-3 z-20">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-white bg-slate-950/85 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 shadow-md">
                        <Icons.Calendar className="w-3 h-3 text-blue-400" />
                        {formatDate(evt.start_date)}{evt.start_date !== evt.end_date && ` - ${formatDate(evt.end_date)}`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Container */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white">
                    <div>
                      <h3 className="font-bold text-slate-900 leading-snug mb-2 tracking-tight text-base sm:text-lg line-clamp-2 group-hover:text-[#004899] transition-colors">
                        {evt.title}
                      </h3>
                      {evt.description && (
                        <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-3">
                          {evt.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Card Footer: View Details CTA */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        NSS Event
                      </span>
                      <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#004899] group-hover:text-blue-700 transition-colors">
                        {t("activities.viewDetails")}
                        <Icons.ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedEvent && createPortal(
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-[9999] p-3 md:p-6 overflow-hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94dvh] md:max-h-[90vh] flex flex-col relative overflow-hidden animate-fade-in-up border border-white/20">
            <div className="bg-slate-900 p-4 md:p-6 flex justify-between items-center text-white shrink-0 z-20 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <Icons.Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm md:text-xl tracking-tight uppercase leading-none">{t("activities.viewDetails")}</h3>
                  <p className="text-[10px] text-blue-400 font-bold mt-1 uppercase tracking-widest hidden md:block">{t("activities.badge")}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-all focus:outline-none cursor-pointer">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar bg-white">
              <div className="w-full bg-slate-950 aspect-video relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                <img src={selectedEvent.banner_url} alt="Banner" loading="lazy" className="w-full h-full object-contain relative z-10" />
                <div className="absolute inset-0 blur-2xl opacity-30 scale-105 pointer-events-none">
                  <img src={selectedEvent.banner_url} alt="BG" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                    {selectedEvent.title}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border ${getEventStatus(selectedEvent.start_date, selectedEvent.end_date).color}`}>
                    {getEventStatus(selectedEvent.start_date, selectedEvent.end_date).text}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 mb-5 bg-blue-50 border border-blue-100 text-blue-800 font-bold px-3 py-1.5 rounded-lg text-xs">
                  <Icons.Calendar className="w-4 h-4" />
                  {formatDate(selectedEvent.start_date)}{selectedEvent.start_date !== selectedEvent.end_date && `${t("activities.dateTo")}${formatDate(selectedEvent.end_date)}`}
                </div>

                {selectedEvent.description && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-800 text-sm md:text-base mb-2 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                      <Icons.Document className="w-4 h-4 text-blue-700" /> {t("activities.description")}
                    </h4>
                    <p className="text-slate-600 whitespace-pre-line leading-relaxed text-xs md:text-sm">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-extrabold text-blue-800 mb-1.5 flex items-center gap-2 text-xs md:text-sm">
                      <Icons.Users className="w-4 h-4" /> {t("activities.volunteers")} ({getCount(selectedEvent.volunteers_present)})
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedEvent.volunteers_present || <span className="text-slate-400 italic">{t("activities.noVolunteers")}</span>}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-extrabold text-purple-800 mb-1.5 flex items-center gap-2 text-xs md:text-sm">
                      <Icons.AcademicCap className="w-4 h-4" /> {t("activities.teachers")} ({getCount(selectedEvent.teachers_present)})
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedEvent.teachers_present || <span className="text-slate-400 italic">{t("activities.noTeachers")}</span>}
                    </p>
                  </div>
                </div>

                {selectedEvent.gallery_urls && selectedEvent.gallery_urls.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base mb-2 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                      <Icons.Photo className="w-4 h-4 text-blue-700" /> {t("activities.gallery")}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedEvent.gallery_urls.map((url, i) => (
                        <a href={url} target="_blank" rel="noreferrer" key={i} className="block overflow-hidden rounded-lg shadow-sm border border-slate-200">
                          <img 
                            src={getOptimizedImageUrl(url, { width: 300, quality: 'auto' })} 
                            alt="Gallery" 
                            loading="lazy" 
                            decoding="async"
                            className="w-full h-20 object-cover hover:scale-110 transition duration-500" 
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
