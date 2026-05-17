"use client";
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans">
      <Navbar activeTab="" onTabChange={() => window.location.href = '/'} />

      <main className="flex-grow pt-28 pb-16 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12">
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Privacy Policy</h1>
            <p className="text-slate-500 font-medium">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="prose prose-slate max-w-none text-slate-700 space-y-6">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">1. Introduction</h2>
              <p>
                The National Service Scheme (NSS) Unit of Banwarilal Bhalotia College respects your privacy and is committed to protecting your personal data. This Privacy Policy outlines how we collect, use, and safeguard the information you provide while using our official portal.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">2. Information We Collect</h2>
              <p>When you register or interact with our portal, we may collect the following information:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Personal Identification Data:</strong> Name, Email Address, Phone/WhatsApp Number, and Date of Birth.</li>
                <li><strong>Academic Information:</strong> Department, Semester, and College Roll Number.</li>
                <li><strong>Health & Logistics Data:</strong> Blood Group and Current Address (necessary for organizing health camps and emergency logistics during special camps).</li>
                <li><strong>Authentication Data:</strong> OAuth tokens and profile images if you sign in using Google or Facebook.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">3. How We Use Your Information</h2>
              <p>The collected data is strictly used for official NSS purposes, including:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Managing volunteer enrollments and maintaining the official NSS roster.</li>
                <li>Communicating updates regarding upcoming events, drives, and special camps.</li>
                <li>Generating official NSS certificates based on activity logs.</li>
                <li>Coordinating blood donation camps and emergency responses (using Blood Group data).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">4. Data Sharing and Protection</h2>
              <p>
                We do not sell, trade, or rent your personal data to third parties. Your information is securely stored and only accessible to authorized NSS Program Officers, College System Administrators, and the regional/national NSS Directorate when required for official reporting.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">5. Cookies and Tracking</h2>
              <p>
                Our portal uses minimal local storage and session cookies solely to maintain your login state and improve user experience. We do not use third-party tracking cookies for advertising purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">6. Your Rights</h2>
              <p>
                As a registered volunteer, you have the right to view, update, or correct your profile information through your dashboard. If you wish to withdraw your registration, you may contact the NSS Program Officers to have your data securely archived or removed from the active roster.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">7. Contact Us</h2>
              <p>
                If you have any questions or concerns regarding this Privacy Policy or how your data is handled, please reach out to us via the Contact Us page on this portal.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer siteData={{}} />
    </div>
  );
}
