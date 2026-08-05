"use client";
import React, { useState, useEffect, useRef } from "react";
import { Icons } from "@/components/Icons";
import { useLanguage } from "@/context/LanguageContext";

export default function HeroSection({ title, subtitle, sliderUrls, onNavigate }) {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => setIsLoggedIn(!!localStorage.getItem('nss_user'));
    checkAuth();
    window.addEventListener('nss_user_logged_in', checkAuth);
    window.addEventListener('nss_user_logged_out', checkAuth);
    return () => {
      window.removeEventListener('nss_user_logged_in', checkAuth);
      window.removeEventListener('nss_user_logged_out', checkAuth);
    };
  }, []);

  const defaultImages = [
    "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070",
    "https://images.unsplash.com/photo-1529390079861-591de354faf5?q=80&w=2070",
    "https://images.unsplash.com/photo-1511649475669-e288648b2339?q=80&w=2070",
  ];

  const images = sliderUrls && sliderUrls.length > 0 ? sliderUrls : defaultImages;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000);
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

  return (
    <header
      className="relative w-full h-[640px] sm:h-[700px] md:h-[760px] lg:h-[800px] flex flex-col items-center justify-center text-center text-white overflow-hidden bg-slate-900 flex-grow"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEndEvent}
    >
      {/* Background Slider with Blur */}
      {images.map((imgUrl, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
        >
          <img
            src={imgUrl}
            alt={`Banwarilal Bhalotia College NSS Unit - Event Slide ${index + 1}`}
            className="absolute inset-0 w-full h-full object-cover scale-105 transform origin-center transition-transform duration-[10000ms] will-change-transform ease-linear"
            style={{ transform: index === currentSlide ? 'scale(1)' : 'scale(1.1)' }}
          />
        </div>
      ))}

      {/* Modern Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-900/90 z-20 pointer-events-none"></div>

      {/* Floating Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full filter blur-3xl animate-blob z-20 pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-indigo-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000 z-20 pointer-events-none"></div>

      {/* Content Area */}
      <div className="relative z-30 px-6 sm:px-12 flex flex-col items-center w-full max-w-5xl mx-auto mt-28 lg:mt-0 pb-28 lg:pb-0">

        {/* Top Directorate & Ministry Panel */}
        <div className="flex flex-col items-center text-center px-4 py-4 md:px-6 md:py-6 rounded-3xl bg-slate-950/80 border border-white/10 shadow-2xl mb-6 md:mb-10 animate-fade-in-up max-w-2xl w-full">
          <div className="inline-flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs sm:text-sm md:text-base lg:text-2xl font-black text-amber-400 uppercase tracking-[0.25em] drop-shadow-md">
              {t("hero.badge")}
            </span>
          </div>
          <span className="text-[10px] sm:text-xs md:text-sm lg:text-lg font-extrabold text-white uppercase tracking-widest leading-relaxed drop-shadow-sm text-center">
            {t("hero.directorate")}
          </span>
          <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-bold text-slate-200 uppercase tracking-wider mt-1.5 drop-shadow-sm text-center">
            {t("hero.ministry")}
          </span>
        </div>

        {/* College & NSS Unit Header */}
        <h1
          className="hero-title font-black uppercase mb-4 md:mb-5 text-center animate-fade-in-up [animation-delay:100ms] px-2 w-full whitespace-nowrap"
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            color: "#ffffff",
            fontSize: "clamp(0.75rem, 4.5vw, 3.75rem)",
            letterSpacing: "0.02em",
            wordSpacing: "0.15em",
            textShadow: `
              -1.2px -1.2px 0 rgba(0, 0, 0, 0.7),  
               1.2px -1.2px 0 rgba(0, 0, 0, 0.7),
              -1.2px  1.2px 0 rgba(0, 0, 0, 0.7),
               1.2px  1.2px 0 rgba(0, 0, 0, 0.7),
               0px 5px 15px rgba(0, 0, 0, 0.5)
            `
          }}
        >
          {t("hero.college")}
        </h1>

        <h2
          className="font-black tracking-widest text-blue-400 uppercase mb-4 md:mb-5 drop-shadow-md animate-fade-in-up [animation-delay:150ms] text-center"
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: "clamp(1.15rem, 3.5vw, 3rem)",
            textShadow: "0 0 25px rgba(96, 165, 250, 0.45)"
          }}
        >
          {t("hero.unit")}
        </h2>

        <p
          className="hero-subtitle text-[11px] sm:text-sm md:text-base lg:text-lg font-semibold tracking-wide text-slate-200 italic mb-6 md:mb-16 max-w-3xl leading-relaxed animate-fade-in-up [animation-delay:200ms] text-center"
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif"
          }}
        >
          {t("hero.affiliation")}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up [animation-delay:300ms]">
          {!isLoggedIn && (
            <button
              onClick={() => {
                window.dispatchEvent(new Event('open_nss_register'));
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3.5 md:px-10 md:py-4 rounded-full text-sm md:text-base font-bold hover:bg-blue-700 hover:scale-105 transition-all duration-300 shadow-xl border border-blue-500/50 w-full sm:w-auto cursor-pointer group"
            >
              {t("hero.join")} <Icons.ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          <button
            onClick={() => onNavigate('activities')}
            className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md text-white px-8 py-3.5 md:px-10 md:py-4 rounded-full text-sm md:text-base font-bold hover:bg-white hover:text-slate-900 hover:scale-105 transition-all duration-300 shadow-lg border border-white/20 w-full sm:w-auto cursor-pointer"
          >
            {t("hero.explore")}
          </button>
        </div>
      </div>

      {/* Modern Dots Indicator */}
      <div className="absolute bottom-6 md:bottom-10 z-30 flex gap-3 bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 shadow-lg">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${index === currentSlide ? "bg-white w-8" : "bg-white/40 hover:bg-white/80 w-2"}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </header>
  );
}
