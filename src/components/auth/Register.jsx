"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export const compressImage = (file, maxSizeMB = 2, maxWidth = 800) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) { resolve(file); return; }
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image(); img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        const maxSizeBytes = maxSizeMB * 1024 * 1024; let quality = 0.9;
        const attemptCompress = () => {
          ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return; }
            if (blob.size > maxSizeBytes && quality > 0.1) { quality -= 0.1; attemptCompress(); } 
            else {
              const newFileName = file.name.replace(/\.[^/.]+$/, ".jpg");
              resolve(new File([blob], newFileName, { type: 'image/jpeg', lastModified: Date.now() }));
            }
          }, 'image/jpeg', quality);
        };
        attemptCompress();
      }; img.onerror = () => resolve(file);
    }; reader.onerror = () => resolve(file);
  });
};

export default function Register({ onClose, onSwitch }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', phone: '', whatsapp: '',
    dob: '', gender: '', blood_group: '', current_address: '',
    department: '', semester: '', roll_no: '', bio: '', photo_url: ''
  });

  const { toast } = useToast();
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setPhotoFile(e.target.files[0]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedPhotoUrl = '';

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.full_name } }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User registration failed, please try again.");

      if (photoFile) {
        const compressedFile = await compressImage(photoFile, 2, 800);
        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `volunteer-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('nss-images').upload(fileName, compressedFile);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('nss-images').getPublicUrl(fileName);
        uploadedPhotoUrl = data.publicUrl;
      }

      const { password, ...publicProfileData } = formData;
      const finalData = { ...publicProfileData, id: authData.user.id, photo_url: uploadedPhotoUrl };

      const { error: insertError } = await supabase.from('registrations').insert([finalData]);
      if (insertError) throw insertError;

      toast.success("Registration Successful! Please check your email for a confirmation link.");
      if (onSwitch) onSwitch('login'); 

    } catch (err) {
      console.error("Registration Error:", err);
      toast.error("Registration failed. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const handleMouseDown = (e) => {
    // Don't drag if clicking on interactive elements
    if (e.target.closest('input, textarea, select, button, label, a')) return;
    isDragging.current = true;
    startY.current = e.pageY - scrollRef.current.offsetTop;
    scrollTop.current = scrollRef.current.scrollTop;
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
  };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const y = e.pageY - scrollRef.current.offsetTop;
    const walk = (y - startY.current) * 1.5;
    scrollRef.current.scrollTop = scrollTop.current - walk;
  };
  const handleMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = '';
      scrollRef.current.style.userSelect = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 font-sans antialiased">
      <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={onClose}></div>
      <div
        ref={scrollRef}
        className="relative z-10 max-w-4xl w-full mx-auto bg-gradient-to-br from-sky-50 to-blue-50 shadow-2xl rounded-3xl p-5 md:p-10 border border-blue-100 overflow-y-auto max-h-[88dvh] md:max-h-[90vh] animate-fade-in-up will-change-transform [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <button onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-700 transition-colors border border-slate-200 shadow-sm focus:outline-none z-20 cursor-pointer">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center mb-8 mt-8 sm:mt-0">
          <h2 className="text-2xl sm:text-4xl font-semibold text-slate-900 tracking-tight mb-2">Volunteer Registration</h2>
          <p className="text-slate-500 text-[14px] sm:text-[15px] font-medium">Join the NSS Unit of Banwarilal Bhalotia College</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-8">
          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-blue-100 shadow-sm">
            <h3 className="text-xl font-semibold text-blue-900 mb-6 tracking-tight">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Full Name *</label>
                <input name="full_name" type="text" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder="Enter your full name" />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Email Address *</label>
                <input name="email" type="email" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Create Password *</label>
                <input name="password" type="password" onChange={handleChange} required minLength="6" className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder="Minimum 6 characters" />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Date of Birth *</label>
                <input name="dob" type="date" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 shadow-sm text-[15px]" />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Phone Number *</label>
                <input name="phone" type="tel" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder="10-digit mobile number" />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">WhatsApp Number</label>
                <input name="whatsapp" type="tel" onChange={handleChange} className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder="Optional" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Gender *</label>
                  <select name="gender" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 shadow-sm text-[15px]">
                    <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Blood Group *</label>
                  <select name="blood_group" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 shadow-sm text-[15px]">
                    <option value="">Select</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="O+">O+</option><option value="O-">O-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Current Address *</label>
                <textarea name="current_address" rows="2" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder="Enter your full current residential address..."></textarea>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-blue-100 shadow-sm">
            <h3 className="text-xl font-semibold text-blue-900 mb-6 tracking-tight">Academic Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Department *</label>
                <input name="department" type="text" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder="e.g. BA, Bcom, BSc" />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Semester *</label>
                <select name="semester" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 shadow-sm text-[15px]">
                  <option value="">Select</option><option value="1st">1st Sem</option><option value="2nd">2nd Sem</option><option value="3rd">3rd Sem</option><option value="4th">4th Sem</option><option value="5th">5th Sem</option><option value="6th">6th Sem</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Roll Number *</label>
                <input name="roll_no" type="text" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder="College Roll No" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-8 rounded-3xl border border-blue-100 shadow-sm">
            <h3 className="text-xl font-semibold text-blue-900 mb-6 tracking-tight">Profile Setup</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Why do you want to join NSS? (Bio) *</label>
                <textarea name="bio" rows="3" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder="Tell us a little about yourself and your motivation..."></textarea>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Profile Photo (Passport Size) *</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border border-blue-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-white transition-all duration-200">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-3 text-blue-400" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                      <p className="mb-1 text-[15px] text-slate-600"><span className="font-semibold text-blue-600">Click to upload</span></p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} required />
                  </label>
                </div>
                {photoFile && <p className="text-[13px] text-slate-700 mt-2 font-medium bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg w-fit">Selected: {photoFile.name}</p>}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className={`w-full font-semibold py-4 rounded-2xl transition-all duration-300 text-[17px] mt-2 shadow-lg ${loading ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'}`}>
              {loading ? 'Submitting Application...' : 'Submit NSS Application'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center border-t border-blue-100 pt-6">
          <p className="text-slate-500 text-[15px]">Already registered?{' '}
            <button type="button" onClick={() => onSwitch('login')} className="text-blue-600 font-semibold hover:text-blue-800 transition-colors ml-1 cursor-pointer">Login here</button>
          </p>
        </div>
      </div>
    </div>
  );
}