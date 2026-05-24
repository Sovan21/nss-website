import React, { useState } from "react";
import { getInitials } from "./UserAvatar";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import CVBuilder from "./CVBuilder";

export const ProfileCardContent = ({ user, onClose, onLogout }) => {
  const [currentView, setCurrentView] = useState('profile');

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      // 1. Verify Current Password by attempting re-login
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        throw new Error("Incorrect current password.");
      }

      // 2. Update to New Password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      
      toast.success("Password updated successfully!");
      setCurrentView('settings');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const renderProfile = () => (
    <div className="flex flex-col w-full max-h-[85vh] md:max-h-[80vh] overflow-hidden text-slate-800 bg-transparent print:hidden">
      <div className="bg-white/50 p-4 flex flex-col items-center text-center relative border-b border-blue-100 shrink-0">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full p-1.5 transition focus:outline-none shadow-sm cursor-pointer">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-white shadow-md mb-2 bg-blue-100 flex items-center justify-center shrink-0">
          {user.photo_url ? (<img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />) : (<span className="text-blue-700 font-bold text-3xl tracking-widest">{getInitials(user.full_name)}</span>)}
        </div>
        <h3 className="font-black text-slate-900 text-xl md:text-2xl truncate w-full px-2 tracking-wide">{user.full_name}</h3>
        <p className="text-sm font-semibold text-slate-500 mb-1.5 px-2 truncate w-full">{user.email}</p>
        {(!user.phone || !user.department || !user.roll_no) ? (
          <p className="mt-1.5 bg-amber-50 text-amber-700 font-extrabold text-[11px] md:text-xs px-4 py-1.5 rounded-full border border-amber-200 flex items-center justify-center gap-1.5 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Profile Incomplete — Contact Admin
          </p>
        ) : (
          <p className="text-emerald-600 text-sm font-extrabold flex items-center justify-center gap-1 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Active Volunteer
          </p>
        )}
      </div>
      <div className="p-4 md:p-5 overflow-y-auto overscroll-contain flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-3 border-b border-blue-100 pb-1.5">Academic Info</p>
            <div className="grid grid-cols-2 gap-y-4 gap-x-3 px-1">
              <div><span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Department</span><span className="text-[14px] font-extrabold text-slate-800">{user.department || 'N/A'}</span></div>
              <div><span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Semester</span><span className="text-[14px] font-extrabold text-slate-800">{user.semester || 'N/A'}</span></div>
              <div className="col-span-2"><span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Roll No</span><span className="text-[14px] font-extrabold text-slate-800 uppercase tracking-wider">{user.roll_no || 'N/A'}</span></div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-3 border-b border-blue-100 pb-1.5">Personal Details</p>
            <div className="grid grid-cols-2 gap-y-4 gap-x-3 px-1">
              <div><span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Phone</span><span className="text-[14px] font-extrabold text-slate-800">{user.phone || 'N/A'}</span></div>
              <div><span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">WhatsApp</span><span className="text-[14px] font-extrabold text-slate-800">{user.whatsapp || 'N/A'}</span></div>
              <div><span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">DOB</span><span className="text-[14px] font-extrabold text-slate-800">{user.dob || 'N/A'}</span></div>
              <div><span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Blood Group</span><span className="text-[14px] font-extrabold text-red-600 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.5c3.59 0 6.5-2.91 6.5-6.5 0-4-6.5-12-6.5-12S5.5 11 5.5 15c0 3.59 2.91 6.5 6.5 6.5z" /></svg>{user.blood_group || 'N/A'}</span></div>
              {user.current_address && (<div className="col-span-2"><span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Address</span><span className="text-[13px] font-bold text-slate-700 leading-snug block">{user.current_address}</span></div>)}
            </div>
          </div>
          {user.bio && (<div><p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-3 border-b border-blue-100 pb-1.5">About Me</p><p className="text-[13px] text-slate-700 font-medium italic leading-relaxed bg-white/60 p-3.5 rounded-xl border border-blue-100 px-3 mx-1">"{user.bio}"</p></div>)}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">Profile changes are managed by the <span className="text-blue-600 font-bold">NSS Admin</span>. Contact your admin to update any information.</p>
          </div>
        </div>
      </div>
      <div className="p-3 md:p-4 bg-white/50 border-t border-blue-100 flex flex-row gap-2 shrink-0">
        <button onClick={() => setCurrentView('settings')} className="flex-1 bg-blue-600 text-white font-bold py-2 md:py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-blue-700 transition shadow-sm text-xs md:text-sm border border-blue-700 cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Settings
        </button>
        <button onClick={onLogout} className="flex-1 bg-red-50 text-red-600 font-bold py-2 md:py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-red-100 transition shadow-sm text-xs md:text-sm border border-red-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> Logout
        </button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="flex flex-col w-full max-h-[85vh] md:max-h-[80vh] overflow-hidden text-slate-800 bg-transparent print:hidden animate-fade-in-up">
      <div className="bg-white/50 p-4 flex items-center justify-between border-b border-blue-100 shrink-0">
        <button onClick={() => setCurrentView('profile')} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold text-sm bg-white hover:bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg> Back
        </button>
        <h3 className="font-black text-slate-800 text-lg">Settings</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full p-1.5 transition">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50/50">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Security</p>
        <button onClick={() => setCurrentView('change_password')} className="w-full bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all mb-6 group text-left">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Change Password</h4>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Update your account security password</p>
          </div>
          <svg className="w-5 h-5 text-slate-300 ml-auto group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </button>

        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Career & Growth</p>
        <button onClick={() => setCurrentView('cv_builder')} className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-700 p-4 rounded-2xl flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all group text-left text-white">
          <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white group-hover:text-blue-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <h4 className="font-black text-white">Build CV / Resume</h4>
            <p className="text-xs font-medium text-blue-100 mt-0.5">Generate a professional CV using your NSS profile</p>
          </div>
          <svg className="w-5 h-5 text-blue-200 ml-auto group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );

  const renderChangePassword = () => (
    <div className="flex flex-col w-full max-h-[85vh] md:max-h-[80vh] overflow-hidden text-slate-800 bg-transparent print:hidden animate-fade-in-up">
      <div className="bg-white/50 p-4 flex items-center justify-between border-b border-blue-100 shrink-0">
        <button onClick={() => setCurrentView('settings')} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold text-sm bg-white hover:bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg> Back
        </button>
        <h3 className="font-black text-slate-800 text-lg">Change Password</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full p-1.5 transition">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-6 overflow-y-auto flex-1 bg-white">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-800 placeholder:text-slate-400" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-800 placeholder:text-slate-400" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-widest">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-800 placeholder:text-slate-400" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-3.5 rounded-xl mt-4 hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );

  return currentView === 'settings' ? renderSettings() : 
         currentView === 'change_password' ? renderChangePassword() : 
         currentView === 'cv_builder' ? <CVBuilder user={user} onClose={() => setCurrentView('settings')} /> : 
         renderProfile();
};
