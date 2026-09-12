import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "GreenCharge — Smart EV Charging",
  description:
    "AI-powered EV charging optimization. Charge smarter, save money, go green.",
  keywords: ["EV charging", "electric vehicle", "renewable energy", "India", "GreenCharge"],
  openGraph: {
    title: "GreenCharge",
    description: "Smart EV Charging Optimization for India",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#0A0D0B] text-[#F0FDF4] antialiased">
        {children}
      </body>
    </html>
  );
}
