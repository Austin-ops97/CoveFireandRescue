import type { Metadata, Viewport } from "next";
import { Source_Sans_3 } from "next/font/google";
import { AppProviders } from "@/app/providers";
import { EmergencyBanner } from "@/components/site/EmergencyBanner";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { LocalBusinessJsonLd } from "@/components/site/LocalBusinessJsonLd";
import { siteConfig } from "@/lib/config/site";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Cove Fire & Rescue | Volunteer Fire Department Cove TX",
    template: "%s | Cove Fire & Rescue",
  },
  description: siteConfig.seo.defaultDescription,
  keywords: [...siteConfig.seo.keywords],
  applicationName: siteConfig.name,
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.seo.defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.seo.defaultDescription,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#1b36a4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sourceSans.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <LocalBusinessJsonLd />
        <AppProviders>
          <EmergencyBanner />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
