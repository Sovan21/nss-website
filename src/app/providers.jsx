"use client";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/Toast";
import { LanguageProvider } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

export default function Providers({ children }) {
  const pathname = usePathname();
  // Show Live count, Total count & Language Switcher ONLY on the navbar menu pages (pathname === '/')
  const isNavbarPage = pathname === '/';

  return (
    <LanguageProvider>
      <ToastProvider>
        {children}
        {isNavbarPage && <LanguageSwitcher />}
      </ToastProvider>
    </LanguageProvider>
  );
}
