import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {Providers} from "./providers";
import {Snowflake} from "lucide-react";
import {Header} from "@/components/ui/Header";
import {ClerkProvider} from "@clerk/nextjs";
import "./globals.css";
import {frFR} from "@clerk/localizations";

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
        <ClerkProvider localization={frFR}>
          <div className="min-h-screen bg-gradient-to-b from-[#e0f0ff] to-white pb-10">
            {/* Header avec effet de neige */}
            <div className="relative bg-[#3d7cf2] text-white">
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({length: 50}).map((_, i) => {
                  const initialOpacity = Math.random() * 0.5 + 0.5;
                  const scale = Math.random() * 0.6 + 0.4;
                  const duration = Math.random() * 10 + 10;
                  const delay = Math.random() * -20;
                  const xAmplitude =
                    (Math.random() * 90 + 30) * (Math.random() > 0.5 ? 1 : -1); // entre -120px et 120px
                  const rotation =
                    (Math.random() * 540 + 180) *
                    (Math.random() > 0.5 ? 1 : -1); // entre -720deg et 720deg

                  return (
                    <Snowflake
                      key={i}
                      className="absolute text-white animate-snowfall"
                      style={
                        {
                          top: "-10%",
                          left: `${Math.random() * 100}%`,
                          "--opacity": initialOpacity,
                          "--scale": scale,
                          opacity: initialOpacity,
                          transform: `scale(${scale})`,
                          animationDuration: `${duration}s`,
                          animationDelay: `${delay}s`,
                          "--x-amplitude": `${xAmplitude}px`,
                          "--rotation": `${rotation}deg`,
                        } as React.CSSProperties
                      }
                    />
                  );
                })}
              </div>
              <Header />
            </div>
            <div className="flex justify-center py-8 px-4">
              <div className="w-full max-w-8xl">
                <Providers>{children}</Providers>
              </div>
            </div>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
