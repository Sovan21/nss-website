"use client";
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { Icons } from "@/components/Icons";
import { useLanguage } from "@/context/LanguageContext";
import useScrollLock from "@/lib/useScrollLock";
import { getDirectImageUrl, formatDate } from "@/lib/utils";

export default function Gallery({ prefetchedEvents, prefetchedGallery }) {
  const { locale } = useLanguage();
  const [activeLightbox, setActiveLightbox] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dbPhotos, setDbPhotos] = useState([]);
  const [adminGallery, setAdminGallery] = useState([]);
  const [loading, setLoading] = useState(!prefetchedGallery);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useScrollLock(!!activeLightbox);

  // Broadcast lightbox state to hide mobile floating widgets
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nss_lightbox_state', { detail: !!activeLightbox }));
  }, [activeLightbox]);

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

  const currentIndex = activeLightbox !== null ? filteredMedia.findIndex(m => m.id === activeLightbox.id) : -1;

  const showNext = (e) => {
    e?.stopPropagation();
    if (currentIndex < filteredMedia.length - 1) {
      setActiveLightbox(filteredMedia[currentIndex + 1]);
    } else {
      setActiveLightbox(filteredMedia[0]);
    }
  };

  const showPrev = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setActiveLightbox(filteredMedia[currentIndex - 1]);
    } else {
      setActiveLightbox(filteredMedia[filteredMedia.length - 1]);
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeLightbox) return;
      if (e.key === "Escape") setActiveLightbox(null);
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLightbox, currentIndex, filteredMedia]);

  return (
    <section className="w-full bg-[#faf9f6] py-8 sm:py-10 px-4 sm:px-6 lg:px-8 flex-grow">
      <div className="max-w-7xl mx-auto flex flex-col">
        
        {/* ================= HEADER ================= */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#004899] text-xs font-black uppercase tracking-widest shadow-xs mb-2.5">
            <Icons.Photo className="w-4 h-4 text-[#004899]" />
            <span>{locale === 'bn' ? 'অফিসিয়াল ফটো গ্যালারি' : 'Official Photo Gallery'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight font-poppins">
            {locale === 'bn' ? 'এনএসএস' : 'NSS'} <span className="text-[#004899] underline decoration-amber-400 decoration-4 underline-offset-8">{locale === 'bn' ? 'ফটো অ্যালবাম' : 'Photo Gallery'}</span>
          </h2>

          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            {locale === 'bn'
              ? 'বিভিন্ন সমাজসেবামূলক কর্মকাণ্ড, স্পেশাল ক্যাম্প এবং কার্যক্রমের বিশেষ মুহূর্তের আলোকচিত্র সংগ্রহ।'
              : 'A visual archive capturing our community drives, special camping sessions, social campaigns, and memorable milestones.'}
          </p>

          {searchQuery && (
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs">
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 sm:mb-8 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
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

        {/* ================= GOOGLE PHOTOS STYLE DATE-GROUPED GRID ================= */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <div className="w-9 h-9 border-3 border-[#004899] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-semibold">Loading photo gallery...</p>
          </div>
        ) : dateGroups.length === 0 ? (
          <div className="bg-white p-10 sm:p-12 rounded-3xl text-center border border-slate-200/80 shadow-sm my-2">
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
          <div className="space-y-8 sm:space-y-10">
            {dateGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-3">
                {/* Date Header matching the site's standard design */}
                <div className="flex items-center justify-between sticky top-16 z-10 bg-[#faf9f6]/95 backdrop-blur-md py-2 px-1 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 bg-blue-50 text-[#004899] rounded-lg border border-blue-100">
                      <Icons.Calendar className="w-4 h-4" />
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-poppins">
                      {formatDate(group.date)}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                    {group.photos.length} {group.photos.length === 1 ? 'photo' : 'photos'}
                  </span>
                </div>

                {/* Natural Aspect Ratio Masonry Grid */}
                <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-4 gap-3.5 sm:gap-4 space-y-3.5 sm:space-y-4">
                  {group.photos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setActiveLightbox(photo)}
                      className="break-inside-avoid group relative bg-white rounded-2xl overflow-hidden cursor-pointer shadow-xs hover:shadow-xl border border-slate-200/90 transition-all duration-300 hover:-translate-y-1 select-none"
                    >
                      <img
                        src={photo.image_url}
                        alt={photo.date}
                        loading="lazy"
                        className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Clean Hover Overlay with Zoom Icon & Date Badge */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
                        <div className="flex items-center justify-between text-white text-xs font-semibold">
                          <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px]">
                            <Icons.Photo className="w-3 h-3" />
                            {formatDate(photo.date)}
                          </span>
                          <span className="w-6 h-6 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ================= NATIVE FULLSCREEN LIGHTBOX VIA PORTAL ================= */}
      {mounted && activeLightbox && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-black/95 sm:bg-black/90 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in"
          onClick={() => setActiveLightbox(null)}
        >
          {/* Top Bar: Back/Close + Date + Counter */}
          <div 
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/90 to-transparent z-20 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveLightbox(null)}
                className="p-2 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {formatDate(activeLightbox.date)}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-white/80 bg-white/10 px-2.5 py-1 rounded-full">
                {currentIndex + 1} / {filteredMedia.length}
              </span>
              <button
                onClick={() => setActiveLightbox(null)}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Close Lightbox"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Center: Image Stage with Navigation */}
          <div 
            className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-6 overflow-hidden min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Button */}
            <button
              onClick={showPrev}
              className="absolute left-2 sm:left-6 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-md transition z-30 cursor-pointer shadow-lg active:scale-95"
              title="Previous Photo"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Current Fullscreen Photo */}
            <img
              src={activeLightbox.image_url}
              alt={activeLightbox.date}
              className="max-h-[75vh] max-w-[94vw] sm:max-h-[82vh] sm:max-w-[85vw] w-auto h-auto object-contain rounded-lg sm:rounded-2xl shadow-2xl transition duration-300 mx-auto"
            />

            {/* Next Button */}
            <button
              onClick={showNext}
              className="absolute right-2 sm:right-6 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-md transition z-30 cursor-pointer shadow-lg active:scale-95"
              title="Next Photo"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Bottom Bar: Download Option */}
          <div 
            className="flex items-center justify-between px-6 py-3 bg-gradient-to-t from-black/90 to-transparent z-20 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[11px] text-white/60 hidden sm:inline-block">
              Use Left/Right arrow keys to browse
            </span>
            <div className="flex items-center gap-2 mx-auto sm:mx-0">
              <a
                href={activeLightbox.image_url}
                target="_blank"
                rel="noreferrer"
                download
                className="px-4 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-full backdrop-blur-md transition flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {locale === 'bn' ? 'ছবি ডাউনলোড' : 'Download Photo'}
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}

    </section>
  );
}
