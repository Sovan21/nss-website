// File: src/app/Login.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/context/LanguageContext';
import { getPendingPhotoFile, uploadConfirmedUserPhoto } from '@/lib/utils';

// Professional SVG icon components for fact cards
const FactIconBuilding = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
  </svg>
);
const FactIconHeart = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);
const FactIconSun = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);
const FactIconFlag = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
  </svg>
);
const FactIconGlobe = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

// Accurate NSS facts (verified from nss.gov.in & official sources)
const NSSFacts = [
  { Icon: FactIconBuilding, title: "Established", value: "24 September 1969", desc: "Launched during Mahatma Gandhi's Birth Centenary Year" },
  { Icon: FactIconHeart, title: "Inspired By", value: "Mahatma Gandhi", desc: "Founded on Gandhian ideals of selfless service" },
  { Icon: FactIconSun, title: "Symbol", value: "Konark Sun Temple Wheel", desc: "8 bars represent 24 hours of the day" },
  { Icon: FactIconFlag, title: "Motto", value: "NOT ME BUT YOU", desc: "Reflects democratic living & selfless service" },
  { Icon: FactIconGlobe, title: "Launch Scale", value: "37 Universities", desc: "Started with 40,000 student volunteers across India" },
];

export default function Login({ onClose, onSwitch }) {
  const { t } = useLanguage();
  // Prevent background scrolling when modal is active
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      setTimeout(() => {
        if (!document.querySelector('#nss-auth-modal')) {
          document.body.style.overflow = prevOverflow || 'unset';
        }
      }, 50);
    };
  }, []);

  const { toast } = useToast();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [activeFact, setActiveFact] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot Password Flow States
  const [view, setView] = useState('login'); // 'login', 'forgot_email', 'forgot_otp', 'forgot_password'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendTimer, setResendTimer] = useState(90);

  // 90-second resend countdown timer for OTP reset modal
  useEffect(() => {
    let interval = null;
    if (view === 'forgot_otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [view, resendTimer]);

  const handleResendOTP = async () => {
    if (resendTimer > 0 || loading || !forgotEmail) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
      if (error) throw error;
      toast.success("OTP has been resent to your email!");
      setResendTimer(90);
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-cycle through facts
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFact((prev) => (prev + 1) % NSSFacts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // We have a user!
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked a password recovery link! Show the 'New Password' view.
        setView('forgot_password');
        toast.info("Please set your new password below.");
      } else if (event === 'USER_UPDATED') {
        // Ignore password update events in the general listener (handled in handleSetNewPassword)
        return;
      } else if (session?.user) {
        // Signed in! Now fetch or create profile
        const user = session.user;

        // 1. Check if the user profile already exists
        const { data: existingProfile } = await supabase
          .from('registrations')
          .select('*')
          .eq('id', user.id)
          .single();

        let finalProfile;

        if (existingProfile) {
          finalProfile = existingProfile;
          if (!finalProfile.photo_url) {
            const uploadedUrl = await uploadConfirmedUserPhoto(user, user.email, finalProfile.full_name);
            if (uploadedUrl) {
              finalProfile.photo_url = uploadedUrl;
            } else if (user.user_metadata?.photo_url) {
              finalProfile.photo_url = user.user_metadata.photo_url;
              await supabase.from('registrations').update({ photo_url: user.user_metadata.photo_url }).eq('id', user.id);
            }
          }
        } else {
          // If profile doesn't exist (first time Google login), create a basic profile
          const newUserProfile = {
            id: user.id,
            full_name: user.user_metadata.full_name || user.user_metadata.name || 'NSS Volunteer',
            email: user.email,
            photo_url: user.user_metadata.avatar_url || user.user_metadata.picture || '',
          };

          const { data: newProfile, error } = await supabase
            .from('registrations')
            .insert([newUserProfile])
            .select()
            .single();

          if (!error && newProfile) {
            finalProfile = newProfile;
          } else {
            console.error("Failed to create new profile:", error);
            // Fallback so the user is still logged in on the frontend
            finalProfile = newUserProfile;
          }
        }

        if (finalProfile) {
          localStorage.removeItem('nss_admin_mode');
          localStorage.setItem('nss_user', JSON.stringify(finalProfile));
          window.dispatchEvent(new Event('nss_user_logged_in'));

          // Only close automatically if we are not in the middle of a password reset flow
          // because we need the modal to stay open for them to set a new password.
          if (document.getElementById('password-reset-active') === null) {
            setTimeout(() => { if (onClose) onClose(); }, 500);
          }
        }
      }
    });
    return () => { if (subscription) subscription.unsubscribe(); };
  }, [onClose]);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSocialLogin = async (provider) => {
    try {
      setLoading(true);
      sessionStorage.setItem('nss_oauth_pending', 'true');
      // Clear any stale sessions before initiating a new one
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: { redirectTo: window.location.origin + '/' },
      });
      if (error) throw error;
    } catch (err) {
      console.error(`${provider} Login Error:`, err.message);
      toast.error(`Could not authenticate with ${provider}.`);
      sessionStorage.removeItem('nss_oauth_pending');
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (credentials.password.length < 6 || credentials.password.length > 16) {
      toast.error("Password must be between 6 and 16 characters.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Incorrect email or password.");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please confirm your email address before logging in.");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      // Fetch user profile from registrations table
      let { data: profileData } = await supabase
        .from('registrations')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // If email confirmed and photo upload was pending, upload to storage now
      if (data?.user && (!profileData?.photo_url || profileData.photo_url === '')) {
        const pendingFile = getPendingPhotoFile(credentials.email);
        if (pendingFile) {
          const newPhotoUrl = await uploadConfirmedUserPhoto(data.user, credentials.email, profileData?.full_name || '', pendingFile);
          if (newPhotoUrl && profileData) {
            profileData.photo_url = newPhotoUrl;
          }
        }
      }

      toast.success("Signed in successfully!");
      if (profileData && profileData.role === 'admin') {
        localStorage.setItem('nss_admin_mode', 'true');
      } else {
        localStorage.removeItem('nss_admin_mode');
      }
      localStorage.setItem('nss_user', JSON.stringify(profileData));
      window.dispatchEvent(new Event('nss_user_logged_in'));
      if (onClose) onClose();
    } catch (err) {
      console.error("Manual Sign In Error:", err);
      toast.error("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  // --- Forgot Password Flow Handlers ---
  const handleSendResetOTP = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error("Please enter your email.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
      if (error) throw error;
      toast.success("OTP sent to your email.");
      setResendTimer(90);
      setView('forgot_otp');
    } catch (err) {
      toast.error(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!forgotOtp) return toast.error("Please enter the OTP.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: forgotEmail,
        token: forgotOtp,
        type: 'recovery',
      });
      if (error) throw error;
      toast.success("OTP verified. Please set a new password.");
      setView('forgot_password');
    } catch (err) {
      toast.error(err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match.");
    if (newPassword.length < 6 || newPassword.length > 16) return toast.error("Password must be between 6 and 16 characters.");

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw error;
      }

      // Successfully updated password!
      toast.success("Password changed successfully! Please login with your new password.");

      // Sign out safely to clear the temporary recovery session
      await supabase.auth.signOut().catch(() => {});

      // Clear fields and redirect to login view
      setNewPassword('');
      setConfirmPassword('');
      setForgotOtp('');
      setView('login');

    } catch (err) {
      console.error("Password Update Error:", err);
      let errorMsg = err?.message || "Failed to update password.";
      if (
        errorMsg.toLowerCase().includes("session") ||
        errorMsg.toLowerCase().includes("auth") ||
        errorMsg.toLowerCase().includes("token") ||
        errorMsg.toLowerCase().includes("jwt") ||
        errorMsg.toLowerCase().includes("grant")
      ) {
        errorMsg = "Reset session expired or invalid. Please request a new password reset OTP.";
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const socialBtnClass = `w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-[4px_4px_10px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.9)] transition-all duration-300 border border-blue-50 ${loading ? 'opacity-50 cursor-not-allowed pointer-events-none grayscale-[0.5]' : 'hover:shadow-inner hover:scale-105 active:scale-95 cursor-pointer'}`;

  return (
    <div id="nss-auth-modal" className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 font-sans antialiased">
      <div className="absolute inset-0 bg-black/40 transition-opacity cursor-pointer" onClick={onClose}></div>

      <div className="relative z-10 w-full max-w-5xl bg-white shadow-2xl rounded-3xl animate-fade-in-up border border-blue-100 overflow-hidden max-h-[92dvh] md:max-h-[90vh] flex flex-col md:flex-row">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-11 h-11 flex items-center justify-center bg-white hover:bg-slate-100 rounded-full text-slate-600 hover:text-slate-900 transition-all duration-200 border border-slate-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none z-30 cursor-pointer backdrop-blur-sm"
          title="Close"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ===== LEFT PANEL: NSS Branding (hidden on mobile) ===== */}
        <div className="hidden md:flex md:w-[45%] bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative flex-col items-center justify-center p-10 overflow-hidden">
          {/* Background animated circles */}
          <div className="absolute top-[-50px] left-[-50px] w-48 h-48 rounded-full bg-blue-600/20 animate-blob"></div>
          <div className="absolute bottom-[-30px] right-[-30px] w-36 h-36 rounded-full bg-indigo-500/20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-blue-400/5 animate-blob animation-delay-4000"></div>

          {/* NSS Logo */}
          <div className="relative z-10 mb-8">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl mx-auto overflow-hidden ring-4 ring-white/20">
              <img src="/nss-logo.png" alt="NSS Logo" className="w-full h-full object-contain p-0.5 bg-white" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              <div className="hidden items-center justify-center w-full h-full text-blue-900 text-xl font-black bg-white">NSS</div>
            </div>
          </div>

          {/* Motto */}
          <h3 className="relative z-10 text-white font-black text-2xl tracking-tight mb-2 text-center drop-shadow-md">
            NOT ME <span className="text-blue-200">BUT YOU</span>
          </h3>
          <p className="relative z-10 text-blue-50 text-xs font-bold uppercase tracking-[0.25em] mb-10 drop-shadow-sm">
            National Service Scheme
          </p>

          {/* Animated Fact Cards */}
          <div className="relative z-10 w-full max-w-xs">
            {NSSFacts.map((fact, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${i === activeFact ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}
              >
                <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-5 border border-white/25 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-blue-100 shrink-0 shadow-inner">
                      <fact.Icon />
                    </div>
                    <div>
                      <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest drop-shadow-sm">{fact.title}</p>
                      <p className="text-white font-black text-lg leading-tight drop-shadow-md">{fact.value}</p>
                    </div>
                  </div>
                  <p className="text-white/95 text-sm font-medium drop-shadow-sm">{fact.desc}</p>
                </div>
              </div>
            ))}
            {/* Spacer to maintain height */}
            <div className="invisible">
              <div className="bg-transparent rounded-2xl p-5 border border-transparent">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 shrink-0"></div>
                  <div>
                    <p className="text-[10px]">Placeholder</p>
                    <p className="text-lg">Placeholder Value</p>
                  </div>
                </div>
                <p className="text-sm">Placeholder description text that is long enough</p>
              </div>
            </div>
          </div>

          {/* Dots indicator */}
          <div className="relative z-10 flex gap-2 mt-6">
            {NSSFacts.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveFact(i)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer shadow-sm ${i === activeFact ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>

          {/* Swami Vivekananda quote */}
          <div className="relative z-10 mt-8 text-center bg-black/10 px-4 py-3 rounded-2xl backdrop-blur-sm border border-white/10 shadow-inner">
            <p className="text-white/95 text-[12px] font-medium italic leading-relaxed drop-shadow-sm">
              &ldquo;Arise, awake, and stop not till the goal is reached.&rdquo;
            </p>
            <p className="text-blue-200/90 text-[10px] font-bold mt-1.5 uppercase tracking-widest drop-shadow-sm">
              — Swami Vivekananda
            </p>
          </div>

          <div className="relative z-10 mt-8 text-center bg-black/10 px-4 py-3 rounded-2xl backdrop-blur-sm border border-white/10 shadow-inner">
            <p className="text-white/95 text-[12px] font-medium italic leading-relaxed drop-shadow-sm">
              &ldquo;Leader in Education. Guide to the Youth. Architect of Tomorrow.&rdquo;
            </p>
            <p className="text-blue-200/90 text-[10px] font-bold mt-1.5 uppercase tracking-widest drop-shadow-sm">
              — Dr. Amitava Basu
            </p>
          </div>

        </div>

        {/* ===== RIGHT PANEL: Login Form ===== */}
        <div className="flex-1 bg-gradient-to-br from-sky-50 to-blue-50 p-6 md:p-10 flex flex-col justify-center overflow-y-auto max-h-[92dvh] md:max-h-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-md mx-auto w-full">

            {/* Mobile-only NSS branding */}
            <div className="md:hidden text-center mb-6 mt-10">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl shadow-blue-600/20 mx-auto mb-3 ring-2 ring-blue-100 overflow-hidden">
                <img src="/nss-logo.png" alt="NSS" className="w-full h-full object-contain p-0.5 bg-white" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                <div className="hidden items-center justify-center w-full h-full text-blue-900 text-sm font-black bg-white">NSS</div>
              </div>
            </div>

            <div className="text-center mb-8 px-4 sm:px-0">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">
                {view === 'login' ? t("auth.login.title") : view === 'forgot_email' ? t("auth.login.resetTitle") : view === 'forgot_otp' ? 'Enter OTP' : 'New Password'}
              </h2>
              <p className="text-slate-500 text-[14px] sm:text-[15px] font-medium">
                {view === 'login' ? t("auth.login.subtitle") : view === 'forgot_email' ? t("auth.login.resetSubtitle") : view === 'forgot_otp' ? 'Check your email for the 6-digit code' : 'Set a new secure password'}
              </p>
            </div>

            {view === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5 animate-fade-in-up">
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.login.email")}</label>
                  <input name="email" type="email" placeholder="Enter your email" onChange={handleChange} className="w-full p-4 bg-white border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]" required />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 ml-1 mr-1">
                    <label className="block text-slate-600 font-bold text-[12px] uppercase tracking-wider">{t("auth.login.password")}</label>
                    <button type="button" onClick={() => setView('forgot_email')} className="text-blue-600 text-xs font-bold hover:text-blue-800 transition-colors">{t("auth.login.forgotPassword")}</button>
                  </div>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      onChange={handleChange}
                      minLength="6"
                      maxLength="16"
                      className="w-full p-4 pr-12 bg-white border border-blue-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 text-slate-800 placeholder-slate-400 shadow-sm text-[15px]"
                      required
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

                <button type="submit" disabled={loading} className={`w-full font-semibold py-4 rounded-2xl transition-all duration-300 text-[17px] mt-2 shadow-lg cursor-pointer ${loading ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98]'}`}>
                  {loading ? t("auth.login.signingIn") : t("auth.login.signIn")}
                </button>
              </form>
            )}

            {view === 'forgot_email' && (
              <form onSubmit={handleSendResetOTP} className="space-y-5 animate-fade-in-up">
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">{t("auth.login.email")}</label>
                  <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="Enter your registered email" className="w-full p-4 bg-white border border-blue-200 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-[15px]" required />
                </div>
                <button type="submit" disabled={loading} className={`w-full font-semibold py-4 rounded-2xl transition-all text-[17px] mt-2 shadow-lg ${loading ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30 hover:scale-[1.02]'}`}>
                  {loading ? t("auth.login.sending") : t("auth.login.sendResetLink")}
                </button>
                <button type="button" onClick={() => setView('login')} className="w-full text-slate-500 font-semibold text-sm hover:text-slate-800 mt-3">{t("auth.login.backToLogin")}</button>
              </form>
            )}

            {view === 'forgot_otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-5 animate-fade-in-up">
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">6-Digit OTP Code</label>
                  <input type="text" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Enter 6-digit OTP" className="w-full p-4 bg-white border border-blue-200 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-[15px] text-center tracking-[0.5em] font-bold" required minLength={6} maxLength={6} pattern="\d{6}" title="Please enter exactly 6 digits" />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold px-1">
                  <span className="text-slate-500">Didn't receive the OTP code?</span>
                  <button
                    type="button"
                    disabled={resendTimer > 0 || loading}
                    onClick={handleResendOTP}
                    className={`font-bold transition-colors cursor-pointer ${resendTimer > 0 || loading ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>

                <button type="submit" disabled={loading} className={`w-full font-semibold py-4 rounded-2xl transition-all text-[17px] mt-2 shadow-lg ${loading ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30 hover:scale-[1.02]'}`}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button type="button" onClick={() => setView('login')} className="w-full text-slate-500 font-semibold text-sm hover:text-slate-800 mt-3">Cancel</button>
              </form>
            )}

            {view === 'forgot_password' && (
              <form onSubmit={handleSetNewPassword} className="space-y-5 animate-fade-in-up">
                <input type="hidden" id="password-reset-active" value="true" />
                <div>
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="6 to 16 characters"
                      className="w-full p-4 pr-12 bg-white border border-blue-200 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-[15px]"
                      required
                      minLength={6}
                      maxLength={16}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1 z-10"
                    >
                      {showNewPassword ? (
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
                  <label className="block text-slate-600 font-bold mb-2 text-[12px] uppercase tracking-wider ml-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full p-4 pr-12 bg-white border border-blue-200 rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-[15px]"
                      required
                      minLength={6}
                      maxLength={16}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1 z-10"
                    >
                      {showConfirmPassword ? (
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
                <button type="submit" disabled={loading} className={`w-full font-semibold py-4 rounded-2xl transition-all text-[17px] mt-2 shadow-lg ${loading ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30 hover:scale-[1.02]'}`}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}

            {view === 'login' && (
              <>
                <div className="mt-6 text-center border-t border-blue-100 pt-5">
                  <p className="text-slate-500 text-[14px] sm:text-[15px]">
                    {t("auth.login.noAccount")}{' '}
                    <button type="button" onClick={() => onSwitch('register')} className="text-blue-600 font-semibold hover:text-blue-800 transition-colors ml-1 cursor-pointer">
                      {t("auth.login.registerHere")}
                    </button>
                  </p>
                </div>

                <div className="mt-5 flex flex-col items-center">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-5">{t("auth.login.orContinueWith")}</p>
                  <div className="flex justify-center items-center gap-4">
                    <button type="button" disabled={loading} onClick={() => handleSocialLogin('google')} className={socialBtnClass} title="Google">
                      <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" className="w-6 h-6" alt="Google" />
                    </button>
                    <button type="button" disabled={loading} onClick={() => handleSocialLogin('facebook')} className={socialBtnClass} title="Facebook">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg" className="w-6 h-6" alt="Facebook" />
                    </button>
                    <button type="button" disabled={loading} onClick={() => handleSocialLogin('linkedin_oidc')} className={socialBtnClass} title="LinkedIn">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" className="w-6 h-6" alt="LinkedIn" />
                    </button>
                    <button type="button" disabled={loading} onClick={() => handleSocialLogin('github')} className={socialBtnClass} title="GitHub">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" className="w-6 h-6" alt="GitHub" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}