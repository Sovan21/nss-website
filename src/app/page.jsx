"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Icons } from "@/components/Icons";
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



export default function Home() {
  const [siteData, setSiteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [authModal, setAuthModal] = useState(null);

  useEffect(() => {
    let isMounted = true; 
    
    // Clean up aborted OAuth state
    if (window.location.hash && (
      window.location.hash.includes('error') ||
      window.location.hash.includes('access_token') ||
      window.location.hash.includes('token_type')
    )) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    if (sessionStorage.getItem('nss_oauth_pending')) {
      sessionStorage.removeItem('nss_oauth_pending');
      setAuthModal(null);
    }

    const fetchSiteData = async () => {
      try {
        const { data } = await supabase.from("site_content").select("*").limit(1).single();
        if (isMounted && data) setSiteData(data);
      } catch (err) {
        console.error("Error fetching homepage data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSiteData();
    
    // Global event listeners for modal toggling
    const handleOpenRegister = () => setAuthModal('register');
    const handleOpenLogin = () => setAuthModal('login');
    window.addEventListener('open_nss_register', handleOpenRegister);
    window.addEventListener('open_nss_login', handleOpenLogin);

    // Fallback loading timer
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3000);
    
    return () => { 
      isMounted = false; 
      clearTimeout(timer);
      window.removeEventListener('open_nss_register', handleOpenRegister);
      window.removeEventListener('open_nss_login', handleOpenLogin);
    };
  }, []);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

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
          <Activities />
        </div>
        <div className={activeTab === 'committee' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <Committee />
        </div>
        <div className={activeTab === 'about' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <About onNavigate={setActiveTab} />
        </div>
        <div className={activeTab === 'contact' ? 'flex-grow flex flex-col animate-fade-in-up w-full' : 'hidden'}>
          <Contact />
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