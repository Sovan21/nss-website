"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Icons } from "@/components/Icons";
import LoadingScreen from "@/components/layout/LoadingScreen";

export default function AboutPage({ onNavigate }) {
  const [siteData, setSiteData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSiteData = async () => {
      try {
        const { data } = await supabase.from("site_content").select("*").limit(1).single();
        if (data) setSiteData(data);
      } catch (err) {
        console.error("Error fetching about data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSiteData();
  }, []);

  if (loading) return <LoadingScreen />;

  const finalData = siteData || {
    about_heading: "About Us",
    about_text: "Welcome to our NSS Unit.",
    about_image_url: "",
  };

  const images = finalData.about_image_url ? finalData.about_image_url.split(',').filter(Boolean) : ["https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80"];

  return (
    <section className="pt-28 pb-12 md:pt-36 md:pb-20 px-4 sm:px-6 lg:px-8 bg-[#faf9f6] relative overflow-hidden flex-grow flex items-center">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20 bg-white/70 backdrop-blur-2xl p-8 md:p-16 rounded-[3rem] shadow-[0_20px_50px_rgb(37,99,235,0.05)] border border-blue-50/60 relative z-10 w-full overflow-hidden">
        
        {/* TEXT SIDE */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left order-1 lg:order-2">
          <div className="inline-flex items-center justify-center lg:justify-start gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] w-max mb-6 mx-auto lg:mx-0 border border-blue-100">
            <Icons.Info className="w-3.5 h-3.5" /> Our Mission
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
            {finalData.about_heading}
          </h2>
          <div className="h-1.5 w-16 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-full mb-8 mx-auto lg:mx-0 shadow-lg shadow-blue-500/20"></div>
          
          <p className="text-sm md:text-base text-slate-600 mb-8 leading-relaxed font-medium text-justify md:text-left">
            {finalData.about_text}
          </p>

          <ul className="space-y-3 mb-10 text-left mx-auto lg:mx-0 w-full">
            {[
              { text: "Develop competence required for group-living and sharing of responsibilities.", icon: Icons.Team },
              { text: "Gain skills in mobilizing community participation.", icon: Icons.Users },
              { text: "Acquire leadership qualities and democratic attitudes.", icon: Icons.AcademicCap }
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-blue-50 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300">
                <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-600/20">
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-slate-800 font-bold text-xs md:text-sm leading-tight mt-1">{item.text}</span>
              </li>
            ))}
          </ul>

          <button onClick={() => onNavigate && onNavigate('activities')} className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-700 transition-all duration-500 w-full sm:w-max shadow-2xl hover:shadow-blue-700/40 text-sm mx-auto lg:mx-0 hover:-translate-y-1 cursor-pointer uppercase tracking-widest">
            See Our Impact <Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        {/* IMAGE SIDE */}
        <div className="w-full lg:w-1/2 relative group order-2 lg:order-1 h-[250px] md:h-[350px]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-[2rem] transform -rotate-3 scale-105 opacity-60 group-hover:rotate-0 transition-transform duration-700 shadow-inner"></div>
          
          {images.length === 1 && (
            <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-xl border-[6px] border-white bg-white z-10">
              <img src={images[0]} alt="About NSS" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 will-change-transform" />
            </div>
          )}
          
          {images.length === 2 && (
            <div className="relative w-full h-full flex gap-3 z-10">
              <div className="w-1/2 h-full rounded-[2rem] overflow-hidden shadow-lg border-[4px] border-white bg-white"><img src={images[0]} alt="About 1" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 will-change-transform" /></div>
              <div className="w-1/2 h-[85%] mt-auto rounded-[2rem] overflow-hidden shadow-lg border-[4px] border-white bg-white"><img src={images[1]} alt="About 2" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 will-change-transform" /></div>
            </div>
          )}

          {images.length >= 3 && (
            <div className="relative w-full h-full flex gap-3 z-10">
              <div className="w-[55%] h-full rounded-[2rem] overflow-hidden shadow-lg border-[4px] border-white bg-white">
                <img src={images[0]} alt="About 1" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 will-change-transform" />
              </div>
              <div className="w-[45%] h-full flex flex-col gap-3">
                <div className="h-1/2 w-full rounded-[1.5rem] overflow-hidden shadow-lg border-[4px] border-white bg-white"><img src={images[1]} alt="About 2" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 will-change-transform" /></div>
                <div className="h-1/2 w-full rounded-[1.5rem] overflow-hidden shadow-lg border-[4px] border-white bg-white"><img src={images[2]} alt="About 3" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 will-change-transform" /></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
