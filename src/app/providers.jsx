"use client";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/Toast";
import { LanguageProvider } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

export default function Providers({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <LanguageProvider>
      <ToastProvider>
        {children}
        {!isAdminRoute && <LanguageSwitcher />}
      </ToastProvider>
    </LanguageProvider>
  );
}
