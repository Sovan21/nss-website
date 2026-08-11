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

const TeacherCard = ({ member, onCardClick }) => {
  const { designation } = decodeDesignation(member.designation);

  return (
    <div 
      onClick={() => onCardClick(member)}
      className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-md border border-slate-100 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-4 md:p-6 text-center group h-full cursor-pointer relative z-10"
    >
      <div className="absolute top-0 left-0 w-full h-20 md:h-24 bg-gradient-to-br from-indigo-50/80 via-slate-50/50 to-white -z-10 group-hover:from-indigo-100/60 transition-colors duration-500"></div>
      
      <div className="relative w-16 h-16 md:w-28 md:h-28 mx-auto mb-3 md:mb-4 rounded-full overflow-hidden border-2 md:border-[4px] border-white shadow-lg shrink-0 bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-all duration-500">
        {member.image_url ? (
          <img
            src={member.image_url}
            alt={member.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <Icons.Users className="w-10 h-10 md:w-12 md:h-12 text-slate-300" />
        )}
      </div>

      <div className="flex flex-col flex-grow justify-center">
        <h4 className="font-black text-slate-900 text-sm md:text-xl leading-tight mb-1 tracking-tight line-clamp-2">
          {member.name}
        </h4>
        <div className="mt-auto pt-2">
          <p className="text-[8px] md:text-xs text-indigo-700 font-black bg-indigo-50/80 py-1.5 px-3 md:px-4 rounded-xl inline-block mx-auto border border-indigo-100 uppercase tracking-widest shadow-sm break-words whitespace-normal text-center max-w-full leading-relaxed">
            {designation}
          </p>
        </div>
      </div>
    </div>
  );
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
    <section className="pt-8 pb-10 md:pt-12 md:pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-3 border border-indigo-100">
            <Icons.Team className="w-3.5 h-3.5" /> {t("teachers.badge")}
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-none">
            {t("teachers.heading")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700">{t("teachers.headingAccent")}</span>
          </h2>
          <p className="text-slate-500 font-medium text-xs md:text-base leading-relaxed">{t("teachers.subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8 items-stretch">
          {sortedMembers.map((member) => (
            <TeacherCard key={member.id} member={member} onCardClick={setSelectedMember} />
          ))}
        </div>
      </div>

      {selectedMember && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-[9999] p-4 cursor-pointer backdrop-blur-sm" onClick={() => setSelectedMember(null)}>
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden cursor-default" onClick={(e) => e.stopPropagation()} style={{ animation: "confirm-pop-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
              <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white transition-all rounded-full p-2 backdrop-blur-md">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="px-6 md:px-8 pb-8 -mt-16 relative">
              <div 
                onClick={() => selectedMember.image_url && setShowFullPhoto(true)}
                className={`w-28 h-28 md:w-32 md:h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-50 flex items-center justify-center mb-4 relative group ${selectedMember.image_url ? 'cursor-pointer hover:scale-105 transition-all duration-300' : ''}`}
                title={selectedMember.image_url ? "Click to view full photo" : ""}
              >
                {selectedMember.image_url ? (
                  <>
                    <img src={selectedMember.image_url} alt={selectedMember.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-full text-white text-[10px] font-black uppercase tracking-wider gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>View Photo</span>
                    </div>
                  </>
                ) : (
                  <Icons.Users className="w-16 h-16 text-slate-300" />
                )}
              </div>
              
              <div className="text-center mt-2">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-1">{selectedMember.name}</h3>
                <p className="text-xs md:text-sm text-indigo-600 font-bold uppercase tracking-widest mb-6 px-2 break-words">
                  {decodeDesignation(selectedMember.designation).designation}
                </p>
                
                {selectedMember.about ? (
                  <div className="bg-slate-50 rounded-2xl p-4 md:p-5 text-sm text-slate-700 leading-relaxed text-left border border-slate-100 h-60 overflow-y-auto custom-scrollbar">
                    <h4 className="font-black text-slate-800 mb-2 uppercase tracking-wide text-xs">{t("teachers.about")}</h4>
                    <div className="whitespace-pre-wrap">{selectedMember.about}</div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-4 md:p-5 text-sm text-slate-700 leading-relaxed text-center border border-slate-100 h-60 flex items-center justify-center">
                    <p className="text-slate-400 italic text-sm">{t("teachers.noDetails")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Absolute Full Photo Overlay (Floating inside with small inset border & scale origin centering) */}
            <div 
              onClick={() => setShowFullPhoto(false)}
              className={`absolute inset-3 rounded-2xl bg-slate-950/98 flex items-center justify-center cursor-pointer z-50 transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform border border-slate-800 ${showFullPhoto ? 'scale-100 opacity-100 visible pointer-events-auto' : 'scale-0 opacity-0 invisible pointer-events-none'}`}
              style={{ transformOrigin: '50% 80px' }}
            >
              {selectedMember.image_url && (
                <img 
                  src={selectedMember.image_url} 
                  alt={selectedMember.name} 
                  className="w-full h-full object-contain p-2" 
                />
              )}
              
              {/* Image Close Button */}
              <button 
                onClick={(e) => { e.stopPropagation(); setShowFullPhoto(false); }}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors cursor-pointer z-50 border border-white/10 focus:outline-none"
                title="Close photo"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1.5 rounded-full text-[10px] text-white/90 font-bold uppercase tracking-wider whitespace-nowrap">
                Click photo to go back
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
