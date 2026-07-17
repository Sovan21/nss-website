"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { Icons } from "@/components/Icons";
import { useLanguage } from "@/context/LanguageContext";
import { CALENDAR_EVENTS } from "@/data/calendarEvents";

/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL HOOK — IntersectionObserver-based
   ═══════════════════════════════════════════════════════════════ */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

/* Bulk reveal for a container — reveals all `.scroll-reveal` children */
function useChildReveal(threshold = 0.1) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = container.querySelectorAll(".scroll-reveal, .scroll-reveal-left, .scroll-reveal-right");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [threshold]);

  return containerRef;
}

/* ═══════════════════════════════════════════════════════════════
   SECTION HEADER — Reusable label + heading + subtitle
   ═══════════════════════════════════════════════════════════════ */
function SectionHeader({ label, labelIcon: LabelIcon, heading, headingAccent, subtitle, light = false }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className="scroll-reveal text-center max-w-3xl mx-auto mb-6 md:mb-10">
      <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest mb-4 border ${light ? "bg-white/10 border-white/20 text-blue-200" : "bg-blue-50 border-blue-100 text-blue-700"}`}>
        {LabelIcon && <LabelIcon className="w-3.5 h-3.5" />} {label}
      </div>
      <h2 className={`text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight ${light ? "text-white" : "text-slate-900"}`}>
        {heading}{" "}
        {headingAccent && (
          <span className={`${light ? "text-blue-300" : "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700"}`}>
            {headingAccent}
          </span>
        )}
      </h2>
      {subtitle && (
        <p className={`text-xs md:text-base leading-relaxed font-medium max-w-2xl mx-auto ${light ? "text-slate-300" : "text-slate-500"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BLOCK 1 — What is NSS?
   ═══════════════════════════════════════════════════════════════ */
function WhatIsNSS() {
  const { t, tHtml } = useLanguage();
  const containerRef = useChildReveal();

  const facts = [
    { icon: Icons.Calendar, label: t("nss.whoWeAre.fact1Label"), value: t("nss.whoWeAre.fact1Value"), color: "from-blue-500 to-indigo-500" },
    { icon: Icons.Flag, label: t("nss.whoWeAre.fact2Label"), value: t("nss.whoWeAre.fact2Value"), color: "from-indigo-500 to-purple-500" },
    { icon: Icons.BuildingLibrary, label: t("nss.whoWeAre.fact3Label"), value: t("nss.whoWeAre.fact3Value"), color: "from-purple-500 to-blue-500" },
    { icon: Icons.Sun, label: t("nss.whoWeAre.fact4Label"), value: t("nss.whoWeAre.fact4Value"), color: "from-blue-500 to-cyan-500" },
  ];

  return (
    <section className="relative py-10 md:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div ref={containerRef} className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          label={t("nss.whoWeAre.label")}
          labelIcon={Icons.Shield}
          heading={t("nss.whoWeAre.heading")}
          headingAccent={t("nss.whoWeAre.headingAccent")}
          subtitle={t("nss.whoWeAre.subtitle")}
          light
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* Left — Narrative Text */}
          <div className="scroll-reveal-left">
            <p 
              className="text-sm md:text-base text-slate-300 leading-relaxed mb-4 font-medium text-justify"
              dangerouslySetInnerHTML={{ __html: tHtml("nss.whoWeAre.para1") }}
            />
            <p 
              className="text-sm md:text-base text-slate-300 leading-relaxed mb-4 font-medium text-justify"
              dangerouslySetInnerHTML={{ __html: tHtml("nss.whoWeAre.para2") }}
            />
            <p 
              className="text-sm md:text-base text-slate-400 leading-relaxed font-medium italic text-justify"
              dangerouslySetInnerHTML={{ __html: tHtml("nss.whoWeAre.para3") }}
            />
          </div>

          {/* Right — Fact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {facts.map((fact, idx) => (
              <div
                key={idx}
                className={`scroll-reveal reveal-delay-${idx + 1} group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 md:p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-1`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${fact.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  <fact.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">{fact.label}</p>
                <p className="text-sm md:text-base text-white font-bold leading-snug">{fact.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Core NSS Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 md:mt-16">
          {/* Card 1: Objectives */}
          <div className="scroll-reveal group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-1 flex flex-col">
            <div className="flex items-center gap-3.5 mb-5 shrink-0">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 shrink-0">
                <Icons.Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight">{t("nss.objectives.title")}</h3>
            </div>
            <ul className="space-y-3.5 flex-1">
              {[
                t("nss.objectives.item1"),
                t("nss.objectives.item2"),
                t("nss.objectives.item3"),
                t("nss.objectives.item4")
              ].map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-3 text-slate-300 text-sm md:text-base leading-relaxed font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/40 border border-amber-400/60 mt-1.5 shrink-0 animate-pulse"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2: Major Activities */}
          <div className="scroll-reveal group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-1 flex flex-col">
            <div className="flex items-center gap-3.5 mb-5 shrink-0">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 shrink-0">
                <Icons.Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight">{t("nss.activities.title")}</h3>
            </div>
            <ul className="space-y-3.5 flex-1">
              {[
                t("nss.activities.item1"),
                t("nss.activities.item2"),
                t("nss.activities.item3"),
                t("nss.activities.item4"),
                t("nss.activities.item5"),
                t("nss.activities.item6"),
                t("nss.activities.item7")
              ].map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-3 text-slate-300 text-sm md:text-base leading-relaxed font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/40 border border-emerald-400/60 mt-1.5 shrink-0 animate-pulse"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 3: Eligibility */}
          <div className="scroll-reveal group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-1 flex flex-col">
            <div className="flex items-center gap-3.5 mb-5 shrink-0">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 shrink-0">
                <Icons.AcademicCap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight">{t("nss.eligibility.title")}</h3>
            </div>
            <div className="flex flex-col justify-between flex-1">
              <div>
                <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-wider mb-2.5">{t("nss.eligibility.subtitle")}</p>
                <ul className="space-y-3 mb-5">
                  {[
                    t("nss.eligibility.item1"),
                    t("nss.eligibility.item2"),
                    t("nss.eligibility.item3")
                  ].map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-3 text-slate-300 text-sm md:text-base leading-relaxed font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400/40 border border-blue-400/60 mt-1.5 shrink-0 animate-pulse"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-4 border-t border-white/10 text-xs md:text-sm text-slate-400 font-bold leading-relaxed italic">
                {t("nss.eligibility.note")}
              </div>
            </div>
          </div>

          {/* Card 4: Benefits of Joining NSS */}
          <div className="scroll-reveal group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-1 flex flex-col">
            <div className="flex items-center gap-3.5 mb-5 shrink-0">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 shrink-0">
                <Icons.Trophy className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight">{t("nss.benefits.title")}</h3>
            </div>
            <ul className="space-y-3.5 flex-1">
              {[
                t("nss.benefits.item1"),
                t("nss.benefits.item2"),
                t("nss.benefits.item3"),
                t("nss.benefits.item4"),
                t("nss.benefits.item5")
              ].map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-3 text-slate-300 text-sm md:text-base leading-relaxed font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400/40 border border-purple-400/60 mt-1.5 shrink-0 animate-pulse"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BLOCK 2 — What We Do
   ═══════════════════════════════════════════════════════════════ */
function WhatWeDo() {
  const { t } = useLanguage();
  const containerRef = useChildReveal();

  const activities = [
    {
      icon: Icons.Heart,
      title: t("nss.whatWeDo.card1Title"),
      desc: t("nss.whatWeDo.card1Desc"),
      color: "text-rose-600 bg-rose-50 border-rose-100",
    },
    {
      icon: Icons.Leaf,
      title: t("nss.whatWeDo.card2Title"),
      desc: t("nss.whatWeDo.card2Desc"),
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      icon: Icons.BookOpen,
      title: t("nss.whatWeDo.card3Title"),
      desc: t("nss.whatWeDo.card3Desc"),
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      icon: Icons.Shield,
      title: t("nss.whatWeDo.card4Title"),
      desc: t("nss.whatWeDo.card4Desc"),
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      icon: Icons.Drop,
      title: t("nss.whatWeDo.card5Title"),
      desc: t("nss.whatWeDo.card5Desc"),
      color: "text-cyan-600 bg-cyan-50 border-cyan-100",
    },
    {
      icon: Icons.Handshake,
      title: t("nss.whatWeDo.card6Title"),
      desc: t("nss.whatWeDo.card6Desc"),
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
  ];

  return (
    <section className="relative py-10 md:py-16 px-4 sm:px-6 lg:px-8 bg-[#faf9f6] overflow-hidden">
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div ref={containerRef} className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          label={t("nss.whatWeDo.label")}
          labelIcon={Icons.Target}
          heading={t("nss.whatWeDo.heading")}
          headingAccent={t("nss.whatWeDo.headingAccent")}
          subtitle={t("nss.whatWeDo.subtitle")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {activities.map((item, idx) => (
            <div
              key={idx}
              className={`scroll-reveal reveal-delay-${idx + 1} group bg-white border border-slate-200/60 rounded-2xl p-4 md:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_16px_40px_rgb(37,99,235,0.06)] hover:border-blue-200/50 hover:-translate-y-1 transition-all duration-500`}
            >
              <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl ${item.color} border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500`}>
                <item.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-base md:text-lg font-black text-slate-900 mb-2 tracking-tight">{item.title}</h3>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BLOCK 3 — What You Give / What You Get
   ═══════════════════════════════════════════════════════════════ */
function GiveAndGet() {
  const { t } = useLanguage();
  const containerRef = useChildReveal();

  const give = [
    { icon: Icons.Clock, text: t("nss.giveGet.give1") },
    { icon: Icons.Calendar, text: t("nss.giveGet.give2") },
    { icon: Icons.HandRaised, text: t("nss.giveGet.give3") },
    { icon: Icons.LightBulb, text: t("nss.giveGet.give4") },
  ];

  const get = [
    { icon: Icons.Certificate, text: t("nss.giveGet.get1") },
    { icon: Icons.AcademicCap, text: t("nss.giveGet.get2") },
    { icon: Icons.Team, text: t("nss.giveGet.get3") },
    { icon: Icons.Trophy, text: t("nss.giveGet.get4") },
    { icon: Icons.Star, text: t("nss.giveGet.get5") },
  ];

  return (
    <section className="relative py-10 md:py-16 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div ref={containerRef} className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          label={t("nss.giveGet.label")}
          labelIcon={Icons.Handshake}
          heading={t("nss.giveGet.heading")}
          headingAccent={t("nss.giveGet.headingAccent")}
          subtitle={t("nss.giveGet.subtitle")}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* GIVE Column */}
          <div className="scroll-reveal-left">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200/60 rounded-2xl md:rounded-3xl p-5 md:p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Icons.Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">{t("nss.giveGet.giveTitle")}</h3>
                  <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">{t("nss.giveGet.giveSubtitle")}</p>
                </div>
              </div>
              <div className="space-y-2 md:space-y-3">
                {give.map((item, idx) => (
                  <div key={idx} className="flex gap-3 md:gap-4 items-start group">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-rose-500 group-hover:bg-rose-50 group-hover:border-rose-200 transition-colors duration-300 shadow-sm">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GET Column */}
          <div className="scroll-reveal-right">
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-slate-200/60 rounded-2xl md:rounded-3xl p-5 md:p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Icons.AcademicCap className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">{t("nss.giveGet.getTitle")}</h3>
                  <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">{t("nss.giveGet.getSubtitle")}</p>
                </div>
              </div>
              <div className="space-y-2 md:space-y-3">
                {get.map((item, idx) => (
                  <div key={idx} className="flex gap-3 md:gap-4 items-start group">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-blue-600 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors duration-300 shadow-sm">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed pt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BLOCK 4 — Life at BB College NSS
   ═══════════════════════════════════════════════════════════════ */
function LifeAtBBCollege() {
  const { t } = useLanguage();
  const containerRef = useChildReveal();

  const highlights = [
    {
      icon: Icons.Tent,
      title: t("nss.bbCollege.card1Title"),
      desc: t("nss.bbCollege.card1Desc"),
      color: "text-violet-600 bg-violet-50 border-violet-100",
    },
    {
      icon: Icons.Star,
      title: t("nss.bbCollege.card2Title"),
      desc: t("nss.bbCollege.card2Desc"),
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      icon: Icons.Drop,
      title: t("nss.bbCollege.card3Title"),
      desc: t("nss.bbCollege.card3Desc"),
      color: "text-rose-600 bg-rose-50 border-rose-100",
    },
    {
      icon: Icons.Leaf,
      title: t("nss.bbCollege.card4Title"),
      desc: t("nss.bbCollege.card4Desc"),
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      icon: Icons.Megaphone,
      title: t("nss.bbCollege.card5Title"),
      desc: t("nss.bbCollege.card5Desc"),
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      icon: Icons.Users,
      title: t("nss.bbCollege.card6Title"),
      desc: t("nss.bbCollege.card6Desc"),
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
  ];

  return (
    <section className="relative py-10 md:py-16 px-4 sm:px-6 lg:px-8 bg-[#faf9f6] overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div ref={containerRef} className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          label={t("nss.bbCollege.label")}
          labelIcon={Icons.BuildingLibrary}
          heading={t("nss.bbCollege.heading")}
          headingAccent={t("nss.bbCollege.headingAccent")}
          subtitle={t("nss.bbCollege.subtitle")}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className={`scroll-reveal reveal-delay-${idx + 1} group bg-white border border-slate-200/60 rounded-2xl p-4 md:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_16px_40px_rgb(99,102,241,0.06)] hover:border-indigo-200/50 hover:-translate-y-1 transition-all duration-500 relative overflow-hidden`}
            >
              {/* Subtle accent top bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                idx === 0 ? "from-violet-500 to-purple-500" :
                idx === 1 ? "from-amber-400 to-orange-500" :
                idx === 2 ? "from-rose-400 to-red-500" :
                idx === 3 ? "from-emerald-400 to-green-500" :
                idx === 4 ? "from-blue-400 to-indigo-500" :
                "from-indigo-400 to-purple-500"
              } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

              <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl ${item.color} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
                <item.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-base md:text-lg font-black text-slate-900 mb-2 tracking-tight">{item.title}</h3>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BLOCK 5 — Why NSS Was Founded (Timeline)
   ═══════════════════════════════════════════════════════════════ */
function WhyNSSFounded() {
  const { t } = useLanguage();
  const containerRef = useChildReveal();

  const milestones = [
    {
      year: t("nss.history.year1"),
      title: t("nss.history.title1"),
      desc: t("nss.history.desc1"),
      icon: Icons.Flag,
      color: "from-blue-500 to-indigo-500",
    },
    {
      year: t("nss.history.year2"),
      title: t("nss.history.title2"),
      desc: t("nss.history.desc2"),
      icon: Icons.LightBulb,
      color: "from-indigo-500 to-purple-500",
    },
    {
      year: t("nss.history.year3"),
      title: t("nss.history.title3"),
      desc: t("nss.history.desc3"),
      icon: Icons.GlobeAlt,
      color: "from-purple-500 to-blue-500",
    },
    {
      year: t("nss.history.year4"),
      title: t("nss.history.title4"),
      desc: t("nss.history.desc4"),
      icon: Icons.Sparkles,
      color: "from-blue-500 to-cyan-500",
    },
  ];

  return (
    <section className="relative py-10 md:py-16 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div ref={containerRef} className="max-w-6xl mx-auto relative z-10">
        <SectionHeader
          label={t("nss.history.label")}
          labelIcon={Icons.Clock}
          heading={t("nss.history.heading")}
          headingAccent={t("nss.history.headingAccent")}
          subtitle={t("nss.history.subtitle")}
        />

        {/* Timeline */}
        <div className="relative mt-8">
          {/* Horizontal connector — hidden on mobile, shown on md+ */}
          <div className="hidden md:block absolute left-[12.5%] right-[12.5%] top-7 h-0.5 bg-gradient-to-r from-blue-300 via-indigo-300 to-cyan-300"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {milestones.map((item, idx) => (
              <div 
                key={idx} 
                className={`scroll-reveal reveal-delay-${idx + 1} flex flex-col items-center text-center`}
              >
                {/* Timeline Node/Dot */}
                <div className="relative mb-4 md:mb-6 z-10">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-xl border-4 border-white hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Milestone Card */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 hover:shadow-lg hover:border-indigo-200/50 transition-all duration-500 w-full flex-grow flex flex-col">
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-widest block mb-1">{item.year}</span>
                  <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight mb-2">{item.title}</h3>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* First Volunteer Spotlight Card */}
        <div className="mt-16 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-10 shadow-2xl border border-slate-800/80 scroll-reveal relative overflow-hidden group">
          {/* Subtle glow background */}
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none"></div>
          <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            {/* Avatar Column */}
            <div className="md:col-span-4 flex flex-col items-center text-center">
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 shadow-xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden relative">
                  <img 
                    src="/images/kk_gupta.png" 
                    alt="Krishan Kumar Gupta" 
                    className="w-full h-full object-cover object-top" 
                  />
                </div>
              </div>
              <span className="mt-4 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] md:text-xs font-black text-blue-400 uppercase tracking-widest">
                {t("nss.spotlight.badge")}
              </span>
            </div>

            {/* Profile Info Column */}
            <div className="md:col-span-8 flex flex-col">
              <h3 className="text-xl md:text-3xl font-black text-white tracking-tight mb-1">
                {t("nss.spotlight.title")}
              </h3>
              <p className="text-xs md:text-sm font-extrabold text-indigo-400 uppercase tracking-widest mb-4">
                {t("nss.spotlight.subtitle")}
              </p>
              
              <p className="text-xs md:text-base text-slate-300 leading-relaxed font-semibold mb-6">
                {t("nss.spotlight.desc")}
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://www.facebook.com/nss.krishangupta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-xs md:text-sm font-black shadow-lg shadow-blue-600/20 hover:scale-105 transition-all duration-300"
                >
                  <Icons.Facebook className="w-4 h-4" /> {t("nss.spotlight.connect")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BLOCK 6 — NSS Calendar (Interactive Event Schedule)
   ═══════════════════════════════════════════════════════════════ */
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

const MONTHS = [
  { year: 2026, month: 0, name: "January 2026" },
  { year: 2026, month: 1, name: "February 2026" },
  { year: 2026, month: 2, name: "March 2026" },
  { year: 2026, month: 3, name: "April 2026" },
  { year: 2026, month: 4, name: "May 2026" },
  { year: 2026, month: 5, name: "June 2026" },
  { year: 2026, month: 6, name: "July 2026" },
  { year: 2026, month: 7, name: "August 2026" },
  { year: 2026, month: 8, name: "September 2026" },
  { year: 2026, month: 9, name: "October 2026" },
  { year: 2026, month: 10, name: "November 2026" },
  { year: 2026, month: 11, name: "December 2026" }
];

function NSSCalendar() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState("calendar"); // calendar | agenda
  const [currentMonthIdx, setCurrentMonthIdx] = useState(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const idx = MONTHS.findIndex(m => m.year === currentYear && m.month === currentMonth);
    return idx !== -1 ? idx : 0; // Default to January index 0 if current date is not in 2026
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useChildReveal();

  const activeMonth = MONTHS[currentMonthIdx];
  const daysInMonth = new Date(activeMonth.year, activeMonth.month + 1, 0).getDate();
  const firstDayIndex = new Date(activeMonth.year, activeMonth.month, 1).getDay();

  const monthEvents = useMemo(() => {
    return CALENDAR_EVENTS.filter(evt => {
      const evtDate = new Date(evt.date);
      return evtDate.getFullYear() === activeMonth.year && evtDate.getMonth() === activeMonth.month;
    });
  }, [activeMonth]);

  useEffect(() => {
    if (monthEvents.length > 0) {
      setSelectedEvent(monthEvents[0]);
    } else {
      setSelectedEvent(null);
    }
  }, [monthEvents]);

  const handlePrevMonth = () => {
    setCurrentMonthIdx(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextMonth = () => {
    setCurrentMonthIdx(prev => (prev < MONTHS.length - 1 ? prev + 1 : prev));
  };

  const getEventForDay = (day) => {
    const monthStr = String(activeMonth.month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${activeMonth.year}-${monthStr}-${dayStr}`;
    return CALENDAR_EVENTS.find(evt => {
      if (evt.endDate) {
        return dateStr >= evt.date && dateStr <= evt.endDate;
      }
      return evt.date === dateStr;
    });
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case "env": return { bg: "bg-emerald-500", border: "border-emerald-500", text: "text-emerald-500", lightBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300", label: t("nss.calendar.type.env") };
      case "health": return { bg: "bg-rose-500", border: "border-rose-500", text: "text-rose-500", lightBg: "bg-rose-500/10 border-rose-500/20 text-rose-300", label: t("nss.calendar.type.health") };
      case "social": return { bg: "bg-blue-500", border: "border-blue-500", text: "text-blue-500", lightBg: "bg-blue-500/10 border-blue-500/20 text-blue-300", label: t("nss.calendar.type.social") };
      case "nat": return { bg: "bg-amber-500", border: "border-amber-500", text: "text-amber-500", lightBg: "bg-amber-500/10 border-amber-500/20 text-amber-300", label: t("nss.calendar.type.nat") };
      case "hist": return { bg: "bg-indigo-500", border: "border-indigo-500", text: "text-indigo-500", lightBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300", label: t("nss.calendar.type.hist") };
      case "nss": return { bg: "bg-violet-500", border: "border-violet-500", text: "text-violet-500", lightBg: "bg-violet-500/10 border-violet-500/20 text-violet-300", label: t("nss.calendar.type.nss") };
      case "admin": return { bg: "bg-slate-500", border: "border-slate-500", text: "text-slate-500", lightBg: "bg-slate-500/10 border-slate-500/20 text-slate-300", label: t("nss.calendar.type.admin") };
      default: return { bg: "bg-blue-500", border: "border-blue-500", text: "text-blue-500", lightBg: "bg-blue-500/10 border-blue-500/20 text-blue-300", label: t("nss.calendar.type.general") };
    }
  };

  const filteredAgendaEvents = useMemo(() => {
    return CALENDAR_EVENTS.filter(evt => {
      const translatedTitle = t(evt.titleKey || evt.title).toLowerCase();
      const translatedDesc = t(evt.descKey || evt.desc).toLowerCase();
      const q = searchQuery.toLowerCase();
      return translatedTitle.includes(q) || translatedDesc.includes(q);
    });
  }, [searchQuery, t]);

  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalSlots = [...blanks, ...days];

  return (
    <section className="relative py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-slate-950 overflow-hidden border-t border-white/5">
      <div className="absolute top-1/3 left-10 w-72 h-72 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div ref={containerRef} className="max-w-6xl mx-auto relative z-10">
        <SectionHeader
          label={t("nss.calendar.label")}
          labelIcon={Icons.Calendar}
          heading={t("nss.calendar.title")}
          headingAccent="2026"
          subtitle={t("nss.calendar.subtitle")}
          light
        />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 p-1 rounded-2xl flex gap-1 shadow-inner w-full sm:w-auto shrink-0">
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${viewMode === "calendar" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
            >
              {t("nss.calendar.viewCalendar")}
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${viewMode === "agenda" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
            >
              {t("nss.calendar.viewAgenda")}
            </button>
          </div>

          {viewMode === "agenda" ? (
            <div className="relative w-full sm:w-72 shrink-0">
              <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t("nss.calendar.search")}
                className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 rounded-xl text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder:text-slate-500"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={handlePrevMonth}
                disabled={currentMonthIdx === 0}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                &larr;
              </button>
              <span className="text-sm sm:text-base font-black text-white uppercase tracking-wider text-center min-w-[140px] truncate">
                {t(`nss.calendar.months.${activeMonth.name.split(" ")[0].toLowerCase().substring(0, 3)}`)}
              </span>
              <button
                onClick={handleNextMonth}
                disabled={currentMonthIdx === MONTHS.length - 1}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                &rarr;
              </button>
            </div>
          )}
        </div>

        {viewMode === "calendar" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Grid Sheet */}
            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-md shadow-2xl">
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                <span>{t("nss.calendar.days.sun")}</span>
                <span>{t("nss.calendar.days.mon")}</span>
                <span>{t("nss.calendar.days.tue")}</span>
                <span>{t("nss.calendar.days.wed")}</span>
                <span>{t("nss.calendar.days.thu")}</span>
                <span>{t("nss.calendar.days.fri")}</span>
                <span>{t("nss.calendar.days.sat")}</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {totalSlots.map((slot, index) => {
                  if (slot === null) {
                    return <div key={`blank-${index}`} className="aspect-square"></div>;
                  }

                  const hasEvent = getEventForDay(slot);
                  const isSelected = selectedEvent && hasEvent && (selectedEvent.date === hasEvent.date || (hasEvent.endDate && selectedEvent.date >= hasEvent.date && selectedEvent.date <= hasEvent.endDate));
                  const style = hasEvent ? getTypeStyle(hasEvent.type) : null;

                  return (
                    <button
                      key={`day-${slot}`}
                      onClick={() => hasEvent && setSelectedEvent(hasEvent)}
                      disabled={!hasEvent}
                      className={`aspect-square rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center transition-all duration-300 relative group cursor-pointer ${
                        hasEvent 
                          ? `${style.bg}/10 border-${style.border}/30 text-white hover:scale-105 active:scale-95 hover:bg-${style.bg}/20 hover:border-${style.border}` 
                          : "border-white/5 bg-white/[0.01] text-slate-600 cursor-default"
                      } ${
                        isSelected ? `ring-2 ring-blue-500 border-blue-500` : ""
                      }`}
                    >
                      <span className={`text-xs sm:text-sm md:text-base font-black ${hasEvent ? "text-white" : ""}`}>{slot}</span>
                      {hasEvent && (
                        <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${style.bg} mt-1 animate-pulse`}></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar details */}
            <div className="lg:col-span-5 flex flex-col">
              {selectedEvent ? (
                <div className="flex-1 bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl flex flex-col justify-between h-full group">
                  <div>
                    <div className="flex justify-between items-center gap-3 mb-6">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 tracking-wide shrink-0">
                        <Icons.Calendar className="w-3.5 h-3.5" />
                        {selectedEvent.endDate 
                          ? `${formatDate(selectedEvent.date)} - ${formatDate(selectedEvent.endDate)}` 
                          : formatDate(selectedEvent.date)
                        }
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm ${getTypeStyle(selectedEvent.type).lightBg}`}>
                        {getTypeStyle(selectedEvent.type).label}
                      </span>
                    </div>

                    <h3 className="text-lg md:text-xl font-black text-white leading-snug tracking-tight mb-4 group-hover:text-blue-400 transition-colors duration-300">
                      {t(selectedEvent.titleKey || selectedEvent.title)}
                    </h3>

                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-semibold">
                      {t(selectedEvent.descKey || selectedEvent.desc)}
                    </p>
                  </div>

                  <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 flex items-start gap-3 mt-6">
                    <Icons.Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                      {t("nss.calendar.note")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-white/[0.01] border border-dashed border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center text-center text-slate-500 h-full">
                  <Icons.Calendar className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="font-extrabold text-slate-400 tracking-tight text-sm">{t("nss.calendar.noEventsTitle")}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-1 max-w-[240px] leading-relaxed">{t("nss.calendar.noEventsDesc")}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-8 backdrop-blur-md shadow-2xl max-h-[500px] overflow-y-auto custom-scrollbar">
            {filteredAgendaEvents.length === 0 ? (
              <div className="text-center py-16 text-slate-500 flex flex-col items-center">
                <Icons.Info className="w-10 h-10 text-slate-600 mb-3" />
                <p className="font-extrabold text-slate-400 text-sm">{t("nss.calendar.noSearchTitle")}</p>
              </div>
            ) : (
              <div className="space-y-4 pr-2">
                {filteredAgendaEvents.map((evt, index) => {
                  const style = getTypeStyle(evt.type);
                  return (
                    <div
                      key={index}
                      className="group bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-300 hover:bg-white/[0.04]"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 items-center mb-2">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${style.lightBg} border`}>
                            {style.label}
                          </span>
                          <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                            <Icons.Calendar className="w-3.5 h-3.5" />
                            {evt.endDate ? `${formatDate(evt.date)} ${t("activities.dateTo")} ${formatDate(evt.endDate)}` : formatDate(evt.date)}
                          </span>
                        </div>

                        <h4 className="text-sm md:text-base font-black text-white group-hover:text-blue-400 transition-colors mb-1 leading-snug">
                          {t(evt.titleKey || evt.title)}
                        </h4>
                        
                        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                          {t(evt.descKey || evt.desc)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BLOCK 6 — CTA Banner
   ═══════════════════════════════════════════════════════════════ */
function CTABanner({ onNavigate }) {
  const { t } = useLanguage();
  const ref = useScrollReveal();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => setIsLoggedIn(!!localStorage.getItem('nss_user'));
    checkAuth();
    window.addEventListener('nss_user_logged_in', checkAuth);
    window.addEventListener('nss_user_logged_out', checkAuth);
    return () => {
      window.removeEventListener('nss_user_logged_in', checkAuth);
      window.removeEventListener('nss_user_logged_out', checkAuth);
    };
  }, []);

  return (
    <section className="relative py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 overflow-hidden">
      {/* Background decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-indigo-300/10 rounded-full blur-[60px] -translate-y-1/2"></div>
      </div>

      <div ref={ref} className="scroll-reveal max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white/90 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-4">
          <Icons.Sparkles className="w-3.5 h-3.5" /> {t("nss.cta.badge")}
        </div>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-3 md:mb-4 tracking-tight leading-tight">
          {t("nss.cta.heading")}<br className="hidden sm:block" /> {t("nss.cta.headingLine2")}
        </h2>
        <p className="text-sm md:text-base text-blue-100 font-medium max-w-2xl mx-auto mb-6 md:mb-8 leading-relaxed">
          {t("nss.cta.subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!isLoggedIn && (
            <button
              onClick={() => window.dispatchEvent(new Event('open_nss_register'))}
              className="flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 md:px-10 md:py-4 rounded-full text-sm md:text-base font-black hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-xl w-full sm:w-auto cursor-pointer group"
            >
              {t("nss.cta.join")} <Icons.ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          <button
            onClick={() => onNavigate && onNavigate('activities')}
            className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md text-white px-8 py-3.5 md:px-10 md:py-4 rounded-full text-sm md:text-base font-bold hover:bg-white hover:text-blue-700 hover:scale-105 transition-all duration-300 shadow-lg border border-white/20 w-full sm:w-auto cursor-pointer"
          >
            {t("nss.cta.explore")}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT — NSSStory
   ═══════════════════════════════════════════════════════════════ */
export default function NSSStory({ onNavigate }) {
  return (
    <div>
      <WhatIsNSS />
      <WhatWeDo />
      <GiveAndGet />
      <LifeAtBBCollege />
      <WhyNSSFounded />
      <NSSCalendar />
      <CTABanner onNavigate={onNavigate} />
    </div>
  );
}
