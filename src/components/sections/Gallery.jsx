"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { Icons } from "@/components/Icons";
import { useLanguage } from "@/context/LanguageContext";
import useScrollLock from "@/lib/useScrollLock";
import { getDirectImageUrl, formatDate } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/lib/cloudinary";

export default function Gallery({ prefetchedEvents, prefetchedGallery }) {
  const { locale } = useLanguage();
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 420);
  const [searchQuery, setSearchQuery] = useState("");
  const [dbPhotos, setDbPhotos] = useState([]);
  const [adminGallery, setAdminGallery] = useState([]);
  const [loading, setLoading] = useState(!prefetchedGallery);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useScrollLock(lightboxIndex !== null);

  // Broadcast lightbox state to hide mobile floating widgets
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nss_lightbox_state', { detail: lightboxIndex !== null }));
  }, [lightboxIndex]);

  // Global gallery search / filter listener
  useEffect(() => {
    const handleGallerySearch = (e) => {
      if (e?.detail) {
        setSearchQuery(e.detail);
      }
    };
    window.addEventListener("nss_search_gallery", handleGallerySearch);
    return () => window.removeEventListener("nss_search_gallery", handleGallerySearch);
  }, []);

  // Fetch admin-managed gallery photos
  useEffect(() => {
    if (prefetchedGallery && Array.isArray(prefetchedGallery) && prefetchedGallery.length > 0) {
      const formatted = prefetchedGallery.map(item => ({
        id: `admin-${item.id}`,
        date: item.date ? item.date.split('T')[0] : '2026-01-01',
        image_url: getDirectImageUrl(item.image_url)
      }));
      setAdminGallery(formatted);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchAdminGallery = async () => {
      try {
        let { data, error } = await supabase.from('nss_gallery').select('*').order('date', { ascending: false });
        if (error) {
          const fallback = await supabase.from('gallery').select('*').order('date', { ascending: false });
          if (!fallback.error && fallback.data) data = fallback.data;
        }
        if (isMounted && data && Array.isArray(data)) {
          const formatted = data.map(item => ({
            id: `admin-${item.id}`,
            date: item.date ? item.date.split('T')[0] : '2026-01-01',
            image_url: getDirectImageUrl(item.image_url)
          }));
          setAdminGallery(formatted);
        }
      } catch (err) {
        console.warn('Admin gallery fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAdminGallery();
    return () => { isMounted = false; };
  }, [prefetchedGallery]);

  // Extract extra photos from events
  useEffect(() => {
    const extractPhotos = (eventsList) => {
      if (!eventsList || !Array.isArray(eventsList)) return [];
      const extracted = [];
      eventsList.forEach((evt) => {
        if (evt.slider_urls && Array.isArray(evt.slider_urls)) {
          evt.slider_urls.forEach((url, idx) => {
            if (url && typeof url === 'string') {
              extracted.push({
                id: `evt-${evt.id}-${idx}`,
                date: evt.start_date ? evt.start_date.split('T')[0] : "2025-10-01",
                image_url: getDirectImageUrl(url)
              });
            }
          });
        }
      });
      return extracted;
    };

    if (prefetchedEvents) {
      setDbPhotos(extractPhotos(prefetchedEvents));
    } else {
      supabase.from("events").select("*").then(({ data }) => {
        if (data) setDbPhotos(extractPhotos(data));
      });
    }
  }, [prefetchedEvents]);

  // Combined photo list (Dynamic admin uploads and real event photos)
  const allMedia = useMemo(() => {
    return [...adminGallery, ...dbPhotos];
  }, [adminGallery, dbPhotos]);

  // Filtered media by date search query
  const filteredMedia = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allMedia;
    return allMedia.filter((item) => {
      return item.date && item.date.includes(q);
    });
  }, [allMedia, searchQuery]);

  // Group photos by exact Date (Google Photos style date grouping)
  const dateGroups = useMemo(() => {
    const groups = {};
    filteredMedia.forEach((photo) => {
      const d = photo.date || '2026-01-01';
      if (!groups[d]) {
        groups[d] = {
          date: d,
          photos: []
        };
      }
      groups[d].photos.push(photo);
    });

    // Sort date groups descending (newest date first)
    return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredMedia]);

  const activeLightbox = lightboxIndex !== null && filteredMedia[lightboxIndex] ? filteredMedia[lightboxIndex] : null;

  const showNext = (e) => {
    e?.stopPropagation();
    if (lightboxIndex !== null && filteredMedia.length > 0) {
      if (lightboxIndex < filteredMedia.length - 1) {
        setLightboxIndex(prev => prev + 1);
      } else {
        setLightboxIndex(0);
      }
    }
  };

  const showPrev = (e) => {
    e?.stopPropagation();
    if (lightboxIndex !== null && filteredMedia.length > 0) {
      if (lightboxIndex > 0) {
        setLightboxIndex(prev => prev - 1);
      } else {
        setLightboxIndex(filteredMedia.length - 1);
      }
    }
  };

  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchStartTimestampRef = useRef(0);
  const swipeDirRef = useRef(null);
  const hasMovedRef = useRef(false);

  const handleLightboxTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartTimestampRef.current = Date.now();
    swipeDirRef.current = null;
    hasMovedRef.current = false;
    setIsDragging(true);
    setDragOffset(0);
    setDragOffsetY(0);
  };

  const handleLightboxTouchMove = (e) => {
    if (lightboxIndex === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
      hasMovedRef.current = true;
    }

    if (swipeDirRef.current === null) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        swipeDirRef.current = Math.abs(diffX) > Math.abs(diffY) ? 'h' : 'v';
      }
    }

    if (swipeDirRef.current === 'h') {
      let offset = diffX;
      if (lightboxIndex === 0 && offset > 0) {
        offset = offset * 0.3;
      } else if (lightboxIndex === filteredMedia.length - 1 && offset < 0) {
        offset = offset * 0.3;
      }
      setDragOffset(offset);
      setDragOffsetY(0);
    } else if (swipeDirRef.current === 'v') {
      if (diffY > 0) {
        setDragOffsetY(diffY);
        setDragOffset(0);
      }
    }
  };

  const handleLightboxTouchEnd = () => {
    setIsDragging(false);
    const duration = Date.now() - touchStartTimestampRef.current;

    // If it was a quick tap -> Toggle immersion controls
    if (!hasMovedRef.current && duration < 280) {
      setShowControls(prev => !prev);
      setDragOffset(0);
      setDragOffsetY(0);
      swipeDirRef.current = null;
      return;
    }

    if (swipeDirRef.current === 'v') {
      if (dragOffsetY > 85) {
        setLightboxIndex(null);
        setDragOffsetY(0);
        setDragOffset(0);
        swipeDirRef.current = null;
        return;
      }
      setDragOffsetY(0);
    } else if (swipeDirRef.current === 'h') {
      const threshold = Math.min(viewportWidth * 0.18, 55);
      if (dragOffset < -threshold && lightboxIndex < filteredMedia.length - 1) {
        setLightboxIndex(prev => prev + 1);
      } else if (dragOffset > threshold && lightboxIndex > 0) {
        setLightboxIndex(prev => prev - 1);
      }
      setDragOffset(0);
    }

    swipeDirRef.current = null;
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredMedia.length]);

  return (
    <section className="w-full bg-[#faf9f6] py-4 sm:py-10 px-0 sm:px-6 lg:px-8 flex-grow">
      <div className="max-w-7xl mx-auto flex flex-col">

        {/* ================= HEADER ================= */}
        <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-8 px-3 sm:px-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#004899] text-xs font-black uppercase tracking-widest shadow-xs mb-2.5">
            <Icons.Photo className="w-4 h-4 text-[#004899]" />
            <span>{locale === 'bn' ? 'অফিসিয়াল ফটো গ্যালারি' : 'Official Photo Gallery'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight font-poppins">
            {locale === 'bn' ? 'এনএসএস' : 'NSS'} <span className="text-[#004899] underline decoration-amber-400 decoration-4 underline-offset-8">{locale === 'bn' ? 'ফটো অ্যালবাম' : 'Photo Gallery'}</span>
          </h2>

          <p className="mt-2.5 text-slate-600 text-xs sm:text-base leading-relaxed max-w-2xl mx-auto">
            {locale === 'bn'
              ? 'বিভিন্ন সমাজসেবামূলক কর্মকাণ্ড, স্পেশাল ক্যাম্প এবং কার্যক্রমের বিশেষ মুহূর্তের আলোকচিত্র সংগ্রহ।'
              : 'A visual archive capturing our community drives, special camping sessions, social campaigns, and memorable milestones.'}
          </p>

          {searchQuery && (
            <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs">
              <span>Showing results for: &ldquo;<strong className="font-bold">{searchQuery}</strong>&rdquo;</span>
              <button
                onClick={() => setSearchQuery("")}
                className="ml-1 w-4 h-4 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-900 flex items-center justify-center text-[10px] cursor-pointer font-bold"
                title="Clear search"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ================= FILTERS & SEARCH BAR ================= */}
        <div className="mx-2 sm:mx-0 flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 sm:mb-8 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 px-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              {locale === 'bn'
                ? `মোট ${filteredMedia.length} টি ছবি প্রদর্শিত হচ্ছে`
                : `Showing ${filteredMedia.length} photo${filteredMedia.length === 1 ? '' : 's'}`}
            </span>
          </div>

          {/* Search by Date */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'bn' ? 'তারিখ দিয়ে খুঁজুন (যেমন: 2026)...' : 'Search by date (e.g. 2026)...'}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#004899] outline-none transition-all shadow-2xs"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ================= GOOGLE PHOTOS STYLE DATE-GROUPED 4-COLUMN GRID ================= */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <div className="w-9 h-9 border-3 border-[#004899] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold">Loading photo gallery...</p>
          </div>
        ) : dateGroups.length === 0 ? (
          <div className="mx-2 sm:mx-0 bg-white p-10 sm:p-12 rounded-3xl text-center border border-slate-200/80 shadow-sm my-2">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-100 text-[#004899]">
              <Icons.Photo className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {searchQuery
                ? (locale === 'bn' ? `"${searchQuery}" এর জন্য কোনো ছবি পাওয়া যায়নি` : `No photos found matching "${searchQuery}"`)
                : (locale === 'bn' ? 'গ্যালারিতে কোনো ছবি পাওয়া যায়নি' : 'No Photos in Gallery')}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery
                ? (locale === 'bn' ? 'অন্য কোনো তারিখ দিয়ে খোঁজার চেষ্টা করুন।' : 'Try searching with a different date format.')
                : (locale === 'bn' ? 'অ্যাডমিন প্যানেল থেকে নতুন ছবি আপলোড করা হলে এখানে প্রদর্শিত হবে।' : 'Photos uploaded by the administrator will appear here.')}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 bg-[#004899] hover:bg-[#003366] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                {locale === 'bn' ? 'সব ছবি দেখুন' : 'View All Photos'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-10">
            {dateGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1.5 sm:space-y-2.5">
                {/* Date Header matching Google Photos style */}
                <div className="flex items-center justify-between sticky top-12 sm:top-16 z-10 bg-[#faf9f6]/95 backdrop-blur-md py-2 px-3 sm:px-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="p-1 sm:p-1.5 bg-blue-50 text-[#004899] rounded-lg border border-blue-100">
                      <Icons.Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                    <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-900 tracking-tight font-poppins">
                      {formatDate(group.date)}
                    </h3>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-white px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-slate-200 shadow-2xs">
                    {group.photos.length} {group.photos.length === 1 ? 'photo' : 'photos'}
                  </span>
                </div>

                {/* 4 Photos per row on mobile (grid-cols-4), tight 1.5px gap without wasted padding */}
                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-[1.5px] sm:gap-2.5 sm:rounded-2xl overflow-hidden">
                  {group.photos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => {
                        const idx = filteredMedia.findIndex(m => m.id === photo.id);
                        setLightboxIndex(idx !== -1 ? idx : 0);
                      }}
                      className="relative aspect-square bg-slate-200 overflow-hidden cursor-pointer group select-none active:opacity-75 transition-opacity"
                    >
                      <img
                        src={getOptimizedImageUrl(photo.image_url, { width: 400, quality: 'auto' })}
                        alt={photo.date}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Clean Subtle Hover Overlay */}
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                        <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ================= GOOGLE PHOTOS STYLE FULLSCREEN LIGHTBOX VIA PORTAL ================= */}
      {mounted && activeLightbox && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black flex flex-col justify-between select-none animate-fade-in overflow-hidden touch-none"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${Math.max(0.15, 1 - dragOffsetY / 320)})`,
            transition: isDragging ? 'none' : 'background-color 280ms ease-out',
          }}
          onClick={() => {
            // Click outside photo toggles controls or closes
          }}
        >
          {/* Top Bar: Google Photos Header */}
          <div
            className={`flex items-center justify-between px-3 sm:px-5 py-3.5 bg-gradient-to-b from-black/85 via-black/50 to-transparent z-30 shrink-0 transition-all duration-300 ${
              showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => setLightboxIndex(null)}
                className="w-11 h-11 rounded-full text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0"
                title="Back to Gallery"
                aria-label="Back to Gallery"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white tracking-wide font-poppins">
                  {formatDate(activeLightbox.date)}
                </h4>
                <p className="text-[11px] text-white/60 font-medium">NSS Event Archive</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-white/90 bg-white/15 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                {lightboxIndex + 1} / {filteredMedia.length}
              </span>
            </div>
          </div>

          {/* Center Stage: Google Photos Viewport with Real-time Gutter Swipe & Pull-Down Dismiss */}
          <div
            className="relative flex-1 w-full h-full overflow-hidden select-none flex items-center justify-center"
            onTouchStart={handleLightboxTouchStart}
            onTouchMove={handleLightboxTouchMove}
            onTouchEnd={handleLightboxTouchEnd}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowControls(prev => !prev);
              }
            }}
          >
            {filteredMedia.map((photo, idx) => {
              // Only render ±1 neighbor images for true Google Photos performance & real-time peek
              if (Math.abs(idx - lightboxIndex) > 1) return null;

              const offsetDiff = idx - lightboxIndex;
              const gutter = 24;
              const posX = offsetDiff * (viewportWidth + gutter) + dragOffset;
              const posY = offsetDiff === 0 ? dragOffsetY : 0;
              const scale = offsetDiff === 0 && dragOffsetY > 0 ? Math.max(0.72, 1 - dragOffsetY / 700) : 1;

              return (
                <div
                  key={photo.id || idx}
                  className="absolute inset-0 flex items-center justify-center p-2 sm:p-6 will-change-transform pointer-events-none"
                  style={{
                    transform: `translate3d(${posX}px, ${posY}px, 0) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 280ms cubic-bezier(0.15, 0.9, 0.25, 1)',
                  }}
                >
                  <img
                    src={photo.image_url}
                    alt={photo.date || 'NSS Photo'}
                    loading={offsetDiff === 0 ? "eager" : "lazy"}
                    className="max-h-[86vh] max-w-[96vw] sm:max-h-[88vh] sm:max-w-[88vw] w-auto h-auto object-contain rounded-lg sm:rounded-xl shadow-2xl select-none"
                  />
                </div>
              );
            })}

            {/* Desktop Previous Button */}
            <button
              onClick={showPrev}
              className={`hidden sm:flex absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all duration-200 z-30 cursor-pointer active:scale-90 focus:outline-none drop-shadow-xl items-center justify-center backdrop-blur-md ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              title="Previous Photo"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Desktop Next Button */}
            <button
              onClick={showNext}
              className={`hidden sm:flex absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all duration-200 z-30 cursor-pointer active:scale-90 focus:outline-none drop-shadow-xl items-center justify-center backdrop-blur-md ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              title="Next Photo"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Bottom Bar: Google Photos Info & Gesture Hint */}
          <div
            className={`flex items-center justify-center px-6 py-3 bg-gradient-to-t from-black/85 via-black/50 to-transparent z-30 shrink-0 transition-all duration-300 ${
              showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[11px] text-white/60 tracking-wide sm:hidden">
              {locale === 'bn' ? 'সোয়াইপ করে ছবি দেখুন • নিচে টেনে বন্ধ করুন' : 'Swipe horizontally to browse • Drag down to dismiss'}
            </span>
            <span className="text-[11px] text-white/60 tracking-wide hidden sm:inline-block">
              {locale === 'bn' ? 'ব্রাউজ করতে কীবোর্ডের তীর বা পাশের বাটন ব্যবহার করুন' : 'Use Arrow keys or on-screen buttons to navigate'}
            </span>
          </div>
        </div>,
        document.body
      )}

    </section>
  );
}
