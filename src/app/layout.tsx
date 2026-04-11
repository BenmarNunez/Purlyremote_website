import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Purly Remote LLC – Global Remote Staffing & Freelancing Solutions",
    template: "%s | Purly Remote LLC",
  },
  description:
    "Purly Remote LLC connects skilled freelancers with international clients. Access global talent, remote jobs, and reliable work-from-home opportunities worldwide.",
  keywords: [
    "remote staffing",
    "freelancers",
    "work from home",
    "global talent",
    "remote jobs",
    "outsourcing",
    "talent matching",
    "hire remote talent Philippines",
    "remote staffing US businesses",
  ],
  openGraph: {
    title: "Purly Remote LLC – Global Remote Staffing & Freelancing Solutions",
    description:
      "Connecting skilled freelancers with international clients. Reliable, scalable, and fully remote.",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "Purly Remote LLC",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Purly Remote LLC – Global Remote Staffing",
    description: "Connecting global talent to remote opportunities.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
