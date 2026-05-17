"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { Icons } from "@/components/Icons";
import LoadingScreen from "@/components/layout/LoadingScreen";

const CommitteeCard = ({ member, onImageClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const charLimit = 70;
  const hasLongAbout = member.about && member.about.length > charLimit;

  return (
    <div className="bg-white rounded-[2.5rem] shadow-[0_10px_40px_rgb(37,99,235,0.05)] border border-blue-50/60 overflow-hidden flex flex-col hover:shadow-[0_20px_50px_rgb(37,99,235,0.1)] hover:-translate-y-2 transition-all duration-500 p-6 md:p-8 text-center group h-fit relative z-10">
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-50/50 via-slate-50/30 to-white -z-10 group-hover:from-blue-100/40 transition-colors duration-500"></div>
      
      <div className="relative w-20 h-20 md:w-28 md:h-28 mx-auto mb-4 rounded-full overflow-hidden border-[4px] border-white shadow-xl shrink-0 bg-slate-50 flex items-center justify-center group-hover:scale-105 transition-all duration-500">
        {member.image_url ? (
          <img
            src={member.image_url}
            alt={member.name}
            loading="lazy"
            className="w-full h-full object-cover cursor-pointer group-hover:scale-110 transition-transform duration-500"
            onClick={() => onImageClick(member.image_url)}
          />
        ) : (
          <Icons.Users className="w-10 h-10 md:w-12 md:h-12 text-slate-300" />
        )}
      </div>

      <h4 className="font-black text-slate-900 text-base md:text-xl leading-tight mb-1 tracking-tight">
        {member.name}
      </h4>
      <p className="text-[9px] md:text-xs text-blue-700 font-black mb-4 bg-blue-50/80 py-1.5 px-4 rounded-full inline-block mx-auto border border-blue-100 uppercase tracking-widest shadow-sm">
        {member.designation}
      </p>

      {member.about && (
        <div className="text-[10px] md:text-sm text-slate-500 leading-relaxed flex flex-col items-center border-t border-slate-100 pt-4">
          <p className="transition-all duration-300 text-center w-full break-words font-medium">
            {isExpanded ? member.about : hasLongAbout ? `${member.about.substring(0, charLimit)}...` : member.about}
          </p>

          {hasLongAbout && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 flex items-center justify-center gap-1.5 text-blue-600 font-black hover:text-blue-800 transition focus:outline-none cursor-pointer text-[10px] md:text-xs uppercase tracking-widest"
            >
              {isExpanded ? <>Collapse <Icons.ChevronUp className="w-3.5 h-3.5" /></> : <>Details <Icons.ChevronDown className="w-3.5 h-3.5" /></>}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function CommitteePage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    const fetchCommittee = async () => {
      try {
        const { data } = await supabase.from("committee").select("*").order("id", { ascending: true });
        if (data) setMembers(data);
      } catch (err) {
        console.error("Error fetching committee:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommittee();
  }, []);

  useEffect(() => {
    if (zoomedImage) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [zoomedImage]);

  if (loading) return <LoadingScreen />;

  return (
    <section className="pt-28 pb-12 md:pt-36 md:pb-20 px-4 sm:px-6 lg:px-8 flex-grow relative overflow-hidden bg-[#faf9f6]">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-4 border border-blue-100">
            <Icons.Team className="w-3.5 h-3.5" /> Leadership
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-none">
            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">Committee</span>
          </h2>
          <p className="text-slate-500 font-medium text-sm md:text-lg leading-relaxed">Meet the visionaries and educators who lead our NSS unit with dedication and excellence.</p>
        </div>

        {members.length === 0 ? (
          <div className="bg-white p-16 rounded-[2.5rem] text-center border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <Icons.Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold tracking-tight">Committee details will be updated soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 items-start">
            {members.map((member) => (
              <CommitteeCard key={member.id} member={member} onImageClick={setZoomedImage} />
            ))}
          </div>
        )}
      </div>

      {zoomedImage && createPortal(
        <div className="fixed inset-0 bg-slate-950/95 flex items-center justify-center z-[9999] p-4 cursor-pointer backdrop-blur-xl" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-3xl max-h-[90vh]" style={{ animation: "confirm-pop-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <img src={zoomedImage} alt="Zoomed Profile" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-2 border-white/10" onClick={(e) => e.stopPropagation()} />
            <button onClick={() => setZoomedImage(null)} className="absolute -top-3 -right-3 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all rounded-full p-2 shadow-xl border border-slate-200 cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
