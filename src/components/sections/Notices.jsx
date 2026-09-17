"use client";
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { Icons } from "@/components/Icons";
import { useLanguage } from "@/context/LanguageContext";
import useScrollLock from "@/lib/useScrollLock";

const NOTICE_CATEGORIES = [
  { id: "all", label: "All Notices", labelBn: "সকল বিজ্ঞপ্তি" },
  { id: "urgent", label: "Urgent & New", labelBn: "জরুরি ও নতুন" },
  { id: "enrolment", label: "Enrolment", labelBn: "ভর্তি ও নিবন্ধন" },
  { id: "camps", label: "Special Camps", labelBn: "বিশেষ শিবির" },
  { id: "events", label: "Events & Drives", labelBn: "কার্যক্রম" },
  { id: "guidelines", label: "Guidelines", labelBn: "নিয়মাবলী" },
  { id: "general", label: "General Circular", labelBn: "সাধারণ বিজ্ঞপ্তি" }
];

const getCategoryName = (cat) => {
  switch (cat) {
    case 'enrolment': return 'Volunteer Enrolment';
    case 'camps': return 'Special Camps';
    case 'events': return 'Activities & Drives';
    case 'guidelines': return 'Guidelines & Rules';
    default: return 'General Circular';
  }
};

export default function Notices({ prefetchedNotices }) {
  const { locale } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNoticeModal, setActiveNoticeModal] = useState(null);
  const [noticesList, setNoticesList] = useState([]);
  const [loading, setLoading] = useState(!prefetchedNotices);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useScrollLock(!!activeNoticeModal);

  const formatNoticeItems = (data) => {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => ({
      id: item.id,
      refNo: item.ref_no || item.refNo || `BBC/NSS/2026/NOT-${item.id}`,
      title: item.title,
      category: item.category || 'general',
      categoryName: getCategoryName(item.category),
      date: item.date ? item.date.split('T')[0] : '2026-01-01',
      isUrgent: Boolean(item.is_urgent ?? item.isUrgent),
      isNew: Boolean(item.is_new ?? item.isNew),
      issuedBy: item.issued_by || item.issuedBy || 'Programme Officer, NSS Unit I & II',
      summary: item.summary || '',
      body: item.body || '',
      signatory: item.signatory || 'Programme Officer\nNSS Unit I & II\nBanwarilal Bhalotia College, Asansol'
    }));
  };

  // Listen for open notice event from search
  useEffect(() => {
    const handleOpenNotice = (e) => {
      if (e?.detail) {
        const target = noticesList.find(n => String(n.id) === String(e.detail) || n.refNo === e.detail || n.title === e.detail);
        if (target) {
          setActiveNoticeModal(target);
        }
      }
    };
    window.addEventListener("nss_open_notice", handleOpenNotice);
    return () => window.removeEventListener("nss_open_notice", handleOpenNotice);
  }, [noticesList]);

  useEffect(() => {
    if (prefetchedNotices && prefetchedNotices.length > 0) {
      setNoticesList(formatNoticeItems(prefetchedNotices));
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchDynamicNotices = async () => {
      setLoading(true);
      try {
        let { data, error } = await supabase.from('nss_notices').select('*').order('date', { ascending: false });
        if (error) {
          const fallback = await supabase.from('notices').select('*').order('date', { ascending: false });
          if (!fallback.error && fallback.data) data = fallback.data;
        }

        if (isMounted) {
          if (data && Array.isArray(data)) {
            setNoticesList(formatNoticeItems(data));
          } else {
            setNoticesList([]);
          }
        }
      } catch (e) {
        console.warn('Dynamic notices fetch error:', e);
        if (isMounted) setNoticesList([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDynamicNotices();
    return () => { isMounted = false; };
  }, [prefetchedNotices]);

  const filteredNotices = useMemo(() => {
    return noticesList.filter((item) => {
      const matchesCategory = 
        selectedCategory === "all" ||
        (selectedCategory === "urgent" && (item.isUrgent || item.isNew)) ||
        item.category === selectedCategory;
      
      const matchesSearch = !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.body.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [noticesList, selectedCategory, searchQuery]);

  const handlePrintNotice = () => {
    if (!activeNoticeModal) return;

    // Remove any existing print iframe
    const oldIframe = document.getElementById("nss-notice-print-frame");
    if (oldIframe) {
      document.body.removeChild(oldIframe);
    }

    // Create an isolated hidden iframe dedicated ONLY for the notice letterhead
    const iframe = document.createElement("iframe");
    iframe.id = "nss-notice-print-frame";
    iframe.style.position = "fixed";
    iframe.style.top = "-99999px";
    iframe.style.left = "-99999px";
    iframe.style.width = "850px";
    iframe.style.height = "1200px";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title></title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            @page {
              size: auto;
              margin: 0; /* Completely removes browser default header (date, title) and footer (URL, page number) */
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              width: 100%;
              height: 100%;
              min-height: 100%;
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #0f172a;
              -webkit-font-smoothing: antialiased;
            }
            .notice-paper {
              width: 100%;
              max-width: 100%;
              min-height: 100vh;
              height: 100%;
              margin: 0 auto;
              padding: 14mm 18mm 14mm 18mm;
              background: #ffffff;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-sizing: border-box;
            }
            .content-section {
              flex: 1 0 auto;
              display: flex;
              flex-direction: column;
            }
            .header-block {
              text-align: center;
              padding-bottom: 12px;
              border-bottom: 2.5px solid #003366;
              margin-bottom: 12px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .logos-wrap {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 16px;
              margin-bottom: 8px;
            }
            .logo-img {
              height: 48px;
              width: auto;
              object-fit: contain;
            }
            .college-title {
              font-family: 'Poppins', sans-serif;
              font-size: 15.5pt;
              font-weight: 900;
              color: #003366;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              line-height: 1.25;
            }
            .unit-title {
              font-size: 11pt;
              font-weight: 700;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 3px;
            }
            .affiliation-text {
              font-size: 8.5pt;
              color: #64748b;
              font-weight: 500;
              margin-top: 3px;
            }
            .meta-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 9.5pt;
              font-weight: 600;
              color: #334155;
              padding-bottom: 6px;
              border-bottom: 1px solid #e2e8f0;
              margin-bottom: 14px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .meta-bar strong {
              color: #0f172a;
              font-weight: 800;
            }
            .subject-container {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 14px;
              margin-bottom: 16px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .subject-tag {
              font-size: 8pt;
              font-weight: 800;
              color: #004899;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              display: block;
              margin-bottom: 3px;
            }
            .subject-text {
              font-size: 12pt;
              font-weight: 800;
              color: #0f172a;
              line-height: 1.35;
            }
            .body-text {
              font-size: 10.5pt;
              color: #1e293b;
              line-height: 1.7;
              white-space: pre-line;
              text-align: justify;
              margin-bottom: 24px;
            }
            .signature-area {
              margin-top: auto;
              padding-top: 16px;
              border-top: 2.5px solid #003366;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .sig-col-left {
              text-align: left;
            }
            .sig-col-right {
              text-align: right;
            }
            .sig-bar {
              width: 110px;
              height: 2px;
              background: #003366;
              margin-bottom: 8px;
            }
            .sig-bar-right {
              margin-left: auto;
            }
            .sig-heading {
              font-size: 10.5pt;
              font-weight: 800;
              color: #0f172a;
              line-height: 1.3;
            }
            .sig-name {
              font-size: 10pt;
              font-weight: 700;
              color: #003366;
              margin-top: 2px;
              line-height: 1.3;
            }
            .sig-sub {
              font-size: 8.5pt;
              color: #64748b;
              margin-top: 1px;
            }
            .seal-subtext {
              font-size: 8pt;
              color: #94a3b8;
              font-style: italic;
              margin-top: 2px;
            }
          </style>
        </head>
        <body>
          <div class="notice-paper">
            <div class="content-section">
              <div class="header-block">
                <div class="logos-wrap">
                  <img src="/nss-logo.png" class="logo-img" alt="NSS Logo" />
                  <img src="/BBCollege Logo.jpeg" class="logo-img" alt="College Logo" />
                </div>
                <div class="college-title">BANWARILAL BHALOTIA COLLEGE, ASANSOL</div>
                <div class="unit-title">NATIONAL SERVICE SCHEME (NSS) UNIT - I & II</div>
                <div class="affiliation-text">Affiliated to Kazi Nazrul University • NAAC Accredited • Ministry of Youth Affairs & Sports, Govt. of India</div>
              </div>

              <div class="meta-bar">
                <span>Ref. No: <strong>${activeNoticeModal.refNo}</strong></span>
                <span>Date: <strong>${activeNoticeModal.date}</strong></span>
              </div>

              <div class="subject-container">
                <span class="subject-tag">SUBJECT:</span>
                <div class="subject-text">${activeNoticeModal.title}</div>
              </div>

              <div class="body-text">${activeNoticeModal.body}</div>
            </div>

            <div class="signature-area">
              <div class="sig-col-left">
                <div class="sig-bar"></div>
                <div class="sig-heading">Principal, B.B. College</div>
                <div class="sig-name">Dr. Amitava Basu</div>
                <div class="sig-sub">Banwarilal Bhalotia College, Asansol</div>
                <div class="seal-subtext">(Approved & Signed)</div>
              </div>

              <div class="sig-col-right">
                <div class="sig-bar sig-bar-right"></div>
                <div class="sig-heading">Programme Officer</div>
                <div class="sig-name">NSS Unit I & II</div>
                <div class="sig-sub">Banwarilal Bhalotia College, Asansol</div>
                <div class="seal-subtext">(Issued via Official Digital Seal)</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger isolated print
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        window.print();
      }
    }, 300);
  };

  return (
    <div className="w-full bg-[#faf9f6] py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col">
        
        {/* ================= HEADER ================= */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-black uppercase tracking-widest shadow-xs mb-2.5">
            <Icons.Megaphone className="w-4 h-4 text-amber-600" />
            <span>{locale === 'bn' ? 'অফিসিয়াল সার্কুলার ও নোটিশ বোর্ড' : 'Official Notice Board & Circulars'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight font-poppins">
            {locale === 'bn' ? 'বিজ্ঞপ্তি ও' : 'Notices &'} <span className="text-[#004899] underline decoration-amber-400 decoration-4 underline-offset-8">{locale === 'bn' ? 'ঘোষণা' : 'Circulars'}</span>
          </h2>

          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            {locale === 'bn'
              ? 'এনএসএস ইউনিট-I ও ইউনিট-II এর সমস্ত আনুষ্ঠানিক আদেশ, ক্যাম্প শিডিউল, এবং স্বেচ্ছাসেবক সংক্রান্ত জরুরি নির্দেশাবলী।'
              : 'Official administrative orders, volunteer enrolment circulars, camping guidelines, and activity announcements.'}
          </p>
        </div>

        {/* ================= FILTERS & SEARCH ================= */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {NOTICE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#004899] text-white shadow-md shadow-blue-900/20'
                      : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700'
                  }`}
                >
                  {locale === 'bn' ? cat.labelBn : cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72 shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'bn' ? 'বিজ্ঞপ্তি খুঁজুন (শিরোনাম বা মেমো নং)...' : 'Search circulars or memo ref...'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ================= NOTICES LIST ================= */}
        {loading ? (
          <div className="text-center py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#004899] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-semibold text-xs">
              {locale === 'bn' ? 'বিজ্ঞপ্তি লোড হচ্ছে...' : 'Loading Official Circulars...'}
            </p>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm my-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.Document className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {locale === 'bn' ? 'কোনো সক্রিয় বিজ্ঞপ্তি পাওয়া যায়নি' : 'No Official Circulars Published Yet'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {locale === 'bn'
                ? 'এডমিন প্যানেল থেকে কোনো নোটিশ বা আদেশ প্রকাশ করা হলে তা এখানে প্রদর্শিত হবে।'
                : 'When new administrative circulars are issued from the Admin Panel, they will appear here.'}
            </p>
            {(selectedCategory !== 'all' || searchQuery) && (
              <button
                onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
                className="mt-4 px-4 py-2 bg-[#004899] text-white rounded-xl text-xs font-bold hover:bg-[#003366] transition-colors cursor-pointer"
              >
                {locale === 'bn' ? 'সব ফিল্টার রিসেট করুন' : 'Reset Filters'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotices.map((notice) => (
              <div
                key={notice.id}
                className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all duration-300 hover:shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 cursor-pointer ${
                  notice.isUrgent 
                    ? 'border-amber-300/80 bg-gradient-to-r from-amber-50/30 via-white to-white' 
                    : 'border-slate-200/80 hover:border-blue-300'
                }`}
                onClick={() => setActiveNoticeModal(notice)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon Stamp */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
                    notice.isUrgent 
                      ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                      : 'bg-blue-50 text-[#004899] border border-blue-100'
                  }`}>
                    <Icons.Document className="w-6 h-6" />
                  </div>

                  {/* Text Information */}
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {notice.refNo}
                      </span>
                      <span className="text-[11px] font-bold text-[#004899] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {notice.categoryName}
                      </span>
                      {notice.isUrgent && (
                        <span className="text-[10px] font-black text-amber-900 bg-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                          Urgent
                        </span>
                      )}
                      {notice.isNew && (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          New
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 hover:text-blue-700 transition-colors leading-snug">
                      {notice.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {notice.summary}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-3 font-medium">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Icons.Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {notice.date}
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">{notice.issuedBy}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveNoticeModal(notice);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#004899] hover:bg-[#003366] text-white font-bold text-xs rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <Icons.BookOpen className="w-4 h-4" />
                  <span>{locale === 'bn' ? 'বিজ্ঞপ্তি দেখুন' : 'View Circular'}</span>
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ================= OFFICIAL CIRCULAR MODAL (PORTALED ABOVE NAVBAR & FOOTER) ================= */}
      {mounted && activeNoticeModal && createPortal(
        <div className="notice-print-portal-root notice-modal-wrapper fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 font-sans animate-fade-in pointer-events-auto">
          {/* Print Styles for Guaranteed Single Page & Clean Letterhead Output */}
          <style type="text/css">{`
            @media print {
              body > *:not(.notice-print-portal-root) {
                display: none !important;
              }
              html, body {
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
                min-height: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .notice-print-portal-root {
                position: static !important;
                display: block !important;
                width: 100% !important;
                height: auto !important;
                padding: 0 !important;
                margin: 0 !important;
                background: transparent !important;
                inset: auto !important;
                z-index: auto !important;
              }
              .no-print,
              .notice-modal-backdrop,
              .notice-modal-topbar,
              .notice-modal-footer {
                display: none !important;
              }
              .notice-modal-card {
                position: static !important;
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                max-height: none !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                background: #ffffff !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
              }
              #official-notice-print-paper {
                padding: 14mm 18mm 14mm 18mm !important;
                margin: 0 !important;
                width: 100% !important;
                height: 100% !important;
                min-height: 100vh !important;
                overflow: visible !important;
                background: #ffffff !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                box-sizing: border-box !important;
              }
              .notice-header-block,
              .notice-meta-bar,
              .notice-subject-box,
              .notice-signature-area {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .notice-body-content {
                page-break-inside: auto !important;
                break-inside: auto !important;
              }
              @page {
                size: auto;
                margin: 0;
              }
            }
          `}</style>

          {/* Backdrop */}
          <div
            className="no-print notice-modal-backdrop absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setActiveNoticeModal(null)}
          ></div>

          {/* Modal Card */}
          <div className="notice-modal-card relative z-10 w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] animate-fade-in-up">
            
            {/* Top Modal Bar (Hidden on Print) */}
            <div className="no-print notice-modal-topbar w-full bg-[#004899] text-white px-5 sm:px-8 py-4 flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5">
                <Icons.Document className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm tracking-wide">
                  Official Administrative Circular
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintNotice}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Print Notice"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24-1.048-.37-2.14-.37-3.26 0-4.418 3.582-8 8-8s8 3.582 8 8a7.96 7.96 0 01-1.39 4.47m-4.61 5.96a7.964 7.964 0 01-2 .25c-4.418 0-8-3.582-8-8 0-.46.04-.91.11-1.35m14.89 0A8.005 8.005 0 0012 2.25c-4.418 0-8 3.582-8 8 0 1.94.69 3.72 1.84 5.12M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Print</span>
                </button>

                <button
                  onClick={() => setActiveNoticeModal(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close Notice Modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Notice Paper Content (Target for 1-Page Print) */}
            <div id="official-notice-print-paper" className="p-6 sm:p-10 overflow-y-auto flex-grow bg-white text-slate-800 flex flex-col justify-between min-h-[480px]">
              
              <div className="flex-1 flex flex-col space-y-6">
                {/* Institutional Header with Logos */}
                <div className="notice-header-block flex flex-col items-center text-center pb-5 border-b-2 border-[#003366]">
                  <div className="flex items-center gap-3 mb-2 justify-center">
                    <img src="/nss-logo.png" alt="NSS Logo" className="w-12 h-12 object-contain" />
                    <img src="/BBCollege Logo.jpeg" alt="College Logo" className="w-11 h-11 object-contain rounded-full" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-[#003366] tracking-wide uppercase font-poppins">
                    BANWARILAL BHALOTIA COLLEGE, ASANSOL
                  </h2>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-700 tracking-wider uppercase">
                    NATIONAL SERVICE SCHEME (NSS) UNIT - I & II
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Affiliated to Kazi Nazrul University • NAAC Accredited • Ministry of Youth Affairs & Sports, Govt. of India
                  </p>
                </div>

                {/* Memo Meta & Date Row */}
                <div className="notice-meta-bar flex flex-row items-center justify-between text-xs font-bold text-slate-600 pb-2 border-b border-slate-200 gap-2">
                  <span>Ref. No: <strong className="text-slate-900 font-mono">{activeNoticeModal.refNo}</strong></span>
                  <span>Date: <strong className="text-slate-900">{activeNoticeModal.date}</strong></span>
                </div>

                {/* Notice Title / Subject */}
                <div className="notice-subject-box p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-[#004899] uppercase tracking-wider block mb-0.5">
                    SUBJECT:
                  </span>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                    {activeNoticeModal.title}
                  </h4>
                </div>

                {/* Notice Full Body */}
                <div className="notice-body-content text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line space-y-3">
                  {activeNoticeModal.body}
                </div>
              </div>

              {/* Signatures & Seal with ample room for signing (Bottom Aligned) */}
              <div className="notice-signature-area pt-12 mt-10 border-t-2 border-[#003366] flex flex-row justify-between items-end gap-3 text-xs w-full">
                <div className="text-left flex flex-col items-start min-w-0 flex-1">
                  <div className="w-16 sm:w-24 h-0.5 bg-[#003366] mb-1.5"></div>
                  <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">Principal, B.B. College</h5>
                  <p className="font-bold text-[#003366] text-[11px] sm:text-xs">Dr. Amitava Basu</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Banwarilal Bhalotia College, Asansol</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 italic mt-0.5">
                    (Approved & Signed)
                  </p>
                </div>

                <div className="text-right flex flex-col items-end min-w-0 flex-1">
                  <div className="w-16 sm:w-24 h-0.5 bg-[#003366] mb-1.5"></div>
                  <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm">Programme Officer</h5>
                  <p className="font-bold text-[#003366] text-[11px] sm:text-xs">NSS Unit I & II</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Banwarilal Bhalotia College, Asansol</p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 italic mt-0.5">
                    (Issued via Official Digital Seal)
                  </p>
                </div>
              </div>

            </div>

            {/* Modal Bottom Footer */}
            <div className="no-print notice-modal-footer bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveNoticeModal(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Notice
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
