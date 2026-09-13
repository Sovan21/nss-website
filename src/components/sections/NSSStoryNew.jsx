"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { Icons } from "@/components/Icons";
import { useLanguage } from "@/context/LanguageContext";
import { CALENDAR_EVENTS } from "@/data/calendarEvents";

/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL HOOK — IntersectionObserver-based
   ═══════════════════════════════════════════════════════════════ */
function useScrollReveal(threshold = 0.1) {
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
      { threshold, rootMargin: "0px 0px -20px 0px" }
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
      { threshold, rootMargin: "0px 0px -20px 0px" }
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
    <div ref={ref} className="scroll-reveal text-center max-w-3xl mx-auto mb-6 sm:mb-8">
      <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-black text-xs uppercase tracking-widest mb-2.5 shadow-xs border ${
        light ? "bg-white/10 border-white/20 text-white" : "bg-blue-50 border-blue-200/80 text-[#004899]"
      }`}>
        {LabelIcon && <LabelIcon className={`w-4 h-4 ${light ? "text-white" : "text-[#004899]"}`} />}
        <span>{label}</span>
      </div>
      <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-poppins ${light ? "text-white" : "text-slate-900"}`}>
        {heading}{" "}
        {headingAccent && (
          <span className={`${light ? "text-blue-200" : "text-[#004899] underline decoration-amber-400 decoration-4 underline-offset-8"}`}>
            {headingAccent}
          </span>
        )}
      </h2>
      {subtitle && (
        <p className={`mt-3 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto font-normal ${light ? "text-blue-100" : "text-slate-600"}`}>
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
    { icon: Icons.Calendar, label: t("nss.whoWeAre.fact1Label"), value: t("nss.whoWeAre.fact1Value") },
    { icon: Icons.Flag, label: t("nss.whoWeAre.fact2Label"), value: t("nss.whoWeAre.fact2Value") },
    { icon: Icons.BuildingLibrary, label: t("nss.whoWeAre.fact3Label"), value: t("nss.whoWeAre.fact3Value") },
    { icon: Icons.Sun, label: t("nss.whoWeAre.fact4Label"), value: t("nss.whoWeAre.fact4Value") },
  ];

  return (
    <section className="relative py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-[#faf9f6] overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div ref={containerRef} className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          label={t("nss.whoWeAre.label")}
          labelIcon={Icons.Shield}
          heading={t("nss.whoWeAre.heading")}
          headingAccent={t("nss.whoWeAre.headingAccent")}
          subtitle={t("nss.whoWeAre.subtitle")}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Left — Narrative Text */}
          <div className="scroll-reveal-left bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-center">
            <p 
              className="text-[15px] sm:text-base md:text-[17px] text-slate-700 leading-relaxed sm:leading-loose mb-4 font-normal text-justify"
              dangerouslySetInnerHTML={{ __html: tHtml("nss.whoWeAre.para1") }}
            />
            <p 
              className="text-[15px] sm:text-base md:text-[17px] text-slate-700 leading-relaxed sm:leading-loose mb-4 font-normal text-justify"
              dangerouslySetInnerHTML={{ __html: tHtml("nss.whoWeAre.para2") }}
            />
            <p 
              className="text-[14px] sm:text-[15px] md:text-base text-slate-600 leading-relaxed font-medium italic text-justify"
              dangerouslySetInnerHTML={{ __html: tHtml("nss.whoWeAre.para3") }}
            />
          </div>

          {/* Right — Fact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {facts.map((fact, idx) => (
              <div
                key={idx}
                className={`scroll-reveal reveal-delay-${idx + 1} group bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between`}
              >
                <div className="w-10 h-10 rounded-xl bg-transparent border border-slate-300 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:border-slate-900 transition-all duration-300">
                  <fact.icon className="w-5 h-5 text-slate-900" />
                </div>
                <div>
                  <p className="text-xs sm:text-[13px] text-slate-500 uppercase tracking-widest font-black mb-1">{fact.label}</p>
                  <p className="text-base sm:text-lg text-slate-900 font-black leading-snug">{fact.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Core NSS Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 md:mt-10">
          {/* Card 1: Objectives */}
          <div className="scroll-reveal group bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
            <div className="flex items-center gap-3.5 mb-5 shrink-0">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-transparent border border-slate-300 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:border-slate-900 transition-all duration-300 shrink-0">
                <Icons.Target className="w-5 h-5 md:w-6 md:h-6 text-slate-900" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-poppins">{t("nss.objectives.title")}</h3>
            </div>
            <ul className="space-y-3.5 flex-1">
              {[
                t("nss.objectives.item1"),
                t("nss.objectives.item2"),
                t("nss.objectives.item3"),
                t("nss.objectives.item4")
              ].map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-3 text-slate-700 text-sm sm:text-base leading-relaxed font-medium">
                  <span className="w-2 h-2 rounded-full bg-slate-900 mt-2 shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2: Major Activities */}
          <div className="scroll-reveal group bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
            <div className="flex items-center gap-3.5 mb-5 shrink-0">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-transparent border border-slate-300 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:border-slate-900 transition-all duration-300 shrink-0">
                <Icons.Sparkles className="w-5 h-5 md:w-6 md:h-6 text-slate-900" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-poppins">{t("nss.activities.title")}</h3>
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
                <li key={itemIdx} className="flex items-start gap-3 text-slate-700 text-sm sm:text-base leading-relaxed font-medium">
                  <span className="w-2 h-2 rounded-full bg-slate-900 mt-2 shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 3: Eligibility */}
          <div className="scroll-reveal group bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
            <div className="flex items-center gap-3.5 mb-5 shrink-0">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-transparent border border-slate-300 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:border-slate-900 transition-all duration-300 shrink-0">
                <Icons.AcademicCap className="w-5 h-5 md:w-6 md:h-6 text-slate-900" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-poppins">{t("nss.eligibility.title")}</h3>
            </div>
            <div className="flex flex-col justify-between flex-1">
              <div>
                <p className="text-xs sm:text-sm text-slate-500 font-black uppercase tracking-wider mb-3">{t("nss.eligibility.subtitle")}</p>
                <ul className="space-y-3.5 mb-5">
                  {[
                    t("nss.eligibility.item1"),
                    t("nss.eligibility.item2"),
                    t("nss.eligibility.item3")
                  ].map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-3 text-slate-700 text-sm sm:text-base leading-relaxed font-medium">
                      <span className="w-2 h-2 rounded-full bg-slate-900 mt-2 shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-4 border-t border-slate-100 text-sm sm:text-[15px] text-slate-600 font-medium leading-relaxed italic">
                {t("nss.eligibility.note")}
              </div>
            </div>
          </div>

          {/* Card 4: Benefits of Joining NSS */}
          <div className="scroll-reveal group bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
            <div className="flex items-center gap-3.5 mb-5 shrink-0">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-transparent border border-slate-300 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:border-slate-900 transition-all duration-500 shrink-0">
                <Icons.Trophy className="w-5 h-5 md:w-6 md:h-6 text-slate-900" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-poppins">{t("nss.benefits.title")}</h3>
            </div>
            <ul className="space-y-3.5 flex-1">
              {[
                t("nss.benefits.item1"),
                t("nss.benefits.item2"),
                t("nss.benefits.item3"),
                t("nss.benefits.item4"),
                t("nss.benefits.item5")
              ].map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-3 text-slate-700 text-sm sm:text-base leading-relaxed font-medium">
                  <span className="w-2 h-2 rounded-full bg-slate-900 mt-2 shrink-0"></span>
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
    },
    {
      icon: Icons.Leaf,
      title: t("nss.whatWeDo.card2Title"),
      desc: t("nss.whatWeDo.card2Desc"),
    },
    {
      icon: Icons.BookOpen,
      title: t("nss.whatWeDo.card3Title"),
      desc: t("nss.whatWeDo.card3Desc"),
    },
    {
      icon: Icons.Shield,
      title: t("nss.whatWeDo.card4Title"),
      desc: t("nss.whatWeDo.card4Desc"),
    },
    {
      icon: Icons.Drop,
      title: t("nss.whatWeDo.card5Title"),
      desc: t("nss.whatWeDo.card5Desc"),
    },
    {
      icon: Icons.Handshake,
      title: t("nss.whatWeDo.card6Title"),
      desc: t("nss.whatWeDo.card6Desc"),
    },
  ];

  return (
    <section className="relative py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-[#faf9f6] overflow-hidden">
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-slate-500/5 rounded-full blur-[100px] pointer-events-none"></div>

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
              className={`scroll-reveal reveal-delay-${idx + 1} group bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-slate-400 hover:-translate-y-1 transition-all duration-300`}
            >
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-transparent border border-slate-300 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:border-slate-900 transition-all duration-300">
                <item.icon className="w-5 h-5 md:w-6 md:h-6 text-slate-900" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2 tracking-tight">{item.title}</h3>
              <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed font-medium">{item.desc}</p>
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
    <section className="relative py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
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
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200/80 rounded-2xl md:rounded-3xl p-5 md:p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-transparent border border-slate-300 flex items-center justify-center shadow-xs">
                  <Icons.Heart className="w-5 h-5 md:w-6 md:h-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("nss.giveGet.giveTitle")}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-widest">{t("nss.giveGet.giveSubtitle")}</p>
                </div>
              </div>
              <div className="space-y-2.5 md:space-y-3.5">
                {give.map((item, idx) => (
                  <div key={idx} className="flex gap-3 md:gap-4 items-start group">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-transparent border border-slate-200 flex items-center justify-center shrink-0 text-slate-900 group-hover:border-slate-800 transition-colors duration-300">
                      <item.icon className="w-4 h-4 text-slate-900" />
                    </div>
                    <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed pt-0.5">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GET Column */}
          <div className="scroll-reveal-right">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200/80 rounded-2xl md:rounded-3xl p-5 md:p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-transparent border border-slate-300 flex items-center justify-center shadow-xs">
                  <Icons.AcademicCap className="w-5 h-5 md:w-6 md:h-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("nss.giveGet.getTitle")}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-widest">{t("nss.giveGet.getSubtitle")}</p>
                </div>
              </div>
              <div className="space-y-2.5 md:space-y-3.5">
                {get.map((item, idx) => (
                  <div key={idx} className="flex gap-3 md:gap-4 items-start group">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-transparent border border-slate-200 flex items-center justify-center shrink-0 text-slate-900 group-hover:border-slate-800 transition-colors duration-300">
                      <item.icon className="w-4 h-4 text-slate-900" />
                    </div>
                    <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed pt-0.5">{item.text}</p>
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
    },
    {
      icon: Icons.Star,
      title: t("nss.bbCollege.card2Title"),
      desc: t("nss.bbCollege.card2Desc"),
    },
    {
      icon: Icons.Drop,
      title: t("nss.bbCollege.card3Title"),
      desc: t("nss.bbCollege.card3Desc"),
    },
    {
      icon: Icons.Leaf,
      title: t("nss.bbCollege.card4Title"),
      desc: t("nss.bbCollege.card4Desc"),
    },
    {
      icon: Icons.Megaphone,
      title: t("nss.bbCollege.card5Title"),
      desc: t("nss.bbCollege.card5Desc"),
    },
    {
      icon: Icons.Users,
      title: t("nss.bbCollege.card6Title"),
      desc: t("nss.bbCollege.card6Desc"),
    },
  ];

  return (
    <section className="relative py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-[#faf9f6] overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-slate-500/5 rounded-full blur-[120px] pointer-events-none"></div>

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
              className={`scroll-reveal reveal-delay-${idx + 1} group bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-slate-400 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}
            >
              {/* Subtle accent top bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-transparent border border-slate-300 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-slate-900 transition-all duration-300">
                <item.icon className="w-5 h-5 md:w-6 md:h-6 text-slate-900" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2 tracking-tight">{item.title}</h3>
              <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed font-medium">{item.desc}</p>
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
    },
    {
      year: t("nss.history.year2"),
      title: t("nss.history.title2"),
      desc: t("nss.history.desc2"),
      icon: Icons.LightBulb,
    },
    {
      year: t("nss.history.year3"),
      title: t("nss.history.title3"),
      desc: t("nss.history.desc3"),
      icon: Icons.GlobeAlt,
    },
    {
      year: t("nss.history.year4"),
      title: t("nss.history.title4"),
      desc: t("nss.history.desc4"),
      icon: Icons.Sparkles,
    },
  ];

  return (
    <section className="relative py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-slate-500/5 rounded-full blur-[100px] pointer-events-none"></div>

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
          <div className="hidden md:block absolute left-[12.5%] right-[12.5%] top-7 h-0.5 bg-slate-300"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {milestones.map((item, idx) => (
              <div 
                key={idx} 
                className={`scroll-reveal reveal-delay-${idx + 1} flex flex-col items-center text-center`}
              >
                {/* Timeline Node/Dot */}
                <div className="relative mb-4 md:mb-6 z-10">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md border-2 border-slate-300 hover:scale-110 hover:border-slate-900 transition-all duration-300">
                    <item.icon className="w-5 h-5 text-slate-900" />
                  </div>
                </div>

                {/* Milestone Card */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 hover:shadow-lg hover:border-slate-400 transition-all duration-300 w-full flex-grow flex flex-col">
                  <span className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-widest block mb-1">{item.year}</span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-2">{item.title}</h3>
                  <p className="text-sm sm:text-[15px] text-slate-600 leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* First Volunteer Spotlight Card */}
        <div className="mt-12 md:mt-16 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-3xl p-6 md:p-10 shadow-sm border border-slate-200/80 scroll-reveal relative overflow-hidden group">
          {/* Subtle glow background */}
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-slate-500/5 rounded-full blur-[60px] pointer-events-none"></div>
          <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-slate-500/5 rounded-full blur-[60px] pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            {/* Avatar Column */}
            <div className="md:col-span-4 flex flex-col items-center text-center">
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-slate-900 via-slate-700 to-slate-900 shadow-lg group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden relative">
                  <img 
                    src="/images/kk_gupta.png" 
                    alt="Krishan Kumar Gupta" 
                    className="w-full h-full object-cover object-top" 
                  />
                </div>
              </div>
              <span className="mt-4 px-4 py-1.5 bg-slate-900 border border-slate-800 text-white rounded-full text-xs sm:text-sm font-black uppercase tracking-widest shadow-xs">
                {t("nss.spotlight.badge")}
              </span>
            </div>

            {/* Profile Info Column */}
            <div className="md:col-span-8 flex flex-col">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-1.5 font-poppins">
                {t("nss.spotlight.title")}
              </h3>
              <p className="text-sm sm:text-base font-extrabold text-[#004899] uppercase tracking-widest mb-4">
                {t("nss.spotlight.subtitle")}
              </p>
              
              <p className="text-sm sm:text-base md:text-lg text-slate-700 leading-relaxed font-normal mb-6 text-justify">
                {t("nss.spotlight.desc")}
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://www.facebook.com/nss.krishangupta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#004899] hover:bg-[#003366] text-white px-6 py-3 rounded-full text-sm sm:text-base font-bold shadow-sm hover:shadow transition-all duration-300"
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

const getAcademicYearMonths = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (3 is April)

  let startYear = currentYear;
  if (currentMonth < 3) {
    startYear = currentYear - 1;
  }

  const months = [];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  for (let i = 0; i < 12; i++) {
    const mIdx = (3 + i) % 12;
    const y = mIdx < 3 ? startYear + 1 : startYear;
    months.push({
      year: y,
      month: mIdx,
      name: `${monthNames[mIdx]} ${y}`,
      localeKey: monthNames[mIdx].toLowerCase().substring(0, 3)
    });
  }

  return months;
};

function NSSCalendar() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState("calendar"); // calendar | agenda
  
  const MONTHS = useMemo(() => getAcademicYearMonths(), []);
  
  const [currentMonthIdx, setCurrentMonthIdx] = useState(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const idx = MONTHS.findIndex(m => m.year === currentYear && m.month === currentMonth);
    return idx !== -1 ? idx : 0;
  });
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useChildReveal();

  const activeMonth = MONTHS[currentMonthIdx];
  const daysInMonth = new Date(activeMonth.year, activeMonth.month + 1, 0).getDate();
  const firstDayIndex = new Date(activeMonth.year, activeMonth.month, 1).getDay();

  // Project events to matching session years dynamically
  const projectedEvents = useMemo(() => {
    return CALENDAR_EVENTS.map(evt => {
      const dateParts = evt.date.split("-");
      const endParts = evt.endDate ? evt.endDate.split("-") : null;
      const evtMonth = parseInt(dateParts[1], 10) - 1;
      
      const matchingMonth = MONTHS.find(m => m.month === evtMonth);
      const projectedYear = matchingMonth ? matchingMonth.year : activeMonth.year;
      
      const dateStr = `${projectedYear}-${dateParts[1]}-${dateParts[2]}`;
      
      let endDateStr = null;
      if (endParts) {
        const endMonth = parseInt(endParts[1], 10) - 1;
        let endYear = projectedYear;
        if (endMonth < evtMonth) {
          endYear = projectedYear + 1;
        }
        endDateStr = `${endYear}-${endParts[1]}-${endParts[2]}`;
      }

      return {
        ...evt,
        date: dateStr,
        endDate: endDateStr
      };
    });
  }, [activeMonth.year, MONTHS]);

  const monthEvents = useMemo(() => {
    return projectedEvents.filter(evt => {
      const evtDate = new Date(evt.date);
      return evtDate.getFullYear() === activeMonth.year && evtDate.getMonth() === activeMonth.month;
    });
  }, [activeMonth, projectedEvents]);

  const academicYearSession = useMemo(() => {
    if (MONTHS && MONTHS.length > 0) {
      return `${MONTHS[0].year}-${MONTHS[11].year}`;
    }
    return "2026-2027";
  }, [MONTHS]);

  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    if (monthEvents.length > 0) {
      // Prioritize NSS flagship events (like Sept 24 NSS Day) or single-day events
      const nssEvent = monthEvents.find(e => e.type === "nss") || monthEvents.find(e => !e.endDate) || monthEvents[0];
      setSelectedEvent(nssEvent);
      const dayNum = parseInt(nssEvent.date.split("-")[2], 10);
      setSelectedDay(dayNum);
    } else {
      setSelectedEvent(null);
      setSelectedDay(null);
    }
  }, [monthEvents]);

  const handlePrevMonth = () => {
    setCurrentMonthIdx(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleNextMonth = () => {
    setCurrentMonthIdx(prev => (prev < MONTHS.length - 1 ? prev + 1 : prev));
  };

  const getEventsForDay = (day) => {
    const monthStr = String(activeMonth.month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${activeMonth.year}-${monthStr}-${dayStr}`;
    const evts = projectedEvents.filter(evt => {
      if (evt.endDate) {
        return dateStr >= evt.date && dateStr <= evt.endDate;
      }
      return evt.date === dateStr;
    });

    // Prioritize specific single-day events (e.g. Sept 24 NSS Day) over broader fortnights
    return evts.sort((a, b) => {
      if (a.date === dateStr && b.date !== dateStr) return -1;
      if (b.date === dateStr && a.date !== dateStr) return 1;
      if (a.type === "nss" && b.type !== "nss") return -1;
      if (b.type === "nss" && a.type !== "nss") return 1;
      return 0;
    });
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case "env": return { bg: "bg-emerald-500", border: "border-emerald-500", text: "text-emerald-500", lightBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300", label: t("nss.calendar.type.env") };
      case "health": return { bg: "bg-rose-500", border: "border-rose-500", text: "text-rose-500", lightBg: "bg-rose-500/10 border-rose-500/20 text-rose-300", label: t("nss.calendar.type.health") };
      case "social": return { bg: "bg-blue-500", border: "border-blue-500", text: "text-blue-500", lightBg: "bg-blue-500/10 border-blue-500/20 text-blue-300", label: t("nss.calendar.type.social") };
      case "nat": return { bg: "bg-amber-500", border: "border-amber-500", text: "text-amber-500", lightBg: "bg-amber-500/10 border-amber-500/20 text-amber-300", label: t("nss.calendar.type.nat") };
      case "hist": return { bg: "bg-indigo-500", border: "border-indigo-500", text: "text-indigo-500", lightBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300", label: t("nss.calendar.type.hist") };
      case "nss": return { bg: "bg-violet-600", border: "border-violet-600", text: "text-violet-600", lightBg: "bg-violet-500/15 border-violet-500/30 text-violet-700", label: t("nss.calendar.type.nss") };
      case "admin": return { bg: "bg-slate-500", border: "border-slate-500", text: "text-slate-500", lightBg: "bg-slate-500/10 border-slate-500/20 text-slate-300", label: t("nss.calendar.type.admin") };
      default: return { bg: "bg-blue-500", border: "border-blue-500", text: "text-blue-500", lightBg: "bg-blue-500/10 border-blue-500/20 text-blue-300", label: t("nss.calendar.type.general") };
    }
  };

  const filteredAgendaEvents = useMemo(() => {
    return projectedEvents.filter(evt => {
      const translatedTitle = t(evt.titleKey || evt.title).toLowerCase();
      const translatedDesc = t(evt.descKey || evt.desc).toLowerCase();
      const q = searchQuery.toLowerCase();
      return translatedTitle.includes(q) || translatedDesc.includes(q);
    });
  }, [searchQuery, t, projectedEvents]);

  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  // Standard 6-row calendar grid (42 slots) keeps container height 100% stable across all months
  const trailingBlanks = Array(Math.max(0, 42 - (blanks.length + days.length))).fill(null);
  const totalSlots = [...blanks, ...days, ...trailingBlanks];

  const currentDayEvents = selectedDay ? getEventsForDay(selectedDay) : (selectedEvent ? [selectedEvent] : []);

  return (
    <section className="relative py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8 bg-[#faf9f6] overflow-hidden border-t border-slate-200/80">
      <div className="absolute top-1/3 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div ref={containerRef} className="max-w-6xl mx-auto relative z-10">
        <SectionHeader
          label={t("nss.calendar.label")}
          labelIcon={Icons.Calendar}
          heading={t("nss.calendar.title")}
          headingAccent={academicYearSession}
          subtitle={t("nss.calendar.subtitle")}
        />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 sm:mb-8">
          <div className="bg-slate-100 border border-slate-200/80 p-1 rounded-2xl flex gap-1 shadow-xs w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${viewMode === "calendar" ? "bg-[#004899] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              {t("nss.calendar.viewCalendar")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("agenda")}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${viewMode === "agenda" ? "bg-[#004899] text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
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
                className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-slate-800 text-sm outline-none focus:border-[#004899] focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 shadow-xs"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={currentMonthIdx === 0}
                aria-label="Previous Month"
                className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 active:scale-95 border-2 border-slate-300 hover:border-slate-400 text-slate-900 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-xs"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <span className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider text-center min-w-[140px] truncate">
                {t(`nss.calendar.months.${activeMonth.localeKey}`)} {activeMonth.year}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                disabled={currentMonthIdx === MONTHS.length - 1}
                aria-label="Next Month"
                className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 active:scale-95 border-2 border-slate-300 hover:border-slate-400 text-slate-900 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer shadow-xs"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {viewMode === "calendar" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Grid Sheet */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-5 md:p-6 shadow-sm min-h-[380px] sm:min-h-[440px] md:min-h-[470px]">
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
                    return <div key={`blank-${index}`} className="aspect-square pointer-events-none"></div>;
                  }

                  const dayEvents = getEventsForDay(slot);
                  const hasEvents = dayEvents.length > 0;
                  const primaryEvent = hasEvents ? dayEvents[0] : null;
                  const isNssEvent = dayEvents.some(e => e.type === "nss");
                  const isSelected = selectedDay === slot || (selectedEvent && dayEvents.some(e => e.title === selectedEvent.title));
                  const primaryStyle = primaryEvent ? getTypeStyle(primaryEvent.type) : null;
                  
                  const today = new Date();
                  const isCurrentDay = today.getDate() === slot && today.getMonth() === activeMonth.month && today.getFullYear() === activeMonth.year;

                  return (
                    <button
                      key={`day-${slot}`}
                      type="button"
                      onClick={() => {
                        if (hasEvents) {
                          setSelectedDay(slot);
                          setSelectedEvent(dayEvents[0]);
                        }
                      }}
                      disabled={!hasEvents}
                      className={`aspect-square rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 relative group ${
                        hasEvents 
                          ? isNssEvent 
                            ? "bg-violet-50/80 border-violet-300 text-slate-900 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                            : `${primaryStyle.bg}/10 border-${primaryStyle.border}/30 text-slate-900 hover:scale-105 active:scale-95 hover:bg-blue-100/60 cursor-pointer` 
                          : "border-slate-100 bg-slate-50/50 text-slate-400 cursor-default"
                      } ${
                        isSelected ? `ring-2 ring-[#004899] border-[#004899] bg-blue-50/90 shadow-md` : ""
                      } ${
                        isCurrentDay ? "border-amber-400 bg-amber-50 ring-1 ring-amber-300" : ""
                      }`}
                    >
                      {isCurrentDay && (
                        <span className="absolute top-1 text-[7px] font-black uppercase tracking-wider text-amber-600">
                          Today
                        </span>
                      )}
                      <span className={`text-xs sm:text-sm md:text-base font-black ${hasEvents ? "text-slate-900" : "text-slate-400"} ${isCurrentDay ? "text-amber-700 font-extrabold" : ""} ${isNssEvent ? "text-violet-950" : ""}`}>
                        {slot}
                      </span>
                      
                      {/* Event indicator dots */}
                      {hasEvents && (
                        <div className="flex items-center gap-1 mt-1 justify-center">
                          {dayEvents.slice(0, 3).map((e, dotIdx) => (
                            <span 
                              key={dotIdx} 
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${getTypeStyle(e.type).bg} shadow-xs`}
                              title={t(e.titleKey || e.title)}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar details */}
            <div className="lg:col-span-5 flex flex-col">
              {selectedEvent ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[360px] sm:min-h-[440px] md:min-h-[470px]">
                  <div className="flex flex-col">
                    {/* Multiple Events Switcher Bar */}
                    {currentDayEvents.length > 1 && (
                      <div className="mb-4 p-2 bg-blue-50/70 rounded-2xl border border-blue-100 flex flex-col gap-1.5">
                        <span className="text-[10.5px] font-black text-[#004899] uppercase tracking-wider px-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                          Multiple Events on this Date ({currentDayEvents.length})
                        </span>
                        <div className="flex flex-col gap-1">
                          {currentDayEvents.map((evt, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedEvent(evt)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer text-left flex items-center justify-between gap-2 ${
                                selectedEvent?.title === evt.title
                                  ? "bg-[#004899] text-white shadow-xs"
                                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                              }`}
                            >
                              <span className="truncate">{t(evt.titleKey || evt.title)}</span>
                              <span className={`w-2 h-2 rounded-full shrink-0 ${getTypeStyle(evt.type).bg}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center gap-3 mb-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004899] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 tracking-wide shrink-0">
                        <Icons.Calendar className="w-3.5 h-3.5" />
                        {selectedEvent.endDate 
                          ? `${formatDate(selectedEvent.date)} - ${formatDate(selectedEvent.endDate)}` 
                          : formatDate(selectedEvent.date)
                        }
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-xs ${getTypeStyle(selectedEvent.type).lightBg}`}>
                        {getTypeStyle(selectedEvent.type).label}
                      </span>
                    </div>

                    <h3 className="text-lg md:text-xl font-black text-slate-900 leading-snug tracking-tight mb-3 font-poppins">
                      {t(selectedEvent.titleKey || selectedEvent.title)}
                    </h3>

                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                      {t(selectedEvent.descKey || selectedEvent.desc)}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 flex items-start gap-3 mt-6">
                    <Icons.Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {t("nss.calendar.note")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl sm:rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center text-slate-400 min-h-[360px] sm:min-h-[440px] md:min-h-[470px]">
                  <Icons.Calendar className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="font-bold text-slate-600 tracking-tight text-sm">{t("nss.calendar.noEventsTitle")}</p>
                  <p className="text-xs text-slate-400 font-medium mt-1 max-w-[240px] leading-relaxed">{t("nss.calendar.noEventsDesc")}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-5 md:p-8 shadow-sm max-h-[500px] overflow-y-auto custom-scrollbar">
            {filteredAgendaEvents.length === 0 ? (
              <div className="text-center py-16 text-slate-400 flex flex-col items-center">
                <Icons.Info className="w-10 h-10 text-slate-300 mb-3" />
                <p className="font-bold text-slate-600 text-sm">{t("nss.calendar.noSearchTitle")}</p>
              </div>
            ) : (
              <div className="space-y-3.5 pr-2">
                {filteredAgendaEvents.map((evt, index) => {
                  const style = getTypeStyle(evt.type);
                  return (
                    <div
                      key={index}
                      className="group bg-slate-50/70 border border-slate-200/80 hover:border-blue-200 hover:bg-white rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all duration-200 shadow-2xs hover:shadow-xs"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 items-center mb-2">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${style.lightBg} border`}>
                            {style.label}
                          </span>
                          <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                            <Icons.Calendar className="w-3.5 h-3.5 text-blue-600" />
                            {evt.endDate ? `${formatDate(evt.date)} ${t("activities.dateTo")} ${formatDate(evt.endDate)}` : formatDate(evt.date)}
                          </span>
                        </div>

                        <h4 className="text-sm md:text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors mb-1 leading-snug">
                          {t(evt.titleKey || evt.title)}
                        </h4>
                        
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
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
    <section className="relative py-8 sm:py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 overflow-hidden">
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
