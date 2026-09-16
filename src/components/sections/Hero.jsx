"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Icons } from "@/components/Icons";
import { useLanguage } from "@/context/LanguageContext";
import { getUpcomingCalendarEvents, getDynamicNotices, formatEventDateParts } from "@/data/calendarEvents";

export default function HeroSection({ sliderUrls, onNavigate }) {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(null);

  const upcomingEvents = getUpcomingCalendarEvents(3);
  const [dynamicNotices, setDynamicNotices] = useState(() => getDynamicNotices(3));

  useEffect(() => {
    let isMounted = true;
    const fetchLatestNotices = async () => {
      try {
        let { data, error } = await supabase.from('nss_notices').select('*').order('date', { ascending: false }).limit(3);
        if (error) {
          const fallback = await supabase.from('notices').select('*').order('date', { ascending: false }).limit(3);
          if (!fallback.error && fallback.data) data = fallback.data;
        }
        if (isMounted && data && Array.isArray(data) && data.length > 0) {
          const formatted = data.map(item => ({
            id: item.id,
            title: item.title,
            subtitle: item.summary || item.issued_by || 'Official Circular',
            date: item.date ? item.date.split('T')[0] : '2026-01-01',
            isNew: Boolean(item.is_new ?? item.isNew),
            isUrgent: Boolean(item.is_urgent ?? item.isUrgent)
          }));
          setDynamicNotices(formatted);
        }
      } catch (e) {
        console.warn('Hero notices fetch error:', e);
      }
    };
    fetchLatestNotices();
    return () => { isMounted = false; };
  }, []);

  const defaultImages = [
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070",
    "https://images.unsplash.com/photo-1577495508048-b635879837f1?q=80&w=2070",
    "https://images.unsplash.com/photo-1529390079861-591de354faf5?q=80&w=2070",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070",
  ];

  const images = sliderUrls && sliderUrls.length > 0 ? sliderUrls : defaultImages;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [images.length]);

  const onTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchEndEvent = (e) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = touchStartX.current - touchEndX;
    const minSwipeDistance = 50;

    if (swipeDistance > minSwipeDistance) {
      nextSlide();
    } else if (swipeDistance < -minSwipeDistance) {
      prevSlide();
    }

    touchStartX.current = null;
  };

  const handleJoinClick = () => {
    window.dispatchEvent(new Event("open_nss_register"));
  };

  const handleNav = (tab) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  return (
    <section className="w-full flex flex-col bg-[#f4f7fb]">
      {/* =========================================================================
          DESKTOP VIEW: EXACT REPLICA OF THE OFFICIAL MOCKUP (lg and above / sm and above)
          ========================================================================= */}
      <div className="hidden sm:flex flex-col w-full">

        {/* SVG Definition for Desktop Wave Curve */}
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
          <defs>
            <clipPath id="desktopHeroWave" clipPathUnits="objectBoundingBox">
              <path d="M 0.20 0 C 0.08 0.30, 0.02 0.63, 0 1 L 1 1 L 1 0 Z" />
            </clipPath>
            <linearGradient id="desktopCurveGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="45%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>
        </svg>

        {/* ================= 1. HERO BANNER WITH CURVED WAVE ================= */}
        <div className="relative w-full min-h-[440px] md:min-h-[480px] lg:min-h-[520px] bg-gradient-to-r from-[#eef5fc] via-[#f2f7fd] to-[#e4eef9] overflow-hidden flex items-center">

          {/* Faint College Building Watermark in background - fitted to the left text column */}
          <div
            className="absolute inset-y-0 left-0 w-full sm:w-[50%] lg:w-[46%] z-0 opacity-[0.22] pointer-events-none bg-no-repeat"
            style={{ 
              backgroundImage: `url('/college%20photo.jpeg')`,
              backgroundPosition: 'left center',
              backgroundSize: 'contain',
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 65%, transparent 100%)',
              maskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 65%, transparent 100%)'
            }}
          ></div>

          <div className="w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-12 relative z-10 flex items-center justify-between">

            {/* Left Column: Hero Texts & CTA */}
            <div className="w-full sm:w-[48%] lg:w-[42%] flex flex-col py-10 z-20">

              {/* Spaced Sub-label */}
              <p className="text-[11px] md:text-xs font-black tracking-[0.22em] text-[#004899] uppercase mb-2">
                NATIONAL SERVICE SCHEME
              </p>

              {/* Main Headline */}
              <h1
                className="font-black text-[#002b66] text-3xl sm:text-4xl md:text-5xl lg:text-[50px] xl:text-[56px] tracking-tight leading-[1.06] mb-1 uppercase font-outfit"
              >
                SERVICE TO SOCIETY
              </h1>

              <h2
                className="font-black text-[#0066cc] text-3xl sm:text-4xl md:text-5xl lg:text-[50px] xl:text-[56px] tracking-tight leading-[1.06] mb-5 uppercase italic font-outfit"
              >
                LEADERSHIP FOR LIFE
              </h2>

              {/* Description */}
              <p className="text-slate-600 text-sm md:text-base lg:text-[16px] leading-relaxed max-w-md mb-7 font-medium">
                NSS empowers youth to build a better society through selfless service and strong values.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => handleNav("activities")}
                  className="inline-flex items-center gap-2 bg-[#004899] hover:bg-[#003366] text-white px-5 md:px-6 py-2.5 md:py-3 rounded-lg font-outfit font-bold text-xs md:text-sm tracking-wide transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95"
                >
                  <span>Explore Activities</span>
                  <Icons.ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleJoinClick}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-blue-50 text-[#004899] border-2 border-[#004899] px-5 md:px-6 py-2.5 md:py-3 rounded-lg font-outfit font-bold text-xs md:text-sm tracking-wide transition-all shadow-sm hover:shadow cursor-pointer active:scale-95"
                >
                  <span>Join NSS</span>
                </button>
              </div>

            </div>

          </div>

          {/* Right Column: Wave Cut Image Slider Frame - Spanning the visible right half to prevent cropping */}
          <div
            className="absolute top-0 right-0 w-[58%] lg:w-[60%] h-full z-10 overflow-hidden pointer-events-none"
            style={{
              clipPath: 'url(#desktopHeroWave)',
            }}
          >
            {images.map((imgUrl, index) => (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full transition-opacity duration-[1200ms] ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
              >
                <img
                  src={imgUrl}
                  alt={`NSS Event ${index + 1}`}
                  className="w-full h-full object-cover object-[center_center] select-none pointer-events-auto"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}

            {/* Subtle soft vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25 pointer-events-none z-20"></div>



            {/* Bottom Right Location Tag */}
            <div className="absolute bottom-4 right-6 lg:bottom-6 lg:right-10 z-30 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-white/15 shadow-md pointer-events-auto">
              <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>Asansol, West Bengal, India</span>
            </div>

          </div>

          {/* Glowing S-Curve Divider Border Line - perfectly synchronized with the image clip path */}
          <div className="absolute top-0 right-0 w-[58%] lg:w-[60%] h-full z-20 pointer-events-none">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
            >
              <path
                d="M 200 0 C 80 300, 20 630, 0 1000"
                fill="none"
                stroke="url(#desktopCurveGlow)"
                strokeWidth="5"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(-2px 0px 6px rgba(37,99,235,0.4))' }}
              />
            </svg>
          </div>

        </div>

        {/* ================= 2. FOUR CORE PILLARS CARD ================= */}
        <div className="w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-12 relative z-30 -mt-7">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.07)] border border-slate-100 p-5 lg:p-6 grid grid-cols-2 lg:grid-cols-4 gap-6 items-center">

            {/* Pillar 1: Community Service */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-transparent border border-slate-200 flex items-center justify-center shrink-0">
                <Icons.Users className="w-6 h-6 text-slate-900" />
              </div>
              <div className="flex flex-col">
                <h4 className="font-black text-[#002b66] text-sm lg:text-[15px] leading-tight">Community Service</h4>
                <p className="text-slate-500 text-xs italic leading-tight mt-1">Creating positive change in society</p>
              </div>
            </div>

            {/* Pillar 2: Youth Development */}
            <div className="flex items-center gap-3.5 border-l border-slate-100 pl-0 lg:pl-6">
              <div className="w-12 h-12 rounded-xl bg-transparent border border-slate-200 flex items-center justify-center shrink-0">
                <Icons.Leaf className="w-6 h-6 text-slate-900" />
              </div>
              <div className="flex flex-col">
                <h4 className="font-black text-[#002b66] text-sm lg:text-[15px] leading-tight">Youth Development</h4>
                <p className="text-slate-500 text-xs italic leading-tight mt-1">Building responsible citizens</p>
              </div>
            </div>

            {/* Pillar 3: Leadership */}
            <div className="flex items-center gap-3.5 border-l border-slate-100 pl-0 lg:pl-6">
              <div className="w-12 h-12 rounded-xl bg-transparent border border-slate-200 flex items-center justify-center shrink-0">
                <Icons.AcademicCap className="w-6 h-6 text-slate-900" />
              </div>
              <div className="flex flex-col">
                <h4 className="font-black text-[#002b66] text-sm lg:text-[15px] leading-tight">Leadership</h4>
                <p className="text-slate-500 text-xs italic leading-tight mt-1">Learning by doing</p>
              </div>
            </div>

            {/* Pillar 4: Social Awareness */}
            <div className="flex items-center gap-3.5 border-l border-slate-100 pl-0 lg:pl-6">
              <div className="w-12 h-12 rounded-xl bg-transparent border border-slate-200 flex items-center justify-center shrink-0">
                <Icons.Heart className="w-6 h-6 text-slate-900" />
              </div>
              <div className="flex flex-col">
                <h4 className="font-black text-[#002b66] text-sm lg:text-[15px] leading-tight">Social Awareness</h4>
                <p className="text-slate-500 text-xs italic leading-tight mt-1">For an inclusive and equitable nation</p>
              </div>
            </div>

          </div>
        </div>

        {/* ================= 3. THREE-COLUMN DASHBOARD (NOTICES, EVENTS, WELCOME) ================= */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">

            {/* Widget 1: Latest Notices (4 cols) */}
            <div id="notices-section" className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between scroll-mt-24">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Icons.Megaphone className="w-5 h-5 text-slate-900" />
                    <h3 className="font-black text-slate-900 text-base lg:text-lg">Latest Notices</h3>
                  </div>
                  <button onClick={() => handleNav('notices')} className="text-xs font-bold text-[#004899] hover:underline flex items-center gap-1 cursor-pointer">
                    <span>View All</span>
                    <Icons.ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {dynamicNotices.map((notice, idx) => {
                    const dateParts = formatEventDateParts(notice.date);
                    return (
                      <div key={notice.id || idx} className="flex items-start gap-3 group cursor-pointer" onClick={() => handleNav('notices')}>
                        <div className="flex flex-col items-center justify-center bg-blue-50 text-[#004899] rounded-lg px-2.5 py-1.5 shrink-0 border border-blue-100 text-center min-w-[54px]">
                          <span className="text-sm font-black leading-none">{dateParts.day}</span>
                          <span className="text-[9px] font-bold uppercase mt-0.5">{dateParts.monthYear}</span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs lg:text-[13px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug truncate">
                              {notice.title}
                            </h4>
                            {notice.isNew && (
                              <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded shrink-0 uppercase">New</span>
                            )}
                          </div>
                          <p className="text-slate-500 text-[11px] leading-tight mt-1 truncate">{notice.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Widget 2: Upcoming Events (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Icons.Calendar className="w-5 h-5 text-slate-900" />
                    <h3 className="font-black text-slate-900 text-base lg:text-lg">Upcoming Events</h3>
                  </div>
                  <button onClick={() => handleNav('activities')} className="text-xs font-bold text-[#004899] hover:underline flex items-center gap-1 cursor-pointer">
                    <span>View All</span>
                    <Icons.ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {upcomingEvents.map((event, idx) => {
                    const dateParts = formatEventDateParts(event.date);
                    return (
                      <div key={event.date + idx} className="flex items-start gap-3 group cursor-pointer" onClick={() => handleNav('activities')}>
                        <div className="flex flex-col items-center justify-center bg-blue-50 text-[#004899] rounded-lg px-2.5 py-1.5 shrink-0 border border-blue-100 text-center min-w-[54px]">
                          <span className="text-sm font-black leading-none">{dateParts.day}</span>
                          <span className="text-[9px] font-bold uppercase mt-0.5">{dateParts.monthYear}</span>
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <h4 className="text-xs lg:text-[13px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-snug truncate">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                            <span className="flex items-center gap-1">🕒 {event.time || "10:00 AM"}</span>
                            <span className="flex items-center gap-1 truncate">📍 {event.venue || "College Campus"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Widget 3: Welcome to NSS (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
                  <Icons.Users className="w-5 h-5 text-slate-900" />
                  <h3 className="font-black text-slate-900 text-base lg:text-lg">Welcome to NSS</h3>
                </div>

                <p className="text-slate-600 text-xs lg:text-[13.5px] leading-relaxed mb-4">
                  The <strong className="text-slate-900">National Service Scheme (NSS)</strong> Unit of Banwarilal Bhalotia College, Asansol, is dedicated to the holistic development of students through community service, social responsibility and nation-building initiatives.
                </p>

                {/* Yellow Accent Bar */}
                <div className="w-12 h-1 bg-amber-400 rounded-full mb-6"></div>
              </div>

              <button
                onClick={() => handleNav("about")}
                className="inline-flex items-center justify-center gap-2 bg-[#004899] hover:bg-[#003366] text-white px-5 py-2.5 rounded-lg font-outfit font-bold text-xs tracking-wide transition-all shadow cursor-pointer active:scale-95 w-fit"
              >
                <span>Know More About Us</span>
                <Icons.ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>



      </div>

      {/* =========================================================================
          MOBILE VIEW: EXACT REPLICA OF THE REFERENCE SCREENSHOT (sm:hidden, 390-428px)
          ========================================================================= */}
      <div
        className="sm:hidden flex flex-col w-full bg-[#f4f7fb]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEndEvent}
      >

        {/* ================= SECTION C: HERO SECTION (Bottom-Left Anchored Content) ================= */}
        <div className="relative w-full min-h-[235px] min-[390px]:min-h-[255px] bg-[#0B2559] overflow-hidden flex flex-col justify-end p-3 min-[390px]:p-3.5">

          {/* Background Image Carousel - Spanning Full Width with Soft Translucent Blend */}
          <div
            className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.85) 25%, black 60%)',
              maskImage: 'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.85) 25%, black 60%)'
            }}
          >
            {images.map((imgUrl, index) => (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full transition-opacity duration-[1000ms] ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
              >
                <img
                  src={imgUrl}
                  alt={`NSS Volunteer Slide ${index + 1}`}
                  className="w-full h-full object-cover object-[80%_center] select-none"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>

          {/* Translucent Soft Dark Navy Gradient Overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(to right, rgba(11, 37, 89, 0.85) 0%, rgba(11, 37, 89, 0.6) 36%, rgba(11, 37, 89, 0.18) 60%, transparent 85%)'
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B2559]/75 via-transparent to-black/15 pointer-events-none z-10"></div>

          {/* Top-Right Floating Directorate Badge */}
          <div className="absolute top-2 right-2 min-[390px]:top-2.5 min-[390px]:right-2.5 z-20 flex items-center gap-2 bg-[#0B2559]/90 backdrop-blur-md px-3 py-1.5 min-[390px]:py-2 rounded-xl border border-white/20 shadow-xl max-w-[240px] min-[390px]:max-w-[280px]">
            <div className="w-5 h-7 min-[390px]:w-6 min-[390px]:h-8 shrink-0 flex items-center justify-center">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                alt="Govt of India"
                className="w-full h-full object-contain"
                style={{ filter: 'invert(85%) sepia(42%) saturate(4032%) hue-rotate(351deg) brightness(101%) contrast(106%)' }}
              />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <p className="text-[9px] min-[390px]:text-[10.5px] text-white font-bold leading-tight">
                Ministry of Youth Affairs & Sports
              </p>
              <p className="text-[8px] min-[390px]:text-[9.5px] text-white/80 font-medium leading-tight">
                Government of India
              </p>
              <p className="text-amber-400 font-black text-[8.5px] min-[390px]:text-[10px] leading-tight mt-0.5">
                Regional Directorate of NSS, Kolkata, WB
              </p>
            </div>
          </div>

          {/* Left Content Block - Bottom-Left Aligned */}
          <div className="relative z-20 flex flex-col items-start w-[65%] min-[390px]:w-[60%] max-w-[260px] mt-auto">
            {/* Small label "NATIONAL SERVICE SCHEME" with line */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[8px] min-[390px]:text-[8.5px] font-black text-white/90 tracking-[0.16em] uppercase drop-shadow-sm">
                NATIONAL SERVICE SCHEME
              </span>
            </div>

            {/* Heading line 1: SERVICE TO SOCIETY */}
            <h1
              className="font-black text-white text-[15px] min-[390px]:text-[17px] tracking-tight leading-[1.05] uppercase font-outfit drop-shadow-md"
            >
              SERVICE TO<br />SOCIETY
            </h1>

            {/* Heading line 2: LEADERSHIP FOR LIFE */}
            <h2
              className="font-black text-[#4FC3F7] text-[15px] min-[390px]:text-[17px] tracking-tight leading-[1.05] uppercase italic font-outfit mt-0.5 mb-1.5 drop-shadow-md"
            >
              LEADERSHIP<br />FOR LIFE
            </h2>

            {/* Paragraph */}
            <p className="text-slate-200 text-[8px] min-[390px]:text-[9px] leading-[1.25] mb-2 font-medium line-clamp-2 drop-shadow-sm">
              NSS empowers youth to build a better society through selfless service and strong values.
            </p>

            {/* CTA buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleNav("activities")}
                className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-[#0B2559] font-outfit font-extrabold text-[9px] min-[390px]:text-[10px] px-2.5 py-1 min-[390px]:px-3 min-[390px]:py-1.5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <span>Explore Activities</span>
                <Icons.ArrowRight className="w-2.5 h-2.5" />
              </button>

              <button
                onClick={handleJoinClick}
                className="inline-flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-outfit font-black text-[9px] min-[390px]:text-[10px] px-2.5 py-1 min-[390px]:px-3 min-[390px]:py-1.5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <span>Join NSS</span>
              </button>
            </div>

            {/* Carousel Dots */}
            <div className="flex items-center gap-1 mt-2 ml-0.5">
              {images.slice(0, 3).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === (currentSlide % 3) ? "w-3.5 bg-[#4FC3F7]" : "w-1.5 bg-white/50"
                    }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Bottom-Right Location Pill */}
          <div className="absolute bottom-2 right-2 min-[390px]:bottom-2.5 min-[390px]:right-2.5 z-20 flex items-center gap-1 bg-[#081b40]/90 backdrop-blur-md text-white text-[8px] min-[390px]:text-[8.5px] font-semibold px-2 py-0.5 rounded-full border border-white/15 shadow">
            <svg className="w-2.5 h-2.5 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>Asansol, West Bengal, India</span>
          </div>

        </div>

        {/* ================= SECTION D: FEATURE HIGHLIGHTS STRIP ================= */}
        <div className="w-full px-2.5 relative z-30 -mt-2.5">
          <div className="bg-white rounded-xl shadow-sm border border-[#E4E7EC] p-2.5 grid grid-cols-4 gap-1 text-center">

            {/* 1. Community Service */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-lg bg-transparent border border-slate-200 flex items-center justify-center mb-1">
                <Icons.Users className="w-4.5 h-4.5 text-slate-900" />
              </div>
              <h4 className="font-extrabold text-[#0B2559] text-[10px] leading-tight">Community Service</h4>
              <p className="text-[#5B6472] text-[8px] leading-tight mt-0.5">Creating positive change</p>
            </div>

            {/* 2. Youth Development */}
            <div className="flex flex-col items-center border-l border-[#E4E7EC] pl-0.5">
              <div className="w-8 h-8 rounded-lg bg-transparent border border-slate-200 flex items-center justify-center mb-1">
                <Icons.Leaf className="w-4.5 h-4.5 text-slate-900" />
              </div>
              <h4 className="font-extrabold text-[#0B2559] text-[10px] leading-tight">Youth Development</h4>
              <p className="text-[#5B6472] text-[8px] leading-tight mt-0.5">Building responsible citizens</p>
            </div>

            {/* 3. Leadership */}
            <div className="flex flex-col items-center border-l border-[#E4E7EC] pl-0.5">
              <div className="w-8 h-8 rounded-lg bg-transparent border border-slate-200 flex items-center justify-center mb-1">
                <Icons.AcademicCap className="w-4.5 h-4.5 text-slate-900" />
              </div>
              <h4 className="font-extrabold text-[#0B2559] text-[10px] leading-tight">Leadership</h4>
              <p className="text-[#5B6472] text-[8px] leading-tight mt-0.5">Learning by doing</p>
            </div>

            {/* 4. Social Awareness */}
            <div className="flex flex-col items-center border-l border-[#E4E7EC] pl-0.5">
              <div className="w-8 h-8 rounded-lg bg-transparent border border-slate-200 flex items-center justify-center mb-1">
                <Icons.Heart className="w-4.5 h-4.5 text-slate-900" />
              </div>
              <h4 className="font-extrabold text-[#0B2559] text-[10px] leading-tight">Social Awareness</h4>
              <p className="text-[#5B6472] text-[8px] leading-tight mt-0.5">For an inclusive nation</p>
            </div>

          </div>
        </div>

        {/* ================= SECTION E: VERTICALLY STACKED CARDS (Notices + Events) ================= */}
        <div className="w-full px-3 py-3 flex flex-col gap-3">

          {/* Card 1 — Latest Notices */}
          <div className="bg-white rounded-xl p-3.5 shadow-sm border border-[#E4E7EC] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E4E7EC]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-transparent border border-slate-200 flex items-center justify-center shrink-0">
                    <Icons.Megaphone className="w-3.5 h-3.5 text-slate-900" />
                  </div>
                  <h3 className="font-black text-[#0B2559] text-[13px] truncate">Latest Notices</h3>
                </div>
                <button
                  onClick={() => handleNav('notices')}
                  className="text-[11px] font-bold text-[#1D6FE0] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>View All</span>
                  <Icons.ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {dynamicNotices.map((notice, idx) => {
                  const dateParts = formatEventDateParts(notice.date);
                  return (
                    <div key={notice.id || idx} className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors" onClick={() => handleNav('notices')}>
                      <div className="flex flex-col items-center justify-center bg-[#EAF2FE] text-[#0B2559] rounded-lg px-2 py-1 shrink-0 border border-[#E4E7EC] text-center min-w-[42px]">
                        <span className="text-[12px] font-black leading-none">{dateParts.day}</span>
                        <span className="text-[8px] font-bold uppercase mt-0.5">{dateParts.monthYear}</span>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-[11.5px] font-bold text-[#0B2559] leading-tight truncate">
                            {notice.title}
                          </h4>
                          {notice.isNew && (
                            <span className="bg-[#E5342E] text-white text-[7.5px] font-black px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-[#5B6472] text-[9.5px] leading-tight mt-0.5 truncate">
                          {notice.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 2 — Upcoming Events */}
          <div className="bg-white rounded-xl p-3.5 shadow-sm border border-[#E4E7EC] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E4E7EC]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-transparent border border-slate-200 flex items-center justify-center shrink-0">
                    <Icons.Calendar className="w-3.5 h-3.5 text-slate-900" />
                  </div>
                  <h3 className="font-black text-[#0B2559] text-[13px] truncate">Upcoming Events</h3>
                </div>
                <button
                  onClick={() => handleNav('activities')}
                  className="text-[11px] font-bold text-[#1D6FE0] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>View All</span>
                  <Icons.ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {upcomingEvents.map((event, idx) => {
                  const dateParts = formatEventDateParts(event.date);
                  return (
                    <div key={event.date + idx} className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors" onClick={() => handleNav('activities')}>
                      <div className="flex flex-col items-center justify-center bg-[#EAF2FE] text-[#0B2559] rounded-lg px-2 py-1 shrink-0 border border-[#E4E7EC] text-center min-w-[42px]">
                        <span className="text-[12px] font-black leading-none">{dateParts.day}</span>
                        <span className="text-[8px] font-bold uppercase mt-0.5">{dateParts.monthYear}</span>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <h4 className="text-[11.5px] font-bold text-[#0B2559] leading-tight truncate">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[9px] text-[#5B6472] mt-0.5 truncate">
                          <span className="flex items-center gap-0.5">
                            <Icons.Clock className="w-3 h-3 text-[#5B6472]" /> {event.time || "10:00 AM"}
                          </span>
                          <span>·</span>
                          <span className="truncate">{event.venue || "College Campus"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* ================= SECTION G: TAGLINE / QUOTE BANNER ================= */}
        <div className="w-full px-3 pb-4">
          <div className="bg-[#EAF2FE] rounded-xl p-4 shadow-sm border border-[#E4E7EC] flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-transparent flex items-center justify-center shrink-0 border border-slate-300">
              <Icons.BuildingLibrary className="w-5 h-5 text-slate-900" />
            </div>
            <div className="flex flex-col text-left">
              <h4 className="text-base font-serif italic font-extrabold text-[#0B2559] leading-tight">
                &ldquo;Not Me But You&rdquo;
              </h4>
              <p className="text-[#5B6472] text-[11px] font-serif italic font-medium leading-tight mt-0.5">
                Selfless Service for a Better Tomorrow
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

