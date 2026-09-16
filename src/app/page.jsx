"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import LoadingScreen from "@/components/layout/LoadingScreen";
import { useLanguage } from "@/context/LanguageContext";
import { Icons } from "@/components/Icons";

// Layout components
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VisitorCounter from "@/components/layout/VisitorCounter";
import Login from "@/components/auth/Login";
import Register from "@/components/auth/Register";

// Section components
import HeroSection from "@/components/sections/Hero";
import Activities from "@/components/sections/Activities";
import Gallery from "@/components/sections/Gallery";
import Notices from "@/components/sections/Notices";
import Committee from "@/components/sections/Committee";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import TeachersSection from "@/components/sections/TeachersSection";
import NSSStory from "@/components/sections/NSSStoryNew";

const VALID_TABS = ['home', 'activities', 'committee', 'gallery', 'notices', 'contact', 'about'];
const getTabFromHash = () => {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace('#', '');
  return VALID_TABS.includes(hash) ? hash : 'home';
};

export default function Home() {
  const { t } = useLanguage();
  const [siteData, setSiteData] = useState(null);
  const [eventsData, setEventsData] = useState(null);
  const [committeeData, setCommitteeData] = useState(null);
  const [noticesData, setNoticesData] = useState(null);
  const [galleryData, setGalleryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [authModal, setAuthModal] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const isFirstRender = useRef(true);

  // Listen for lightbox state to hide floating controls
  useEffect(() => {
    const handleLightboxState = (e) => setIsLightboxOpen(Boolean(e.detail));

    window.addEventListener('nss_lightbox_state', handleLightboxState);

    return () => {
      window.removeEventListener('nss_lightbox_state', handleLightboxState);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 250);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Detect when footer enters viewport to hide scroll-to-top button with requestAnimationFrame
  useEffect(() => {
    let rafId;
    const handleCheckFooter = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const footer = document.getElementById('footer');
        if (!footer) {
          setIsFooterVisible(false);
          return;
        }
        const rect = footer.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const isVisible = rect.top <= windowHeight;
        setIsFooterVisible(prev => (prev !== isVisible ? isVisible : prev));
      });
    };

    window.addEventListener('scroll', handleCheckFooter, { passive: true });
    window.addEventListener('resize', handleCheckFooter, { passive: true });
    handleCheckFooter();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleCheckFooter);
      window.removeEventListener('resize', handleCheckFooter);
    };
  }, [loading, activeTab]);

  useEffect(() => {
    let isMounted = true;

    // Restore tab from URL hash (client-only, avoids hydration mismatch)
    const tabFromHash = getTabFromHash();
    if (tabFromHash !== 'home') {
      setActiveTab(tabFromHash);
    }

    // Clean up aborted OAuth error state — only strip OAuth error fragments, not tab hashes
    const currentHash = window.location.hash;
    if (currentHash && currentHash.includes('error=') && currentHash.includes('error_description')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    if (sessionStorage.getItem('nss_oauth_pending')) {
      sessionStorage.removeItem('nss_oauth_pending');
      setAuthModal(null);
    } else if (sessionStorage.getItem('nss_pending_creds')) {
      setAuthModal('register');
    }

    // Fetch ALL data in parallel — eliminates waterfall loading
    const fetchAllData = async () => {
      try {
        const [siteRes, eventsRes, committeeRes, noticesRes, galleryRes] = await Promise.allSettled([
          supabase.from("site_content").select("*").limit(1).single(),
          supabase.from("events").select("*").order("start_date", { ascending: false }),
          supabase.from("committee").select("*").order("id", { ascending: true }),
          supabase.from("nss_notices").select("*").order("date", { ascending: false }),
          supabase.from("nss_gallery").select("*").order("date", { ascending: false }),
        ]);

        if (isMounted) {
          if (siteRes.status === 'fulfilled' && siteRes.value.data) setSiteData(siteRes.value.data);
          if (eventsRes.status === 'fulfilled' && eventsRes.value.data) setEventsData(eventsRes.value.data);
          if (committeeRes.status === 'fulfilled' && committeeRes.value.data) setCommitteeData(committeeRes.value.data);
          
          if (noticesRes.status === 'fulfilled' && noticesRes.value.data) {
            setNoticesData(noticesRes.value.data);
          } else {
            // Fallback for notices table
            supabase.from("notices").select("*").order("date", { ascending: false }).then(({ data }) => {
              if (data && isMounted) setNoticesData(data);
            }).catch(() => {});
          }

          if (galleryRes.status === 'fulfilled' && galleryRes.value.data) {
            setGalleryData(galleryRes.value.data);
          } else {
            // Fallback for gallery table
            supabase.from("gallery").select("*").order("date", { ascending: false }).then(({ data }) => {
              if (data && isMounted) setGalleryData(data);
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Error fetching page data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAllData();

    // Global event listeners for modal toggling
    const handleOpenRegister = () => setAuthModal('register');
    const handleOpenLogin = () => setAuthModal('login');
    window.addEventListener('open_nss_register', handleOpenRegister);
    window.addEventListener('open_nss_login', handleOpenLogin);

    // Fallback loading timer (safety net)
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      window.removeEventListener('open_nss_register', handleOpenRegister);
      window.removeEventListener('open_nss_login', handleOpenLogin);
    };
  }, []);

  // Sync tab to URL hash & scroll to top — skip on initial mount
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    const newHash = activeTab === 'home' ? '' : `#${activeTab}`;
    window.history.replaceState(null, '', newHash || window.location.pathname + window.location.search);
  }, [activeTab]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const finalData = siteData || {
    about_heading: "About Us",
    about_text: "Welcome to our NSS Unit.",
    about_image_url: "",
    hero_slider_urls: [],
    contact_email: "",
    contact_phone: "",
    contact_whatsapp: "",
    social_facebook: "",
    social_instagram: "",
    social_youtube: "",
  };

  return (
    <div className="font-sans text-slate-800 bg-[#faf9f6] min-h-screen flex flex-col">
      <Navbar
        onOpenLogin={() => setAuthModal('login')}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isFooterVisible={isFooterVisible}
        searchData={{
          events: eventsData,
          committee: committeeData,
          notices: noticesData,
          gallery: galleryData,
          site: siteData
        }}
      />

      <main id="main-content" tabIndex={-1} className="flex-grow flex flex-col relative w-full focus:outline-none">
        <div className={activeTab === 'home' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <HeroSection
            sliderUrls={finalData.hero_slider_urls}
            onNavigate={setActiveTab}
          />
          <NSSStory onNavigate={setActiveTab} />
          <TeachersSection
            members={committeeData?.filter(m => !m.designation || !m.designation.includes('::') || m.designation.startsWith('Teacher::')) || []}
          />
        </div>
        <div className={activeTab === 'activities' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <Activities prefetchedEvents={eventsData} />
        </div>
        <div className={activeTab === 'gallery' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <Gallery prefetchedEvents={eventsData} prefetchedGallery={galleryData} />
        </div>
        <div className={activeTab === 'notices' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <Notices prefetchedNotices={noticesData} />
        </div>
        <div className={activeTab === 'committee' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <Committee
            prefetchedMembers={committeeData?.filter(m => m.designation && !m.designation.startsWith('Teacher::')) || []}
          />
        </div>
        <div className={activeTab === 'about' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <About onNavigate={setActiveTab} siteData={siteData} />
        </div>
        <div className={activeTab === 'contact' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <Contact siteData={siteData} />
        </div>
      </main>

      <Footer finalData={finalData} />

      {/* Floating Visitor and Live Count Widget - Only on Home Page/Tab */}
      {activeTab === 'home' && <VisitorCounter />}

      {/* Floating Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 w-11 h-11 rounded-full bg-gradient-to-tr from-[#003366] via-[#004899] to-[#1D6FE0] hover:from-[#002244] hover:to-[#004899] text-white flex items-center justify-center shadow-[0_8px_25px_rgba(0,51,102,0.4)] border border-white/25 transition-all duration-300 ease-in-out hover:scale-110 active:scale-90 cursor-pointer ${
          showScrollTop && !isFooterVisible && !isLightboxOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <Icons.ChevronUp className="w-5 h-5" />
      </button>

      {authModal === 'login' && (
        <Login onClose={() => setAuthModal(null)} onSwitch={(mode) => setAuthModal(mode)} />
      )}
      {authModal === 'register' && (
        <Register onClose={() => setAuthModal(null)} onSwitch={(mode) => setAuthModal(mode)} />
      )}
    </div>
  );
}