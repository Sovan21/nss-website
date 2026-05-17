/**
 * LoadingScreen & GlobalStyles Components
 * Purpose: Animated loading screen with NSS motto and global CSS injections.
 */

// Global CSS for Scrollbar and Custom Motto Animation
export const GlobalStyles = () => (
  <style>{`
    body::-webkit-scrollbar { width: 8px; }
    body::-webkit-scrollbar-track { background: #f8fafc; }
    body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f8fafc; }
    body::-webkit-scrollbar-thumb:hover { background: #94a3b8; border-color: #f1f5f9; }
    html { scroll-behavior: smooth; }
    
    /* Force pointer cursor on all standard interactive elements globally */
    button, a, select, [role="button"], input[type="button"], input[type="submit"] {
      cursor: pointer;
    }
    button:disabled, a[disabled], input:disabled {
      cursor: not-allowed;
    }

    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }

    @keyframes fade-in-up {
      0%   { opacity: 0; transform: translateY(20px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0)    scale(1);    }
    }
    .animate-fade-in-up {
      animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      will-change: transform, opacity;
    }

    /* Custom Animation for NSS Motto Loader */
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .animate-motto {
      background: linear-gradient(90deg, #1e3a8a 0%, #93c5fd 50%, #1e3a8a 100%);
      background-size: 200% auto;
      color: transparent;
      -webkit-background-clip: text;
      background-clip: text;
      animation: shimmer 3s linear infinite;
    }

    /* Page transition animation */
    @keyframes page-enter {
      0%   { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .animate-page-enter {
      animation: page-enter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `}</style>
);

const LoadingScreen = () => (
  <div id="nss-loading-screen" className="min-h-screen flex items-center justify-center bg-[#faf9f6] flex-col relative overflow-hidden">
    {/* 
      FALLBACK AUTO-RELOAD: If React fails to hydrate after back-navigation from OAuth,
      this script reloads the page after 2 seconds. On normal loads, React removes this
      component from the DOM quickly, so the reload never triggers.
    */}
    {/* Fallback auto-reload moved to useEffect */}
    <GlobalStyles />
    <div className="z-10 flex flex-col items-center px-4 w-full animate-fade-in-up">
      <div className="flex items-center justify-center mb-6">
        <img src="/nss-logo.png" alt="NSS Logo" className="w-28 h-28 md:w-32 md:h-32 object-contain animate-pulse" />
      </div>
      <h2 className="text-2xl md:text-4xl lg:text-5xl font-black uppercase animate-motto text-center whitespace-nowrap tracking-widest">
        NOT ME BUT YOU
      </h2>
      <div className="mt-8 flex gap-2.5">
        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce shadow-sm" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  </div>
);

export default LoadingScreen;
