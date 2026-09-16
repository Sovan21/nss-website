import React, { useState, useEffect, useRef, useMemo } from "react";
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
  { key: 'gallery', label: 'Gallery', icon: Icons.Photo },
  { key: 'notices', label: 'Notices', icon: Icons.Document },
  { key: 'contact', label: 'Contact', icon: Icons.Mail },
  { key: 'about', label: 'About Us', icon: Icons.Info },
];

const formatSearchDate = (dateStr) => {
  if (!dateStr) return "";
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [_, year, month, day] = match;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = parseInt(month, 10) - 1;
    const mName = months[mIdx] || month;
    return `${day} ${mName} ${year}`;
  }
  return dateStr;
};

const HighlightMatch = ({ text, query }) => {
  if (!text) return null;
  if (!query || query.trim().length < 4) return <span>{text}</span>;
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = String(text).split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-300 text-slate-950 font-black px-1 py-0.5 rounded shadow-xs not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const getTypeBadge = (type) => {
  switch (type) {
    case 'notice':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
          <Icons.Document className="w-2.5 h-2.5" /> Notice
        </span>
      );
    case 'event':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
          <Icons.Sparkles className="w-2.5 h-2.5" /> Event
        </span>
      );
    case 'leadership':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
          <Icons.Team className="w-2.5 h-2.5" /> Team
        </span>
      );
    case 'gallery':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
          <Icons.Photo className="w-2.5 h-2.5" /> Photos
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
          <Icons.Home className="w-2.5 h-2.5" /> Page
        </span>
      );
  }
};

const Navbar = ({ onOpenLogin, activeTab, onTabChange, searchData, isFooterVisible: propFooterVisible }) => {
  const { t, locale, setLocale } = useLanguage();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [showDesktopProfile, setShowDesktopProfile] = useState(false);
  const [showAdminWarning, setShowAdminWarning] = useState(false);
  const [showEmailConfirmedModal, setShowEmailConfirmedModal] = useState(false);
  const [fontSize, setFontSize] = useState('normal'); // 'sm' | 'normal' | 'lg'
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileLangOpen, setIsMobileLangOpen] = useState(false);
  const [showScreenReaderModal, setShowScreenReaderModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const langDropdownRef = useRef(null);
  const mobileLangDropdownRef = useRef(null);
  const searchContainerRef = useRef(null);
  const hamburgerRef = useRef(null);
  const [closeBtnPos, setCloseBtnPos] = useState(null);

  // Listen for fullscreen photo lightbox state
  useEffect(() => {
    const handleLightboxState = (e) => {
      setIsLightboxOpen(Boolean(e.detail));
    };
    window.addEventListener('nss_lightbox_state', handleLightboxState);
    return () => window.removeEventListener('nss_lightbox_state', handleLightboxState);
  }, []);

  // Automatically sync footer visibility with requestAnimationFrame to prevent layout thrashing
  useEffect(() => {
    let rafId;
    const handleFooterDock = () => {
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

    window.addEventListener('scroll', handleFooterDock, { passive: true });
    window.addEventListener('resize', handleFooterDock, { passive: true });
    handleFooterDock();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleFooterDock);
      window.removeEventListener('resize', handleFooterDock);
    };
  }, [activeTab]);

  // Build universal searchable index across all site content in memory
  const searchIndex = useMemo(() => {
    const items = [];
    const events = searchData?.events || [];
    const committee = searchData?.committee || [];
    const notices = searchData?.notices || [];
    const gallery = searchData?.gallery || [];

    // 1. Pages & Core Sections
    NAV_ITEMS.forEach(item => {
      items.push({
        id: `page-${item.key}`,
        type: 'page',
        title: t(`nav.${item.key}`) || item.label,
        subtitle: `Jump to ${item.label} section`,
        tab: item.key,
        searchStr: `${item.key} ${item.label} ${t(`nav.${item.key}`)} home activities committee gallery notices contact about আমাদের কার্যক্রম বিজ্ঞপ্তি গ্যালারি কমিটি যোগাযোগ`.toLowerCase()
      });
    });

    // 2. Events & Activities
    events.forEach(evt => {
      const d = evt.start_date ? evt.start_date.split('T')[0] : '';
      const formattedDate = d ? formatSearchDate(d) : '';
      items.push({
        id: `evt-${evt.id}`,
        type: 'event',
        title: evt.title || 'NSS Event',
        subtitle: `${formattedDate ? formattedDate : 'Activity'}${evt.location ? ' • ' + evt.location : ''}`,
        tab: 'activities',
        actionId: evt.id,
        date: d,
        searchStr: `${evt.title || ''} ${evt.description || ''} ${evt.location || ''} ${d} ${formattedDate} event activity কার্যক্রম অনুষ্ঠান`.toLowerCase()
      });
    });

    // 3. Notices & Circulars
    notices.forEach(not => {
      const d = not.date ? not.date.split('T')[0] : '';
      const formattedDate = d ? formatSearchDate(d) : '';
      const ref = not.ref_no || not.refNo || `BBC/NSS/2026/NOT-${not.id}`;
      items.push({
        id: `not-${not.id}`,
        type: 'notice',
        title: not.title || 'Official Notice',
        subtitle: `${ref}${formattedDate ? ' • ' + formattedDate : ''}`,
        tab: 'notices',
        actionId: not.id,
        date: d,
        searchStr: `${not.title || ''} ${ref} ${not.summary || ''} ${not.body || ''} ${not.category || ''} ${d} ${formattedDate} notice circular বিজ্ঞপ্তি সার্কুলার`.toLowerCase()
      });
    });

    // 4. Leadership, Teachers & Committee Members
    committee.forEach(mem => {
      let role = mem.designation || '';
      let category = 'Student';
      if (role.includes('::')) {
        const firstColon = role.indexOf('::');
        category = role.substring(0, firstColon);
        const rest = role.substring(firstColon + 2);
        if (rest.startsWith('{')) {
          try {
            const parsed = JSON.parse(rest);
            role = parsed.designation || category;
          } catch (e) {
            role = rest || category;
          }
        } else {
          role = rest || category;
        }
      } else if (role.toLowerCase().includes('teacher') || role.toLowerCase().includes('officer') || role.toLowerCase().includes('principal') || role.toLowerCase().includes('programme')) {
        category = 'Teacher';
      }

      const isTeacher = category === 'Teacher' || !mem.designation || mem.designation.startsWith('Teacher::');
      const targetTab = isTeacher ? 'home' : 'committee';

      items.push({
        id: `com-${mem.id}`,
        type: 'leadership',
        title: mem.name || 'Member',
        subtitle: `${role || 'NSS Member'}${category && category !== 'Student' && category !== 'Teacher' ? ' • ' + category + ' Committee' : ''}${mem.department ? ' • ' + mem.department : ''}${mem.unit ? ' • ' + mem.unit : ''}`,
        tab: targetTab,
        actionId: mem.id,
        category: category,
        searchStr: `${mem.name || ''} ${role} ${category} ${mem.department || ''} ${mem.unit || ''} ${mem.phone || ''} ${mem.email || ''} leadership teacher committee coordinator volunteer নেতৃত্ব শিক্ষক সদস্য environment cultural student`.toLowerCase()
      });
    });

    // 5. Gallery Photo Dates
    const uniqueDates = new Set();
    gallery.forEach(g => {
      if (g.date) uniqueDates.add(g.date.split('T')[0]);
    });
    events.forEach(e => {
      if (e.start_date) uniqueDates.add(e.start_date.split('T')[0]);
    });
    uniqueDates.forEach(d => {
      const formattedDate = formatSearchDate(d);
      items.push({
        id: `gal-${d}`,
        type: 'gallery',
        title: `Photos of ${formattedDate || d}`,
        subtitle: `Photo Gallery Album • ${formattedDate || d}`,
        tab: 'gallery',
        date: d,
        searchStr: `gallery photo photos album ছবি গ্যালারি ${d} ${formattedDate}`.toLowerCase()
      });
    });

    return items;
  }, [searchData, t]);

  // STRICT REQUIREMENT: Only show suggestions when query has at least 4 characters
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 4) return [];

    const tokens = q.split(/\s+/).filter(Boolean);
    return searchIndex.filter(item => {
      return tokens.every(token => item.searchStr.includes(token));
    }).slice(0, 8);
  }, [searchQuery, searchIndex]);

  const handleSelectItem = (item) => {
    if (!item) return;
    setIsSearchFocused(false);
    setSearchQuery('');
    setSelectedIndex(-1);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);

    if (onTabChange) {
      onTabChange(item.tab);
    } else {
      router.push(`/#${item.tab}`);
    }

    setTimeout(() => {
      if (item.type === 'notice') {
        window.dispatchEvent(new CustomEvent('nss_open_notice', { detail: item.actionId }));
      } else if (item.type === 'event') {
        window.dispatchEvent(new CustomEvent('nss_open_event', { detail: item.actionId }));
        window.dispatchEvent(new CustomEvent('nss_search', { detail: item.title }));
      } else if (item.type === 'gallery') {
        window.dispatchEvent(new CustomEvent('nss_search_gallery', { detail: item.date }));
      } else if (item.type === 'leadership') {
        if (item.tab === 'committee') {
          window.dispatchEvent(new CustomEvent('nss_open_committee_member', { 
            detail: { id: item.actionId, name: item.title, category: item.category } 
          }));
        } else if (item.tab === 'home') {
          window.dispatchEvent(new CustomEvent('nss_open_teacher_member', { 
            detail: { id: item.actionId, name: item.title } 
          }));
        }
      }
    }, 150);
  };

  const handleKeyDown = (e) => {
    if (searchQuery.trim().length < 4) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        e.preventDefault();
        handleSelectItem(searchResults[selectedIndex]);
      } else if (searchResults.length > 0) {
        e.preventDefault();
        handleSelectItem(searchResults[0]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };

  useEffect(() => {
    // Restore font size scale
    const savedScale = localStorage.getItem('nss_font_scale');
    if (savedScale) {
      setFontSize(savedScale);
      if (savedScale === 'sm') document.documentElement.style.fontSize = '90%';
      else if (savedScale === 'lg') document.documentElement.style.fontSize = '112%';
      else document.documentElement.style.fontSize = '100%';
    }

    const handleClickOutside = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setIsLangDropdownOpen(false);
      }
      if (mobileLangDropdownRef.current && !mobileLangDropdownRef.current.contains(e.target)) {
        setIsMobileLangOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const applyFontSize = (size) => {
    setFontSize(size);
    localStorage.setItem('nss_font_scale', size);
    if (size === 'sm') {
      document.documentElement.style.fontSize = '90%';
    } else if (size === 'lg') {
      document.documentElement.style.fontSize = '112%';
    } else {
      document.documentElement.style.fontSize = '100%';
    }
  };

  const handleSkipToContent = (e) => {
    if (e) e.preventDefault();
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.scrollIntoView({ behavior: 'smooth' });
      mainEl.focus();
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    if (searchResults.length > 0) {
      handleSelectItem(searchResults[0]);
      return;
    }

    // Do NOT navigate away to other tabs! Keep user on current tab and display search popover
    setIsSearchFocused(true);
  };

  const handleTestSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const textToSpeak = "National Service Scheme, Banwarilal Bhalotia College, Asansol. Motto: Not Me But You. Selfless service for a better tomorrow. Affiliated to Kazi Nazrul University, NAAC Accredited.";
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

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
            await uploadConfirmedUserPhoto(user, user.email, profileData.full_name);
            profileData.photo_url = user.user_metadata.photo_url;
          }
        }
        if (!profileData) {
          const m = user.user_metadata || {};
          const fullName = m.full_name || user.email?.split('@')[0] || "Volunteer";
          await uploadConfirmedUserPhoto(user, user.email, fullName);
          
          userDataToSave = {
            id: user.id,
            full_name: fullName,
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

  useScrollLock(showAdminWarning || showEmailConfirmedModal || showScreenReaderModal || isMobileMenuOpen || showMobileProfile);

  const toggleMenu = () => {
    if (!isMobileMenuOpen && hamburgerRef.current) {
      const rect = hamburgerRef.current.getBoundingClientRect();
      setCloseBtnPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  const closeAllMenus = () => { 
    setIsMobileMenuOpen(false); 
    setShowMobileProfile(false); 
    setShowDesktopProfile(false); 
  };

  const handleNavClick = (key) => {
    if (onTabChange) {
      if (activeTab === key) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        onTabChange(key);
      }
    } else {
      router.push(`/#${key}`);
    }
    closeAllMenus();
  };

  const handleLogout = async () => { 
    await supabase.auth.signOut(); 
    localStorage.removeItem('nss_user'); 
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('nss_')) sessionStorage.removeItem(key);
    });
    setCurrentUser(null); 
    closeAllMenus(); 
    window.dispatchEvent(new Event('nss_user_logged_out')); 
  };

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

  const adminPressTimerRef = useRef(null);
  const isLongPressTriggeredRef = useRef(false);
  const [isAdminRedirecting, setIsAdminRedirecting] = useState(false);

  // Prefetch admin routes so Next.js bundles are ready in memory
  useEffect(() => {
    try {
      router.prefetch('/admin');
      router.prefetch('/admin-login');
    } catch (e) {}
  }, [router]);

  const handlePressStart = () => {
    isLongPressTriggeredRef.current = false;
    try {
      router.prefetch('/admin');
      router.prefetch('/admin-login');
    } catch (e) {}
    if (adminPressTimerRef.current) {
      clearTimeout(adminPressTimerRef.current);
    }
    adminPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setIsAdminRedirecting(false);
      setShowAdminWarning(true);
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(80);
      }
    }, 6000);
  };

  const handlePressEnd = () => {
    if (adminPressTimerRef.current) {
      clearTimeout(adminPressTimerRef.current);
      adminPressTimerRef.current = null;
    }
  };

  const handleLogoClick = (e) => {
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }
    handleNavClick('home');
  };

  const confirmAdminAccess = () => {
    setIsAdminRedirecting(true);
    sessionStorage.removeItem('allow_public');
    const target = localStorage.getItem('nss_admin_mode') ? '/admin' : '/admin-login';
    router.push(target);
  };

  return (
    <>
      {/* ================= DESKTOP OFFICIAL PORTAL HEADER (lg and above) ================= */}
      {/* Tier 1: Government of India & Ministry Bar (scrolls naturally out of view) */}
      <div className="hidden lg:flex w-full bg-[#081b40] text-slate-200 text-[11px] font-medium py-1.5 px-6 xl:px-12 justify-between items-center border-b border-white/10 select-none relative z-[60]">
        <div className="flex items-center gap-2.5">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
            alt="Govt of India"
            className="w-3.5 h-4.5 object-contain shrink-0"
            style={{ filter: 'invert(85%) sepia(42%) saturate(4032%) hue-rotate(351deg) brightness(101%) contrast(106%)' }}
          />
          <span className="font-bold text-white tracking-wide">Government of India</span>
          <span className="text-white/30 font-normal">|</span>
          <span className="text-slate-300 font-medium">Ministry of Youth Affairs & Sports</span>
        </div>

        <div className="flex items-center gap-4 text-slate-300 text-[11px]">
          <button 
            onClick={handleSkipToContent} 
            className="hover:text-white transition-colors cursor-pointer focus:outline-none focus:text-amber-300 underline-offset-2 hover:underline"
          >
            Skip to main content
          </button>
          <span className="text-white/20">|</span>
          <button 
            onClick={() => setShowScreenReaderModal(true)} 
            className="hover:text-white cursor-pointer transition-colors focus:outline-none focus:text-amber-300"
          >
            Screen Reader Access
          </button>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1 font-bold" aria-label="Font Size Adjuster">
            <button 
              onClick={() => applyFontSize('sm')} 
              className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-all ${fontSize === 'sm' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:bg-white/10 hover:text-amber-300'}`}
              title="Decrease Font Size"
              aria-label="Decrease Font Size"
            >
              A-
            </button>
            <button 
              onClick={() => applyFontSize('normal')} 
              className={`px-1.5 py-0.5 rounded text-[11px] cursor-pointer transition-all ${fontSize === 'normal' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:bg-white/10 hover:text-amber-300'}`}
              title="Normal Font Size"
              aria-label="Normal Font Size"
            >
              A
            </button>
            <button 
              onClick={() => applyFontSize('lg')} 
              className={`px-1.5 py-0.5 rounded text-[12px] cursor-pointer transition-all ${fontSize === 'lg' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:bg-white/10 hover:text-amber-300'}`}
              title="Increase Font Size"
              aria-label="Increase Font Size"
            >
              A+
            </button>
          </div>
          <span className="text-white/20">|</span>
          
          {/* Language Selector */}
          <div className="relative" ref={langDropdownRef}>
            <button 
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)} 
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer text-[11px] border border-white/10 shadow-xs focus:outline-none"
              aria-expanded={isLangDropdownOpen}
              aria-label="Change Language"
            >
              <span>{locale === 'bn' ? 'বাংলা' : locale === 'hi' ? 'हिंदी' : 'English'}</span>
              <Icons.ChevronDown className={`w-3 h-3 text-white/70 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLangDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 flex flex-col bg-[#0B2559] border border-white/20 rounded-lg shadow-2xl py-1 z-[100] min-w-[120px] overflow-hidden animate-fade-in-up">
                <button 
                  onClick={() => { setLocale('en'); setIsLangDropdownOpen(false); }} 
                  className={`px-3.5 py-2 text-left text-[11px] font-semibold cursor-pointer transition-colors flex items-center justify-between ${locale === 'en' ? 'bg-[#1D6FE0] text-white font-bold' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}
                >
                  <span>English</span>
                  {locale === 'en' && <span className="text-amber-400 font-bold">✓</span>}
                </button>
                <button 
                  onClick={() => { setLocale('bn'); setIsLangDropdownOpen(false); }} 
                  className={`px-3.5 py-2 text-left text-[11px] font-semibold cursor-pointer transition-colors flex items-center justify-between ${locale === 'bn' ? 'bg-[#1D6FE0] text-white font-bold' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}
                >
                  <span>বাংলা</span>
                  {locale === 'bn' && <span className="text-amber-400 font-bold">✓</span>}
                </button>
                <button 
                  onClick={() => { setLocale('hi'); setIsLangDropdownOpen(false); }} 
                  className={`px-3.5 py-2 text-left text-[11px] font-semibold cursor-pointer transition-colors flex items-center justify-between ${locale === 'hi' ? 'bg-[#1D6FE0] text-white font-bold' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}
                >
                  <span>हिंदी</span>
                  {locale === 'hi' && <span className="text-amber-400 font-bold">✓</span>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Sticky Header: Tier 2 (Logo & Institutional header) + Tier 3 (Blue Navigation ribbon) */}
      <header className="hidden lg:flex flex-col sticky top-0 z-50 w-full bg-white shadow-md border-b border-slate-200/80">
        {/* Tier 2: Institutional White Header (Logos/Title, Centered Motto, Right Directorate Info) */}
        <div className="w-full bg-white py-3 px-6 xl:px-12 flex justify-between items-center border-b border-slate-100">
          
          {/* Left: NSS & College Logos + Institution Typography */}
          <div 
            className="flex items-center gap-3.5 cursor-pointer group select-none shrink-0"
            onClick={handleLogoClick}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onTouchCancel={handlePressEnd}
            onContextMenu={(e) => e.preventDefault()}
            style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
          >
            {/* Unified Logo Grouping */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-50/80 rounded-xl border border-slate-200/70 shadow-xs shrink-0 group-hover:border-blue-300 transition-colors">
              <img src="/nss-logo.png" alt="NSS Logo" className="w-10 h-10 xl:w-11 xl:h-11 object-contain select-none" />
              <div className="w-[1px] h-6 bg-slate-200"></div>
              <img src="/BBCollege Logo.jpeg" alt="B.B. College Logo" className="w-9 h-9 xl:w-10 xl:h-10 object-contain rounded-full select-none" />
            </div>

            {/* Institution Typography */}
            <div className="flex flex-col">
              <h1 
                className="text-lg xl:text-xl font-black italic text-[#003366] tracking-[0.04em] uppercase leading-tight font-fraunces-black"
              >
                NATIONAL SERVICE SCHEME
              </h1>
              <h2 className="text-xs xl:text-sm font-black italic text-slate-800 tracking-[0.03em] uppercase leading-tight mt-0.5 font-fraunces-black">
                BANWARILAL BHALOTIA COLLEGE, ASANSOL
              </h2>
              <p className="text-[10.5px] text-slate-600 font-bold italic tracking-[0.02em] leading-tight mt-0.5 font-fraunces-black flex items-center gap-1.5">
                <span>Affiliated to Kazi Nazrul University</span>
                <span className="text-slate-300">|</span>
                <span className="text-blue-700">NAAC Accredited</span>
              </p>
            </div>
          </div>

          {/* Center: NSS Motto & Tagline */}
          <div className="hidden xl:flex flex-col items-center text-center select-none px-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
              <span className="text-lg xl:text-[20px] font-serif italic font-extrabold text-[#003366] tracking-wide">
                &ldquo;Not Me But You&rdquo;
              </span>
              <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-slate-400 to-transparent"></div>
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              Selfless Service for a Better Tomorrow
            </p>
          </div>

          {/* Right: Directorate of NSS & Ministry of Youth Affairs (with Ashoka Emblem) */}
          <div className="hidden lg:flex items-center gap-3.5 text-right select-none pl-4 shrink-0">
            <div className="flex flex-col items-end leading-tight">
              <h3 className="text-[#003366] font-black text-xs xl:text-[12.5px] tracking-wide uppercase font-outfit">
                NATIONAL SERVICE SCHEME
              </h3>
              <p className="text-slate-800 font-bold text-[10.5px] xl:text-[11.5px] mt-0.5">
                Regional Directorate of NSS, Kolkata, West Bengal
              </p>
              <p className="text-slate-500 font-medium text-[9.5px] xl:text-[10px] mt-0.5">
                Ministry of Youth Affairs & Sports, Govt. of India
              </p>
            </div>
            {/* Ashoka Emblem */}
            <div className="w-8.5 h-11 shrink-0 flex items-center justify-center p-1 bg-amber-50/50 rounded-lg border border-amber-200/50">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                alt="Emblem of India"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

        </div>

        {/* Tier 3: Deep Royal Blue Navigation Ribbon */}
        <nav className="w-full bg-[#004899] text-white px-6 xl:px-12 flex justify-between items-stretch shadow-inner font-poppins h-12">
          <div className="flex items-stretch gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`px-3.5 xl:px-4.5 font-poppins text-[13px] xl:text-[14px] font-bold transition-colors duration-150 cursor-pointer flex items-center justify-center relative whitespace-nowrap shrink-0 ${
                    isActive 
                      ? 'bg-[#002f66] text-white shadow-inner after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-amber-400' 
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{t(`nav.${item.key}`)}</span>
                </button>
              );
            })}
          </div>

          {/* Right Side: Search & Login/Profile */}
          <div className="flex items-center gap-3 py-1.5">
            <div ref={searchContainerRef} className="relative flex items-center">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                    setSelectedIndex(-1);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search activities, circulars, team..."
                  className="bg-white/95 focus:bg-white text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-3.5 pr-12 py-2 w-48 xl:w-60 outline-none border border-transparent focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner"
                />
                
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedIndex(-1);
                    }}
                    className="absolute right-7 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition-colors text-xs font-bold"
                    aria-label="Clear Search"
                  >
                    ✕
                  </button>
                )}

                <button 
                  type="submit" 
                  className="absolute right-2.5 text-slate-400 hover:text-blue-700 cursor-pointer transition-colors" 
                  aria-label="Search"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>

              {/* Suggestions Popover (Strictly shown ONLY when query length >= 4) */}
              {isSearchFocused && searchQuery.trim().length >= 4 && (
                <div className="absolute right-0 top-full mt-2 w-80 xl:w-96 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-[100] animate-fade-in-up text-slate-800">
                  {/* Header info */}
                  <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-3.5 py-2 flex items-center justify-between text-white border-b border-blue-950">
                    <span className="text-[11px] font-bold tracking-wide flex items-center gap-1.5">
                      <Icons.Sparkles className="w-3 h-3 text-amber-300" />
                      Search Suggestions
                    </span>
                    <span className="text-[10px] text-blue-200 font-medium">
                      {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}
                    </span>
                  </div>

                  {/* Results list */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.length > 0 ? (
                      searchResults.map((item, idx) => {
                        const isSelected = idx === selectedIndex;
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`px-3.5 py-2.5 flex items-start gap-2.5 cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-50/90 text-blue-950' : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {getTypeBadge(item.type)}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-xs font-bold text-slate-900 leading-snug truncate">
                                <HighlightMatch text={item.title} query={searchQuery} />
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                <HighlightMatch text={item.subtitle} query={searchQuery} />
                              </p>
                            </div>
                            <svg className="w-3.5 h-3.5 text-slate-400 self-center shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                          <Icons.Sparkles className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">No results found for &ldquo;{searchQuery}&rdquo;</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Try searching leadership name, event date, circular ref, or photo date</p>
                      </div>
                    )}
                  </div>

                  {/* Dropdown Footer hints */}
                  <div className="bg-slate-50 px-3.5 py-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Press <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[9px] text-slate-600">↵ Enter</kbd> to open</span>
                    <span><kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono text-[9px] text-slate-600">Esc</kbd> to close</span>
                  </div>
                </div>
              )}
            </div>

            {currentUser ? (
              <div className="relative pl-2 border-l border-white/20">
                <UserAvatar user={currentUser} onClick={() => setShowDesktopProfile(!showDesktopProfile)} />
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-lg font-outfit font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer ml-1 active:scale-95 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                <span>{t("nav.login")}</span>
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* ================= MOBILE HEADER (lg:hidden) ================= */}
      {/* Tier 1: Government of India & Ministry Bar (Section A - scrolls naturally out of view) */}
      <div className="lg:hidden w-full bg-[#0B2559] text-white text-[11px] py-1.5 px-3 flex justify-between items-center select-none relative z-[60]">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
            alt="Govt of India"
            className="w-4 h-5 object-contain shrink-0"
            style={{ filter: 'invert(85%) sepia(42%) saturate(4032%) hue-rotate(351deg) brightness(101%) contrast(106%)' }}
          />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-semibold text-white text-[11px] truncate">Government of India</span>
            <span className="text-white/80 text-[9.5px] truncate">Ministry of Youth Affairs & Sports</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-white text-[10px]">
          <span className="text-white/30">|</span>
          {/* Language Selector */}
          <div className="relative" ref={mobileLangDropdownRef}>
            <button 
              onClick={() => setIsMobileLangOpen(!isMobileLangOpen)} 
              className="flex items-center gap-0.5 bg-white/15 hover:bg-white/25 text-white px-2 py-0.5 rounded font-bold transition-colors cursor-pointer text-[10px]"
              aria-expanded={isMobileLangOpen}
              aria-label="Change Language"
            >
              <span>{locale === 'bn' ? 'বাংলা' : locale === 'hi' ? 'हिंदी' : 'English'}</span>
              <Icons.ChevronDown className={`w-2.5 h-2.5 transition-transform ${isMobileLangOpen ? 'rotate-180' : ''}`} />
            </button>
            {isMobileLangOpen && (
              <div className="absolute right-0 top-full mt-1 flex flex-col bg-[#0B2559] border border-white/20 rounded shadow-xl py-1 z-[100] min-w-[90px] animate-fade-in-up">
                <button 
                  onClick={() => { setLocale('en'); setIsMobileLangOpen(false); }} 
                  className={`px-2.5 py-1 text-left text-[10px] cursor-pointer flex items-center justify-between ${locale === 'en' ? 'bg-[#1D6FE0] text-white font-bold' : 'text-white/90 hover:bg-white/10'}`}
                >
                  <span>English</span>
                  {locale === 'en' && <span className="text-amber-400 font-bold">✓</span>}
                </button>
                <button 
                  onClick={() => { setLocale('bn'); setIsMobileLangOpen(false); }} 
                  className={`px-2.5 py-1 text-left text-[10px] cursor-pointer flex items-center justify-between ${locale === 'bn' ? 'bg-[#1D6FE0] text-white font-bold' : 'text-white/90 hover:bg-white/10'}`}
                >
                  <span>বাংলা</span>
                  {locale === 'bn' && <span className="text-amber-400 font-bold">✓</span>}
                </button>
                <button 
                  onClick={() => { setLocale('hi'); setIsMobileLangOpen(false); }} 
                  className={`px-2.5 py-1 text-left text-[10px] cursor-pointer flex items-center justify-between ${locale === 'hi' ? 'bg-[#1D6FE0] text-white font-bold' : 'text-white/90 hover:bg-white/10'}`}
                >
                  <span>हिंदी</span>
                  {locale === 'hi' && <span className="text-amber-400 font-bold">✓</span>}
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 font-bold text-[9px]">
            <button 
              onClick={() => applyFontSize('sm')} 
              className={`px-1 py-0.2 rounded cursor-pointer transition-all ${fontSize === 'sm' ? 'bg-amber-400 text-slate-950 font-black' : 'text-white/80 hover:text-amber-300'}`}
            >
              A-
            </button>
            <button 
              onClick={() => applyFontSize('normal')} 
              className={`px-1 py-0.2 rounded cursor-pointer transition-all ${fontSize === 'normal' ? 'bg-amber-400 text-slate-950 font-black' : 'text-white/80 hover:text-amber-300'}`}
            >
              A
            </button>
            <button 
              onClick={() => applyFontSize('lg')} 
              className={`px-1 py-0.2 rounded cursor-pointer transition-all ${fontSize === 'lg' ? 'bg-amber-400 text-slate-950 font-black' : 'text-white/80 hover:text-amber-300'}`}
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Tier 2: Institutional Sticky Navbar with Unified Dual Logo Card & Hamburger (Section B - Sticky on Mobile) */}
      <header className="lg:hidden sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E4E7EC]">
        <div className="w-full py-2 px-2 min-[380px]:px-2.5 flex items-center justify-between overflow-hidden">
          <div 
            className="flex items-center gap-1.5 min-[380px]:gap-2 cursor-pointer min-w-0 flex-1 mr-2 select-none"
            onClick={handleLogoClick}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onTouchCancel={handlePressEnd}
            onContextMenu={(e) => e.preventDefault()}
            style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
          >
            {/* Unified Dual Logos Card (College + NSS Covered Together) */}
            <div className="flex items-center gap-1 min-[380px]:gap-1.5 p-1 bg-white rounded-lg border border-slate-200/90 shadow-xs shrink-0">
              {/* College Logo */}
              <div className="w-6.5 h-6.5 min-[380px]:w-7.5 min-[380px]:h-7.5 flex items-center justify-center overflow-hidden">
                <img src="/BBCollege Logo.jpeg" alt="B.B. College Logo" className="w-full h-full object-contain" />
              </div>
              {/* Divider */}
              <div className="w-[1px] h-4.5 bg-slate-200"></div>
              {/* NSS Wheel Logo */}
              <div className="w-6.5 h-6.5 min-[380px]:w-7.5 min-[380px]:h-7.5 flex items-center justify-center overflow-hidden">
                <img src="/nss-logo.png" alt="NSS Logo" className="w-full h-full object-contain select-none" />
              </div>
            </div>

            {/* Fluid Dynamic Typography - Perfectly scales between Logo and Hamburger */}
            <div className="flex flex-col min-w-0 flex-1 justify-center overflow-hidden">
              <h1 
                className="font-black italic text-[#004899] tracking-[0.04em] uppercase leading-none font-fraunces-black truncate"
                style={{ fontSize: 'clamp(9px, 3.1vw, 14px)' }}
              >
                NATIONAL SERVICE SCHEME
              </h1>
              <h2 
                className="font-black italic text-slate-800 tracking-[0.03em] uppercase leading-tight font-fraunces-black mt-0.5 truncate"
                style={{ fontSize: 'clamp(6.5px, 2.1vw, 9.5px)' }}
              >
                BANWARILAL BHALOTIA COLLEGE, ASANSOL
              </h2>
              <p 
                className="text-slate-600 font-bold italic tracking-[0.02em] leading-tight mt-0.5 font-fraunces-black truncate"
                style={{ fontSize: 'clamp(5.5px, 1.8vw, 8px)' }}
              >
                Affiliated to Kazi Nazrul University | NAAC Accredited
              </p>
            </div>
          </div>

          {/* Right: Hamburger or User Avatar */}
          <div className="flex items-center shrink-0">
            {currentUser ? (
              <UserAvatar user={currentUser} onClick={toggleMenu} />
            ) : (
              <button
                ref={hamburgerRef}
                onClick={toggleMenu}
                className="w-9 h-9 min-[380px]:w-9.5 min-[380px]:h-9.5 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#0B2559] focus:outline-none cursor-pointer transition-all shadow-xs shrink-0 active:scale-95"
                aria-label="Toggle Menu"
              >
                <div className="w-4.5 min-[380px]:w-5 h-3.5 min-[380px]:h-4 flex flex-col justify-between">
                  <span className={`h-[2.5px] w-full bg-[#0B2559] rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-[5.5px] min-[380px]:translate-y-[6px]' : ''}`}></span>
                  <span className={`h-[2.5px] w-full bg-[#0B2559] rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 scale-0' : ''}`}></span>
                  <span className={`h-[2.5px] w-full bg-[#0B2559] rounded-full transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-[5.5px] min-[380px]:-translate-y-[6px]' : ''}`}></span>
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile close button — rendered outside navbar stacking context, positioned at hamburger's exact location */}
      {isMobileMenuOpen && closeBtnPos && !currentUser && (
        <button
          onClick={closeAllMenus}
          className="fixed z-[80] lg:hidden flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg border border-white/20 cursor-pointer transition-all duration-200 focus:outline-none shadow-md backdrop-blur-xs active:scale-95"
          style={{ top: closeBtnPos.top, left: closeBtnPos.left, width: closeBtnPos.width, height: closeBtnPos.height }}
          aria-label="Close Menu"
        >
          <div className="relative w-4.5 min-[380px]:w-5 h-3.5 min-[380px]:h-4 flex flex-col justify-between">
            <span className="h-[2.5px] w-full bg-white rounded-full origin-center rotate-45 translate-y-[5.5px] min-[380px]:translate-y-[6px]"></span>
            <span className="h-[2.5px] w-full bg-white rounded-full opacity-0 scale-0"></span>
            <span className="h-[2.5px] w-full bg-white rounded-full origin-center -rotate-45 -translate-y-[5.5px] min-[380px]:-translate-y-[6px]"></span>
          </div>
        </button>
      )}

      {/* Mobile backdrop */}
      <div className={`fixed inset-0 bg-slate-900/40 z-[60] lg:hidden transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={closeAllMenus}></div>

      {/* Mobile menu */}
      <div className={`fixed top-0 right-0 w-[280px] h-fit max-h-[100dvh] z-[70] lg:hidden flex flex-col transform transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-bl-[28px] overflow-hidden will-change-transform ${isMobileMenuOpen ? 'opacity-100 translate-x-0 visible' : 'opacity-0 translate-x-full invisible'}`}
        style={{ background: 'rgba(15, 23, 42, 0.97)', borderLeft: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>

        {currentUser ? (
          <div className="pt-14">
            <button onClick={(e) => { e.preventDefault(); closeAllMenus(); setShowMobileProfile(true); }} className="w-full bg-white/5 hover:bg-white/10 transition-colors p-5 flex flex-col items-center text-center shrink-0 relative group focus:outline-none border-b border-white/10 cursor-pointer">
              <div className="w-18 h-18 rounded-full overflow-hidden border-2 border-blue-500/30 shadow-xl mb-3 shrink-0 p-1 bg-white/5">
                <div className="w-full h-full rounded-full overflow-hidden">
                  {currentUser.photo_url ? <img src={currentUser.photo_url} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-blue-600 text-white font-bold text-2xl flex items-center justify-center tracking-widest">{getInitials(currentUser.full_name)}</div>}
                </div>
              </div>
              <p className="font-extrabold text-white text-base leading-tight truncate w-full">{currentUser.full_name}</p>
              <p className="text-[10px] text-blue-400 mt-2 font-black flex items-center justify-center gap-1.5 bg-blue-500/10 py-1.5 px-4 rounded-full border border-blue-500/20 uppercase tracking-widest">{t("nav.viewProfile")} <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg></p>
            </button>
          </div>
        ) : (
          <div className="px-5 pt-16 pb-3.5 flex justify-between items-center border-b border-white/10">
            <span className="font-bold text-white/80 text-[11px] uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              {t("nav.menu")}
            </span>
          </div>
        )}

        <div className="overflow-y-auto py-4 px-4 space-y-2 shrink [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] font-poppins">
          {NAV_ITEMS.map((item) => {
            const IconComp = item.icon;
            return (
              <button key={item.key} onClick={() => handleNavClick(item.key)}
                className={`flex items-center gap-3 w-full px-4.5 py-3 rounded-full font-bold text-sm transition-all duration-300 border cursor-pointer hover:translate-x-1 ${activeTab === item.key ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-[0_4px_15px_rgba(37,99,235,0.35)]' : 'bg-white/5 text-slate-200 border-transparent hover:bg-white/10 hover:border-white/10 active:scale-[0.98]'}`}>
                <IconComp className={`w-5 h-5 shrink-0 ${activeTab === item.key ? 'text-white' : ''}`} /> {t(`nav.${item.key}`)}
              </button>
            );
          })}
          {!currentUser && (
            <div className="pt-3 mt-2 border-t border-white/10 space-y-2">
              <button 
                onClick={() => { closeAllMenus(); window.dispatchEvent(new Event('open_nss_register')); }} 
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 py-2.5 rounded-full font-bold text-sm w-full transition-all duration-200 cursor-pointer shadow-md active:scale-[0.97]"
              >
                <span>Join NSS</span>
              </button>
              <button 
                onClick={() => { closeAllMenus(); onOpenLogin(); }} 
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-full font-bold text-sm w-full transition-colors duration-200 cursor-pointer active:scale-[0.97] border border-white/15"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg> {t("nav.login")}
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
              <button 
                onClick={() => { setShowAdminWarning(false); setIsAdminRedirecting(false); }} 
                disabled={isAdminRedirecting}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition text-sm shadow-sm cursor-pointer disabled:opacity-50"
              >
                {t("nav.cancel")}
              </button>
              <button 
                onClick={confirmAdminAccess} 
                disabled={isAdminRedirecting}
                className="flex-1 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition text-sm shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-80"
              >
                {isAdminRedirecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>{t("nav.proceed")}</span>
                )}
              </button>
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

      {/* ================= SCREEN READER ACCESS MODAL ================= */}
      {showScreenReaderModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 font-sans antialiased animate-fade-in pointer-events-auto">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowScreenReaderModal(false)}></div>
          
          <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200 text-left animate-fade-in-up flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#004899] flex items-center justify-center border border-blue-100">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Screen Reader & Accessibility</h3>
                  <p className="text-xs text-slate-500 font-medium">Govt. of India Guidelines & WCAG 2.1 AA Compliance</p>
                </div>
              </div>

              <button
                onClick={() => setShowScreenReaderModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 text-sm text-slate-600">
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100">
                <h4 className="font-extrabold text-[#003366] text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                  Active Accessibility Features
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed mt-1">
                  This website adheres to the <strong>Guidelines for Indian Government Websites (GIGW)</strong> and <strong>World Wide Web Consortium (W3C) WCAG 2.1 (Level AA)</strong> standards for visually impaired and assistive technology users.
                </p>
              </div>

              {/* Keyboard Shortcuts */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5">Key Navigation Shortcuts</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                    <span className="text-slate-600 font-medium">Next Element</span>
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono font-bold shadow-xs">Tab</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                    <span className="text-slate-600 font-medium">Previous Element</span>
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono font-bold shadow-xs">Shift + Tab</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                    <span className="text-slate-600 font-medium">Activate Button/Link</span>
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono font-bold shadow-xs">Enter / Space</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                    <span className="text-slate-600 font-medium">Skip to Content</span>
                    <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono font-bold shadow-xs">Alt + S</kbd>
                  </div>
                </div>
              </div>

              {/* Supported Screen Readers */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <span className="font-bold text-slate-900 text-xs block mb-1">Supported Screen Readers:</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  • <strong>NVDA</strong> (NonVisual Desktop Access) on Windows<br />
                  • <strong>JAWS</strong> (Job Access With Speech) on Windows<br />
                  • <strong>VoiceOver</strong> on Apple iOS & macOS<br />
                  • <strong>TalkBack</strong> on Google Android
                </p>
              </div>

              {/* Text to Speech Test */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleTestSpeech}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                    isSpeaking 
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                      : 'bg-[#004899] hover:bg-[#003366] text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                  <span>{isSpeaking ? 'Stop Voice Announcement' : '🔊 Test Voice Speech Announcement'}</span>
                </button>

                <button
                  onClick={(e) => { setShowScreenReaderModal(false); handleSkipToContent(e); }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer text-center"
                >
                  Jump Directly to Main Content
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
