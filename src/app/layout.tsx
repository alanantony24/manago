import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import "./globals.css";
import { ericaOne } from "@/lib/fonts";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ManaGo!",
  description: "Find nearby water coolers, restrooms, and nursing rooms.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full font-sans antialiased ${inter.variable} ${ericaOne.variable}`}>
      <body className="min-h-full flex flex-col">
        <ViewTransitions>{children}</ViewTransitions>
      </body>
    </html>
  );
}
