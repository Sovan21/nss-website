"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getInitials, compressImage } from "./UserAvatar";
import { useToast } from "@/components/Toast";

export const ProfileCardContent = ({ user, onClose, onEditClick, onLogout }) => (
  <div className="flex flex-col w-full max-h-[85vh] md:max-h-[80vh] overflow-hidden text-slate-800 bg-transparent">
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
        <button onClick={onEditClick} className="mt-1.5 bg-amber-50 text-amber-700 font-extrabold text-[11px] md:text-xs px-4 py-1.5 rounded-full border border-amber-200 flex items-center justify-center gap-1.5 shadow-sm hover:bg-amber-100 transition-colors cursor-pointer focus:outline-none">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          Complete Your Profile
        </button>
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
      </div>
    </div>
    <div className="p-3 md:p-4 bg-white/50 border-t border-blue-100 flex flex-col sm:flex-row gap-2.5 shrink-0">
      <button onClick={onEditClick} className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-sm text-sm border border-blue-700 hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> Update Profile
      </button>
      <button onClick={onLogout} className="flex-1 bg-red-50 text-red-600 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition shadow-sm text-sm border border-red-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> Logout
      </button>
    </div>
  </div>
);

export const EditProfileModal = ({ currentUser, onClose, setCurrentUser }) => {
  const { toast } = useToast();
  const [editFormData, setEditFormData] = useState({
    full_name: currentUser.full_name || '', phone: currentUser.phone || '', whatsapp: currentUser.whatsapp || '',
    department: currentUser.department || '', semester: currentUser.semester || '', roll_no: currentUser.roll_no || '',
    blood_group: currentUser.blood_group || '', dob: currentUser.dob || '', bio: currentUser.bio || '', current_address: currentUser.current_address || ''
  });
  const [editImageFile, setEditImageFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);

  const handleEditInputChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  const handlePhoneInput = (e) => { const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10); setEditFormData({ ...editFormData, [e.target.name]: val }); };

  const submitProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      let updatedPhotoUrl = currentUser.photo_url;
      if (removeImage && updatedPhotoUrl) {
        const oldFileName = updatedPhotoUrl.split('/').pop();
        await supabase.storage.from('nss-images').remove([oldFileName]);
        updatedPhotoUrl = null;
      } else if (editImageFile) {
        if (currentUser.photo_url) { const oldFileName = currentUser.photo_url.split('/').pop(); await supabase.storage.from('nss-images').remove([oldFileName]); }
        const compressedFile = await compressImage(editImageFile, 2, 800);
        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `registration-${Date.now()}.${fileExt}`;
        await supabase.storage.from('nss-images').upload(fileName, compressedFile);
        updatedPhotoUrl = supabase.storage.from('nss-images').getPublicUrl(fileName).data.publicUrl;
      }
      const finalData = { id: currentUser.id, email: currentUser.email, ...editFormData, photo_url: updatedPhotoUrl };
      const { error } = await supabase.from('registrations').upsert(finalData);
      if (error) throw error;
      const updatedUser = { ...currentUser, ...finalData };
      setCurrentUser(updatedUser);
      localStorage.setItem('nss_user', JSON.stringify(updatedUser));
      onClose();
      toast.success("Profile updated successfully!");
    } catch (err) { console.error(err); toast.error("Failed to update profile."); }
    finally { setSavingProfile(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-2xl bg-gradient-to-br from-sky-50 to-blue-50 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[88dvh] md:max-h-[90vh] animate-fade-in-up border border-blue-100">
        <div className="bg-white/50 p-4 md:p-5 flex justify-between items-center text-slate-800 shrink-0 border-b border-blue-100">
          <h3 className="font-black text-base md:text-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> Update Profile
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-full p-1.5 transition shadow-sm focus:outline-none cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={submitProfileUpdate} className="p-4 md:p-6 overflow-y-auto flex flex-col gap-4 bg-transparent text-slate-800 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex flex-col items-center justify-center mb-2">
            <div className="relative group cursor-pointer mb-2">
              <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-white shadow-md bg-blue-100 flex items-center justify-center">
                {editImageFile ? (<img src={URL.createObjectURL(editImageFile)} alt="New" className="w-full h-full object-cover" />) : currentUser?.photo_url && !removeImage ? (<img src={currentUser.photo_url} alt="Current" className="w-full h-full object-cover" />) : (<span className="text-blue-700 font-bold text-3xl tracking-widest">{getInitials(currentUser?.full_name)}</span>)}
              </div>
              <label className="absolute inset-0 bg-black/60 backdrop-blur-sm text-white flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-white/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <input type="file" accept="image/*" onChange={(e) => { setEditImageFile(e.target.files[0]); setRemoveImage(false); }} className="hidden" />
              </label>
            </div>
            <div className="flex gap-3 mt-1 items-center">
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{(currentUser?.photo_url || editImageFile) && !removeImage ? 'Tap to change' : 'Tap to add photo'}</span>
              {(currentUser?.photo_url || editImageFile) && !removeImage && (<button type="button" onClick={() => { setRemoveImage(true); setEditImageFile(null); }} className="text-[10px] text-red-500 hover:text-red-600 font-bold uppercase tracking-widest cursor-pointer">Remove</button>)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Full Name</label><input type="text" name="full_name" value={editFormData.full_name} onChange={handleEditInputChange} required className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm font-semibold text-slate-800 shadow-sm placeholder-slate-400" /></div>
            <div><label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label><input type="tel" name="phone" value={editFormData.phone} onInput={handlePhoneInput} maxLength="10" className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm font-semibold text-slate-800 shadow-sm placeholder-slate-400" /></div>
            <div><label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">WhatsApp Number</label><input type="tel" name="whatsapp" value={editFormData.whatsapp} onInput={handlePhoneInput} maxLength="10" className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm font-semibold text-slate-800 shadow-sm placeholder-slate-400" /></div>
            <div><label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Department</label><input type="text" name="department" value={editFormData.department} onChange={handleEditInputChange} placeholder="e.g. B.Sc Physics" className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm font-semibold text-slate-800 shadow-sm placeholder-slate-400" /></div>
            <div><label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Semester</label><select name="semester" value={editFormData.semester} onChange={handleEditInputChange} className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm font-semibold text-slate-800 shadow-sm cursor-pointer appearance-none"><option value="">Select Semester</option><option value="1st">1st Sem</option><option value="2nd">2nd Sem</option><option value="3rd">3rd Sem</option><option value="4th">4th Sem</option><option value="5th">5th Sem</option><option value="6th">6th Sem</option><option value="7th">7th Sem</option><option value="8th">8th Sem</option></select></div>
            <div><label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">College Roll No</label><input type="text" name="roll_no" value={editFormData.roll_no} onChange={handleEditInputChange} className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm font-semibold text-slate-800 uppercase shadow-sm placeholder-slate-400" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Date of Birth</label><input type="date" name="dob" value={editFormData.dob} onChange={handleEditInputChange} className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm font-semibold text-slate-800 shadow-sm" /></div>
              <div><label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Blood Group</label><select name="blood_group" value={editFormData.blood_group} onChange={handleEditInputChange} className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm font-bold text-red-600 shadow-sm cursor-pointer appearance-none"><option value="">Select</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="O+">O+</option><option value="O-">O-</option><option value="AB+">AB+</option><option value="AB-">AB-</option></select></div>
            </div>
            <div className="md:col-span-2 mt-2"><label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Current Address</label><textarea name="current_address" value={editFormData.current_address} onChange={handleEditInputChange} rows="2" placeholder="Your full address..." className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm font-semibold text-slate-800 shadow-sm placeholder-slate-400"></textarea></div>
            <div className="md:col-span-2 pt-2"><h4 className="text-[11px] md:text-xs font-bold text-blue-800 mb-3 uppercase tracking-widest border-b border-blue-100 pb-2">About You</h4><label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Short Bio</label><textarea name="bio" value={editFormData.bio} onChange={handleEditInputChange} rows="2" placeholder="Write something about yourself..." className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition text-sm font-semibold text-slate-800 shadow-sm placeholder-slate-400"></textarea></div>
          </div>
          <div className="flex gap-3 mt-4 shrink-0 border-t border-blue-100 pt-4">
            <button type="button" onClick={onClose} className="w-1/3 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition text-sm shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer">Cancel</button>
            <button type="submit" disabled={savingProfile} className={`w-2/3 font-bold py-3.5 rounded-xl transition shadow-lg text-sm flex items-center justify-center gap-2 ${savingProfile ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'}`}>
              {savingProfile ? <span className="animate-pulse">Updating Data...</span> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
