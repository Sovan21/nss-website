'use client';
import { Icons } from '../Icons';

const Footer = ({ siteData, finalData: passedFinalData }) => {
  const finalData = siteData || passedFinalData || {};

  const handleEmailClick = (e, email) => {
    e.preventDefault();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `mailto:${email}`;
    } else {
      window.open(`https://mail.google.com/mail/?extsrc=mailto&url=mailto:${email}`, '_blank');
    }
  };

  return (
    <footer className="relative bg-[#0B1120] text-slate-300 border-t border-white/10 overflow-hidden font-sans" id="footer">
      {/* Decorative gradient glow at the top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-blue-600/10 blur-[100px] pointer-events-none"></div>

      <div className="relative pt-12 pb-6 px-4 sm:px-8 lg:px-8 max-w-7xl mx-auto z-10">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 mb-10">
          
          {/* Column 1: Branding & Intro (takes up more space) */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-5">
              {/* College Logo */}
              <a href="https://bbcollege.ac.in" target="_blank" rel="noreferrer" className="block h-16 bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-2 ring-white/20 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300 overflow-hidden shrink-0 cursor-pointer rounded-sm py-0.5 px-0">
                <img src="/BBCollege Logo.jpeg" alt="B.B. College Logo" className="h-full w-auto object-contain" />
              </a>

              {/* NSS Logo - Perfect Circle Link */}
              <a href="https://nss.gov.in" target="_blank" rel="noreferrer" className="block w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)] ring-2 ring-white/20 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300 overflow-hidden shrink-0 cursor-pointer">
                <img src="/nss-logo.png" alt="NSS Logo" className="w-full h-full object-contain p-0.5 bg-white" />
              </a>
              
              {/* MY Bharat Logo - Tight Background Link */}
              <a href="https://mybharat.gov.in" target="_blank" rel="noreferrer" className="block bg-white/5 px-2 py-1 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-105">
                <img src="/my bharat.png" alt="MY Bharat" className="h-11 w-auto object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] brightness-110" />
              </a>
            </div>
            
            <p className="text-slate-400 text-[13px] leading-relaxed mb-4 max-w-sm">
              The NSS Unit of B.B. College is an initiative under the Ministry of Youth Affairs &amp; Sports to empower youth through community service, social awareness, and nation building.
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              Not Me But You
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-2 lg:pl-4">
            <h4 className="text-white text-sm font-bold mb-4 tracking-wide uppercase">Useful Links</h4>
            <ul className="space-y-3">
              {[
                { name: 'MY Bharat Portal', url: 'https://mybharat.gov.in' },
                { name: 'Swachh Bharat Mission', url: 'https://swachhbharatmission.gov.in' },
                { name: 'NSS India', url: 'https://nss.gov.in' },
                { name: 'Youth Affairs', url: 'https://yas.gov.in' }
              ].map((link, i) => (
                <li key={i}>
                  <a href={link.url} target="_blank" rel="noreferrer" className="group flex items-center text-slate-400 hover:text-white text-sm font-medium transition-all duration-300">
                    <span className="w-0 h-px bg-blue-500 mr-0 transition-all duration-300 group-hover:w-4 group-hover:mr-2 opacity-0 group-hover:opacity-100"></span>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
            
            <div className="mt-5">
               <a href="https://swachhbharatmission.gov.in" target="_blank" rel="noreferrer" className="inline-flex bg-white px-3 py-1.5 rounded-lg border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:bg-white hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all duration-300 items-center justify-center cursor-pointer">
                 <img src="/swachh bharat.png" alt="Swachh Bharat" className="h-7 w-auto object-contain transition-all duration-500" />
               </a>
            </div>
          </div>

          {/* Column 3: Contact Info */}
          <div className="lg:col-span-3 xl:col-span-4">
            <h4 className="text-white text-sm font-bold mb-4 tracking-wide uppercase">Get In Touch</h4>
            <ul className="space-y-3">
              <li>
                <div onClick={(e) => handleEmailClick(e, finalData.contact_email || "bbcollege1944@gmail.com")} className="group flex items-start gap-3 text-slate-400 hover:text-blue-300 transition-colors duration-300 cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-colors duration-300">
                    <Icons.Mail className="w-4 h-4 text-slate-300 group-hover:text-blue-400" />
                  </div>
                  <span className="text-[14px] leading-tight pt-1.5 break-words">{finalData.contact_email || "bbcollege1944@gmail.com"}</span>
                </div>
              </li>
              {finalData.contact_phone && (
                <li>
                  <div className="group flex items-start gap-3 text-slate-400 transition-colors duration-300">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-colors duration-300 mt-0.5">
                      <Icons.Phone className="w-4 h-4 text-slate-300 group-hover:text-blue-400" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {finalData.contact_phone.split(',').map((phone, i) => phone.trim() ? (
                        <a key={i} href={`tel:${phone.trim()}`} className="text-[14px] leading-tight pt-1.5 hover:text-blue-300 transition-colors">
                          {phone.trim()}
                        </a>
                      ) : null)}
                    </div>
                  </div>
                </li>
              )}
              <li>
                <a href="https://www.google.com/maps/place/B.B.College/@23.6809444,86.9976048,16.95z/data=!4m6!3m5!1s0x39f71ee555555555:0xed1b371b2dd1ddfb!8m2!3d23.680962!4d86.9975621!16s%2Fm%2F0j25rl7?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noreferrer" className="group flex items-start gap-3 text-slate-400 hover:text-blue-300 transition-colors duration-300">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-colors duration-300">
                    <Icons.MapPin className="w-4 h-4 text-slate-300 group-hover:text-blue-400" />
                  </div>
                  <span className="text-[14px] leading-relaxed pt-1.5">B.B. College, Asansol, W.B.</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Social & Credits */}
          <div className="lg:col-span-3">
            <h4 className="text-white text-sm font-bold mb-4 tracking-wide uppercase">Connect With Us</h4>
            
            <div className="flex flex-wrap xl:flex-nowrap justify-center sm:justify-start gap-2 mb-6">
              {[
                { name: 'X', icon: 'twitter', url: '#', color: 'text-[#1DA1F2]' },
                { name: 'Instagram', icon: 'instagram', url: finalData.social_instagram || '#', color: 'text-[#E1306C]' },
                { name: 'Facebook', icon: 'facebook', url: finalData.social_facebook || '#', color: 'text-[#1877F2]' },
                { name: 'LinkedIn', icon: 'linkedin', url: '#', color: 'text-[#0A66C2]' },
                { name: 'WhatsApp', icon: 'whatsapp', url: finalData.contact_whatsapp || '#', color: 'text-[#25D366]' },
                { name: 'YouTube', icon: 'youtube', url: finalData.social_youtube || '#', color: 'text-[#FF0000]' },
              ].map((social) => (
                <a 
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.name}
                  className="relative flex items-center h-9 rounded-full bg-white/5 border border-white/10 overflow-hidden hover:bg-white/10 hover:shadow-[0_4px_15px_rgba(255,255,255,0.08)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-center justify-center w-9 h-9 shrink-0">
                    <img 
                      src={`https://cdn-prod.mybharats.in/mybharat/assets/img/icon/${social.icon}_v10.png`} 
                      alt={social.name} 
                      className="w-6 h-6 opacity-100 transition-all duration-300" 
                    />
                  </div>
                  <span className={`text-[11px] font-bold max-w-0 opacity-0 group-hover:max-w-[80px] group-hover:opacity-100 group-hover:pr-3 transition-all duration-500 ease-out whitespace-nowrap ${social.color}`}>
                    {social.name}
                  </span>
                </a>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.05] inline-block w-full sm:w-auto">
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">Crafted with ❤ by</p>
              <p className="text-slate-200 text-[13px] font-bold tracking-wide">Sovan Maity</p>
              <div className="w-6 h-px bg-white/10 my-2"></div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Ministry of Youth Affairs &amp; Sports<br />
                <span className="text-slate-300 font-medium">Government of India</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm text-center md:text-left">
            © {new Date().getFullYear()} <span className="text-slate-300 font-medium">B.B. College NSS Unit</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="/terms" className="text-slate-500 hover:text-white transition-colors duration-300">Terms &amp; Conditions</a>
            <a href="/privacy" className="text-slate-500 hover:text-white transition-colors duration-300">Privacy Policy</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
