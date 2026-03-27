import type { Metadata } from "next";
import { Poppins, Newsreader, Original_Surfer } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const originalSurfer = Original_Surfer({
  variable: "--font-original-surfer",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Mathitude — It's All About the Attitude",
  description:
    "K-12 math enrichment, tutoring, and engagement books by Paula Hamilton. Lifetime math engagement for all.",
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
        className={`${poppins.variable} ${newsreader.variable} ${originalSurfer.variable}`}
      >
        <body className="min-h-screen flex flex-col font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
