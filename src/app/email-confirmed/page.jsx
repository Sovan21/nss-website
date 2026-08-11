"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadConfirmedUserPhoto } from '@/lib/utils';

export default function EmailConfirmedPage() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let handled = false;

    // Check if URL has error parameters in hash or search
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('error=') || hash.includes('error_code=') || search.includes('error=')) {
        if (isMounted) {
          setIsError(true);
          setIsProcessing(false);
        }
        return;
      }
    }

    const processSession = async (session) => {
      if (handled) return;
      handled = true;

      if (!session?.user) {
        if (isMounted) {
          setIsError(true);
          setIsProcessing(false);
        }
        return;
      }

      try {
        const { data: profileData } = await supabase
          .from('registrations')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        await uploadConfirmedUserPhoto(session.user, session.user.email, profileData?.full_name);
      } catch (e) {
        console.error("Photo sync error on email confirmed page:", e);
      } finally {
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nss_user');
          localStorage.removeItem('nss_admin_mode');
          sessionStorage.removeItem('nss_just_registered');
          window.history.replaceState(null, '', window.location.pathname);
        }
        if (isMounted) {
          setIsSuccess(true);
          setIsProcessing(false);
        }
      }
    };

    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        processSession(session);
      } else {
        // Wait a short moment for token hash to be processed if present
        const timer = setTimeout(() => {
          if (!handled && isMounted) {
            setIsError(true);
            setIsProcessing(false);
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
    });

    // 2. Listen for auth state changes (e.g. SIGNED_IN from token hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        processSession(session);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 font-sans antialiased transition-colors duration-300 ${isError ? 'bg-[#181818]' : 'bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.25),rgba(255,255,255,0))]'}`}>
      
      {isProcessing ? (
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-emerald-100/40 text-center relative overflow-hidden animate-fade-in-up">
          <div className="py-10 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>
            <p className="text-slate-600 text-sm font-bold animate-pulse">Verifying &amp; activating your profile...</p>
          </div>
        </div>
      ) : isError ? (
        /* ── Nvidia Style Temporary Link Error Popup ── */
        <div className="w-full max-w-lg bg-[#242424] rounded-2xl shadow-2xl p-8 sm:p-12 border border-slate-700/60 text-center relative overflow-hidden animate-fade-in-up">
          {/* Warning Icon */}
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center text-amber-500">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>

          {/* Error Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight">
            Something Went Wrong
          </h1>

          {/* Error Description */}
          <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed mb-6">
            This confirmation link is no longer valid or has already been used.
          </p>

          <p className="text-slate-500 text-xs font-semibold">
            If you have already verified your email, you can log in directly from your registration device or website.
          </p>
        </div>
      ) : isSuccess ? (
        /* ── Simple Minimal Confirmation Popup (No WhatsApp / Proceed to Login buttons) ── */
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-emerald-100 text-center relative overflow-hidden animate-fade-in-up">
          {/* Green Checkmark Badge */}
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 ring-8 ring-emerald-50">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Simple Success Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">
            Email Verified Successfully!
          </h1>

          {/* Simple Message Only */}
          <p className="text-slate-600 text-sm font-medium leading-relaxed">
            Your email address has been verified. You can now close this tab or return to your registration device.
          </p>

          <p className="mt-8 text-slate-400 text-xs font-medium">
            NSS Unit • Banwarilal Bhalotia College, Asansol
          </p>
        </div>
      ) : null}
    </div>
  );
}
