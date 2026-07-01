import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import "./globals.css";
import { ericaOne } from "@/lib/fonts";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ManaGo!",
  description: "Find nearby water coolers, restrooms, and nursing rooms.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, ericaOne.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <ViewTransitions>{children}</ViewTransitions>
      </body>
    </html>
  );
}
