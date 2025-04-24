import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {Providers} from "./providers";
import {Snowflake} from "lucide-react";
import {Header} from "@/components/ui/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inscription FIS",
  description: "Inscription FIS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-gradient-to-b from-[#e0f0ff] to-white pb-10">
          {/* Header avec effet de neige */}
          <div className="relative bg-[#3d7cf2] text-white">
            <div className="absolute inset-0 opacity-20">
              {Array.from({length: 20}).map((_, i) => (
                <Snowflake
                  key={i}
                  className="absolute text-white animate-pulse-slow"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.5 + 0.5,
                    transform: `scale(${Math.random() * 0.5 + 0.5})`,
                  }}
                />
              ))}
            </div>
            <Header />
          </div>
          <div className="container relative z-10 py-8 px-4">
            <Providers>{children}</Providers>
          </div>
        </div>
      </body>
    </html>
  );
}
