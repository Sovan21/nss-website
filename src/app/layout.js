import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "NSS Unit - Banwarilal Bhalotia College",
  description: "Official NSS Unit Website for Banwarilal Bhalotia College",
  icons: {
    icon: '/nss-logo.png',
    apple: '/nss-logo.png',
  },
  manifest: '/manifest.json',
  themeColor: '#faf9f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NSS BB College',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
