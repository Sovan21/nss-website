"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Icons } from "@/components/Icons";
import LoadingScreen from "@/components/layout/LoadingScreen";
import { useLanguage } from "@/context/LanguageContext";

const decodeDesignation = (raw) => {
  const defaults = {
    category: 'Student',
    designation: '',
    department: '',
    semester: '',
    blood_group: '',
    phone: '',
    email: '',
    registration_id: null,
    display_order: 999
  };

  if (!raw) return defaults;

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
          department: parsed.department || '',
          semester: parsed.semester || '',
          blood_group: parsed.blood_group || '',
          phone: parsed.phone || '',
          email: parsed.email || '',
          registration_id: parsed.registration_id || null,
          display_order: parsed.display_order != null ? Number(parsed.display_order) : 999
        };
      } catch (e) {
        return { ...defaults, category: cat, designation: rest };
      }
    }

    return { ...defaults, category: cat, designation: rest };
  }

  return { ...defaults, category: 'Student', designation: '' };
};

const getMemberOrder = (member) => {
  if (member?.display_order != null && !isNaN(Number(member.display_order))) {
    return Number(member.display_order);
  }
  const decoded = decodeDesignation(member?.designation);
  return decoded.display_order ?? 999;
};

const CATEGORY_THEMES = {
  Cultural: {
    badge: "bg-pink-100 text-pink-700 border-pink-200",
    headerGrad: "from-pink-500 via-rose-500 to-purple-600",
    bannerBg: "from-pink-600 to-rose-600",
    gradFrom: "#db2777",
    gradTo: "#e11d48",
    textAccent: "text-pink-600",
    bgAccent: "bg-pink-50 text-pink-600 border-pink-100/80",
    tagLabel: "Cultural Committee",
    icon: (
      <svg className="w-3.5 h-3.5 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
    )
  },
  Student: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    headerGrad: "from-blue-600 via-indigo-600 to-blue-700",
    bannerBg: "from-blue-600 to-indigo-700",
    gradFrom: "#2563eb",
    gradTo: "#4338ca",
    textAccent: "text-blue-600",
    bgAccent: "bg-blue-50 text-blue-600 border-blue-100/80",
    tagLabel: "Student Committee",
    icon: (
      <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  Environment: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    headerGrad: "from-emerald-600 via-teal-600 to-green-700",
    bannerBg: "from-emerald-600 to-teal-700",
    gradFrom: "#059669",
    gradTo: "#0d9488",
    textAccent: "text-emerald-600",
    bgAccent: "bg-emerald-50 text-emerald-600 border-emerald-100/80",
    tagLabel: "Environment Committee",
    icon: (
      <svg className="w-3.5 h-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
};

const getInitials = (name) => {
  if (!name) return "S";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const CommitteeCard = ({ member, registrations }) => {
  const decoded = decodeDesignation(member.designation);
  const vol = (decoded.registration_id ? registrations.find(r => String(r.id) === String(decoded.registration_id)) : null)
           || registrations.find(r => r.full_name && member.name && r.full_name.toLowerCase().trim() === member.name.toLowerCase().trim());
  
  const name = vol?.full_name || member.name;
  const department = vol?.department || decoded.department;
  const semester = vol?.semester || decoded.semester;
  const bloodGroup = vol?.blood_group || decoded.blood_group;
  const phone = vol?.phone || decoded.phone;
  const email = vol?.email || decoded.email;
  const photoUrl = vol?.photo_url || member.image_url;

  const theme = CATEGORY_THEMES[decoded.category] || CATEGORY_THEMES.Student;

  return (
    <div className="bg-white rounded-3xl border border-slate-100/90 shadow-[0_8px_24px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative h-full group p-4 sm:p-5">
      
      {/* Top Background Curve & 4x5 Dot Matrix */}
      <div className="absolute top-0 left-0 w-full h-32 overflow-hidden pointer-events-none rounded-t-3xl">
        <svg className="w-full h-full preserve-3d" viewBox="0 0 350 130" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${member.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.gradFrom || "#2563eb"} />
              <stop offset="100%" stopColor={theme.gradTo || "#4338ca"} />
            </linearGradient>
          </defs>
          {/* Smooth curved shape starting top left - constrained to top-left behind photo avatar */}
          <path d="M 0,0 L 145,0 C 120,70 70,105 0,125 Z" fill={`url(#grad-${member.id})`} />
        </svg>

        {/* 4x5 Dot Matrix Grid Overlay on Top Left */}
        <div className="absolute top-3 left-3 grid grid-cols-5 gap-1.5 opacity-30 z-10 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white"></div>
          ))}
        </div>
      </div>

      <div>
        {/* Top Header Row: Category Badge on Top-Right */}
        <div className="relative z-10 flex justify-end mb-2.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase text-white shadow-sm bg-gradient-to-r ${theme.bannerBg} border border-white/20`}>
            {theme.icon}
            {theme.tagLabel}
          </span>
        </div>

        {/* Profile Avatar on Left + Name & Designation on Right (Clean White BG) */}
        <div className="relative z-10 flex items-center gap-3 sm:gap-4 mt-1">
          {/* Avatar with White Ring & Verified Green Checkmark */}
          <div className="relative shrink-0">
            <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full overflow-hidden border-[4px] border-white shadow-lg bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-400 font-black text-xl sm:text-2xl">{getInitials(name)}</span>
              )}
            </div>
            {/* Scalloped Starburst Green Verified Badge under photo avatar */}
            <div className="absolute -bottom-1 -right-1 w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 drop-shadow-md z-10" title="Verified Active Member">
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

          {/* Member Name & Designation Tag (Positioned on Clean White BG) */}
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-serif font-extrabold text-slate-900 text-sm sm:text-base lg:text-[15px] xl:text-base leading-snug truncate mb-1" title={name}>
              {name}
            </h3>
            <span className={`inline-block text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-md ${theme.bgAccent} shadow-2xs`}>
              {decoded.designation || "Member"}
            </span>
          </div>
        </div>

        {/* Horizontal Separator Line */}
        <div className="border-b border-slate-100 my-3 w-full"></div>

        {/* Metadata Details Rows */}
        <div className="space-y-3 mb-4">
          {/* Subject & Semester Row */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#eef4ff] text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60 shadow-2xs">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
                {department || "English"} {semester ? `• ${semester}` : ''}
              </p>
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                SUBJECT & SEMESTER
              </p>
            </div>
          </div>

          {/* Blood Group Row with Blood Drop Icon */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#ffeef0] text-red-500 flex items-center justify-center shrink-0 border border-red-100/60 shadow-2xs">
              {/* Blood Drop SVG Icon */}
              <svg className="w-4 h-4 text-red-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
                {bloodGroup || "0+"}
              </p>
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                BLOOD GROUP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer Box (No Arrow Icon) */}
      <div className="relative z-10 pt-1">
        <div className="bg-[#f6f8fc] rounded-xl p-2.5 flex items-center justify-center border border-slate-100 text-xs shadow-2xs">
          {(phone || email) ? (
            <a
              href={phone ? `tel:${phone}` : `mailto:${email}`}
              className="w-full flex items-center justify-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors py-0.5 no-underline"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Contact</span>
            </a>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 text-slate-400 font-bold py-0.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Contact</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default function CommitteePage({ prefetchedMembers }) {
  const { t } = useLanguage();
  const [members, setMembers] = useState(prefetchedMembers || []);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(!prefetchedMembers || prefetchedMembers.length === 0);
  const [activeCategory, setActiveCategory] = useState("Student");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: commData }, { data: regData }] = await Promise.all([
          supabase.from("committee").select("*").order("id", { ascending: true }),
          supabase.from("registrations").select("*")
        ]);
        if (commData) {
          const studentMembers = commData.filter(m => {
            const decoded = decodeDesignation(m.designation);
            return decoded.category !== 'Teacher';
          });
          setMembers(studentMembers);
        }
        if (regData) {
          setRegistrations(regData);
        }
      } catch (err) {
        console.error("Error fetching committee:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingScreen />;

  const filteredMembers = members
    .filter(m => decodeDesignation(m.designation).category === activeCategory)
    .sort((a, b) => {
      const orderA = getMemberOrder(a);
      const orderB = getMemberOrder(b);
      if (orderA !== orderB) return orderA - orderB;
      return (a.id || 0) - (b.id || 0);
    });

  const committeeDetails = {
    Cultural: {
      title: t("committee.details.Cultural.title"),
      desc: t("committee.details.Cultural.desc"),
      icon: CATEGORY_THEMES.Cultural.icon,
      bg: "bg-pink-50/60", border: "border-pink-100"
    },
    Student: {
      title: t("committee.details.Student.title"),
      desc: t("committee.details.Student.desc"),
      icon: CATEGORY_THEMES.Student.icon,
      bg: "bg-blue-50/60", border: "border-blue-100"
    },
    Environment: {
      title: t("committee.details.Environment.title"),
      desc: t("committee.details.Environment.desc"),
      icon: CATEGORY_THEMES.Environment.icon,
      bg: "bg-emerald-50/60", border: "border-emerald-100"
    }
  };

  return (
    <section className="pt-24 pb-10 md:pt-32 md:pb-16 px-4 sm:px-6 lg:px-8 flex-grow relative overflow-hidden bg-[#faf9f6]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-3 border border-blue-100">
            <Icons.Team className="w-3.5 h-3.5" /> {t("committee.badge")}
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-none">
            {t("committee.heading")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">{t("committee.headingAccent")}</span>
          </h2>
          <p className="text-slate-500 font-medium text-xs md:text-base leading-relaxed">{t("committee.subtitle")}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 md:mb-8">
          {/* Desktop Navigation (Horizontal Pills) */}
          <div className="hidden sm:inline-flex bg-white/70 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-slate-200/60 overflow-x-auto max-w-full no-scrollbar">
            {['Cultural', 'Student', 'Environment'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 md:px-10 py-3 md:py-3.5 rounded-full font-bold text-xs md:text-sm transition-all duration-300 whitespace-nowrap ${activeCategory === cat ? 'bg-slate-900 text-white shadow-md scale-[1.02]' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100/60'}`}
              >
                {t(`committee.tab.${cat}`)}{t("committee.tabSuffix")}
              </button>
            ))}
          </div>

          {/* Mobile Navigation (Ultra-Slim 3-Column Segmented Control) */}
          <div className="grid sm:hidden grid-cols-3 gap-1 p-1 bg-slate-200/60 backdrop-blur-xl rounded-xl border border-slate-200/80 shadow-inner w-full select-none">
            {['Cultural', 'Student', 'Environment'].map((cat) => {
              const isSelected = activeCategory === cat;
              const gradients = {
                Cultural: 'from-pink-500 via-rose-500 to-pink-600 shadow-pink-500/30',
                Student: 'from-blue-600 via-indigo-600 to-blue-700 shadow-blue-500/30',
                Environment: 'from-emerald-600 via-teal-600 to-green-700 shadow-emerald-500/30'
              };

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`relative flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg transition-all duration-150 ease-out active:scale-95 touch-manipulation cursor-pointer ${
                    isSelected
                      ? `bg-gradient-to-r ${gradients[cat]} text-white shadow-sm scale-[1.01] font-extrabold z-10`
                      : 'bg-white/80 hover:bg-white text-slate-700 font-bold shadow-2xs'
                  }`}
                >
                  <span className={`shrink-0 ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                    {React.cloneElement(CATEGORY_THEMES[cat].icon, {
                      className: `w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-600'}`
                    })}
                  </span>
                  <span className="text-[12px] font-bold leading-none truncate tracking-tight">
                    {t(`committee.tab.${cat}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Committee Info Banner */}
        <div className={`mb-10 max-w-3xl mx-auto rounded-2xl p-5 md:p-6 border flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 transition-colors duration-500 animate-fade-in-up ${committeeDetails[activeCategory].bg} ${committeeDetails[activeCategory].border}`}>
          <div className="bg-white p-3 rounded-xl shadow-sm shrink-0">
            {committeeDetails[activeCategory].icon}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-lg mb-1">{committeeDetails[activeCategory].title}</h4>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">{committeeDetails[activeCategory].desc}</p>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl md:rounded-[2.5rem] text-center border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-fade-in-up">
            <Icons.Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold tracking-tight">{t("committee.noMembers")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-stretch animate-fade-in-up" key={activeCategory}>
            {filteredMembers.map((member) => (
              <CommitteeCard key={member.id} member={member} registrations={registrations} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
