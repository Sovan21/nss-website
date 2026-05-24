"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icons } from "@/components/Icons";

const decodeDesignation = (raw) => {
  if (!raw) return { category: 'Teacher', designation: '' };
  if (raw.includes('::')) {
    const [cat, des] = raw.split('::');
    return { category: cat, designation: des };
  }
  return { category: 'Teacher', designation: raw };
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
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (selectedMember) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedMember]);

  if (!members || members.length === 0) return null;

  return (
    <section className="pt-10 pb-10 md:pt-16 md:pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-3 border border-indigo-100">
            <Icons.Team className="w-3.5 h-3.5" /> Leadership
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-none">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700">Leadership</span>
          </h2>
          <p className="text-slate-500 font-medium text-xs md:text-base leading-relaxed">The guiding lights and educators who lead our NSS unit with dedication and excellence.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8 items-stretch">
          {members.map((member) => (
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
              <div className="w-28 h-28 md:w-32 md:h-32 mx-auto rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-50 flex items-center justify-center mb-4">
                {selectedMember.image_url ? (
                  <img src={selectedMember.image_url} alt={selectedMember.name} className="w-full h-full object-cover" />
                ) : (
                  <Icons.Users className="w-16 h-16 text-slate-300" />
                )}
              </div>
              
              <div className="text-center">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-1">{selectedMember.name}</h3>
                <p className="text-xs md:text-sm text-indigo-600 font-bold uppercase tracking-widest mb-6 px-2 break-words">
                  {decodeDesignation(selectedMember.designation).designation}
                </p>
                
                {selectedMember.about ? (
                  <div className="bg-slate-50 rounded-2xl p-4 md:p-5 text-sm text-slate-700 leading-relaxed text-left border border-slate-100 max-h-60 overflow-y-auto custom-scrollbar">
                    <h4 className="font-black text-slate-800 mb-2 uppercase tracking-wide text-xs">About</h4>
                    <div className="whitespace-pre-wrap">{selectedMember.about}</div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-sm">No additional details available.</p>
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
