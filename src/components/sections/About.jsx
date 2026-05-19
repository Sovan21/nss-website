"use client";
import React, { useState, useEffect } from "react";
import { Icons } from "@/components/Icons";

export default function AboutPage({ onNavigate, siteData }) {
  const finalData = siteData || {
    about_heading: "About Us",
    about_text: "Welcome to our NSS Unit.",
    about_image_url: "",
  };

  const images = finalData.about_image_url ? finalData.about_image_url.split(',').filter(Boolean) : ["https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80"];

  const [activeImgIdx, setActiveImgIdx] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImgIdx((prev) => (prev + 1) % images.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-4 sm:px-6 lg:px-8 bg-[#faf9f6] relative overflow-hidden flex-grow flex items-center">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col">
        {/* MAIN ROW: Text + Images */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          
          {/* TEXT & VALUATION COLUMN */}
          <div className="w-full lg:col-span-7 flex flex-col justify-center text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-extrabold text-[10px] md:text-xs uppercase tracking-widest w-max mb-6 mx-auto lg:mx-0 shadow-sm">
              <Icons.Info className="w-3.5 h-3.5 animate-pulse" /> Our Mission & Vision
            </div>
            
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
              {finalData.about_heading}
            </h2>
            
            <div className="h-1 w-16 bg-blue-600 rounded-full mb-8 mx-auto lg:mx-0"></div>
            
            <p className="text-sm md:text-base text-slate-600 mb-10 leading-relaxed font-semibold text-justify md:text-left">
              {finalData.about_text}
            </p>

            <h3 className="text-base md:text-lg font-black text-slate-900 mb-5 text-left uppercase tracking-wider">
              Core Objectives
            </h3>

            {/* Redesigned Objectives Grid */}
            <div className="grid grid-cols-1 gap-4 mb-2 text-left">
              {[
                { text: "Acquire leadership qualities and democratic attitudes.", title: "Leadership Development", icon: Icons.AcademicCap, color: "text-blue-600 bg-blue-50 border-blue-100/50" },
                { text: "Develop competence required for group-living and sharing of responsibilities.", title: "Collective Responsibility", icon: Icons.Team, color: "text-indigo-600 bg-indigo-50 border-indigo-100/50" },
                { text: "Gain practical skills in mobilizing community participation.", title: "Community Mobilization", icon: Icons.Users, color: "text-purple-600 bg-purple-50 border-purple-100/50" }
              ].map((item, index) => (
                <div key={index} className="flex gap-4 bg-white border border-slate-200/50 p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.01)] hover:shadow-[0_12px_35px_rgb(37,99,235,0.04)] hover:border-slate-300 transition-all duration-300 group">
                  <div className={`p-3 rounded-xl ${item.color} border shrink-0 transition-transform duration-500 group-hover:scale-110`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm md:text-base mb-1 tracking-tight">{item.title}</h4>
                    <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => onNavigate && onNavigate('activities')} 
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white font-extrabold rounded-xl hover:bg-blue-700 transition-all duration-300 w-full sm:w-max shadow-lg hover:shadow-blue-600/20 text-xs md:text-sm hover:-translate-y-0.5 cursor-pointer uppercase tracking-widest mt-8 mx-auto lg:mx-0"
            >
              See Our Impact <Icons.ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>

          {/* IMAGE Showcase COLUMN */}
          <div className="w-full lg:col-span-5 h-[340px] md:h-[480px] relative flex items-center justify-center">
            {/* Soft decorative shadow background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-indigo-500/5 rounded-3xl -z-10 blur-xl"></div>
            
            {/* MOBILE ONLY AUTO-PLAY HOMEPAGE-STYLE CROSS-FADE SLIDER */}
            <div className="block lg:hidden w-full relative z-10 px-2">
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                {images.map((imgUrl, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === activeImgIdx ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`NSS Slide ${index}`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover scale-105 transform origin-center transition-transform duration-[10000ms] will-change-transform ease-linear"
                      style={{ transform: index === activeImgIdx ? 'scale(1)' : 'scale(1.1)' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* DESKTOP ONLY INTERACTIVE STAGGERED PHOTO PRINT DECK */}
            <div className="hidden lg:block w-full h-full relative z-10">
              {images.length === 1 && (
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white z-10 hover:shadow-2xl transition-shadow duration-500">
                  <img src={images[0]} alt="About NSS" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              )}
              
              {images.length === 2 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[68%] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white hover:z-30 hover:scale-105 hover:rotate-0 rotate-[-4deg] transition-all duration-500 absolute left-4 top-4">
                    <img src={images[0]} alt="About 1" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-[60%] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white hover:z-30 hover:scale-105 hover:rotate-0 rotate-[4deg] transition-all duration-500 absolute right-4 bottom-4">
                    <img src={images[1]} alt="About 2" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {images.length >= 3 && (
                <div className="absolute inset-0">
                  {/* Photo 1: Left scatter */}
                  <div className="w-[58%] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-white bg-white hover:z-30 hover:scale-105 hover:rotate-0 rotate-[-5deg] transition-all duration-500 absolute left-2 top-8 z-10">
                    <img src={images[0]} alt="About 1" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  {/* Photo 2: Top Right scatter */}
                  <div className="w-[50%] aspect-square rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-white hover:z-30 hover:scale-105 hover:rotate-0 rotate-[3deg] transition-all duration-500 absolute right-2 top-2 z-20">
                    <img src={images[1]} alt="About 2" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  {/* Photo 3: Bottom Right scatter */}
                  <div className="w-[48%] aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-white hover:z-30 hover:scale-105 hover:rotate-0 rotate-[-2deg] transition-all duration-500 absolute right-6 bottom-4 z-[15]">
                    <img src={images[2]} alt="About 3" loading="lazy" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* TRUST & STATS BANNER */}
        <div className="mt-16 md:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
          {[
            { value: "150+", label: "Active Volunteers", desc: "Dedicated student change-makers on campus.", color: "from-blue-600 to-indigo-600 bg-blue-50 text-blue-700 border-blue-100" },
            { value: "50+", label: "Yearly Activities", desc: "Camps, blood donations & community drives.", color: "from-indigo-600 to-purple-600 bg-indigo-50 text-indigo-700 border-indigo-100" },
            { value: "1944", label: "College Heritage", desc: "80+ years of institutional excellence & service.", color: "from-purple-600 to-blue-600 bg-purple-50 text-purple-700 border-purple-100" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_15px_35px_rgb(37,99,235,0.06)] hover:border-blue-500/20 transition-all duration-500 group">
              <div className="flex justify-between items-start mb-4">
                <div className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  {stat.value}
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Icons.Sparkles className="w-4 h-4" />
                </div>
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm md:text-base mb-1 tracking-tight">{stat.label}</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{stat.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
