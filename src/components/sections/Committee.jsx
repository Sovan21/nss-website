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
    bannerBg: "from-rose-500 to-pink-600",
    textAccent: "text-pink-600",
    bgAccent: "bg-pink-50/80 border-pink-100",
    tagLabel: "Cultural Committee",
    icon: (
      <svg className="w-3.5 h-3.5 text-pink-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
    )
  },
  Student: {
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    headerGrad: "from-blue-600 via-indigo-600 to-blue-700",
    bannerBg: "from-blue-600 to-indigo-700",
    textAccent: "text-blue-600",
    bgAccent: "bg-blue-50/80 border-blue-100",
    tagLabel: "Student Committee",
    icon: (
      <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  Environment: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    headerGrad: "from-emerald-600 via-teal-600 to-green-700",
    bannerBg: "from-emerald-600 to-teal-700",
    textAccent: "text-emerald-600",
    bgAccent: "bg-emerald-50/80 border-emerald-100",
    tagLabel: "Environment Committee",
    icon: (
      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <div 
      className="bg-white rounded-[2rem] shadow-[0_10px_30px_rgb(0,0,0,0.05)] border border-slate-100/80 overflow-hidden flex flex-col hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-300 text-center group h-full relative z-10"
    >
      {/* Top Banner Gradient */}
      <div className={`h-20 bg-gradient-to-r ${theme.bannerBg} relative overflow-hidden flex items-start justify-end p-3 shrink-0`}>
        <div className="absolute -left-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-sm"></div>
        <div className="absolute right-10 -bottom-6 w-16 h-16 bg-white/10 rounded-full blur-xs"></div>

        {/* Category Pill Tag */}
        <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/90 text-slate-800 shadow-sm backdrop-blur-md inline-flex items-center gap-1.5 border border-white/40 z-10">
          {theme.icon}
          {theme.tagLabel}
        </span>
      </div>

      {/* Round Circle Avatar */}
      <div className="relative mx-auto -mt-11 mb-3 shrink-0">
        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-[4px] border-white shadow-xl bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-slate-400 font-black text-2xl md:text-3xl">{getInitials(name)}</span>
          )}
        </div>
        {/* Verified Active Badge Dot */}
        <div className="absolute bottom-1 right-1 w-5.5 h-5.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white shadow-sm" title="Active Volunteer Member">
          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        </div>
      </div>

      <div className="p-5 pt-0 flex flex-col flex-grow justify-between">
        <div>
          <h4 className="font-black text-slate-900 text-base md:text-lg leading-snug mb-1.5 line-clamp-1">
            {name}
          </h4>
          
          <div className="mb-3">
            <span className={`text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-lg border ${theme.bgAccent} ${theme.textAccent} inline-block shadow-2xs`}>
              {decoded.designation || "Member"}
            </span>
          </div>
        </div>

        {/* Student Metadata Information */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
          {(department || semester) && (
            <div className="font-bold text-slate-700 bg-slate-50/80 py-1.5 px-3 rounded-xl truncate text-[11px] flex items-center justify-center gap-1.5 border border-slate-100">
              <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              <span className="truncate">{department} {semester ? `• ${semester}` : ''}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {bloodGroup && (
              <span className="inline-flex items-center gap-1 font-extrabold text-red-700 bg-red-50 py-1 px-2.5 rounded-lg border border-red-100 text-[10px] uppercase tracking-wider">
                <svg className="w-3 h-3 text-red-600 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                {bloodGroup}
              </span>
            )}

            {(phone || email) && (
              <a 
                href={phone ? `tel:${phone}` : `mailto:${email}`}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 py-1 px-2.5 rounded-lg border border-blue-100 transition-colors no-underline"
              >
                <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact
              </a>
            )}
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 items-stretch animate-fade-in-up" key={activeCategory}>
            {filteredMembers.map((member) => (
              <CommitteeCard key={member.id} member={member} registrations={registrations} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
