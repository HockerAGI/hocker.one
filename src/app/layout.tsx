import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { WorkspaceProvider } from "@/components/WorkspaceContext";
import ShellFrame from "@/components/ShellFrame";
import PwaRegister from "@/components/PwaRegister";
import { getHockerPublicJsonLdGraph } from "@/lib/hocker-structured-data";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const HOCKER_PUBLIC_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hockerone.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(HOCKER_PUBLIC_URL),
  title: {
    default: "Hocker ONE",
    template: "%s | Hocker ONE",
  },
  description: "Centro visual y operativo de NOVA dentro del ecosistema Hocker.",
  applicationName: "Hocker ONE",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hocker ONE",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/brand/icon-192.png", type: "image/png" }],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Hocker ONE",
    description: "Centro visual y operativo de NOVA dentro del ecosistema Hocker.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hocker ONE",
    description: "Centro visual y operativo de NOVA dentro del ecosistema Hocker.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#020617",
  colorScheme: "dark",
  viewportFit: "cover",
};

const hockerPublicJsonLd = getHockerPublicJsonLdGraph();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className="bg-[#020617] text-slate-50 antialiased selection:bg-sky-400/30 selection:text-white">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(hockerPublicJsonLd) }}
        />
        <WorkspaceProvider>
          <ShellFrame>{children}</ShellFrame>
          <PwaRegister />
        </WorkspaceProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}