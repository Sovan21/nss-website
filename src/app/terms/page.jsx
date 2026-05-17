"use client";
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans">
      <Navbar activeTab="" onTabChange={() => window.location.href = '/'} />

      <main className="flex-grow pt-28 pb-16 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12">
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Terms and Conditions</h1>
            <p className="text-slate-500 font-medium">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="prose prose-slate max-w-none text-slate-700 space-y-6">
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the official website of the National Service Scheme (NSS) Unit, Banwarilal Bhalotia College (B.B. College), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this portal.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">2. Purpose of the Portal</h2>
              <p>
                This website serves as a digital platform for managing NSS volunteer registrations, disseminating information regarding community service events, and maintaining communication between the NSS Program Officers and student volunteers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">3. Volunteer Registration and Conduct</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Accuracy:</strong> All information provided during registration (Name, Roll No, Blood Group, etc.) must be strictly accurate. Providing false information may lead to termination of your NSS membership.</li>
                <li><strong>Discipline:</strong> Registered volunteers are expected to uphold the motto "Not Me But You" and maintain strict discipline during all NSS activities and camps.</li>
                <li><strong>Participation:</strong> Registration does not guarantee an NSS certificate. Volunteers must complete the mandated hours of regular activities and special camping programs as per government guidelines.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">4. Administrative Rights</h2>
              <p>
                The NSS Program Officers and College Administration reserve the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Approve, reject, or terminate any volunteer registration without prior notice if misconduct or policy violation is detected.</li>
                <li>Modify event schedules, gallery images, and site content at their sole discretion.</li>
                <li>Revoke access to the platform for any user attempting to misuse the system.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">5. Intellectual Property</h2>
              <p>
                All content, logos, text, graphics, and images on this site are the property of the NSS Unit, B.B. College, or used with permission from the Ministry of Youth Affairs and Sports, Government of India. Unauthorized use, reproduction, or distribution is strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">6. Modifications</h2>
              <p>
                We reserve the right to modify these terms at any time. Changes will be updated on this page, and your continued use of the website signifies your acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3 border-b pb-2">7. Contact Information</h2>
              <p>
                For any queries regarding these terms, please contact the NSS Program Officers via the details provided on the Contact Us page.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer siteData={{}} />
    </div>
  );
}
