"use client";

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('intro');

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
    { id: 'intro', label: '1. Overview & Authority' },
    { id: 'data-collected', label: '2. Data We Collect' },
    { id: 'purpose-basis', label: '3. Purpose & Legal Basis' },
    { id: 'cookies-tracking', label: '4. Cookies & Browser Storage' },
    { id: 'security-storage', label: '5. Security & Protection' },
    { id: 'sharing-thirdparties', label: '6. Third-Party Sharing' },
    { id: 'user-rights', label: '7. Your DPDP Rights' },
    { id: 'aadhaar-health', label: '8. Identity & Health Protection' },
    { id: 'retention-erasure', label: '9. Retention & Account Erasure' },
    { id: 'grievance', label: '10. Grievance Redressal' },
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
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                DPDP Act 2023 & IT Act Compliant
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
                Privacy Policy
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl font-normal leading-relaxed">
                Official Data Protection and Privacy Statement for the National Service Scheme (NSS) Unit, Banwarilal Bhalotia College (B.B. College), Asansol.
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
                <div>Effective Date</div>
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

          {/* Main Privacy Documentation Container */}
          <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10 md:p-12 space-y-12">
            
            {/* Section 1 */}
            <section id="intro" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">1</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Overview & Data Fiduciary Details
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  The <strong>National Service Scheme (NSS) Unit</strong> of <strong>Banwarilal Bhalotia College (B.B. College)</strong>, Asansol, Paschim Bardhaman, West Bengal (affiliated with Kazi Nazrul University and under the aegis of the Ministry of Youth Affairs and Sports, Government of India) operates this official portal.
                </p>
                <p>
                  In accordance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> of India and the <strong>Information Technology Act, 2000</strong>, the NSS Unit of B.B. College acts as the <strong>Data Fiduciary</strong> responsible for determining the purpose and means of processing personal data provided by student volunteers, program officers, and site visitors (the <em>Data Principals</em>).
                </p>
                <p className="bg-blue-50/70 border-l-4 border-blue-600 p-4 rounded-r-2xl text-blue-950 font-medium">
                  We are deeply committed to maintaining absolute transparency, robust encryption standards, and complete institutional accountability in handling your personal, academic, and identification records.
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2 */}
            <section id="data-collected" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">2</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Information We Collect
                </h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base mb-6 leading-relaxed">
                We collect and process only the minimal personal and academic details strictly required for official volunteer registration, camp management, and government reporting:
              </p>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs mb-6">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3.5 px-4">Data Category</th>
                      <th className="py-3.5 px-4">Information Elements</th>
                      <th className="py-3.5 px-4">Institutional Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">Personal Identity</td>
                      <td className="py-3 px-4 text-slate-800">Full Name, Date of Birth, Gender</td>
                      <td className="py-3 px-4">Official roster membership & government demographic reporting.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">Contact Details</td>
                      <td className="py-3 px-4 text-slate-800">Email Address, Phone & WhatsApp Number, Residential Address</td>
                      <td className="py-3 px-4">Official communication, camp notices, WhatsApp updates & emergency alerts.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">National Identity</td>
                      <td className="py-3 px-4 text-slate-800">Aadhaar Identity Number (12 Digits)</td>
                      <td className="py-3 px-4 font-semibold text-amber-800">Strictly for institutional identity verification & State/National NSS accreditation.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">Health & Logistics</td>
                      <td className="py-3 px-4 text-slate-800">Blood Group</td>
                      <td className="py-3 px-4">Emergency blood donation drives & medical logistics during special camps.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">Academic Records</td>
                      <td className="py-3 px-4 text-slate-800">Department, Semester / Academic Status, College Application ID</td>
                      <td className="py-3 px-4">Student verification with college administration & certificate eligibility.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">Family Details</td>
                      <td className="py-3 px-4 text-slate-800">Father's Name, Mother's Name</td>
                      <td className="py-3 px-4">Parental records for residential camps & official certificates.</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">Profile Media & Bio</td>
                      <td className="py-3 px-4 text-slate-800">Passport Photograph, Volunteer Bio, Extra-Curricular Skills</td>
                      <td className="py-3 px-4">ID cards, volunteer profile badges & special event role allocation.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 3 */}
            <section id="purpose-basis" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">3</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Purpose of Processing & Legal Basis
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  Under Section 4 and Section 6 of the DPDP Act 2023, personal data is processed solely based on your explicit consent granted during registration or for specified legitimate uses associated with government educational activities:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li><strong>Volunteer Roster Management:</strong> Maintaining official rosters for B.B. College NSS Units 1, 2, and 3.</li>
                  <li><strong>Certificate Issuance:</strong> Validating completion of mandatory service hours (120 hrs/year) and 7-day Special Camping programs.</li>
                  <li><strong>Emergency Response & Community Health:</strong> Contacting volunteers during blood donation drives or disaster management duties using blood group and address metadata.</li>
                  <li><strong>Government Reporting:</strong> Submitting non-commercial statistical reports to Kazi Nazrul University, Regional Directorate of NSS West Bengal, and the Ministry of Youth Affairs and Sports.</li>
                </ul>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 4 */}
            <section id="cookies-tracking" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">4</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Cookies & Browser Storage
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  Our portal uses essential browser storage items strictly for session security and accurate visitor counting without third-party commercial tracking:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Anonymous Visitor Counter</h4>
                    <p className="text-xs text-slate-600">
                      Anonymized client identifier stored in browser local storage to count total unique website visits without tracking personal identity.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Secure Session Tokens</h4>
                    <p className="text-xs text-slate-600">
                      Encrypted authentication session tokens stored locally to maintain secure login sessions for registered users.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  <em>We do NOT run third-party advertising cookies, cross-site trackers, or commercial monetization scripts.</em>
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 5 */}
            <section id="security-storage" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">5</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Data Security & Storage Protection
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  Your information is stored in secure encrypted cloud database servers with strict Row Level Security policies and HTTPS/TLS 1.3 encryption in transit.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li><strong>Password Hashing:</strong> Passwords are cryptographically salted and hashed; raw passwords are never readable by system administrators.</li>
                  <li><strong>Storage Security:</strong> Volunteer passport photos are stored in secure cloud storage buckets solely for identity card preview and profile validation.</li>
                  <li><strong>Access Controls:</strong> Administrative rights are restricted exclusively to verified NSS Program Officers and designated college web administrators.</li>
                </ul>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 6 */}
            <section id="sharing-thirdparties" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">6</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Third-Party Data Sharing & Integrity
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-950 font-bold text-sm flex items-center gap-3">
                  <svg className="w-6 h-6 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Strict Zero-Commercialization Pledge: We NEVER sell, trade, rent, or monetize your personal information to any third-party marketing agencies or private companies.</span>
                </div>
                <p>Third-party interactions are strictly technical or regulatory:</p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li><strong>Google OAuth:</strong> If you choose Google Sign-In, token authentication is handled securely via Google Cloud APIs.</li>
                  <li><strong>Official WhatsApp Groups:</strong> Redirects to official WhatsApp group links are voluntary for official group updates.</li>
                  <li><strong>Statutory Authorities:</strong> Information may be shared with judicial or government authorities if mandated by law or court orders under the IT Act 2000.</li>
                </ul>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 7 */}
            <section id="user-rights" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">7</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Your Rights as Data Principal (DPDP Act 2023)
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>Under Chapter III of the DPDP Act 2023, you hold statutory rights regarding your personal data:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Right to Access</h4>
                    <p className="text-xs text-slate-600">Review your full registered profile information via your volunteer dashboard anytime.</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Right to Correction</h4>
                    <p className="text-xs text-slate-600">Request correction or updates for inaccurate academic or contact details.</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Right to Erasure</h4>
                    <p className="text-xs text-slate-600">Request complete account deletion and photo purge upon graduation or withdrawal.</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Right to Grievance</h4>
                    <p className="text-xs text-slate-600">Contact our designated Program Officers for quick resolution of privacy concerns.</p>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 8 */}
            <section id="aadhaar-health" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">8</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Identity & Sensitive Health Data Protection
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <div className="p-5 bg-amber-50/80 border border-amber-200 rounded-2xl text-amber-950">
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Aadhaar Data Governance Notice
                  </h4>
                  <p className="text-xs leading-relaxed text-amber-900">
                    Your 12-digit Aadhaar Number collected during registration is used <strong>exclusively for official identity verification</strong> required by college authorities and the State NSS Directorate for issuing government-recognized certificates. Aadhaar data is protected under strict access controls and will NEVER be publicly displayed, published, or transmitted to third-party commercial entities.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 9 */}
            <section id="retention-erasure" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">9</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Data Retention & Account Erasure Policy
                </h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm sm:text-base leading-relaxed">
                <p>
                  Active volunteer records are retained for the duration of your academic program at B.B. College. Following graduation or exit from the NSS unit, non-sensitive summary logs (such as activity hours completed) are archived for official certificate verification records.
                </p>
                <p>
                  If you wish to request immediate profile deletion or removal of your passport photograph from storage, please email your request to the Program Officer via the Grievance contact below. Deletion will be executed upon verification by college administrators.
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 10 */}
            <section id="grievance" className="scroll-mt-32">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">10</span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Data Protection & Grievance Redressal
                </h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base mb-6 leading-relaxed">
                For any privacy inquiries, data correction requests, or statutory grievances under the DPDP Act 2023, please reach out to our designated Data Protection & NSS Authority:
              </p>

              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Data Controller / Authority</div>
                    <h3 className="text-xl font-bold text-white mb-2">NSS Program Officers</h3>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Banwarilal Bhalotia College (B.B. College)<br />
                      USHA GRAM, Asansol, Paschim Bardhaman,<br />
                      West Bengal - 713303, India.
                    </p>
                  </div>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-3 text-slate-300">
                      <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href="mailto:nssunitbbcollege@gmail.com" className="hover:text-white transition-colors underline font-mono">nssunitbbcollege@gmail.com</a>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Response Timeline: Within 72 Hours</span>
                    </div>
                  </div>
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
