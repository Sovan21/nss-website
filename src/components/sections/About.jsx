"use client";
import React, { useState, useEffect, useRef } from "react";
import { Icons } from "@/components/Icons";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";

export default function AboutPage({ onNavigate, siteData }) {
  const { t } = useLanguage();
  const finalData = siteData || {
    about_heading: "About Us",
    about_text: "Welcome to our NSS Unit.",
    about_image_url: "",
  };

  const images = finalData.about_image_url
    ? finalData.about_image_url.split(',').filter(Boolean)
    : ["https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200"];

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [camps, setCamps] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [achievementsTab, setAchievementsTab] = useState("camps"); // "camps" | "alumni"
  const [achievementsLoading, setAchievementsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchAchievements() {
      try {
        const [campsRes, alumniRes] = await Promise.all([
          supabase.from("nss_camps").select("*").order("year", { ascending: false }),
          supabase.from("nss_alumni").select("*").order("passing_year", { ascending: false })
        ]);
        if (isMounted) {
          if (campsRes.data) setCamps(campsRes.data);
          if (alumniRes.data) setAlumni(alumniRes.data);
        }
      } catch (err) {
        console.error("Error fetching achievements:", err);
      } finally {
        if (isMounted) setAchievementsLoading(false);
      }
    }
    fetchAchievements();
    return () => { isMounted = false; };
  }, []);

  const tabBarRef = useRef(null);

  const handleTabSwitch = (tab) => {
    if (achievementsTab === tab) return;

    const el = tabBarRef.current;
    const initialTop = el ? el.getBoundingClientRect().top : null;

    setAchievementsTab(tab);

    if (el && initialTop !== null) {
      requestAnimationFrame(() => {
        const newTop = el.getBoundingClientRect().top;
        const diff = newTop - initialTop;
        if (Math.abs(diff) > 0.5) {
          window.scrollBy({ top: diff, behavior: "instant" });
        }
      });
    }
  };

  const getCampBadgeColor = (type) => {
    const tLower = (type || "").toLowerCase();
    if (tLower.includes("nic")) return "bg-blue-600/10 text-blue-700 border-blue-200 font-extrabold";
    if (tLower.includes("pre") || tLower.includes("rd")) return "bg-purple-600/10 text-purple-700 border-purple-200 font-extrabold";
    if (tLower.includes("adven")) return "bg-emerald-600/10 text-emerald-700 border-emerald-200 font-extrabold";
    if (tLower.includes("youth") || tLower.includes("fest")) return "bg-amber-600/10 text-amber-800 border-amber-200 font-extrabold";
    return "bg-slate-600/10 text-slate-700 border-slate-200 font-bold";
  };

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImgIdx((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="pt-20 pb-12 md:pt-28 md:pb-16 px-4 sm:px-6 lg:px-8 bg-[#faf9f6] relative overflow-hidden flex-grow">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[35rem] h-[35rem] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[35rem] h-[35rem] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col">
        
        {/* ─── SECTION 1: EDITORIAL HERO HEADER (COMPACT) ─── */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-extrabold text-[10px] sm:text-xs uppercase tracking-widest mb-3 shadow-sm">
            <Icons.Info className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> {t("about.badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            {finalData.about_heading === "About Us" ? (
              <>
                {t("nav.about")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
                  NSS Unit
                </span>
              </>
            ) : finalData.about_heading}
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto mb-4"></div>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium leading-relaxed text-justify sm:text-center">
            {finalData.about_text}
          </p>
        </div>

        {/* ─── SECTION 2: DUAL FEATURE SHOWCASE (MOBILE: TEXT FIRST, PHOTO BELOW) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch mb-12 md:mb-16">
          
          {/* TEXT FIRST ON MOBILE (order-1), RIGHT ON DESKTOP (lg:order-2) */}
          <div className="order-1 lg:order-2 lg:col-span-6 flex flex-col justify-between space-y-3">
            <div className="mb-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-1">
                <Icons.Sparkles className="w-4 h-4 text-blue-600" />
                {t("about.objectives")}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Our foundational principles guiding community service and youth development.
              </p>
            </div>

            {[
              { text: t("about.obj1Text"), title: t("about.obj1Title"), icon: Icons.AcademicCap, badgeBg: "bg-blue-600/10 text-blue-700 border-blue-200" },
              { text: t("about.obj2Text"), title: t("about.obj2Title"), icon: Icons.Team, badgeBg: "bg-indigo-600/10 text-indigo-700 border-indigo-200" },
              { text: t("about.obj3Text"), title: t("about.obj3Title"), icon: Icons.Users, badgeBg: "bg-purple-600/10 text-purple-700 border-purple-200" }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgb(37,99,235,0.07)] hover:border-blue-300 transition-all duration-300 flex items-start gap-3.5 group"
              >
                <div className={`p-2.5 rounded-xl ${item.badgeBg} border shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-sm`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mb-0.5 tracking-tight group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* PHOTO BELOW TEXT ON MOBILE (order-2), LEFT ON DESKTOP (lg:order-1) */}
          <div className="order-2 lg:order-1 lg:col-span-6 flex flex-col justify-center">
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/11] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-slate-950 group">
              {images.map((imgUrl, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                    index === activeImgIdx ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`NSS Unit Activity ${index + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                </div>
              ))}
              <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/20">
                <div className="flex items-center gap-2 text-white font-extrabold text-[11px] sm:text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Banwarilal Bhalotia College NSS Unit</span>
                </div>
                {images.length > 1 && (
                  <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest bg-blue-600/30 px-2 py-0.5 rounded-full border border-blue-400/30">
                    {activeImgIdx + 1} / {images.length}
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ─── SECTION 3: KEY STATS & METRICS GRID (COMPACT) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12 md:mb-16 w-full">
          {[
            { value: t("about.stat1Value"), label: t("about.stat1Label"), desc: t("about.stat1Desc"), accent: "from-blue-600 to-indigo-600", icon: Icons.Users },
            { value: t("about.stat2Value"), label: t("about.stat2Label"), desc: t("about.stat2Desc"), accent: "from-indigo-600 to-purple-600", icon: Icons.Sparkles },
            { value: t("about.stat3Value"), label: t("about.stat3Label"), desc: t("about.stat3Desc"), accent: "from-purple-600 to-pink-600", icon: Icons.AcademicCap }
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgb(37,99,235,0.07)] hover:border-blue-300 transition-all duration-500 group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${stat.accent}`}>
                  {stat.value}
                </span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shadow-inner">
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mb-0.5 tracking-tight">
                  {stat.label}
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {stat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── SECTION 4: ACHIEVEMENTS & HALL OF FAME (FIXED BUTTON POSITIONING & COMPACT) ─── */}
        <div className="w-full border-t border-slate-200/80 pt-10 md:pt-14">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-extrabold text-[10px] sm:text-xs uppercase tracking-widest mb-2 shadow-sm">
              <Icons.AcademicCap className="w-3.5 h-3.5" /> {t("about.achievements.title")}
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
              {t("about.achievements.title")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              {t("about.achievements.subtitle")}
            </p>
          </div>

          {/* ROCK-SOLID FIXED TAB BUTTON WRAPPER (VIEWPORT POSITION IS LOCKED ON CLICK) */}
          <div ref={tabBarRef} className="flex justify-center mb-8 shrink-0">
            <div className="bg-slate-900 p-1.5 rounded-2xl flex gap-2 border border-slate-800 shadow-xl w-full sm:w-auto max-w-md">
              <button
                type="button"
                onClick={() => handleTabSwitch("camps")}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 cursor-pointer text-center select-none ${
                  achievementsTab === "camps"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t("about.achievements.tabCamps")}
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch("alumni")}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 cursor-pointer text-center select-none ${
                  achievementsTab === "alumni"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t("about.achievements.tabAlumni")}
              </button>
            </div>
          </div>

          {/* DYNAMIC CONTENT AREA (Grows/shrinks downwards according to data volume) */}
          <div className="w-full transition-all duration-300 min-h-[420px]">
            {achievementsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
              </div>
            ) : achievementsTab === "camps" ? (
              camps.length === 0 ? (
                <div className="text-center py-12 bg-white border border-slate-200/80 rounded-2xl p-6 max-w-md mx-auto shadow-sm">
                  <Icons.AcademicCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-extrabold text-slate-800 text-xs sm:text-sm">{t("about.achievements.noCamps")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {camps.map((camp) => (
                    <div
                      key={camp.id}
                      className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgb(37,99,235,0.07)] hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] sm:text-xs uppercase tracking-wider shadow-sm ${getCampBadgeColor(camp.camp_type)}`}>
                            <Icons.AcademicCap className="w-3.5 h-3.5" />
                            {camp.camp_type}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                            {camp.year}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-0.5">
                              {t("about.achievements.volunteers")}
                            </span>
                            <p className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                              {camp.volunteers}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                            <div>
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-0.5">
                                {t("about.achievements.location")}
                              </span>
                              <p className="text-xs sm:text-sm font-bold text-slate-700">
                                {camp.location}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-0.5">
                                {t("about.achievements.po")}
                              </span>
                              <p className="text-xs sm:text-sm font-bold text-slate-700">
                                {camp.po_name}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              alumni.length === 0 ? (
                <div className="text-center py-12 bg-white border border-slate-200/80 rounded-2xl p-6 max-w-md mx-auto shadow-sm">
                  <Icons.Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-extrabold text-slate-800 text-xs sm:text-sm">{t("about.achievements.noAlumni")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {alumni.map((alum) => (
                    <div
                      key={alum.id}
                      className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgb(37,99,235,0.07)] hover:border-blue-300 transition-all duration-300 flex flex-col sm:flex-row gap-4 group"
                    >
                      <div className="shrink-0 self-start sm:self-auto">
                        {alum.photo_url ? (
                          <img
                            src={alum.photo_url}
                            alt={alum.name}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-blue-100 shadow-md group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md border-2 border-blue-100">
                            {alum.name ? alum.name.charAt(0).toUpperCase() : "N"}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                          <h4 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            {alum.name}
                          </h4>
                          <span className="text-[10px] sm:text-xs bg-blue-50 border border-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-full shrink-0">
                            {t("about.achievements.alumniPassingBatch")}: {alum.passing_year}
                          </span>
                        </div>

                        <div className="mb-2">
                          <p className="text-xs font-extrabold text-slate-800">
                            {alum.current_position}
                          </p>
                          <p className="text-[11px] text-slate-500 font-bold">
                            {alum.organization}
                          </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block mb-0.5">
                            {t("about.achievements.alumniSuccess")}
                          </span>
                          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                            {alum.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

        </div>

        {/* ─── SECTION 5: INSPIRATIONAL CTA BANNER (COMPACT) ─── */}
        <div className="mt-12 md:mt-16 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white text-center relative overflow-hidden border border-white/10 shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <h3 className="text-xl sm:text-3xl font-black mb-3 tracking-tight leading-tight">
              Join Hands with NSS Unit BB College
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm mb-6 max-w-lg font-medium leading-relaxed">
              Empower society, develop leadership skills, and create a lasting social impact through dedicated community service.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new Event('open_nss_register'));
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-7 py-3 rounded-full text-xs transition-all shadow-lg hover:scale-105 uppercase tracking-wider cursor-pointer"
              >
                Become a Volunteer
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('activities')}
                className="bg-white/10 hover:bg-white/20 text-white font-extrabold px-7 py-3 rounded-full text-xs transition-all border border-white/20 uppercase tracking-wider cursor-pointer"
              >
                Explore Activities
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
