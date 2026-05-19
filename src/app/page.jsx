"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import LoadingScreen from "@/components/layout/LoadingScreen";

// Layout components
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Login from "@/components/auth/Login";
import Register from "@/components/auth/Register";

// Section components
import HeroSection from "@/components/sections/Hero";
import Activities from "@/components/sections/Activities";
import Committee from "@/components/sections/Committee";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";

const VALID_TABS = ['home', 'activities', 'committee', 'about', 'contact'];
const getTabFromHash = () => {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace('#', '');
  return VALID_TABS.includes(hash) ? hash : 'home';
};

export default function Home() {
  const [siteData, setSiteData] = useState(null);
  const [eventsData, setEventsData] = useState(null);
  const [committeeData, setCommitteeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [authModal, setAuthModal] = useState(null);
  const isFirstRender = useRef(true);

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
    }

    // Fetch ALL data in parallel — eliminates waterfall loading
    const fetchAllData = async () => {
      try {
        const [siteRes, eventsRes, committeeRes] = await Promise.allSettled([
          supabase.from("site_content").select("*").limit(1).single(),
          supabase.from("events").select("*").order("start_date", { ascending: false }),
          supabase.from("committee").select("*").order("id", { ascending: true }),
        ]);

        if (isMounted) {
          if (siteRes.status === 'fulfilled' && siteRes.value.data) setSiteData(siteRes.value.data);
          if (eventsRes.status === 'fulfilled' && eventsRes.value.data) setEventsData(eventsRes.value.data);
          if (committeeRes.status === 'fulfilled' && committeeRes.value.data) setCommitteeData(committeeRes.value.data);
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
    hero_title: "Banwarilal Bhalotia College NSS Unit",
    hero_subtitle: "Youth Power for Service",
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
      />
      
      <main className="flex-grow flex flex-col relative w-full">
        <div className={activeTab === 'home' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <HeroSection
            title={finalData.hero_title}
            subtitle={finalData.hero_subtitle}
            sliderUrls={finalData.hero_slider_urls}
            onNavigate={setActiveTab}
          />
        </div>
        <div className={activeTab === 'activities' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <Activities prefetchedEvents={eventsData} />
        </div>
        <div className={activeTab === 'committee' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <Committee prefetchedMembers={committeeData} />
        </div>
        <div className={activeTab === 'about' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <About onNavigate={setActiveTab} siteData={siteData} />
        </div>
        <div className={activeTab === 'contact' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <Contact siteData={siteData} />
        </div>
      </main>

      <Footer finalData={finalData} />

      {authModal === 'login' && (
        <Login onClose={() => setAuthModal(null)} onSwitch={(mode) => setAuthModal(mode)} />
      )}
      {authModal === 'register' && (
        <Register onClose={() => setAuthModal(null)} onSwitch={(mode) => setAuthModal(mode)} />
      )}
    </div>
  );
}