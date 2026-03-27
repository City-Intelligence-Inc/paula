import type { Metadata } from "next";
import { Poppins, Lora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      <html lang="en" className={`${poppins.variable} ${lora.variable}`}>
        <body className="min-h-screen flex flex-col font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
