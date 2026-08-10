"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { uploadConfirmedUserPhoto } from '@/lib/utils';

export default function EmailConfirmedPage() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [confirmedEmail, setConfirmedEmail] = useState('');

  useEffect(() => {
    const processConfirmation = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setConfirmedEmail(session.user.email || '');
          try {
            const { data: profileData } = await supabase
              .from('registrations')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            await uploadConfirmedUserPhoto(session.user, session.user.email, profileData?.full_name);
          } catch (e) {
            console.error("Photo sync error on email confirmed page:", e);
          }
        }
      } catch (err) {
        console.error("Confirmation processing error:", err);
      } finally {
        // Guarantee user is signed out so NO auto-login happens
        await supabase.auth.signOut();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nss_user');
          localStorage.removeItem('nss_admin_mode');
          sessionStorage.removeItem('nss_just_registered');
          window.history.replaceState(null, '', window.location.pathname);
        }
        setIsProcessing(false);
      }
    };

    processConfirmation();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.25),rgba(255,255,255,0))] flex items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 border border-emerald-100/40 text-center relative overflow-hidden animate-fade-in-up">
        {/* Top Decorative Emerald Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {isProcessing ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>
            <p className="text-slate-600 text-sm font-bold animate-pulse">Verifying &amp; activating your profile...</p>
          </div>
        ) : (
          <>
            {/* Green Checkmark Animated Badge */}
            <div className="relative z-10 w-24 h-24 mx-auto mb-6 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 ring-8 ring-emerald-50">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Main Content */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">
              Email Verified Successfully!
            </h1>

            <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
              Your NSS Volunteer profile has been activated. Please join our official WhatsApp Group to stay updated with all activities, events, and announcements.
            </p>

            {confirmedEmail && (
              <div className="mb-6 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs font-bold text-emerald-900 inline-block break-all">
                ✓ Activated account: <span className="text-emerald-700 font-extrabold">{confirmedEmail}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3.5 relative z-10">
              {/* Join WhatsApp Group Button */}
              <a
                href="https://chat.whatsapp.com/CVhiRk37OzC3tVCVdUv5wR"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 px-6 rounded-2xl transition duration-300 shadow-lg shadow-emerald-600/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2.5 text-base no-underline"
              >
                <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.426.002 9.842-4.414 9.845-9.843.002-2.63-1.023-5.101-2.886-6.968C16.366 1.94 13.9 .916 11.999.916 6.574.916 2.16 5.334 2.158 10.766c-.001 1.503.402 2.974 1.168 4.29l-.993 3.627 3.724-.977 1.01.6c1.479.88 3.011 1.342 4.63 1.343h.001zm10.435-7.234c-.267-.134-1.58-.779-1.824-.868-.244-.09-.422-.134-.6.134-.178.267-.689.868-.844 1.047-.156.178-.311.2-.578.067-.267-.134-1.127-.416-2.148-1.327-.795-.71-1.332-1.587-1.488-1.854-.156-.267-.017-.411.116-.544.12-.12.267-.312.4-.467.133-.156.178-.267.267-.445.09-.178.044-.334-.022-.467-.067-.134-.6-1.446-.822-1.98-.217-.522-.455-.45-.6-.458-.138-.008-.297-.01-.456-.01-.159 0-.418.06-.637.29-.219.23-.837.818-.837 1.995 0 1.178.857 2.316.975 2.478.118.162 1.686 2.574 4.084 3.607.57.246 1.016.393 1.363.503.573.182 1.094.156 1.506.095.459-.069 1.58-.646 1.802-1.238.223-.593.223-1.102.156-1.238-.067-.134-.244-.214-.511-.348z" />
                </svg>
                Join WhatsApp Group
              </a>

              {/* Proceed to Login Button */}
              <Link
                href="/#login"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 px-6 rounded-2xl transition duration-200 shadow-md flex items-center justify-center gap-2 text-sm no-underline"
              >
                <span>Proceed to Login</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </>
        )}

        {/* Footer Subtext */}
        <p className="mt-6 text-slate-400 text-xs font-medium">
          NSS Unit • Banwarilal Bhalotia College, Asansol
        </p>
      </div>
    </div>
  );
}
