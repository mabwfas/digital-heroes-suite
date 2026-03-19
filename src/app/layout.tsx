import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digital Heroes | All-in-One Business Suite",
  description:
    "Premium tool suite for Shopify designers, freelancers & digital agencies. 34+ tools in one dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex bg-background text-foreground">
        <TooltipProvider>
          <Sidebar />
          <main className="flex-1 min-h-screen overflow-auto">
            <div className="max-w-7xl mx-auto p-4 lg:p-8 pt-14 lg:pt-8">
              {children}
            </div>
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
