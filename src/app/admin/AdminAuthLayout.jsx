// File: src/app/admin/layout.jsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export default function AdminAuthLayout({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        // Step 1: Read local session first — no network call, no "Failed to fetch"
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          router.replace('/admin-login');
          return;
        }

        // Step 2: Only hit network to verify admin row if a session exists
        const { data: adminData } = await supabase
          .from('admins')
          .select('email')
          .eq('email', session.user.email)
          .single();

        if (adminData) {
          setIsAuthorized(true);
        } else {
          router.replace('/admin-login');
        }
      } catch (err) {
        // Network unavailable or token expired — redirect to login
        console.warn('Admin auth check failed:', err?.message || err);
        router.replace('/admin-login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const handlePageShow = (event) => {
      if (event.persisted) checkAuth();
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [router]);

  // লোডিং স্টেট (সাথে একটি সুন্দর স্পিনার)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold tracking-widest text-slate-300 animate-pulse">Verifying Secure Access...</p>
        </div>
      </div>
    );
  }

  // যদি ইউজার অথোরাইজড না হয়, তবে রিডাইরেক্ট হওয়ার আগে ফাঁকা স্ক্রিন দেখাবে (নিরাপত্তার জন্য)
  if (!isAuthorized) {
    return <div className="h-screen bg-slate-900"></div>;
  }

  return <>{children}</>;
}