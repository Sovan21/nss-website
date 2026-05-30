"use client";
import React, { useState, useEffect, useRef } from "react";
import { Icons } from "@/components/Icons";

export default function HeroSection({ title, subtitle, sliderUrls, onNavigate }) {
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
      className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] lg:h-[800px] flex flex-col items-center justify-center text-center text-white overflow-hidden bg-slate-900 flex-grow" 
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
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/50 to-slate-900/90 z-20 pointer-events-none"></div>

      {/* Floating Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob z-20 pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 z-20 pointer-events-none"></div>

      {/* Content Area */}
      <div className="relative z-30 px-6 sm:px-12 flex flex-col items-center w-full max-w-5xl mx-auto mt-20 md:mt-0 pb-20 md:pb-0">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 md:py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg mb-6 md:mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          <span className="text-[10px] md:text-sm font-bold text-white uppercase tracking-[0.2em]">National Service Scheme</span>
        </div>
        
        <h1 className="hero-title text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6 drop-shadow-2xl whitespace-pre-line tracking-tight animate-fade-in-up [animation-delay:100ms]">
          {title}
        </h1>
        
        <p className="hero-subtitle text-xs sm:text-base md:text-xl font-semibold mb-8 md:mb-10 max-w-3xl leading-relaxed animate-fade-in-up [animation-delay:200ms]">
          {subtitle}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up [animation-delay:300ms]">
          {!isLoggedIn && (
            <button
              onClick={() => {
                 window.dispatchEvent(new Event('open_nss_register'));
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3.5 md:px-10 md:py-4 rounded-full text-sm md:text-base font-bold hover:bg-blue-700 hover:scale-105 transition-all duration-300 shadow-xl border border-blue-500/50 w-full sm:w-auto cursor-pointer group"
            >
              Join as Volunteer <Icons.ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          <button
            onClick={() => onNavigate('activities')}
            className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md text-white px-8 py-3.5 md:px-10 md:py-4 rounded-full text-sm md:text-base font-bold hover:bg-white hover:text-slate-900 hover:scale-105 transition-all duration-300 shadow-lg border border-white/20 w-full sm:w-auto cursor-pointer"
          >
            Explore Activities
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
