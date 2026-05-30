import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
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

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata = {
  metadataBase: new URL('https://nssbbcollege.netlify.app'),
  verification: {
    // Paste your Google Search Console verification code here (e.g., 'your-google-code')
    google: 'odtKt7kQNmtHq6JtVD2DNiDG2JgGpa9XFs-HvR6ZB_Y',
  },
  title: {
    default: "NSS Unit | Banwarilal Bhalotia College (B.B. College), Asansol",
    template: "%s | NSS Unit - Banwarilal Bhalotia College"
  },
  description: "Official National Service Scheme (NSS) Unit portal of Banwarilal Bhalotia College, Asansol. Volunteer registration, social activities, blood donation camps, and community drives under Kazi Nazrul University.",
  keywords: [
    "NSS", "National Service Scheme", "Banwarilal Bhalotia College", "BB College Asansol",
    "B.B. College NSS", "BB College NSS Unit", "NSS Unit BB College", "Asansol College NSS",
    "Kazi Nazrul University NSS", "KNU NSS", "NSS volunteer registration", "Social service college Asansol",
    "BBCollege", "Asansol", "West Bengal NSS"
  ],
  authors: [{ name: "NSS Unit BB College" }],
  creator: "NSS Unit BB College",
  publisher: "Banwarilal Bhalotia College",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/app-logo-nss-site.png',
    apple: '/app-logo-nss-site.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "NSS Unit | Banwarilal Bhalotia College, Asansol",
    description: "Official National Service Scheme (NSS) Unit portal of Banwarilal Bhalotia College, Asansol. Join us in community service, blood donation, and swachh bharat activities.",
    url: 'https://nssbbcollege.netlify.app',
    siteName: "NSS Unit - Banwarilal Bhalotia College",
    images: [
      {
        url: '/app-logo-nss-site.png',
        width: 800,
        height: 800,
        alt: "NSS Unit Banwarilal Bhalotia College Logo",
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "NSS Unit | Banwarilal Bhalotia College, Asansol",
    description: "Official National Service Scheme (NSS) Unit portal of Banwarilal Bhalotia College, Asansol. Join us in community service, blood donation, and swachh bharat activities.",
    images: ['/app-logo-nss-site.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NSS BB College',
  },
};

export const viewport = {
  themeColor: '#faf9f6',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "NSS Unit - Banwarilal Bhalotia College",
              "alternateName": ["BB College NSS Unit", "National Service Scheme Unit - Banwarilal Bhalotia College"],
              "url": "https://nssbbcollege.netlify.app",
              "logo": "https://nssbbcollege.netlify.app/app-logo-nss-site.png",
              "sameAs": [
                "https://www.bbcollege.ac.in"
              ],
              "parentOrganization": {
                "@type": "CollegeOrUniversity",
                "name": "Banwarilal Bhalotia College",
                "url": "https://www.bbcollege.ac.in",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "BB College Road, Sen Raleigh Road",
                  "addressLocality": "Asansol",
                  "addressRegion": "West Bengal",
                  "postalCode": "713303",
                  "addressCountry": "IN"
                }
              },
              "description": "The National Service Scheme (NSS) Unit of Banwarilal Bhalotia College, Asansol, actively engages students in community service, health camps, environmental drives, and social welfare activities.",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "NSS Program Officer",
                "email": "bbcollege1944@gmail.com"
              }
            })
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
