"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icons } from "@/components/Icons";
import { useLanguage } from "@/context/LanguageContext";
import useScrollLock from '@/lib/useScrollLock';

const decodeDesignation = (raw) => {
  if (!raw) return { category: 'Teacher', designation: '', display_order: 999 };
  if (raw.includes('::')) {
    const firstColon = raw.indexOf('::');
    const cat = raw.substring(0, firstColon);
    const rest = raw.substring(firstColon + 2);
    if (rest.startsWith('{')) {
      try {
        const parsed = JSON.parse(rest);
        return {
          category: cat,
          designation: parsed.designation || '',
          display_order: parsed.display_order != null ? Number(parsed.display_order) : 999
        };
      } catch (e) {
        return { category: cat, designation: rest, display_order: 999 };
      }
    }
    return { category: cat, designation: rest, display_order: 999 };
  }
  return { category: 'Teacher', designation: raw, display_order: 999 };
};

const getMemberOrder = (member) => {
  if (member?.display_order != null && !isNaN(Number(member.display_order))) {
    return Number(member.display_order);
  }
  const decoded = decodeDesignation(member?.designation);
  return decoded.display_order ?? 999;
};

const ROLE_THEMES = {
  Principal: {
    bannerBg: "from-[#7c3aed] via-[#6366f1] to-[#3b82f6]",
    gradFrom: "#7c3aed",
    gradTo: "#6366f1",
    textAccent: "text-[#6366f1]",
    lineColor: "bg-[#6366f1]",
    bgAccent: "bg-indigo-50/80 text-[#6366f1] border-indigo-100",
    footerBg: "bg-[#f5f3ff] hover:bg-[#ede9fe] border-[#e0e7ff]",
    iconColor: "text-[#6366f1]",
    badgeIcon: (
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  ProgramOfficer1: {
    bannerBg: "from-[#2563eb] via-[#3b82f6] to-[#0ea5e9]",
    gradFrom: "#2563eb",
    gradTo: "#3b82f6",
    textAccent: "text-[#2563eb]",
    lineColor: "bg-[#2563eb]",
    bgAccent: "bg-blue-50/80 text-[#2563eb] border-blue-100",
    footerBg: "bg-[#eff6ff] hover:bg-[#dbeafe] border-[#dbeafe]",
    iconColor: "text-[#2563eb]",
    badgeIcon: (
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  ProgramOfficer2: {
    bannerBg: "from-[#10b981] via-[#14b8a6] to-[#06b6d4]",
    gradFrom: "#10b981",
    gradTo: "#14b8a6",
    textAccent: "text-[#0d9488]",
    lineColor: "bg-[#0d9488]",
    bgAccent: "bg-teal-50/80 text-[#0d9488] border-teal-100",
    footerBg: "bg-[#f0fdf4] hover:bg-[#dcfce7] border-[#dcfce7]",
    iconColor: "text-[#0d9488]",
    badgeIcon: (
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  MentorAmber: {
    bannerBg: "from-[#f97316] via-[#f59e0b] to-[#eab308]",
    gradFrom: "#f97316",
    gradTo: "#f59e0b",
    textAccent: "text-[#d97706]",
    lineColor: "bg-[#d97706]",
    bgAccent: "bg-amber-50/80 text-[#d97706] border-amber-100",
    footerBg: "bg-[#fffbe6] hover:bg-[#fef3c7] border-[#fef3c7]",
    iconColor: "text-[#d97706]",
    badgeIcon: (
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    )
  },
  MentorPink: {
    bannerBg: "from-[#f43f5e] via-[#ec4899] to-[#e11d48]",
    gradFrom: "#f43f5e",
    gradTo: "#ec4899",
    textAccent: "text-[#e11d48]",
    lineColor: "bg-[#e11d48]",
    bgAccent: "bg-rose-50/80 text-[#e11d48] border-rose-100",
    footerBg: "bg-[#fff1f2] hover:bg-[#ffe4e6] border-[#ffe4e6]",
    iconColor: "text-[#e11d48]",
    badgeIcon: (
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    )
  }
};

const getLeaderTheme = (member, index) => {
  const { designation: decodedDesig } = decodeDesignation(member?.designation);
  const nameLower = (member?.name || '').toLowerCase();
  const desigLower = (decodedDesig || member?.designation || '').toLowerCase();

  if (desigLower.includes('principal') || desigLower.includes('principle') || nameLower.includes('basu') || index === 0) {
    return ROLE_THEMES.Principal;
  }
  if (desigLower.includes('unit -i') || desigLower.includes('unit-1') || desigLower.includes('unit 1') || nameLower.includes('animesh') || index === 1) {
    return ROLE_THEMES.ProgramOfficer1;
  }
  if (desigLower.includes('unit -ii') || desigLower.includes('unit-2') || desigLower.includes('unit 2') || nameLower.includes('soma') || index === 2) {
    return ROLE_THEMES.ProgramOfficer2;
  }
  if (nameLower.includes('sukumar') || index === 3) {
    return ROLE_THEMES.MentorAmber;
  }
  if (nameLower.includes('shanoly') || index === 4) {
    return ROLE_THEMES.MentorPink;
  }

  const themes = [
    ROLE_THEMES.Principal,
    ROLE_THEMES.ProgramOfficer1,
    ROLE_THEMES.ProgramOfficer2,
    ROLE_THEMES.MentorAmber,
    ROLE_THEMES.MentorPink
  ];
  return themes[index % themes.length];
};

const RosetteVerifiedBadge = ({ className = "w-8 h-10" }) => (
  <div className={`relative shrink-0 ${className}`} title="Verified Leader">
    <svg className="w-full h-full drop-shadow-md" viewBox="0 0 32 40" fill="none">
      {/* Left Ribbon Tail */}
      <path d="M10 22L5 37L11.5 33.5L17 37L15 22Z" fill="#00b87c" />
      {/* Right Ribbon Tail */}
      <path d="M22 22L17 37L22.5 33.5L27 37L22 22Z" fill="#00b87c" />

      {/* Starburst Rosette Scalloped Outer Ring */}
      <path
        d="M16 2 L18.2 3.6 L20.8 2.8 L22.4 5 L25.1 5.2 L25.7 7.8 L28.2 8.9 L27.8 11.6 L29.8 13.5 L28.6 16 L29.8 18.5 L27.8 20.4 L28.2 23.1 L25.7 24.2 L25.1 26.8 L22.4 27 L20.8 29.2 L18.2 28.4 L16 30 L13.8 28.4 L11.2 29.2 L9.6 27 L6.9 26.8 L6.3 24.2 L3.8 23.1 L4.2 20.4 L2.2 18.5 L3.4 16 L2.2 13.5 L4.2 11.6 L3.8 8.9 L6.3 7.8 L6.9 5.2 L9.6 5 L11.2 2.8 L13.8 3.6 Z"
        fill="#00b87c"
      />

      {/* Inner White Ring */}
      <circle cx="16" cy="16" r="9.5" fill="none" stroke="white" strokeWidth="1.2" />

      {/* Verified Checkmark */}
      <path
        d="M11 16L14.5 19.5L21 12.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const TeacherCard = ({ member, index, onCardClick, isLastAndOdd }) => {
  const { designation } = decodeDesignation(member.designation);
  const theme = getLeaderTheme(member, index);

  return (
    <div 
      onClick={() => onCardClick(member)}
      className={`bg-white rounded-3xl border border-slate-100/90 shadow-[0_8px_24px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group p-4 sm:p-5 cursor-pointer ${
        isLastAndOdd ? 'sm:col-span-2 sm:max-w-md sm:mx-auto w-full' : ''
      }`}
    >
      {/* Top Curved Banner & Top-Right Rosette Ribbon Verified Badge */}
      <div className="absolute top-0 left-0 w-full h-32 overflow-hidden pointer-events-none rounded-t-3xl">
        <svg className="w-full h-full preserve-3d" viewBox="0 0 350 130" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`teacher-grad-${member.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.gradFrom} />
              <stop offset="100%" stopColor={theme.gradTo} />
            </linearGradient>
          </defs>
          <path d="M 0,0 L 145,0 C 120,70 70,105 0,125 Z" fill={`url(#teacher-grad-${member.id})`} />
        </svg>

        {/* 4x5 Dot Matrix Overlay */}
        <div className="absolute top-3 left-3 grid grid-cols-5 gap-1.5 opacity-30 z-10 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white"></div>
          ))}
        </div>
      </div>

      {/* Top Right Green Rosette Ribbon Verified Badge */}
      <div className="absolute top-3.5 right-3.5 z-20">
        <RosetteVerifiedBadge className="w-8 h-10" />
      </div>

      <div>
        {/* Profile Frame + Name & Designation */}
        <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 pt-3 mb-4">
          {/* Avatar Photo Frame */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-[4px] border-white shadow-lg bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              {member.image_url ? (
                <img
                  src={member.image_url}
                  alt={member.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Icons.Users className="w-10 h-10 text-slate-300" />
              )}
            </div>

            {/* Scalloped Starburst Green Verified Badge under photo avatar */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 drop-shadow-md z-10" title="Verified Active Leader">
              <svg className="w-full h-full" viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 2 L18.2 3.6 L20.8 2.8 L22.4 5 L25.1 5.2 L25.7 7.8 L28.2 8.9 L27.8 11.6 L29.8 13.5 L28.6 16 L29.8 18.5 L27.8 20.4 L28.2 23.1 L25.7 24.2 L25.1 26.8 L22.4 27 L20.8 29.2 L18.2 28.4 L16 30 L13.8 28.4 L11.2 29.2 L9.6 27 L6.9 26.8 L6.3 24.2 L3.8 23.1 L4.2 20.4 L2.2 18.5 L3.4 16 L2.2 13.5 L4.2 11.6 L3.8 8.9 L6.3 7.8 L6.9 5.2 L9.6 5 L11.2 2.8 L13.8 3.6 Z"
                  fill="#00b87c"
                  stroke="white"
                  strokeWidth="1.2"
                />
                <path
                  d="M10 16L14 20L22 11"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Member Name & Designation */}
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-serif font-extrabold text-slate-900 text-base sm:text-lg lg:text-xl leading-snug line-clamp-2 mb-1.5" title={member.name}>
              {member.name}
            </h3>
            
            {/* Horizontal Line Indicator */}
            <div className={`w-8 h-0.5 rounded-full mb-2 ${theme.lineColor}`}></div>

            <p className={`text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase leading-tight ${theme.textAccent}`}>
              {designation || "Leader"}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer Box */}
      <div className="relative z-10 pt-1">
        <div className={`rounded-xl p-2.5 flex items-center justify-between border text-xs shadow-2xs transition-colors ${theme.footerBg}`}>
          <div className="flex items-center gap-2">
            <svg className={`w-4 h-4 ${theme.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className={`font-extrabold ${theme.iconColor}`}>View Profile</span>
          </div>
          <svg className={`w-4 h-4 stroke-current ${theme.iconColor}`} fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

    </div>
  );
};

const decodeTeacherDetails = (member) => {
  if (!member) return {};
  const raw = member?.designation || '';
  let category = 'Teacher';
  let designation = 'Leader';
  let qualification = member?.qualification || '';
  let email = member?.email || '';
  let phone = member?.phone || '';
  let department = member?.department || '';
  let about = member?.about || '';

  if (raw.includes('::')) {
    const firstColon = raw.indexOf('::');
    category = raw.substring(0, firstColon);
    const rest = raw.substring(firstColon + 2);
    if (rest.startsWith('{')) {
      try {
        const parsed = JSON.parse(rest);
        designation = parsed.designation || 'Leader';
        qualification = member?.qualification || parsed.qualification || '';
        email = member?.email || parsed.email || '';
        phone = member?.phone || parsed.phone || '';
        department = member?.department || parsed.department || '';
        about = member?.about || parsed.about || '';
      } catch (e) {
        designation = rest;
      }
    } else {
      designation = rest;
    }
  } else if (raw) {
    designation = raw;
  }

  return {
    category,
    designation,
    qualification,
    email,
    phone,
    department,
    about
  };
};

export default function TeachersSection({ members = [] }) {
  const { t } = useLanguage();
  const [selectedMember, setSelectedMember] = useState(null);
  const [showFullPhoto, setShowFullPhoto] = useState(false);

  const sortedMembers = React.useMemo(() => {
    return [...members].sort((a, b) => {
      const orderA = getMemberOrder(a);
      const orderB = getMemberOrder(b);
      if (orderA !== orderB) return orderA - orderB;
      return (a.id || 0) - (b.id || 0);
    });
  }, [members]);

  useScrollLock(!!selectedMember);
  useEffect(() => { if (!selectedMember) setShowFullPhoto(false); }, [selectedMember]);

  if (!sortedMembers || sortedMembers.length === 0) return null;

  return (
    <section className="pt-10 pb-12 md:pt-16 md:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#faf9f6]">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 font-extrabold text-[10px] md:text-xs uppercase tracking-widest mb-3 border border-purple-100 shadow-2xs">
            <Icons.Team className="w-3.5 h-3.5" /> LEADERSHIP
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight leading-none font-serif">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Leadership</span>
          </h2>

          {/* Underline Separator Ornament */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-purple-300"></div>
            <div className="text-purple-600 text-xs">✦</div>
            <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-purple-300"></div>
          </div>

          <p className="text-slate-500 font-medium text-xs md:text-base leading-relaxed max-w-xl mx-auto">
            The guiding lights and educators who lead our NSS unit with dedication and excellence.
          </p>
        </div>

        {/* Leadership Grid (2 cards per row on desktop, 5th card centered) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 items-stretch max-w-5xl mx-auto">
          {sortedMembers.map((member, idx) => {
            const isLastAndOdd = (idx === sortedMembers.length - 1) && (sortedMembers.length % 2 !== 0);
            return (
              <TeacherCard 
                key={member.id} 
                member={member} 
                index={idx}
                onCardClick={setSelectedMember} 
                isLastAndOdd={isLastAndOdd}
              />
            );
          })}
        </div>
      </div>

      {/* Modal Profile View - 1:1 Match with Reference Screenshot */}
      {selectedMember && (() => {
        const theme = getLeaderTheme(selectedMember, sortedMembers.findIndex(m => m.id === selectedMember.id));
        const details = decodeTeacherDetails(selectedMember);
        const aboutBullets = details.about ? details.about.split('\n').filter(s => s.trim()) : [];

        return createPortal(
          <div 
            className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-[9999] p-4 sm:p-6 overflow-y-auto backdrop-blur-sm" 
            onClick={() => setSelectedMember(null)}
          >
            <div 
              className="relative w-full max-w-sm sm:max-w-md md:max-w-3xl lg:max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden cursor-default my-auto text-left max-h-[92vh] md:max-h-none overflow-y-auto custom-scrollbar" 
              onClick={(e) => e.stopPropagation()} 
              style={{ animation: "confirm-pop-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              {/* Header Gradient Banner */}
              <div className={`h-24 sm:h-32 md:h-44 bg-gradient-to-r ${theme.bannerBg} relative overflow-hidden rounded-t-3xl`}>
                {/* 4x5 Dot Matrix Overlay */}
                <div className="absolute top-3 left-3 grid grid-cols-5 gap-1.5 opacity-30 pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-white"></div>
                  ))}
                </div>

                {/* Close Button */}
                <button 
                  onClick={() => setSelectedMember(null)} 
                  className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 bg-white/25 hover:bg-white/45 text-white transition-all rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center backdrop-blur-md z-20 cursor-pointer shadow-md hover:scale-110 active:scale-95 border border-white/20"
                  title="Close Profile"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Profile Content Body */}
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 relative -mt-12 sm:-mt-16 md:-mt-20">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-6 items-start">
                  
                  {/* Left Column on Desktop */}
                  <div className="md:col-span-5 flex flex-col">
                    {/* Avatar Photo Frame */}
                    <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto md:mx-0 mb-2 sm:mb-3 shrink-0">
                      <div 
                        onClick={() => selectedMember.image_url && setShowFullPhoto(true)}
                        className={`w-full h-full rounded-full overflow-hidden border-[3px] sm:border-[4px] border-white shadow-xl bg-slate-100 flex items-center justify-center relative group ${selectedMember.image_url ? 'cursor-pointer hover:scale-105 transition-transform duration-300' : ''}`}
                        title={selectedMember.image_url ? "Click to view full photo" : ""}
                      >
                        {selectedMember.image_url ? (
                          <>
                            <img 
                              src={selectedMember.image_url} 
                              alt={selectedMember.name} 
                              className="w-full h-full object-cover" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-full text-white text-[9px] font-black uppercase tracking-wider gap-0.5 pointer-events-none">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Zoom</span>
                            </div>
                          </>
                        ) : (
                          <Icons.Users className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-slate-300" />
                        )}
                      </div>

                      {/* Scalloped Starburst Green Verified Badge */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 drop-shadow-md z-10" title="Verified Leader">
                        <svg className="w-full h-full" viewBox="0 0 32 32" fill="none">
                          <path
                            d="M16 2 L18.2 3.6 L20.8 2.8 L22.4 5 L25.1 5.2 L25.7 7.8 L28.2 8.9 L27.8 11.6 L29.8 13.5 L28.6 16 L29.8 18.5 L27.8 20.4 L28.2 23.1 L25.7 24.2 L25.1 26.8 L22.4 27 L20.8 29.2 L18.2 28.4 L16 30 L13.8 28.4 L11.2 29.2 L9.6 27 L6.9 26.8 L6.3 24.2 L3.8 23.1 L4.2 20.4 L2.2 18.5 L3.4 16 L2.2 13.5 L4.2 11.6 L3.8 8.9 L6.3 7.8 L6.9 5.2 L9.6 5 L11.2 2.8 L13.8 3.6 Z"
                            fill="#00b87c"
                            stroke="white"
                            strokeWidth="1.2"
                          />
                          <path
                            d="M10 16L14 20L22 11"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Name & Designation */}
                    <div className="text-center md:text-left mb-2.5 sm:mb-4">
                      <h3 className="font-serif font-black text-slate-900 text-lg sm:text-xl md:text-2xl leading-tight mb-0.5 sm:mb-1">{selectedMember.name}</h3>
                      <p className={`text-[11px] sm:text-xs font-extrabold tracking-widest uppercase ${theme.textAccent}`}>
                        {details.designation || "Leader"}
                      </p>
                      <div className={`w-8 h-0.5 rounded-full mx-auto md:mx-0 my-1.5 sm:my-2 ${theme.lineColor}`}></div>
                    </div>

                    {/* Info Container */}
                    <div className="bg-slate-50/90 border border-slate-100/90 rounded-2xl p-2.5 sm:p-4 space-y-2 sm:space-y-3 mb-2.5 sm:mb-4 shadow-2xs">
                      {/* Qualification */}
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${theme.bgAccent}`}>
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Qualification</p>
                          <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{details.qualification || "—"}</p>
                        </div>
                      </div>

                      <div className="border-b border-slate-100/80"></div>

                      {/* Email */}
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${theme.bgAccent}`}>
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Email</p>
                          {details.email ? (
                            <a href={`mailto:${details.email}`} className={`text-xs sm:text-sm font-bold truncate block hover:underline ${theme.textAccent}`}>{details.email}</a>
                          ) : (
                            <p className="text-xs sm:text-sm font-bold text-slate-400">—</p>
                          )}
                        </div>
                      </div>

                      <div className="border-b border-slate-100/80"></div>

                      {/* Phone */}
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${theme.bgAccent}`}>
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Phone</p>
                          {details.phone ? (
                            <a href={`tel:${details.phone}`} className="text-xs sm:text-sm font-bold text-slate-800 truncate block hover:underline">{details.phone}</a>
                          ) : (
                            <p className="text-xs sm:text-sm font-bold text-slate-400">—</p>
                          )}
                        </div>
                      </div>

                      <div className="border-b border-slate-100/80"></div>

                      {/* Department */}
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${theme.bgAccent}`}>
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Department</p>
                          <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{details.department || "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Footer Tag (Desktop) */}
                    <div className={`hidden md:flex rounded-2xl py-3 text-center text-xs font-extrabold items-center justify-center gap-2 border ${theme.bgAccent}`}>
                      <Icons.Team className="w-4 h-4" /> Leadership Member
                    </div>
                  </div>

                  {/* Right Column on Desktop (ONLY ABOUT Section) */}
                  <div className="md:col-span-7 flex flex-col pt-0 md:pt-24">
                    <div className="bg-slate-50/70 border border-slate-100/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 flex-1 flex flex-col">
                      <h4 className={`text-xs font-extrabold tracking-widest uppercase mb-1 ${theme.textAccent}`}>ABOUT</h4>
                      <div className={`w-6 h-0.5 rounded-full mb-2.5 sm:mb-4 ${theme.lineColor}`}></div>
                      
                      <div className="flex-1 max-h-60 sm:max-h-80 md:max-h-96 overflow-y-auto custom-scrollbar pr-1">
                        {aboutBullets.length > 0 ? (
                          <ul className="space-y-2 sm:space-y-3.5 text-xs sm:text-sm text-slate-600 font-medium">
                            {aboutBullets.map((bullet, idx) => (
                              <li key={idx} className="flex items-start gap-2 sm:gap-3">
                                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 mt-1.5 ${theme.lineColor}`}></span>
                                <span className="leading-relaxed text-slate-700">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs sm:text-sm text-slate-400 italic">No details added yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Footer Tag (Mobile) */}
                    <div className={`md:hidden mt-3 sm:mt-5 rounded-2xl py-2.5 sm:py-3 text-center text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-2 border ${theme.bgAccent}`}>
                      <Icons.Team className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Leadership Member
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Photo Lightbox Overlay - Viewport Fullscreen */}
              <div 
                onClick={() => setShowFullPhoto(false)}
                className={`fixed inset-0 bg-slate-950/98 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer z-[10000] p-4 transition-all duration-300 ${
                  showFullPhoto ? 'opacity-100 visible pointer-events-auto scale-100' : 'opacity-0 invisible pointer-events-none scale-95'
                }`}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowFullPhoto(false); }}
                  className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/20 hover:bg-white/40 text-white rounded-full p-2.5 transition-colors cursor-pointer z-50 backdrop-blur-md border border-white/20"
                  title="Close photo"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {selectedMember.image_url && (
                  <div className="relative max-w-full max-h-[80vh] sm:max-h-[85vh] p-2 flex items-center justify-center">
                    <img 
                      src={selectedMember.image_url} 
                      alt={selectedMember.name} 
                      className="max-w-full max-h-[80vh] sm:max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
                    />
                  </div>
                )}

                <div className="mt-4 bg-white/15 backdrop-blur-md px-5 py-2 rounded-full text-xs text-white/90 font-extrabold uppercase tracking-wider border border-white/20 shadow-lg">
                  Click anywhere to close
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </section>
  );
}
