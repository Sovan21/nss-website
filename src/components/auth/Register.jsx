"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/context/LanguageContext';

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

export const DEPARTMENTS = [
  "Bengali",
  "Botany",
  "Chemistry",
  "Computer Science",
  "Commerce",
  "B.Com (Hindi Shift)",
  "Economics",
  "Education",
  "Electronics",
  "English",
  "Geography",
  "Geography (Hindi Shift)",
  "Hindi",
  "History",
  "History (Hindi Shift)",
  "Mathematics",
  "Microbiology",
  "Philosophy",
  "Physics",
  "Political Science",
  "Political Science (Hindi Shift)",
  "Sanskrit",
  "Statistics",
  "Urdu",
  "Zoology",
  "BBA",
  "BCA"
];

export const YEARS = Array.from({ length: 101 }, (_, i) => 2100 - i);

export default function Register({ onClose, onSwitch }) {
  const { t } = useLanguage();
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', phone: '', whatsapp: '',
    dob: '', gender: '', blood_group: '', current_address: '',
    fathers_name: '', mothers_name: '', aadhaar_no: '',
    department: '', semester: '', college_application_id: '',
    extra_curriculum: '', prev_experience: '',
    bio: '', photo_url: ''
  });

  const { toast } = useToast();
  const [photoFile, setPhotoFile] = useState(null);
  const [passoutYear, setPassoutYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Post-submission confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const registeredCredsRef = useRef(null); // {email, password} for polling
  const pollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Poll via signInWithPassword to detect email confirmation (works cross-device)
  useEffect(() => {
    if (!showConfirmModal || emailConfirmed || !registeredCredsRef.current) return;

    const checkConfirmation = async () => {
      try {
        const { email, password } = registeredCredsRef.current;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (data?.session && !error) {
          // Email is confirmed — sign out so user can login cleanly via login form
          await supabase.auth.signOut();
          setEmailConfirmed(true);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch (err) { /* silent — email not yet confirmed */ }
    };

    // Start polling every 5 seconds
    pollRef.current = setInterval(checkConfirmation, 5000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [showConfirmModal, emailConfirmed]);

  // Warn user before page reload while waiting for confirmation
  useEffect(() => {
    if (!showConfirmModal || emailConfirmed) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [showConfirmModal, emailConfirmed]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const minSize = 500 * 1024;
      const maxSize = 1024 * 1024;
      if (file.size < minSize || file.size > maxSize) {
        toast.error("Passport size photo must be between 500 KB and 1 MB.");
        e.target.value = null; // Reset file input
        setPhotoFile(null);
        return;
      }
    }
    setPhotoFile(file);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6 || formData.password.length > 16) {
      toast.error("Password must be between 6 and 16 characters.");
      return;
    }

    const aadhaarRegex = /^[0-9]{12}$/;
    if (!aadhaarRegex.test(formData.aadhaar_no)) {
      toast.error("Aadhaar Number must be exactly 12 digits and contain only numbers.");
      return;
    }

    if (formData.college_application_id.length > 15) {
      toast.error("College Application ID must not exceed 15 characters.");
      return;
    }

    setLoading(true);

    try {
      let uploadedPhotoUrl = '';

      if (photoFile) {
        const compressedFile = await compressImage(photoFile, 1, 800); // Max 1MB
        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `volunteer-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('nss-images').upload(fileName, compressedFile);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('nss-images').getPublicUrl(fileName);
        uploadedPhotoUrl = data.publicUrl;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: formData.full_name,
            fathers_name: formData.fathers_name,
            mothers_name: formData.mothers_name,
            aadhaar_no: formData.aadhaar_no,
            phone: formData.phone,
            whatsapp: formData.whatsapp,
            dob: formData.dob,
            gender: formData.gender,
            blood_group: formData.blood_group,
            current_address: formData.current_address,
            department: formData.department,
            semester: formData.semester === "Pass Out" ? `Pass Out - ${passoutYear}` : formData.semester,
            college_application_id: formData.college_application_id,
            extra_curriculum: formData.extra_curriculum,
            prev_experience: formData.prev_experience,
            bio: formData.bio,
            photo_url: uploadedPhotoUrl
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User registration failed, please try again.");

      // Store credentials in ref for polling (never rendered, ref only)
      registeredCredsRef.current = { email: formData.email, password: formData.password };
      setShowConfirmModal(true);

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 md:p-6 font-sans antialiased">
      <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={showConfirmModal ? undefined : onClose}></div>

      {showConfirmModal ? (
        /* ── Email Confirmation / WhatsApp Modal ── */
        <div className="relative z-10 max-w-md w-full mx-auto bg-gradient-to-br from-sky-50 to-blue-50 shadow-2xl rounded-3xl p-5 sm:p-8 md:p-12 border border-blue-100 animate-fade-in-up">
          <div className="text-center">
            {!emailConfirmed ? (
              <>
                {/* Animated mail icon */}
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Application Submitted!</h3>
                <p className="text-slate-600 text-[14px] font-medium mb-2 leading-relaxed">
                  We have sent a confirmation link to your email address:
                </p>
                <p className="text-blue-700 font-bold text-[15px] mb-5 bg-blue-50 py-2 px-4 rounded-xl inline-block border border-blue-100">{formData.email}</p>
                <p className="text-slate-500 text-[13px] leading-relaxed mb-6">
                  Please open your email inbox and click on the confirmation link to activate your volunteer account. You can confirm from any device.
                </p>
                {/* Subtle waiting indicator */}
                <div className="flex items-center justify-center gap-2 text-slate-400 text-[13px] font-medium">
                  <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Waiting for email confirmation...
                </div>
              </>
            ) : (
              <>
                {/* Success checkmark */}
                <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Email Confirmed!</h3>
                <p className="text-slate-600 text-[14px] font-medium mb-6 leading-relaxed">
                  Your NSS Volunteer account has been activated successfully. Please join our official WhatsApp Group to stay updated with all activities and announcements.
                </p>
                <a
                  href="https://chat.whatsapp.com/CVhiRk37OzC3tVCVdUv5wR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl transition duration-300 shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-[15px] no-underline mb-3"
                >
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.426.002 9.842-4.414 9.845-9.843.002-2.63-1.023-5.101-2.886-6.968C16.366 1.94 13.9.916 11.999.916 6.574.916 2.16 5.334 2.158 10.766c-.001 1.503.402 2.974 1.168 4.29l-.993 3.627 3.724-.977 1.01.6c1.479.88 3.011 1.342 4.63 1.343h.001zm10.435-7.234c-.267-.134-1.58-.779-1.824-.868-.244-.09-.422-.134-.6.134-.178.267-.689.868-.844 1.047-.156.178-.311.2-.578.067-.267-.134-1.127-.416-2.148-1.327-.795-.71-1.332-1.587-1.488-1.854-.156-.267-.017-.411.116-.544.12-.12.267-.312.4-.467.133-.156.178-.267.267-.445.09-.178.044-.334-.022-.467-.067-.134-.6-1.446-.822-1.98-.217-.522-.455-.45-.6-.458-.138-.008-.297-.01-.456-.01-.159 0-.418.06-.637.29-.219.23-.837.818-.837 1.995 0 1.178.857 2.316.975 2.478.118.162 1.686 2.574 4.084 3.607.57.246 1.016.393 1.363.503.573.182 1.094.156 1.506.095.459-.069 1.58-.646 1.802-1.238.223-.593.223-1.102.156-1.238-.067-.134-.244-.214-.511-.348z" />
                  </svg>
                  Join WhatsApp Group
                </a>
                <button
                  type="button"
                  onClick={() => { setShowConfirmModal(false); if (onSwitch) onSwitch('login'); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl transition duration-200 cursor-pointer text-[15px] shadow-md"
                >
                  OK, Go to Login
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── Registration Form ── */
        <div
          ref={scrollRef}
          className="relative z-10 max-w-4xl w-full mx-auto bg-gradient-to-br from-sky-50 to-blue-50 shadow-2xl rounded-[22px] sm:rounded-3xl p-3.5 sm:p-6 md:p-10 border border-blue-100 overflow-y-auto max-h-[96dvh] sm:max-h-[90dvh] md:max-h-[90vh] animate-fade-in-up will-change-transform [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <button onClick={onClose} className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 flex items-center justify-center bg-white hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-700 transition-colors border border-slate-200 shadow-sm focus:outline-none z-20 cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="text-center mb-8 mt-8 sm:mt-0">
            <h2 className="text-2xl sm:text-4xl font-semibold text-slate-900 tracking-tight mb-2">{t("auth.register.title")}</h2>
            <p className="text-slate-500 text-[14px] sm:text-[15px] font-medium">{t("auth.register.subtitle")}</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-8">
            <div className="bg-white p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl border border-blue-100 shadow-sm">
              <h3 className="text-xl font-semibold text-blue-900 mb-6 tracking-tight">{t("auth.register.personalDetails")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.fullName")} *</label>
                  <input name="full_name" type="text" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterName")} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.email")} *</label>
                  <input name="email" type="email" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterEmail")} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.password")} *</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      onChange={handleChange}
                      required
                      minLength="6"
                      maxLength="16"
                      className="w-full p-4 pr-12 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]"
                      placeholder={t("auth.register.minPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1 z-10"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.dob")} *</label>
                  <input name="dob" type="date" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 shadow-sm text-[15px]" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.phone")} *</label>
                  <input name="phone" type="tel" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterPhone")} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.whatsapp")} ({t("auth.register.optional")})</label>
                  <input name="whatsapp" type="tel" onChange={handleChange} className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.optional")} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.fathersName")} *</label>
                  <input name="fathers_name" type="text" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterFathersName")} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.mothersName")} *</label>
                  <input name="mothers_name" type="text" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterMothersName")} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.aadhaarNo")} *</label>
                  <input name="aadhaar_no" type="text" onChange={handleChange} required maxLength="12" pattern="[0-9]{12}" className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterAadhaar")} />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.gender")} *</label>
                    <select name="gender" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 shadow-sm text-[15px]">
                      <option value="">{t("auth.register.select")}</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.bloodGroup")} *</label>
                    <select name="blood_group" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 shadow-sm text-[15px]">
                      <option value="">{t("auth.register.select")}</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="O+">O+</option><option value="O-">O-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.address")} *</label>
                  <textarea name="current_address" rows="2" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterAddress")}></textarea>
                </div>
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl border border-blue-100 shadow-sm">
              <h3 className="text-xl font-semibold text-blue-900 mb-6 tracking-tight">{t("auth.register.academicDetails")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.department")} *</label>
                  <select name="department" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 shadow-sm text-[15px]">
                    <option value="">{t("auth.register.select")}</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.semester")} *</label>
                  <select name="semester" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 shadow-sm text-[15px]">
                    <option value="">{t("auth.register.select")}</option>
                    <option value="1st">1st Sem</option>
                    <option value="2nd">2nd Sem</option>
                    <option value="3rd">3rd Sem</option>
                    <option value="4th">4th Sem</option>
                    <option value="5th">5th Sem</option>
                    <option value="6th">6th Sem</option>
                    <option value="7th">7th Sem</option>
                    <option value="8th">8th Sem</option>
                    <option value="Pass Out">Pass Out</option>
                  </select>
                </div>
                {formData.semester === "Pass Out" && (
                  <div>
                    <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Pass Out Year *</label>
                    <select
                      required
                      value={passoutYear}
                      onChange={(e) => setPassoutYear(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 shadow-sm text-[15px] bg-white"
                    >
                      <option value="">{t("auth.register.select")}</option>
                      {YEARS.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1 md:h-10 md:flex md:items-end mb-2">{t("auth.register.collegeApplicationId")} *</label>
                  <input name="college_application_id" type="text" onChange={handleChange} required maxLength="15" className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterApplicationId")} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1 md:h-10 md:flex md:items-end mb-2">{t("auth.register.prevExperience")} *</label>
                  <select name="prev_experience" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 shadow-sm text-[15px]">
                    <option value="">{t("auth.register.select")}</option>
                    <option value="Yes">{t("auth.register.yes")}</option>
                    <option value="No">{t("auth.register.no")}</option>
                  </select>
                </div>
                <div className={`col-span-1 ${formData.semester === "Pass Out" ? "md:col-span-1" : "md:col-span-2"}`}>
                  <label className="block text-slate-600 font-bold text-[12px] uppercase tracking-wider ml-1 md:h-10 md:flex md:items-end mb-2">{t("auth.register.extraCurriculum")} *</label>
                  <input name="extra_curriculum" type="text" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterExtraCurriculum")} />
                </div>
              </div>
            </div>

            <div className="bg-white p-3.5 sm:p-8 rounded-2xl sm:rounded-3xl border border-blue-100 shadow-sm">
              <h3 className="text-xl font-semibold text-blue-900 mb-6 tracking-tight">{t("auth.register.profileSetup")}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.bio")} *</label>
                  <textarea name="bio" rows="3" onChange={handleChange} required className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterBio")}></textarea>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.photo")} (500 KB - 1 MB) *</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border border-blue-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-white transition-all duration-200">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-3 text-blue-400" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" /></svg>
                        <p className="mb-1 text-[15px] text-slate-600"><span className="font-semibold text-blue-600">{t("auth.register.uploadClick")}</span></p>
                      </div>
                      <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} required />
                    </label>
                  </div>
                  {photoFile && (
                    <div className="mt-4 flex items-center gap-4 bg-blue-50/50 border border-blue-100 p-3 rounded-2xl w-fit">
                      <img
                        src={URL.createObjectURL(photoFile)}
                        alt="Profile Preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md bg-slate-100 shrink-0"
                      />
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-[13px] text-slate-700 font-extrabold max-w-[200px] truncate">{photoFile.name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-xs text-red-600 font-extrabold hover:text-red-800 transition-colors w-fit cursor-pointer uppercase tracking-wider"
                        >
                          Remove Photo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className={`w-full font-semibold py-4 rounded-2xl transition-all duration-300 text-[17px] mt-2 shadow-lg ${loading ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'}`}>
                {loading ? t("auth.register.submitting") : t("auth.register.submit")}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center border-t border-blue-100 pt-6">
            <p className="text-slate-500 text-[15px]">{t("auth.register.alreadyRegistered")}{' '}
              <button type="button" onClick={() => onSwitch('login')} className="text-blue-600 font-semibold hover:text-blue-800 transition-colors ml-1 cursor-pointer">{t("auth.register.loginHere")}</button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}