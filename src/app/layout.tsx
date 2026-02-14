import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar, MobileNav } from "@/components/layout/navigation";
import { AppFooter } from "@/components/layout/appFooter";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZeroSecThink ",
  description: "Zero Sec Think .",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${inter.className} bg-background text-foreground antialiased`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex flex-col flex-1">
            <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
              {children}
            </main>
            <AppFooter />
          </div>
          <MobileNav />
        </div>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
