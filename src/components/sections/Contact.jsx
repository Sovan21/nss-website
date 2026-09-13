"use client";
import React from "react";
import { Icons } from "@/components/Icons";
import { useLanguage } from "@/context/LanguageContext";

export default function ContactPage({ siteData }) {
  const { t } = useLanguage();
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
    <section className="w-full bg-[#faf9f6] py-8 sm:py-10 px-4 sm:px-6 lg:px-8 flex-grow flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

      <div className="max-w-6xl w-full mx-auto relative z-10 flex flex-col">
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#004899] text-xs font-black uppercase tracking-widest shadow-xs mb-2.5">
            <Icons.Mail className="w-4 h-4 text-blue-600" />
            <span>{t("contact.badge")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight font-poppins">
            {t("contact.heading")} <span className="text-[#004899] underline decoration-amber-400 decoration-4 underline-offset-8">{t("contact.headingAccent")}</span>
          </h2>
          <p className="mt-3 text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
            {t("contact.subtitle")}
          </p>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Address */}
          <a href="https://www.google.com/maps/place/B.B.College/@23.6808679,86.9980219,16.17z/data=!4m6!3m5!1s0x39f71ee555555555:0xed1b371b2dd1ddfb!8m2!3d23.680962!4d86.9975621!16s%2Fm%2F0j25rl7?entry=ttu&g_ep=EgoyMDI2MDUwNi4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noreferrer" className="bg-white p-8 rounded-3xl md:rounded-[2.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center group cursor-pointer">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Icons.MapPin className="w-7 h-7" />
            </div>
            <h4 className="text-slate-900 font-black text-lg mb-3 tracking-tight">{t("contact.location")}</h4>
            <span className="text-blue-600 text-xs md:text-sm font-black group-hover:underline decoration-2 underline-offset-4">
              B.B. College Campus<br />Asansol, WB, India
            </span>
          </a>
 
          {/* Email */}
          <div onClick={(e) => handleEmailClick(e, finalData.contact_email || "nssunitbbcollege@gmail.com")} className="bg-white p-8 rounded-3xl md:rounded-[2.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center group cursor-pointer">
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Icons.Mail className="w-7 h-7" />
            </div>
            <h4 className="text-slate-900 font-black text-lg mb-3 tracking-tight">{t("contact.emailUs")}</h4>
            <span className="text-blue-600 text-[13px] md:text-sm font-black break-words group-hover:underline decoration-2 underline-offset-4">
              {finalData.contact_email || "nssunitbbcollege@gmail.com"}
            </span>
          </div>
 
          {/* Phone */}
          <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center group">
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-600/20 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Icons.Phone className="w-7 h-7" />
            </div>
            <h4 className="text-slate-900 font-black text-lg mb-3 tracking-tight">{t("contact.callUs")}</h4>
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
                  {t("contact.unavailable")}
                </span>
              )}
            </div>
          </div>
 
          {/* WhatsApp */}
          <div onClick={() => { if (finalData.contact_whatsapp) window.open(finalData.contact_whatsapp, '_blank'); }} className="bg-white p-8 rounded-3xl md:rounded-[2.5rem] shadow-[0_10px_40px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_20px_50px_rgb(37,99,235,0.08)] hover:-translate-y-2 transition-all duration-500 flex flex-col items-center text-center group cursor-pointer">
            <div className="w-14 h-14 bg-[#25D366] text-white rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/20 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Icons.Whatsapp className="w-7 h-7" />
            </div>
            <h4 className="text-slate-900 font-black text-lg mb-3 tracking-tight">{t("contact.whatsapp")}</h4>
            <span className="text-green-600 text-xs md:text-sm font-black group-hover:underline decoration-2 underline-offset-4">
              {t("contact.sendMessage")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
