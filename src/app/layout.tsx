import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ericaOne } from "@/lib/fonts";
import { NavMenuProvider } from "@/components/nav-menu";

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
    <html
      lang="en"
      className={`light h-full font-sans antialiased ${inter.variable} ${ericaOne.variable}`}
      style={{ colorScheme: "light" }}
    >
      <body className="flex min-h-full flex-col bg-gray-50 text-manago-navy">
        <ClerkProvider>
          <ViewTransitions>
            <NavMenuProvider>{children}</NavMenuProvider>
          </ViewTransitions>
        </ClerkProvider>
      </body>
    </html>
  );
}
