import type { Metadata } from "next";
import { Original_Surfer, Nunito_Sans, Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const originalSurfer = Original_Surfer({
  variable: "--font-original-surfer",
  subsets: ["latin"],
  weight: ["400"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

// Geist (Vercel) — used for tabular data (financials, payment tables, anything
// with aligned numerals). Pair with `font-variant-numeric: tabular-nums` via
// the .font-tabular utility in globals.css. Per DESIGN.md, never used for
// running prose — body stays on Avenir Next + Nunito Sans.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mathitude — It's All About the Attitude",
  description:
    "K-12 math enrichment, tutoring, and engagement books by Mathitude. Lifetime math engagement for all.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${originalSurfer.variable} ${nunitoSans.variable} ${geist.variable}`}
      >
        <body className="min-h-screen flex flex-col font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
