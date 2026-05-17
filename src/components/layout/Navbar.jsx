import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Icons } from "../Icons";
import UserAvatar, { getInitials } from "../UserAvatar";
import { ProfileCardContent, EditProfileModal } from "../ProfileModals";

export const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: Icons.Home },
  { key: 'activities', label: 'Activities', icon: Icons.Sparkles },
  { key: 'committee', label: 'Committee', icon: Icons.Team },
  { key: 'about', label: 'About Us', icon: Icons.Info },
  { key: 'contact', label: 'Contact', icon: Icons.Mail },
];

const Navbar = ({ onOpenLogin, activeTab, onTabChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [showDesktopProfile, setShowDesktopProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showAdminWarning, setShowAdminWarning] = useState(false);

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
        const { data: profileData } = await supabase.from('registrations').select('*').eq('id', user.id).maybeSingle();
        let userDataToSave = profileData;
        if (!profileData) {
          const newProfile = { id: user.id, full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "Volunteer", email: user.email, photo_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null };
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
    }).catch(() => {});
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') { localStorage.removeItem('nss_user'); localStorage.removeItem('nss_admin_mode'); setCurrentUser(null); return; }
      if (localStorage.getItem('nss_admin_mode') === 'true') return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') { if (session) syncSessionData(session); }
    });
    return () => { window.removeEventListener('nss_user_logged_in', checkSession); subscription?.unsubscribe(); };
  }, []);

  useEffect(() => {
    const isAnyModalOpen = isMobileMenuOpen || showMobileProfile || isEditingProfile || showDesktopProfile || showAdminWarning;
    const navbar = document.getElementById('fixed-navbar');
    if (isAnyModalOpen) { 
      const sw = window.innerWidth - document.documentElement.clientWidth; 
      document.body.style.paddingRight = `${sw}px`; 
      document.body.style.overflow = 'hidden'; 
      if (navbar) navbar.style.paddingRight = `${sw}px`;
    }
    else { 
      document.body.style.paddingRight = '0px'; 
      document.body.style.overflow = 'unset'; 
      if (navbar) navbar.style.paddingRight = '0px';
    }
    return () => { 
      document.body.style.paddingRight = '0px'; 
      document.body.style.overflow = 'unset'; 
      if (navbar) navbar.style.paddingRight = '0px';
    };
  }, [isMobileMenuOpen, showMobileProfile, isEditingProfile, showDesktopProfile, showAdminWarning]);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeAllMenus = () => { setIsMobileMenuOpen(false); setShowMobileProfile(false); setShowDesktopProfile(false); };
  
  const handleNavClick = (key) => {
    onTabChange(key);
    closeAllMenus();
  };

  const handleLogout = async () => { await supabase.auth.signOut(); localStorage.removeItem('nss_user'); setCurrentUser(null); closeAllMenus(); window.dispatchEvent(new Event('nss_user_logged_out')); };
  const openEditModal = () => { closeAllMenus(); setIsEditingProfile(true); };

  let adminPressTimer;
  const handlePressStart = () => { adminPressTimer = setTimeout(() => { setShowAdminWarning(true); }, 6000); };
  const handlePressEnd = () => { clearTimeout(adminPressTimer); };
  const confirmAdminAccess = () => { setShowAdminWarning(false); sessionStorage.removeItem('allow_public'); if (localStorage.getItem('nss_admin_mode')) { window.location.href = '/admin'; } else { window.location.href = '/admin-login'; } };

  return (
    <>
      <div id="fixed-navbar" className="fixed top-0 left-0 right-0 z-50 pt-3 md:pt-4 px-3 md:px-4 pointer-events-none box-border">
        <nav className="pointer-events-auto max-w-5xl mx-auto bg-white/92 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-white/90 rounded-full transition-all duration-300 overflow-hidden">
          <div className="px-4 md:px-6">
            <div className="flex justify-between items-center h-14 md:h-18 gap-2 w-full">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 cursor-pointer select-none"
                onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd} onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}>
                <div className="flex items-center justify-center shrink-0">
                  <img src="/nss-logo.png" alt="NSS Logo" className="w-9 h-9 md:w-12 md:h-12 object-contain shrink-0" />
                </div>
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <h1 className="text-xs md:text-base font-black text-slate-900 leading-tight truncate tracking-tight">NSS UNIT</h1>
                  <p className="text-[8px] md:text-[10px] font-bold text-blue-600 truncate uppercase tracking-wider md:tracking-widest">B.B. College</p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-1 lg:gap-2 font-semibold text-slate-600 shrink-0">
                {NAV_ITEMS.map((item) => (
                  <button key={item.key} onClick={() => handleNavClick(item.key)}
                    className={`relative px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 capitalize cursor-pointer ${activeTab === item.key ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-blue-50 hover:text-blue-700'}`}>
                    {item.label}
                  </button>
                ))}
                {currentUser ? (
                  <div className="relative ml-3 pl-3 border-l border-slate-200">
                    <div className="hover:scale-105 transition transform cursor-pointer"><UserAvatar user={currentUser} onClick={() => setShowDesktopProfile(!showDesktopProfile)} /></div>
                  </div>
                ) : (
                  <button onClick={onOpenLogin} className="bg-slate-900 text-white px-6 py-2.5 rounded-full hover:bg-blue-700 hover:shadow-lg transition-all duration-300 font-bold text-sm ml-2 focus:outline-none cursor-pointer">LOGIN</button>
                )}
              </div>

              <div className="md:hidden flex items-center shrink-0 ml-2">
                {currentUser ? (<UserAvatar user={currentUser} onClick={toggleMenu} />) : (
                  <button onClick={toggleMenu} className="text-slate-800 hover:bg-blue-50 focus:outline-none p-2 shrink-0 bg-white/50 rounded-full border border-slate-200/60 shadow-sm cursor-pointer transition-colors backdrop-blur-sm">
                    {isMobileMenuOpen ? (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>) : (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>)}
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile backdrop */}
      <div className={`fixed inset-0 bg-slate-900/70 z-[60] md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={closeAllMenus}></div>

      {/* Mobile menu */}
      <div className={`fixed top-0 right-0 w-[280px] h-fit max-h-[100dvh] z-[70] md:hidden flex flex-col transform transition-all duration-300 rounded-bl-3xl overflow-hidden will-change-transform ${isMobileMenuOpen ? 'opacity-100 translate-x-0 visible' : 'opacity-0 translate-x-full invisible'}`}
        style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(32px) saturate(180%)', WebkitBackdropFilter: 'blur(32px) saturate(180%)', border: '1px solid rgba(255,255,255,0.12)' }}>
        {currentUser ? (
          <button onClick={(e) => { e.preventDefault(); closeAllMenus(); setShowMobileProfile(true); }} className="w-full bg-white/5 hover:bg-white/10 transition-colors p-6 flex flex-col items-center text-center shrink-0 relative group focus:outline-none border-b border-white/10 cursor-pointer">
            <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); closeAllMenus(); }} className="absolute top-4 right-4 text-white bg-white/15 hover:bg-white/25 rounded-full p-2 transition-colors cursor-pointer"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></span>
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500/30 shadow-xl mb-4 shrink-0 p-1 bg-white/5">
              <div className="w-full h-full rounded-full overflow-hidden">
                {currentUser.photo_url ? <img src={currentUser.photo_url} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-blue-600 text-white font-bold text-2xl flex items-center justify-center tracking-widest">{getInitials(currentUser.full_name)}</div>}
              </div>
            </div>
            <p className="font-extrabold text-white text-lg leading-tight truncate w-full">{currentUser.full_name}</p>
            <p className="text-[10px] text-blue-400 mt-2 font-black flex items-center justify-center gap-1.5 bg-blue-500/10 py-1.5 px-4 rounded-full border border-blue-500/20 uppercase tracking-widest">View Profile <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></p>
          </button>
        ) : (
          <div className="px-5 pt-5 pb-3 flex justify-between items-center">
            <span className="font-bold text-white/90 text-xs uppercase tracking-[0.2em]">Menu</span>
            <button onClick={closeAllMenus} className="text-white bg-white/15 hover:bg-white/25 rounded-full p-2.5 transition-colors cursor-pointer"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        )}

        <div className="overflow-y-auto py-5 px-5 space-y-2.5 shrink [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {NAV_ITEMS.map((item) => {
            const IconComp = item.icon;
            return (
              <button key={item.key} onClick={() => handleNavClick(item.key)}
                className={`flex items-center gap-3 w-full px-5 py-3.5 rounded-full font-bold text-sm transition-colors duration-200 border cursor-pointer ${activeTab === item.key ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25' : 'bg-white/10 text-white border-white/20 hover:bg-white hover:text-slate-900 active:scale-[0.97]'}`}>
                <IconComp className={`w-5 h-5 shrink-0 ${activeTab === item.key ? 'text-white' : ''}`} /> {item.label}
              </button>
            );
          })}
          {!currentUser && (
            <div className="pt-3 mt-2 border-t border-white/10">
              <button onClick={() => { closeAllMenus(); onOpenLogin(); }} className="flex items-center justify-center gap-2 bg-white text-slate-900 py-3 rounded-full font-bold text-sm w-full transition-colors duration-200 cursor-pointer active:scale-[0.97] hover:bg-blue-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg> Login / Join
              </button>
            </div>
          )}
        </div>
        {currentUser && (
          <div className="p-5 shrink-0 bg-transparent border-t border-white/10">
            <button onClick={handleLogout} className="w-full py-3 bg-red-500/10 hover:bg-red-500/25 text-red-300 font-bold text-sm rounded-full transition-colors duration-200 flex items-center justify-center gap-2 border border-red-500/20 shadow-sm cursor-pointer active:scale-[0.97]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg> Logout
            </button>
          </div>
        )}
      </div>

      {/* Mobile Profile Modal */}
      {showMobileProfile && currentUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:hidden">
          <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={closeAllMenus}></div>
          <div className="relative z-10 w-full max-w-sm bg-gradient-to-br from-sky-50 to-blue-50 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[88dvh] md:max-h-[90vh] animate-fade-in-up border border-blue-100">
            <ProfileCardContent user={currentUser} onClose={closeAllMenus} onEditClick={openEditModal} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Desktop Profile Modal */}
      {showDesktopProfile && currentUser && (
        <div className="fixed inset-0 z-[100] hidden md:flex justify-center pointer-events-none">
          <div className="absolute inset-0 pointer-events-auto" onClick={() => setShowDesktopProfile(false)}></div>
          <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="absolute right-4 sm:right-6 lg:right-8 top-[72px] w-[380px] bg-gradient-to-br from-sky-50 to-blue-50 shadow-2xl rounded-3xl overflow-hidden flex flex-col overscroll-contain animate-fade-in-up pointer-events-auto border border-blue-100">
              <ProfileCardContent user={currentUser} onClose={() => setShowDesktopProfile(false)} onEditClick={openEditModal} onLogout={handleLogout} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && currentUser && (
        <EditProfileModal currentUser={currentUser} onClose={() => setIsEditingProfile(false)} setCurrentUser={setCurrentUser} />
      )}

      {/* Admin Confirmation Modal */}
      {showAdminWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setShowAdminWarning(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 md:p-8 text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
              <svg className="w-8 h-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="font-extrabold text-xl text-slate-900 mb-2">Admin Access</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Are you sure you want to leave the public site and proceed to the Admin Panel?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowAdminWarning(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition text-sm shadow-sm cursor-pointer">Cancel</button>
              <button onClick={confirmAdminAccess} className="flex-1 py-3 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 transition text-sm shadow-md cursor-pointer">Proceed</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
