"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { Icons } from "@/components/Icons";
import LoadingScreen from "@/components/layout/LoadingScreen";

const decodeDesignation = (raw) => {
  if (!raw) return { category: 'Teacher', designation: '' };
  if (raw.includes('::')) {
    const [cat, des] = raw.split('::');
    return { category: cat, designation: des };
  }
  return { category: 'Teacher', designation: raw };
};

const CommitteeCard = ({ member, onCardClick }) => {
  const { designation } = decodeDesignation(member.designation);

  return (
    <div 
      onClick={() => onCardClick(member)}
      className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-[0_10px_40px_rgb(37,99,235,0.05)] border border-blue-50/60 overflow-hidden flex flex-col hover:shadow-[0_20px_50px_rgb(37,99,235,0.1)] hover:-translate-y-2 transition-all duration-500 p-6 md:p-8 text-center group h-full cursor-pointer relative z-10"
    >
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-50/50 via-slate-50/30 to-white -z-10 group-hover:from-blue-100/40 transition-colors duration-500"></div>
      
      <div className="relative w-20 h-20 md:w-28 md:h-28 mx-auto mb-4 rounded-full overflow-hidden border-[4px] border-white shadow-xl shrink-0 bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-all duration-500">
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
        <h4 className="font-black text-slate-900 text-base md:text-xl leading-tight mb-1 tracking-tight line-clamp-2">
          {member.name}
        </h4>
        <div className="mt-auto pt-4">
          <p className="text-[9px] md:text-xs text-blue-700 font-black bg-blue-50/80 py-1.5 px-3 md:px-4 rounded-xl inline-block mx-auto border border-blue-100 uppercase tracking-widest shadow-sm break-words whitespace-normal text-center max-w-full leading-relaxed">
            {designation}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function CommitteePage({ prefetchedMembers }) {
  const [members, setMembers] = useState(prefetchedMembers || []);
  const [loading, setLoading] = useState(!prefetchedMembers);
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeCategory, setActiveCategory] = useState("Student");

  useEffect(() => {
    if (prefetchedMembers) {
      setMembers(prefetchedMembers);
      setLoading(false);
      return;
    }
    const fetchCommittee = async () => {
      try {
        const { data } = await supabase.from("committee").select("*").order("id", { ascending: true });
        if (data) {
          // Filter out teachers just in case this component is used standalone without prefetching
          const studentMembers = data.filter(m => m.designation && m.designation.includes('::') && !m.designation.startsWith('Teacher::'));
          setMembers(studentMembers);
        }
      } catch (err) {
        console.error("Error fetching committee:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommittee();
  }, [prefetchedMembers]);

  useEffect(() => {
    if (selectedMember) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedMember]);

  if (loading) return <LoadingScreen />;

  const filteredMembers = members.filter(m => decodeDesignation(m.designation).category === activeCategory);

  const committeeDetails = {
    Cultural: {
      title: "Cultural Activities & Events",
      desc: "Organizes cultural events, celebrations, and awareness campaigns through arts, drama, and music to foster unity and preserve heritage.",
      icon: <svg className="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      bg: "bg-pink-50/50", border: "border-pink-100"
    },
    Student: {
      title: "Core Coordination & Management",
      desc: "The core student body responsible for overall coordination, volunteer management, and executing NSS regular and special camp activities.",
      icon: <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      bg: "bg-blue-50/50", border: "border-blue-100"
    },
    Environment: {
      title: "Environmental Initiatives",
      desc: "Focuses on tree plantation drives, campus cleaning (Swachh Bharat), plastic-free campaigns, and environmental awareness among youth.",
      icon: <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      bg: "bg-green-50/50", border: "border-green-100"
    }
  };

  return (
    <section className="pt-24 pb-10 md:pt-32 md:pb-16 px-4 sm:px-6 lg:px-8 flex-grow relative overflow-hidden bg-[#faf9f6]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-3 border border-blue-100">
            <Icons.Team className="w-3.5 h-3.5" /> Student Wing
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-none">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">Committee</span>
          </h2>
          <p className="text-slate-500 font-medium text-xs md:text-base leading-relaxed">Meet the active student volunteers leading our various NSS initiatives and programs.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="bg-white/60 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-blue-100/50 inline-flex overflow-x-auto max-w-full no-scrollbar">
            {['Cultural', 'Student', 'Environment'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 md:px-10 py-3 md:py-3.5 rounded-full font-bold text-xs md:text-sm transition-all duration-300 whitespace-nowrap ${activeCategory === cat ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'}`}
              >
                {cat} Committee
              </button>
            ))}
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
            <p className="text-slate-400 font-bold tracking-tight">No members found in the {activeCategory} committee yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 items-stretch animate-fade-in-up" key={activeCategory}>
            {filteredMembers.map((member) => (
              <CommitteeCard key={member.id} member={member} onCardClick={setSelectedMember} />
            ))}
          </div>
        )}
      </div>

      {selectedMember && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-[9999] p-4 cursor-pointer backdrop-blur-sm" onClick={() => setSelectedMember(null)}>
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden cursor-default" onClick={(e) => e.stopPropagation()} style={{ animation: "confirm-pop-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
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
                <p className="text-xs md:text-sm text-blue-600 font-bold uppercase tracking-widest mb-6 px-2 break-words">
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
