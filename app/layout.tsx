import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import { ConfirmDialogProvider } from "@/lib/confirm-context";
import { Toaster } from "@/components/ui/sonner";
import { GlobalLoadingIndicator } from "@/components/global-loading-indicator";
import { cn } from "@/lib/client-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AluVerse",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("h-screen overflow-hidden", outfit.variable)}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NuqsAdapter>
          <TRPCReactProvider>
            <ThemeProvider
              attribute="class"
              enableSystem
              defaultTheme="system"
              disableTransitionOnChange
            >
              <ConfirmDialogProvider>
                <GlobalLoadingIndicator />
                <Toaster />
                {children}
              </ConfirmDialogProvider>
            </ThemeProvider>
          </TRPCReactProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
