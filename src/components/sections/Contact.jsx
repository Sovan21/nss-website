"use client";
import React from "react";
import { Icons } from "@/components/Icons";

export default function ContactPage({ siteData }) {
  const finalData = siteData || {
    contact_email: "",
    contact_phone: "",
    contact_whatsapp: "",
  };

  const phoneParts = finalData.contact_phone ? finalData.contact_phone.split(',') : [];
  const phone1 = phoneParts[0]?.trim() || '';
  const phone2 = phoneParts[1]?.trim() || '';

  const handleEmailClick = (e, email) => {
    e.preventDefault();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `mailto:${email}`;
    } else {
      window.open(`https://mail.google.com/mail/?extsrc=mailto&url=mailto:${email}`, '_blank');
    }
  };

  return (
    <section className="pt-28 pb-12 md:pt-36 md:pb-20 px-4 sm:px-6 lg:px-8 bg-[#faf9f6] flex-grow flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
 
      <div className="max-w-5xl w-full mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-4 border border-blue-100">
            <Icons.Mail className="w-3.5 h-3.5" /> Communication
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-none">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">Touch</span>
          </h2>
          <p className="text-slate-500 font-medium text-sm md:text-lg leading-relaxed">Have questions or want to collaborate? Reach out to us through any of the channels below.</p>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Address */}
          <a href="https://www.google.com/maps/place/B.B.College/@23.6808679,86.9980219,16.17z/data=!4m6!3m5!1s0x39f71ee555555555:0xed1b371b2dd1ddfb!8m2!3d23.680962!4d86.9975621!16s%2Fm%2F0j25rl7?entry=ttu&g_ep=EgoyMDI2MDUwNi4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noreferrer" className="bg-white p-8 rounded-3xl md:rounded-[2.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center group cursor-pointer">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Icons.MapPin className="w-7 h-7" />
            </div>
            <h4 className="text-slate-900 font-black text-lg mb-3 tracking-tight">Location</h4>
            <span className="text-blue-600 text-xs md:text-sm font-black group-hover:underline decoration-2 underline-offset-4">
              B.B. College Campus<br />Asansol, WB, India
            </span>
          </a>
 
          {/* Email */}
          <div onClick={(e) => handleEmailClick(e, finalData.contact_email || "bbcollege1944@gmail.com")} className="bg-white p-8 rounded-3xl md:rounded-[2.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center group cursor-pointer">
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Icons.Mail className="w-7 h-7" />
            </div>
            <h4 className="text-slate-900 font-black text-lg mb-3 tracking-tight">Email Us</h4>
            <span className="text-blue-600 text-[13px] md:text-sm font-black break-words group-hover:underline decoration-2 underline-offset-4">
              {finalData.contact_email || "bbcollege1944@gmail.com"}
            </span>
          </div>
 
          {/* Phone */}
          <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center group">
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-600/20 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Icons.Phone className="w-7 h-7" />
            </div>
            <h4 className="text-slate-900 font-black text-lg mb-3 tracking-tight">Call Us</h4>
            <div className="flex flex-col gap-1.5 w-full">
              {phone1 ? (
                <a href={`tel:${phone1}`} className="text-emerald-600 text-[13px] md:text-[13px] font-black hover:underline decoration-2 underline-offset-4 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-block w-full whitespace-nowrap overflow-hidden text-ellipsis">
                  {phone1}
                </a>
              ) : null}
              {phone2 ? (
                <a href={`tel:${phone2}`} className="text-emerald-600 text-[13px] md:text-[13px] font-black hover:underline decoration-2 underline-offset-4 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-block w-full whitespace-nowrap overflow-hidden text-ellipsis">
                  {phone2}
                </a>
              ) : null}
              {!phone1 && !phone2 && (
                <span className="text-emerald-600 text-xs md:text-sm font-black">
                  Unavailable
                </span>
              )}
            </div>
          </div>
 
          {/* WhatsApp */}
          <div onClick={() => { if (finalData.contact_whatsapp) window.open(finalData.contact_whatsapp, '_blank'); }} className="bg-white p-8 rounded-3xl md:rounded-[2.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center group cursor-pointer">
            <div className="w-14 h-14 bg-[#25D366] text-white rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/20 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Icons.Whatsapp className="w-7 h-7" />
            </div>
            <h4 className="text-slate-900 font-black text-lg mb-3 tracking-tight">WhatsApp</h4>
            <span className="text-green-600 text-xs md:text-sm font-black group-hover:underline decoration-2 underline-offset-4">
              Send a Message
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
