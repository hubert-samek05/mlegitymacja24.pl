import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "mLegitymacja24 — Twoje dokumenty zawsze przy Tobie",
  description:
    "Cyfrowe legitymacje zawodowe, którym można zaufać. Jedna, bezpieczna platforma dla firm szkoleniowych, ich absolwentów i wszystkich, którzy weryfikują uprawnienia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${inter.variable} ${display.variable} font-sans antialiased text-ink`}>
        {children}
      </body>
    </html>
  );
}
