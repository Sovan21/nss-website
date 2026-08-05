"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/context/LanguageContext';

import { DEPARTMENTS, YEARS } from '@/lib/constants';
import { compressImage } from '@/lib/utils';

export { DEPARTMENTS, YEARS, compressImage };

// Custom Date Picker component that forces DD/MM/YYYY display on ALL devices while showing native calendar
const DateOfBirthInput = ({ value, onChange, name, className, required, placeholder = "DD/MM/YYYY" }) => {
  const hiddenInputRef = useRef(null);

  const displayValue = React.useMemo(() => {
    if (!value) return "";
    if (value.includes("/")) return value;
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
    return value;
  }, [value]);

  const handleTextChange = (e) => {
    let val = e.target.value.replace(/[^\d/]/g, "");
    if (val.length === 2 && !val.includes("/")) {
      val = val + "/";
    } else if (val.length === 5 && val.split("/").length === 2) {
      val = val + "/";
    }
    const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const yyyymmdd = `${match[3]}-${match[2]}-${match[1]}`;
      onChange({ target: { name, value: yyyymmdd } });
    } else {
      onChange({ target: { name, value: val } });
    }
  };

  const handleCalendarChange = (e) => {
    if (e.target.value) {
      onChange({ target: { name, value: e.target.value } });
    }
  };

  const openCalendar = () => {
    if (hiddenInputRef.current) {
      if (typeof hiddenInputRef.current.showPicker === 'function') {
        try { hiddenInputRef.current.showPicker(); } catch (err) { hiddenInputRef.current.focus(); hiddenInputRef.current.click(); }
      } else {
        hiddenInputRef.current.focus();
        hiddenInputRef.current.click();
      }
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        name={name}
        value={displayValue}
        onChange={handleTextChange}
        onClick={openCalendar}
        required={required}
        placeholder={placeholder}
        maxLength={10}
        className={className}
      />
      <button
        type="button"
        onClick={openCalendar}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 p-1 cursor-pointer focus:outline-none z-10"
        title="Open Calendar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      <input
        ref={hiddenInputRef}
        type="date"
        value={value && value.match(/^\d{4}-\d{2}-\d{2}$/) ? value : ''}
        onChange={handleCalendarChange}
        className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
        tabIndex={-1}
      />
    </div>
  );
};

// Inline Lightweight Dropdown Component with Rounded Border Radius & Custom Text (No external file, No icons)
const InlineSelect = ({ name, value, onChange, options = [], placeholder = "Select", label = "Select Option", required = false, showSearch = true, alignRight = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    return options.filter(opt => String(opt).toLowerCase().includes(searchQuery.toLowerCase().trim()));
  }, [options, searchQuery]);

  const handleSelect = (val) => {
    setIsOpen(false);
    setSearchQuery("");
    setTimeout(() => {
      onChange({ target: { name, value: val } });
    }, 10);
  };

  const stopProp = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <select name={name} value={value} onChange={() => {}} required={required} tabIndex={-1} className="sr-only opacity-0 absolute inset-0 pointer-events-none">
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left flex items-center justify-between p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 shadow-sm text-[15px] font-semibold cursor-pointer outline-none transition-all duration-200"
      >
        <span className={value ? "text-slate-800 font-semibold" : "text-slate-400 font-medium"}>
          {value || placeholder}
        </span>
        <svg className={`w-5 h-5 text-blue-600 transform-gpu transition-transform duration-200 ease-out ${isOpen ? "rotate-180" : "rotate-0"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div
          onMouseDown={stopProp}
          onMouseMove={stopProp}
          onMouseUp={stopProp}
          onWheel={stopProp}
          onTouchStart={stopProp}
          onTouchMove={stopProp}
          className={`absolute z-[300] top-full mt-2 w-full ${alignRight ? 'right-0 left-auto min-w-[200px]' : 'left-0 right-auto min-w-[220px]'} bg-white rounded-3xl shadow-2xl border border-blue-100/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="bg-[#043296] px-4 py-3 text-white flex items-center justify-between">
            <span className="font-bold text-[14px] truncate">{label}</span>
            <button type="button" onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
            </button>
          </div>

          {showSearch && options.length > 4 && (
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-[13px] text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 font-medium"
              />
            </div>
          )}

          <div className="max-h-[220px] overflow-y-auto overscroll-contain touch-pan-y p-2 space-y-1 scrollbar-thin scrollbar-thumb-blue-200">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = value === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-150 text-left text-[14px] cursor-pointer ${
                      isSelected
                        ? "bg-[#0052cc] text-white font-bold shadow-md shadow-blue-600/20"
                        : "hover:bg-blue-50 text-slate-700 font-semibold hover:text-blue-900"
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-slate-400 text-[13px] font-medium">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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
  const [resendTimer, setResendTimer] = useState(90);
  const [resendLoading, setResendLoading] = useState(false);
  const registeredCredsRef = useRef(null); // {email, password} for polling
  const pollRef = useRef(null);
  const fileInputRef = useRef(null);

  // 90-second countdown timer for resend confirmation email
  useEffect(() => {
    let interval = null;
    if (showConfirmModal && !emailConfirmed && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [showConfirmModal, emailConfirmed, resendTimer]);

  const handleResendConfirmationEmail = async () => {
    if (resendTimer > 0 || resendLoading || !formData.email) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      toast.success("Confirmation email has been resent!");
      setResendTimer(90);
    } catch (err) {
      toast.error(err?.message || "Failed to resend confirmation email.");
    } finally {
      setResendLoading(false);
    }
  };

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

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'full_name' || name === 'fathers_name' || name === 'mothers_name') {
      value = value.replace(/[^a-zA-Z\s]/g, '');
    }
    if (name === 'college_application_id') {
      value = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }
    if (name === 'phone' || name === 'whatsapp' || name === 'aadhaar_no') {
      value = value.replace(/\D/g, '');
    }
    setFormData({ ...formData, [name]: value });
  };

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

    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(formData.full_name.trim())) {
      toast.error("Full Name must contain only letters and spaces.");
      return;
    }
    if (!nameRegex.test(formData.fathers_name.trim())) {
      toast.error("Father's Name must contain only letters and spaces.");
      return;
    }
    if (!nameRegex.test(formData.mothers_name.trim())) {
      toast.error("Mother's Name must contain only letters and spaces.");
      return;
    }

    if (formData.password.length < 6 || formData.password.length > 16) {
      toast.error("Password must be between 6 and 16 characters.");
      return;
    }

    const aadhaarRegex = /^[0-9]{12}$/;
    if (!aadhaarRegex.test(formData.aadhaar_no)) {
      toast.error("Aadhaar Number must be exactly 12 digits and contain only numbers.");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    if (formData.whatsapp && !phoneRegex.test(formData.whatsapp)) {
      toast.error("WhatsApp number must be exactly 10 digits.");
      return;
    }

    const appIdRegex = /^[A-Z0-9]{15}$/;
    if (!appIdRegex.test(formData.college_application_id)) {
      toast.error("College Application ID must be exactly 15 characters (e.g. BBCOLG123456789).");
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
        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message || "Storage error"}`);
        }

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
      sessionStorage.setItem('nss_just_registered', 'true');
      setShowConfirmModal(true);

    } catch (err) {
      console.error("Registration Error:", err);
      let errorMsg = err?.message || "Registration failed. Please try again.";
      if (errorMsg.toLowerCase().includes("user already registered") || errorMsg.toLowerCase().includes("already exists")) {
        errorMsg = "This email is already registered! Please login or use a different email.";
      } else if (errorMsg.toLowerCase().includes("rate limit") || errorMsg.toLowerCase().includes("over_email_send_rate_limit")) {
        errorMsg = "Email rate limit exceeded. Please wait a few minutes before trying again.";
      }
      toast.error(errorMsg);
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
    <div id="nss-auth-modal" className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 md:p-6 font-sans antialiased">
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
                <p className="text-slate-500 text-[13px] leading-relaxed mb-4">
                  Please open your email inbox and click on the confirmation link to activate your volunteer account. You can confirm from any device.
                </p>

                {/* Resend Confirmation Email Button with 90s Timer */}
                <div className="mb-6">
                  <button
                    type="button"
                    disabled={resendTimer > 0 || resendLoading}
                    onClick={handleResendConfirmationEmail}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 ${resendTimer > 0 || resendLoading ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer active:scale-[0.98]'}`}
                  >
                    {resendLoading ? (
                      <span>Resending Email...</span>
                    ) : resendTimer > 0 ? (
                      <span>Resend Email in {resendTimer}s</span>
                    ) : (
                      <span>Resend Confirmation Email</span>
                    )}
                  </button>
                </div>

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
                  <input name="full_name" type="text" value={formData.full_name} onChange={handleChange} required pattern="[A-Za-z\s]+" title="Only letters and spaces allowed" className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterName")} />
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
                  <DateOfBirthInput
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                    className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 shadow-sm text-[15px] cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.phone")} *</label>
                  <input name="phone" type="tel" inputMode="numeric" value={formData.phone} onChange={handleChange} required minLength="10" maxLength="10" pattern="[0-9]{10}" title="Must be exactly 10 digits" className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterPhone")} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.whatsapp")} ({t("auth.register.optional")})</label>
                  <input name="whatsapp" type="tel" inputMode="numeric" value={formData.whatsapp} onChange={handleChange} minLength="10" maxLength="10" pattern="[0-9]{10}" title="Must be exactly 10 digits" className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.optional")} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.fathersName")} *</label>
                  <input name="fathers_name" type="text" value={formData.fathers_name} onChange={handleChange} required pattern="[A-Za-z\s]+" title="Only letters and spaces allowed" className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterFathersName")} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.mothersName")} *</label>
                  <input name="mothers_name" type="text" value={formData.mothers_name} onChange={handleChange} required pattern="[A-Za-z\s]+" title="Only letters and spaces allowed" className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterMothersName")} />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.aadhaarNo")} *</label>
                  <input name="aadhaar_no" type="text" inputMode="numeric" value={formData.aadhaar_no} onChange={handleChange} required minLength="12" maxLength="12" pattern="[0-9]{12}" title="Must be exactly 12 digits" className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder={t("auth.register.enterAadhaar")} />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.gender")} *</label>
                    <InlineSelect
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                      options={["Male", "Female", "Other"]}
                      placeholder={t("auth.register.select")}
                      label={t("auth.register.gender")}
                      showSearch={false}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.bloodGroup")} *</label>
                    <InlineSelect
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleChange}
                      required
                      options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
                      placeholder={t("auth.register.select")}
                      label={t("auth.register.bloodGroup")}
                      showSearch={false}
                      alignRight={true}
                    />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="flex flex-col justify-end">
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.department")} *</label>
                  <InlineSelect
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    options={DEPARTMENTS}
                    placeholder={t("auth.register.select")}
                    label="Select Your Subject"
                    showSearch={true}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.semester")} *</label>
                  <InlineSelect
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                    options={["1st Sem", "2nd Sem", "3rd Sem", "4th Sem", "5th Sem", "6th Sem", "7th Sem", "8th Sem", "Pass Out"]}
                    placeholder={t("auth.register.select")}
                    label={t("auth.register.semester")}
                    showSearch={false}
                  />
                </div>
                {formData.semester === "Pass Out" && (
                  <div className="flex flex-col justify-end">
                    <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Pass Out Year *</label>
                    <InlineSelect
                      name="passout_year"
                      value={passoutYear}
                      onChange={(e) => setPassoutYear(e.target.value)}
                      required
                      options={YEARS.map(String)}
                      placeholder={t("auth.register.select")}
                      label="Pass Out Year"
                      showSearch={true}
                    />
                  </div>
                )}
                <div className="flex flex-col justify-end">
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.collegeApplicationId")} *</label>
                  <input name="college_application_id" type="text" value={formData.college_application_id} onChange={handleChange} required minLength="15" maxLength="15" pattern="[A-Za-z0-9]{15}" title="Must be exactly 15 characters (e.g. BBCOLG123456789)" style={{ textTransform: 'uppercase' }} className="w-full p-4 bg-slate-50 border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" placeholder="BBCOLG123456789" />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.prevExperience")} *</label>
                  <InlineSelect
                    name="prev_experience"
                    value={formData.prev_experience}
                    onChange={handleChange}
                    required
                    options={["Yes", "No"]}
                    placeholder={t("auth.register.select")}
                    label={t("auth.register.prevExperience")}
                    showSearch={false}
                  />
                </div>
                <div className={`flex flex-col justify-end col-span-1 ${formData.semester === "Pass Out" ? "md:col-span-1" : "md:col-span-2"}`}>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.register.extraCurriculum")} *</label>
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