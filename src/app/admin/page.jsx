// File: src/app/admin/page.jsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

import VolunteersManager from '@/components/admin/VolunteersManager';
import EventsManager from '@/components/admin/EventsManager';
import CommitteeManager from '@/components/admin/CommitteeManager';
import SettingsManager from '@/components/admin/SettingsManager';
import AchievementsManager from '@/components/admin/AchievementsManager';
import { SidebarIcons } from '@/components/admin/SidebarIcons';

const CustomScrollbarStyles = () => (
  <style jsx global>{`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .sidebar-scroll::-webkit-scrollbar { width: 4px; }
    .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
    .sidebar-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
    .main-scroll::-webkit-scrollbar { width: 6px; }
    .main-scroll::-webkit-scrollbar-track { background: transparent; }
    .main-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  `}</style>
);

export default function AdminDashboard() {
  const router = useRouter();
  const { confirm } = useToast();
  const [activeTab, setActiveTab] = useState('volunteers');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  const isDirtyRef = useRef(isDirty);
  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

  const [warningModal, setWarningModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: adminData } = await supabase.from('admins').select('email').eq('email', user.email).single();
        if (adminData) {
          setAdminUser(user);
        } else {
          router.replace('/admin-login');
        }
      } else {
        router.replace('/admin-login');
      }
    });

    window.history.pushState({ adminTrap: true }, '');
    const handlePopState = () => {
      window.history.pushState({ adminTrap: true }, '');
      if (isDirtyRef.current) {
        setWarningModal({
          show: true,
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Navigating back will discard them. Are you sure?',
          onConfirm: () => { setIsDirty(false); setActiveTab('volunteers'); setWarningModal({ show: false }); }
        });
      } else {
        if (activeTabRef.current !== 'volunteers') setActiveTab('volunteers');
        else {
          setWarningModal({
            show: true,
            title: 'Exit Admin Panel?',
            message: 'You are about to exit the admin dashboard. Any unsaved progress will be lost.',
            onConfirm: () => { window.location.replace('/'); }
          });
        }
      }
    };
    window.addEventListener('popstate', handlePopState);

    const handleBeforeUnload = (e) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = 'Changes you made may not be saved.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleTabChange = async (tabId) => {
    if (isDirty) {
      const confirmed = await confirm("You have unsaved changes. Discard them?", { title: "Discard Changes", type: "danger", confirmText: "Discard", cancelText: "Keep Editing" });
      if (!confirmed) return;
    }
    setIsDirty(false); setActiveTab(tabId); setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    if (isDirty) {
      const confirmed = await confirm("You have unsaved changes. Discard them and logout?", { title: "Logout", type: "danger", confirmText: "Logout", cancelText: "Stay Logged In" });
      if (!confirmed) return;
    }
    sessionStorage.removeItem('allow_public');
    supabase.auth.signOut().then(() => { router.push('/'); });
  };

  const handleGoToPublicSite = async () => {
    if (isDirty) {
      const confirmed = await confirm("Discard changes and return to the public site?", { title: "Leave Dashboard", type: "danger", confirmText: "Leave", cancelText: "Stay" });
      if (!confirmed) return;
    }
    sessionStorage.setItem('allow_public', 'true');
    router.push('/');
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-gray-50 font-sans relative">
      <CustomScrollbarStyles />
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      {warningModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-backdrop-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setWarningModal({ ...warningModal, show: false })} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-fade-in-up">
            <div className="h-2 w-full bg-gradient-to-r from-red-500 to-orange-500" />
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">{warningModal.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">{warningModal.message}</p>
              <div className="flex gap-3">
                <button onClick={() => setWarningModal({ ...warningModal, show: false })} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-[0.98]">Cancel</button>
                <button onClick={warningModal.onConfirm} className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-[0.98]">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`absolute md:relative inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800"><h2 className="text-2xl font-bold text-blue-500">NSS Admin</h2></div>
        <nav className="flex-1 px-4 py-6 space-y-2.5 overflow-y-auto no-scrollbar sidebar-scroll">
          <button 
            onClick={() => handleTabChange('volunteers')} 
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold transition-all text-sm cursor-pointer ${
              activeTab === 'volunteers' ? 'bg-blue-600 text-white shadow-md border border-blue-400/50' : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <SidebarIcons.Volunteers /> Volunteers
          </button>
          
          <button 
            onClick={() => handleTabChange('events')} 
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold transition-all text-sm cursor-pointer ${
              activeTab === 'events' ? 'bg-blue-600 text-white shadow-md border border-blue-400/50' : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <SidebarIcons.Events /> Events
          </button>
          
          <button 
            onClick={() => handleTabChange('committee')} 
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold transition-all text-sm cursor-pointer ${
              activeTab === 'committee' ? 'bg-blue-600 text-white shadow-md border border-blue-400/50' : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <SidebarIcons.Committee /> Committee
          </button>

          <button 
            onClick={() => handleTabChange('settings')} 
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold transition-all text-sm cursor-pointer ${
              activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md border border-blue-400/50' : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <SidebarIcons.Settings /> Site Settings
          </button>

          <button 
            onClick={() => handleTabChange('achievements')} 
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold transition-all text-sm cursor-pointer ${
              activeTab === 'achievements' ? 'bg-blue-600 text-white shadow-md border border-blue-400/50' : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <SidebarIcons.Award /> Achievements
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-3">
          {adminUser && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 shadow-inner">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold text-white truncate">Administrator</p>
                <p className="text-xs text-slate-400 truncate" title={adminUser.email}>{adminUser.email}</p>
              </div>
            </div>
          )}
          <div className="space-y-2.5">
            <button onClick={handleGoToPublicSite} className="w-full flex justify-center items-center gap-2 text-blue-400 font-bold py-3 bg-[#13284c] border border-blue-900/50 hover:bg-[#1a3566] transition rounded-2xl text-sm shadow-sm cursor-pointer"><SidebarIcons.Public /> Return to Site</button>
            <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 text-red-400 font-bold py-3 bg-[#2a1420] border border-red-900/50 hover:bg-[#3d1a2d] transition rounded-2xl text-sm shadow-sm cursor-pointer"><SidebarIcons.Logout /> Logout</button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-100">
        <header className="bg-white shadow-xs p-4 md:px-8 flex items-center gap-4">
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden"><SidebarIcons.Menu /></button>
          <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h1>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar main-scroll p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'volunteers' && <VolunteersManager setIsDirty={setIsDirty} />}
            {activeTab === 'events' && <EventsManager setIsDirty={setIsDirty} />}
            {activeTab === 'committee' && <CommitteeManager setIsDirty={setIsDirty} />}
            {activeTab === 'settings' && <SettingsManager isDirty={isDirty} setIsDirty={setIsDirty} />}
            {activeTab === 'achievements' && <AchievementsManager setIsDirty={setIsDirty} />}
          </div>
        </div>
      </main>
    </div>
  );
}
