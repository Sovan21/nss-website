"use client";

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TermsAndConditions() {
  const [activeSection, setActiveSection] = useState('acceptance');

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const navItems = [
    { id: 'acceptance', label: '1. Acceptance & Scope' },
    { id: 'eligibility', label: '2. Registration & Accuracy' },
    { id: 'code-conduct', label: '3. Code of Conduct & Motto' },
    { id: 'certification', label: '4. Certificate Eligibility' },
    { id: 'account-security', label: '5. Account Security' },
    { id: 'admin-rights', label: '6. Administrative Rights' },
    { id: 'intellectual-property', label: '7. Intellectual Property' },
    { id: 'disclaimer-liability', label: '8. Liability & Disclaimer' },
    { id: 'modifications', label: '9. Terms Modifications' },
    { id: 'governing-law', label: '10. Jurisdiction & Law' },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans selection:bg-blue-500 selection:text-white print:bg-white print:text-black">
      <div className="print:hidden">
        <Navbar activeTab="" onTabChange={() => (window.location.href = '/')} />
      </div>

      <main className="flex-grow pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 md:p-12 mb-8 shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                Official Terms of Service & Governance
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
                Terms and Conditions
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl font-normal leading-relaxed">
                Rules, Volunteer Standards, and Legal Terms governing the use of the National Service Scheme (NSS) Portal at Banwarilal Bhalotia College, Asansol.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0 print:hidden">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl backdrop-blur-md border border-white/20 transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print / Save PDF
              </button>
              <div className="text-right bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl text-xs font-medium text-slate-300">
                <div>Last Updated</div>
                <div className="font-bold text-white">July 22, 2026</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar */}
          <aside className="lg:col-span-4 xl:col-span-3 sticky top-28 hidden lg:block print:hidden">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">
                Table of Contents
              </h3>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${activeSection === item.id ? 'translate-x-0.5 text-blue-600' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Terms Documentation Container */}
          <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10 md:p-12 space-y-12">
            
            {/* Section 1 */}
            <section id="acceptance" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">1</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Acceptance of Terms & Scope
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  Welcome to the official portal of the <strong>National Service Scheme (NSS) Unit</strong> at <strong>Banwarilal Bhalotia College (B.B. College)</strong>, Asansol. By accessing, registering, or interacting with this website, you explicitly agree to comply with and be bound by these Terms and Conditions.
                </p>
                <p>
                  If you do not agree with any part of these terms, you must refrain from registering as a volunteer or using this digital portal.
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2 */}
            <section id="eligibility" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">2</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Volunteer Registration & Information Accuracy
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  Registration as an NSS Volunteer is open to eligible bonafide students enrolled in undergraduate and postgraduate programs at B.B. College, Asansol.
                </p>
                <div className="p-4 bg-slate-50 border-l-4 border-amber-500 rounded-r-2xl text-slate-800 text-sm space-y-2">
                  <h4 className="font-bold text-amber-900">Mandatory Data Integrity Rules:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    <li>All details provided during registration—including <strong>Full Name, Date of Birth, Aadhaar Number, College Application ID, Department, and Semester</strong>—must be strictly true, accurate, and verifiable against official college documents.</li>
                    <li>Submitting false identity records, forged Aadhaar numbers, or impersonating another student will lead to immediate cancellation of registration, forfeiture of NSS membership, and potential disciplinary action by the College Administration.</li>
                  </ul>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 3 */}
            <section id="code-conduct" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">3</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Volunteer Code of Conduct & Motto
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  All registered volunteers are expected to uphold the foundational ethos and motto of the National Service Scheme: <strong>"NOT ME BUT YOU"</strong>.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li><strong>Discipline & Respect:</strong> Volunteers must maintain exemplary discipline, punctuality, and mutual respect towards community members, fellow volunteers, and Program Officers during all NSS camps and drives.</li>
                  <li><strong>Active Participation:</strong> Active participation in community service, cleanliness drives, awareness rallies, blood donation camps, and environmental initiatives is required.</li>
                  <li><strong>Zero Tolerance:</strong> Misconduct, substance abuse, political disruption, discrimination, or insubordination during NSS activities will result in immediate expulsion.</li>
                </ul>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 4 */}
            <section id="certification" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">4</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  NSS Certificate Eligibility & Mandatory Requirements
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  Mere registration on this portal does <strong>NOT</strong> automatically guarantee the issuance of an official NSS Certificate. Certificates are awarded strictly in accordance with Ministry of Youth Affairs and Sports guidelines upon fulfilling:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                    <h4 className="font-bold text-blue-900 text-sm mb-1">120 Hours / Year</h4>
                    <p className="text-xs text-blue-950">Completion of at least 120 hours of regular community service per academic year over 2 consecutive years.</p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                    <h4 className="font-bold text-blue-900 text-sm mb-1">7-Day Special Camp</h4>
                    <p className="text-xs text-blue-950">Mandatory full residential attendance and satisfactory performance in at least one 7-day Special Camping program.</p>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 5 */}
            <section id="account-security" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">5</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Account Credentials & Password Responsibility
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  Volunteers are solely responsible for maintaining the confidentiality of their login credentials (email and password or OAuth access). Any activity conducted through your authenticated account will be deemed your direct responsibility.
                </p>
                <p className="text-xs text-slate-500">
                  If you suspect unauthorized access to your account, notify the Program Officer immediately.
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 6 */}
            <section id="admin-rights" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">6</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Administrative Rights & Authority
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  The NSS Program Officers and College Principal reserve the absolute right to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Approve, reject, suspend, or terminate any volunteer registration or account access without prior notice if policy violations occur.</li>
                  <li>Modify, update, or remove event announcements, gallery media, committee lists, or site content at their discretion.</li>
                  <li>Moderate user-submitted bios or profile images that violate decency or public harmony standards.</li>
                </ul>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 7 */}
            <section id="intellectual-property" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">7</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Intellectual Property & Copyright Notice
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  All content published on this portal—including text, event photographs, custom UI graphics, logos, and site layout—is the property of the <strong>NSS Unit, Banwarilal Bhalotia College</strong> or used with authorization from official government bodies (Ministry of Youth Affairs and Sports).
                </p>
                <p className="text-xs text-slate-600">
                  Unauthorized reproduction, commercial redistribution, or scraping of content without written authorization from the Principal, B.B. College is strictly prohibited.
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 8 */}
            <section id="disclaimer-liability" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">8</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Limitation of Liability & Disclaimer
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  While every effort is made to maintain accurate information and continuous uptime, the NSS Unit of B.B. College provides this portal on an "AS IS" and "AS AVAILABLE" basis.
                </p>
                <p className="text-xs text-slate-600">
                  The institution shall not be liable for temporary server downtimes, internet network delays, or third-party service outages beyond administrative control.
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 9 */}
            <section id="modifications" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">9</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Modifications to Terms
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  We reserve the right to revise these Terms and Conditions at any time. Updated terms will be published on this page with a revised "Last Updated" timestamp. Continued usage of the portal following updates signifies your full acceptance of the revised terms.
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 10 */}
            <section id="governing-law" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">10</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Governing Law & Legal Jurisdiction
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed mb-6">
                <p>
                  These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of India.
                </p>
                <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs sm:text-sm font-medium border border-slate-800">
                  Exclusive Jurisdiction: Any legal disputes, claims, or proceedings arising out of or in connection with this portal or NSS volunteer membership shall be subject exclusively to the jurisdiction of the competent courts in <strong>Asansol, Paschim Bardhaman, West Bengal, India</strong>.
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      <div className="print:hidden">
        <Footer siteData={{}} />
      </div>
    </div>
  );
}
