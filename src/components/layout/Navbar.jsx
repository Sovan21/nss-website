import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import useScrollLock from "@/lib/useScrollLock";
import { Icons } from "../Icons";
import UserAvatar, { getInitials } from "../UserAvatar";
import { ProfileCardContent } from "../ProfileModals";
import { useLanguage } from "@/context/LanguageContext";
import { uploadConfirmedUserPhoto } from "@/lib/utils";

export const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: Icons.Home },
  { key: 'activities', label: 'Activities', icon: Icons.Sparkles },
  { key: 'committee', label: 'Committee', icon: Icons.Team },
  { key: 'about', label: 'About Us', icon: Icons.Info },
  { key: 'contact', label: 'Contact', icon: Icons.Mail },
];

const Navbar = ({ onOpenLogin, activeTab, onTabChange }) => {
  const { t } = useLanguage();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [showDesktopProfile, setShowDesktopProfile] = useState(false);
  const [showAdminWarning, setShowAdminWarning] = useState(false);
  const [showEmailConfirmedModal, setShowEmailConfirmedModal] = useState(false);
  const hamburgerRef = useRef(null);
  const [closeBtnPos, setCloseBtnPos] = useState(null);

  useEffect(() => {
    const checkSession = () => {
      const sessionUser = localStorage.getItem('nss_user');
      if (sessionUser) { const p = JSON.parse(sessionUser); setCurrentUser(p); fetchFreshData(p); }
      else { setCurrentUser(null); }
    };
    const fetchFreshData = async (parsedUser) => {
      try {
        const { data, error } = await supabase.from('registrations').select('*').eq('id', parsedUser.id).maybeSingle();
        if (data && !error) { setCurrentUser(data); localStorage.setItem('nss_user', JSON.stringify(data)); }
      } catch (err) { console.error("Background sync error:", err); }
    };
    const syncSessionData = async (session) => {
      if (!session?.user) return;
      const user = session.user;

      try {
        const { data: profileData, error: profileErr } = await supabase.from('registrations').select('*').eq('id', user.id).maybeSingle();
        if (profileErr) return;
        let userDataToSave = profileData;
        if (profileData && !profileData.photo_url) {
          const uploadedUrl = await uploadConfirmedUserPhoto(user, user.email, profileData.full_name);
          if (uploadedUrl) {
            profileData.photo_url = uploadedUrl;
          } else if (user.user_metadata?.photo_url) {
            profileData.photo_url = user.user_metadata.photo_url;
            await supabase.from('registrations').update({ photo_url: user.user_metadata.photo_url }).eq('id', user.id);
          }
        }
        if (!profileData) {
          const m = user.user_metadata || {};
          const newProfile = {
            id: user.id,
            full_name: m.full_name || user.email?.split('@')[0] || "Volunteer",
            email: user.email,
            fathers_name: m.fathers_name || null,
            mothers_name: m.mothers_name || null,
            aadhaar_no: m.aadhaar_no || null,
            phone: m.phone || null,
            whatsapp: m.whatsapp || null,
            dob: m.dob || null,
            gender: m.gender || null,
            blood_group: m.blood_group || null,
            current_address: m.current_address || null,
            department: m.department || null,
            semester: m.semester || null,
            college_application_id: m.college_application_id || null,
            extra_curriculum: m.extra_curriculum || null,
            prev_experience: m.prev_experience || null,
            bio: m.bio || null,
            photo_url: m.photo_url || null,
            role: 'volunteer'
          };
          const { data: insertedData } = await supabase.from('registrations').insert([newProfile]).select().maybeSingle();
          userDataToSave = insertedData || newProfile;
        }
        localStorage.setItem('nss_user', JSON.stringify(userDataToSave));
        setCurrentUser(userDataToSave);
      } catch (err) { console.error("Session sync error:", err); }
    };
    checkSession();
    window.addEventListener('nss_user_logged_in', checkSession);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && localStorage.getItem('nss_admin_mode') !== 'true') { syncSessionData(session); }
    }).catch(() => { });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') { localStorage.removeItem('nss_user'); localStorage.removeItem('nss_admin_mode'); setCurrentUser(null); return; }
      if (localStorage.getItem('nss_admin_mode') === 'true' || event === 'USER_UPDATED') return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') { if (session) syncSessionData(session); }
    });
    return () => { window.removeEventListener('nss_user_logged_in', checkSession); subscription?.unsubscribe(); };
  }, []);

  useScrollLock(showAdminWarning || showEmailConfirmedModal);

  const toggleMenu = () => {
    if (!isMobileMenuOpen && hamburgerRef.current) {
      const rect = hamburgerRef.current.getBoundingClientRect();
      setCloseBtnPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  const closeAllMenus = () => { setIsMobileMenuOpen(false); setShowMobileProfile(false); setShowDesktopProfile(false); };

  const handleNavClick = (key) => {
    if (activeTab === key) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onTabChange(key);
    }
    closeAllMenus();
  };

  const handleLogout = async () => { await supabase.auth.signOut(); localStorage.removeItem('nss_user'); setCurrentUser(null); closeAllMenus(); window.dispatchEvent(new Event('nss_user_logged_out')); };

  const handleCloseSuccessModal = () => {
    setShowEmailConfirmedModal(false);
    if (currentUser?.id) {
      localStorage.setItem(`nss_whatsapp_dismissed_${currentUser.id}`, 'true');
    }
    sessionStorage.removeItem('nss_just_registered');
    if (!currentUser && onOpenLogin) {
      onOpenLogin();
    }
  };

  let adminPressTimer;
  const handlePressStart = () => { adminPressTimer = setTimeout(() => { setShowAdminWarning(true); }, 6000); };
  const handlePressEnd = () => { clearTimeout(adminPressTimer); };
  const confirmAdminAccess = () => { setShowAdminWarning(false); sessionStorage.removeItem('allow_public'); if (localStorage.getItem('nss_admin_mode')) { router.push('/admin'); } else { router.push('/admin-login'); } };

  return (
    <>
      <div id="fixed-navbar" className="fixed top-0 left-0 right-0 z-50 pt-2.5 sm:pt-3 md:pt-4 px-2 sm:px-3 md:px-4 pointer-events-none box-border">
        <nav className="pointer-events-auto w-full max-w-6xl mx-auto bg-white/95 shadow-[0_12px_30px_rgba(0,0,0,0.06)] border border-slate-100 rounded-full transition-all duration-300 overflow-hidden">
          <div className="px-2.5 sm:px-4 md:px-6">
            <div className="flex justify-between items-center h-13 sm:h-14 md:h-18 gap-1.5 sm:gap-2 w-full">
              <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink min-w-0 cursor-pointer select-none group"
                onClick={() => handleNavClick('home')}>
                {/* Unified Logo Badge — long-press here triggers admin access */}
                <div className="flex items-center gap-1 shrink-0 bg-white rounded-xl sm:rounded-2xl px-1 py-0.5 border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.1)] group-hover:shadow-[0_4px_20px_rgba(0,0,0,0.14)] group-hover:border-slate-300 transition-[transform,box-shadow,border-color] duration-300 ease-out active:scale-[0.98]"
                  onContextMenu={(e) => e.preventDefault()}
                  onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd} onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
                  style={{ WebkitTouchCallout: 'none' }}>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 overflow-hidden shrink-0">
                    <img src="/BBCollege Logo.jpeg" alt="B.B. College Logo" className="w-full h-full object-contain select-none" draggable="false" />
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full overflow-hidden shrink-0">
                    <img src="/nss-logo.png" alt="NSS Logo" className="w-full h-full object-contain select-none" draggable="false" />
                  </div>
                </div>
                <div className="flex flex-col justify-center shrink min-w-0 pointer-events-none">
                  <h1 className="text-[9px] min-[360px]:text-[9.5px] min-[400px]:text-[10.5px] sm:text-[11px] md:text-[12px] lg:text-[13px] xl:text-sm font-black text-slate-800 leading-tight whitespace-nowrap tracking-tight uppercase">{t("hero.badge")}</h1>
                  <p className="text-[6.5px] min-[360px]:text-[7px] min-[400px]:text-[8px] sm:text-[8px] md:text-[9px] lg:text-[10px] xl:text-[11px] font-bold text-blue-600/80 whitespace-nowrap uppercase tracking-wider lg:tracking-widest">
                    Banwarilal Bhalotia College, Asansol
                  </p>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-1 lg:gap-1.5 xl:gap-2.5 font-bold text-slate-700 shrink-0">
                {NAV_ITEMS.map((item) => (
                  <button key={item.key} onClick={() => handleNavClick(item.key)}
                    className={`relative px-3 lg:px-3.5 xl:px-4.5 py-2 lg:py-2.5 xl:py-3 rounded-full font-outfit font-bold tracking-wide text-[12px] lg:text-[13px] xl:text-[15px] transition-all duration-300 capitalize cursor-pointer ${activeTab === item.key ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-blue-50 hover:text-blue-700'}`}>
                    {t(`nav.${item.key}`)}
                  </button>
                ))}
                {currentUser ? (
                  <div className="relative ml-1.5 pl-1.5 lg:ml-3 lg:pl-3 border-l border-slate-200">
                    <div className="hover:scale-105 transition transform cursor-pointer"><UserAvatar user={currentUser} onClick={() => setShowDesktopProfile(!showDesktopProfile)} /></div>
                  </div>
                ) : (
                  <button onClick={onOpenLogin} className="bg-slate-900 text-white px-4 lg:px-5 xl:px-6 py-2 lg:py-2.5 xl:py-3 rounded-full font-outfit font-bold tracking-wide text-[12px] lg:text-[13px] xl:text-[15px] ml-1.5 lg:ml-2 focus:outline-none cursor-pointer">{t("nav.login")}</button>
                )}
              </div>

              <div className="lg:hidden flex items-center shrink-0 ml-1 sm:ml-2">
                {currentUser ? (<UserAvatar user={currentUser} onClick={toggleMenu} />) : (
                  <button ref={hamburgerRef} onClick={toggleMenu} className="text-slate-800 hover:bg-blue-50 focus:outline-none p-1.5 sm:p-2.5 shrink-0 bg-white/50 rounded-full border border-slate-200/60 shadow-sm cursor-pointer transition-all duration-300 backdrop-blur-sm relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
                    <div className="relative w-4.5 sm:w-5 h-3 sm:h-3.5 flex flex-col justify-between origin-center transform transition-all duration-300">
                      <span className={`h-[2px] w-full bg-slate-700 rounded-full transition-all duration-300 origin-center ${isMobileMenuOpen ? 'rotate-45 translate-y-[5px] sm:translate-y-[6px]' : ''}`}></span>
                      <span className={`h-[2px] w-full bg-slate-700 rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 scale-0' : ''}`}></span>
                      <span className={`h-[2px] w-full bg-slate-700 rounded-full transition-all duration-300 origin-center ${isMobileMenuOpen ? '-rotate-45 -translate-y-[5px] sm:-translate-y-[6px]' : ''}`}></span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile close button — rendered outside navbar stacking context, positioned at hamburger's exact location */}
      {isMobileMenuOpen && closeBtnPos && !currentUser && (
        <button
          onClick={closeAllMenus}
          className="fixed z-[80] lg:hidden flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-full border border-white/15 cursor-pointer transition-colors duration-300 focus:outline-none shadow-sm"
          style={{ top: closeBtnPos.top, left: closeBtnPos.left, width: closeBtnPos.width, height: closeBtnPos.height }}
        >
          <div className="relative w-4.5 sm:w-5 h-3 sm:h-3.5 flex flex-col justify-between">
            <span className="h-[2px] w-full bg-white rounded-full origin-center rotate-45 translate-y-[5px] sm:translate-y-[6px]"></span>
            <span className="h-[2px] w-full bg-white rounded-full opacity-0 scale-0"></span>
            <span className="h-[2px] w-full bg-white rounded-full origin-center -rotate-45 -translate-y-[5px] sm:-translate-y-[6px]"></span>
          </div>
        </button>
      )}

      {/* Mobile backdrop */}
      <div className={`fixed inset-0 bg-slate-900/40 z-[60] lg:hidden transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={closeAllMenus}></div>

      {/* Mobile menu */}
      <div className={`fixed top-0 right-0 w-[280px] h-fit max-h-[100dvh] z-[70] lg:hidden flex flex-col transform transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-bl-[28px] overflow-hidden will-change-transform ${isMobileMenuOpen ? 'opacity-100 translate-x-0 visible' : 'opacity-0 translate-x-full invisible'}`}
        style={{ background: 'rgba(15, 23, 42, 0.97)', borderLeft: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

        {currentUser ? (
          <button onClick={(e) => { e.preventDefault(); closeAllMenus(); setShowMobileProfile(true); }} className="w-full bg-white/5 hover:bg-white/10 transition-colors p-6 flex flex-col items-center text-center shrink-0 relative group focus:outline-none border-b border-white/10 cursor-pointer">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500/30 shadow-xl mb-4 shrink-0 p-1 bg-white/5">
              <div className="w-full h-full rounded-full overflow-hidden">
                {currentUser.photo_url ? <img src={currentUser.photo_url} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-blue-600 text-white font-bold text-2xl flex items-center justify-center tracking-widest">{getInitials(currentUser.full_name)}</div>}
              </div>
            </div>
            <p className="font-extrabold text-white text-lg leading-tight truncate w-full">{currentUser.full_name}</p>
            <p className="text-[10px] text-blue-400 mt-2 font-black flex items-center justify-center gap-1.5 bg-blue-500/10 py-1.5 px-4 rounded-full border border-blue-500/20 uppercase tracking-widest">{t("nav.viewProfile")} <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></p>
          </button>
        ) : (
          <div className="px-5 pt-5 pb-3 flex justify-between items-center h-14 md:h-18">
            <span className="font-bold text-white/90 text-xs uppercase tracking-[0.2em]">{t("nav.menu")}</span>
          </div>
        )}

        <div className="overflow-y-auto py-5 px-5 space-y-2.5 shrink [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {NAV_ITEMS.map((item) => {
            const IconComp = item.icon;
            return (
              <button key={item.key} onClick={() => handleNavClick(item.key)}
                className={`flex items-center gap-3 w-full px-5 py-3.5 rounded-full font-bold text-sm transition-all duration-300 border cursor-pointer hover:translate-x-1 ${activeTab === item.key ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-[0_4px_15px_rgba(37,99,235,0.35)]' : 'bg-white/5 text-slate-200 border-transparent hover:bg-white/10 hover:border-white/10 active:scale-[0.98]'}`}>
                <IconComp className={`w-5 h-5 shrink-0 ${activeTab === item.key ? 'text-white' : ''}`} /> {t(`nav.${item.key}`)}
              </button>
            );
          })}
          {!currentUser && (
            <div className="pt-3 mt-2 border-t border-white/10">
              <button onClick={() => { closeAllMenus(); onOpenLogin(); }} className="flex items-center justify-center gap-2 bg-white text-slate-900 py-3 rounded-full font-bold text-sm w-full transition-colors duration-200 cursor-pointer active:scale-[0.97] hover:bg-blue-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg> {t("nav.loginJoin")}
              </button>
            </div>
          )}
        </div>
        {currentUser && (
          <div className="p-5 shrink-0 bg-transparent border-t border-white/10">
            <button onClick={handleLogout} className="w-full py-3 bg-red-500/10 hover:bg-red-500/25 text-red-300 font-bold text-sm rounded-full transition-colors duration-200 flex items-center justify-center gap-2 border border-red-500/20 shadow-sm cursor-pointer active:scale-[0.97]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg> {t("nav.logout")}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Profile Modal */}
      {showMobileProfile && currentUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 lg:hidden">
          <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={closeAllMenus}></div>
          <div className="relative z-10 w-full max-w-sm bg-gradient-to-br from-sky-50 to-blue-50 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[88dvh] md:max-h-[90vh] animate-fade-in-up border border-blue-100">
            <ProfileCardContent user={currentUser} onClose={closeAllMenus} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Desktop Profile Modal */}
      {showDesktopProfile && currentUser && (
        <div className="fixed inset-0 z-[100] hidden lg:flex justify-center pointer-events-none">
          <div className="absolute inset-0 pointer-events-auto" onClick={() => setShowDesktopProfile(false)}></div>
          <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="absolute right-4 sm:right-6 lg:right-8 top-[72px] w-[380px] bg-gradient-to-br from-sky-50 to-blue-50 shadow-2xl rounded-3xl overflow-hidden flex flex-col overscroll-contain animate-fade-in-up pointer-events-auto border border-blue-100">
              <ProfileCardContent user={currentUser} onClose={() => setShowDesktopProfile(false)} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      )}



      {/* Admin Confirmation Modal */}
      {showAdminWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setShowAdminWarning(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 md:p-8 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
              <svg className="w-8 h-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="font-extrabold text-xl text-slate-900 mb-2">{t("nav.adminConfirmTitle")}</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">{t("nav.adminConfirmText")}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowAdminWarning(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition text-sm shadow-sm cursor-pointer">{t("nav.cancel")}</button>
              <button onClick={confirmAdminAccess} className="flex-1 py-3 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition text-sm shadow-md cursor-pointer">{t("nav.proceed")}</button>
            </div>
          </div>
        </div>
      )}
      {/* Single Unified Success Modal: Email Verified Successfully! */}
      {showEmailConfirmedModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 font-sans antialiased animate-fade-in pointer-events-auto">
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md" onClick={handleCloseSuccessModal}></div>

          <div className="relative z-10 w-full max-w-md bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl shadow-2xl p-6 sm:p-8 border border-emerald-100 text-center animate-fade-in-up">
            <button
              onClick={handleCloseSuccessModal}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-white/80 hover:bg-white rounded-full text-slate-500 hover:text-slate-800 transition cursor-pointer border border-slate-200 shadow-sm"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Green Checkmark Badge */}
            <div className="w-20 h-20 mx-auto mb-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Content */}
            <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight tracking-wide">
              {t("nav.whatsapp.title")}
            </h3>
            <p className="text-slate-600 text-[14px] sm:text-[15px] font-medium mb-6 leading-relaxed">
              {t("nav.whatsapp.text")}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <a 
                href="https://chat.whatsapp.com/CVhiRk37OzC3tVCVdUv5wR" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={handleCloseSuccessModal}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl transition duration-300 shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-[15px] no-underline"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.426.002 9.842-4.414 9.845-9.843.002-2.63-1.023-5.101-2.886-6.968C16.366 1.94 13.9 .916 11.999.916 6.574.916 2.16 5.334 2.158 10.766c-.001 1.503.402 2.974 1.168 4.29l-.993 3.627 3.724-.977 1.01.6c1.479.88 3.011 1.342 4.63 1.343h.001zm10.435-7.234c-.267-.134-1.58-.779-1.824-.868-.244-.09-.422-.134-.6.134-.178.267-.689.868-.844 1.047-.156.178-.311.2-.578.067-.267-.134-1.127-.416-2.148-1.327-.795-.71-1.332-1.587-1.488-1.854-.156-.267-.017-.411.116-.544.12-.12.267-.312.4-.467.133-.156.178-.267.267-.445.09-.178.044-.334-.022-.467-.067-.134-.6-1.446-.822-1.98-.217-.522-.455-.45-.6-.458-.138-.008-.297-.01-.456-.01-.159 0-.418.06-.637.29-.219.23-.837.818-.837 1.995 0 1.178.857 2.316.975 2.478.118.162 1.686 2.574 4.084 3.607.57.246 1.016.393 1.363.503.573.182 1.094.156 1.506.095.459-.069 1.58-.646 1.802-1.238.223-.593.223-1.102.156-1.238-.067-.134-.244-.214-.511-.348z" />
                </svg>
                {t("nav.whatsapp.join")}
              </a>

              <button 
                type="button" 
                onClick={handleCloseSuccessModal}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl transition duration-200 shadow-md text-sm cursor-pointer"
              >
                {t("nav.whatsapp.later")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
