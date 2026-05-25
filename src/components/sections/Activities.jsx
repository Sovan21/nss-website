"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { Icons } from "@/components/Icons";
import LoadingScreen from "@/components/layout/LoadingScreen";

export default function ActivitiesPage({ prefetchedEvents }) {
  const [events, setEvents] = useState(prefetchedEvents || []);
  const [loading, setLoading] = useState(!prefetchedEvents);
  const [selectedEvent, setSelectedEvent] = useState(null);

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

  useEffect(() => {
    if (selectedEvent) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedEvent]);

  if (loading) return <LoadingScreen />;

  const getEventStatus = (start, end) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    if (today < startDate) return { text: "Upcoming", color: "bg-amber-50 text-amber-800 border-amber-200" };
    if (today > endDate) return { text: "Past Event", color: "bg-slate-100 text-slate-600 border-slate-200" };
    return { text: "Active Now", color: "bg-emerald-50 text-emerald-800 border-emerald-200 animate-pulse" };
  };

  const getCount = (text) => {
    if (!text || text.trim() === "") return 0;
    return text.split(",").filter((name) => name.trim() !== "").length;
  };

  return (
    <section className="pt-28 pb-12 md:pt-36 md:pb-20 px-4 sm:px-6 lg:px-8 bg-[#faf9f6] flex-grow">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-4 border border-blue-100">
            <Icons.Sparkles className="w-3.5 h-3.5" /> Impact in Action
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-none">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">Activities</span>
          </h2>
          <p className="text-slate-500 font-medium text-sm md:text-lg leading-relaxed">Discover how our volunteers are serving the community through dedicated service and leadership.</p>
        </div>

        {events.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl md:rounded-[2.5rem] text-center border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-300">
              <Icons.Calendar className="w-8 h-8" />
            </div>
            <p className="text-slate-400 font-bold tracking-tight">No activities published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {events.map((evt) => {
              const status = getEventStatus(evt.start_date, evt.end_date);
              
              return (
                <div
                  key={evt.id}
                  className="group bg-slate-900 rounded-3xl md:rounded-[2.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgb(37,99,235,0.15)] overflow-hidden border border-white/10 transition-all duration-700 hover:-translate-y-2 flex flex-col cursor-pointer relative aspect-[2/1]"
                  onClick={() => setSelectedEvent(evt)}
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={evt.banner_url}
                      alt={evt.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
                  </div>
                  
                  <div className="relative z-10 p-4 md:p-6 flex-1 flex flex-col justify-between">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <div className={`px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-black tracking-widest uppercase border shadow-2xl backdrop-blur-md transition-all duration-500 ${status.color} group-hover:scale-105`}>
                        {status.text}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-blue-100 bg-slate-900/60 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/20 shadow-lg">
                        <Icons.Calendar className="w-4 h-4 text-blue-400" />
                        {evt.start_date} {evt.start_date !== evt.end_date && ` - ${evt.end_date}`}
                      </div>
                    </div>
                    
                    <div className="transform transition-all duration-700 translate-y-8 md:translate-y-10 group-hover:translate-y-0">
                      <h3 className="font-black text-white leading-tight drop-shadow-2xl mb-2 tracking-tight text-xl md:text-3xl">
                        {evt.title}
                      </h3>
                      <div className="flex items-center gap-2 text-white font-black text-[10px] md:text-xs bg-white/10 hover:bg-blue-600 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 transition-all opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 w-max uppercase tracking-widest">
                        View Details <Icons.ArrowRight className="w-3.5 h-3.5 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
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
                  <h3 className="font-black text-sm md:text-xl tracking-tight uppercase leading-none">Event Detail</h3>
                  <p className="text-[10px] text-blue-400 font-bold mt-1 uppercase tracking-widest hidden md:block">NSS Unit Activities</p>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-all focus:outline-none cursor-pointer">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar bg-white">
              <div className="w-full bg-slate-900 aspect-video md:aspect-[21/9] relative overflow-hidden flex items-center justify-center">
                <img src={selectedEvent.banner_url} alt="Banner" loading="lazy" className="w-full h-full object-contain relative z-10" />
                <div className="absolute inset-0 blur-3xl opacity-40 scale-110">
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
                  {selectedEvent.start_date} {selectedEvent.start_date !== selectedEvent.end_date && ` to ${selectedEvent.end_date}`}
                </div>

                {selectedEvent.description && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-800 text-sm md:text-base mb-2 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                      <Icons.Document className="w-4 h-4 text-blue-700" /> Description
                    </h4>
                    <p className="text-slate-600 whitespace-pre-line leading-relaxed text-xs md:text-sm">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-extrabold text-blue-800 mb-1.5 flex items-center gap-2 text-xs md:text-sm">
                      <Icons.Users className="w-4 h-4" /> Volunteers ({getCount(selectedEvent.volunteers_present)})
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedEvent.volunteers_present || <span className="text-slate-400 italic">Participation details pending.</span>}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-extrabold text-purple-800 mb-1.5 flex items-center gap-2 text-xs md:text-sm">
                      <Icons.AcademicCap className="w-4 h-4" /> Teachers ({getCount(selectedEvent.teachers_present)})
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedEvent.teachers_present || <span className="text-slate-400 italic">Teacher details pending.</span>}
                    </p>
                  </div>
                </div>

                {selectedEvent.gallery_urls && selectedEvent.gallery_urls.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base mb-2 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                      <Icons.Photo className="w-4 h-4 text-blue-700" /> Event Gallery
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {selectedEvent.gallery_urls.map((url, i) => (
                        <a href={url} target="_blank" rel="noreferrer" key={i} className="block overflow-hidden rounded-lg shadow-sm border border-slate-200">
                          <img src={url} alt="Gallery" loading="lazy" className="w-full h-20 object-cover hover:scale-110 transition duration-500" />
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
