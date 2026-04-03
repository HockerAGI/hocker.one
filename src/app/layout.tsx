import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import PwaRegister from "@/components/PwaRegister";
import { WorkspaceProvider } from "@/components/WorkspaceContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = new URL("https://hockerone.vercel.app");

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Hocker ONE",
    template: "%s | Hocker ONE",
  },
  description: "Control de Hocker IA Technologies.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Hocker ONE",
    locale: "es_MX",
    title: "Hocker ONE",
    description: "Centro de Mando Unificado de Hocker IA Technologies.",
  },
  twitter: {
    card: "summary",
    title: "Hocker ONE",
    description: "Centro de Mando Unificado de Hocker IA Technologies.",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hocker ONE",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className="dark scroll-smooth h-full"
      suppressHydrationWarning
    >
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          min-h-screen
          overflow-y-auto
          bg-slate-950
          text-slate-100
          antialiased
          selection:bg-sky-500/30
        `}
      >
        <WorkspaceProvider>{children}</WorkspaceProvider>

        <PwaRegister />

        <Toaster
          position="top-center"
          theme="dark"
          expand={false}
          richColors
          toastOptions={{
            style: {
              background: "rgba(15, 23, 32, 0.85)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(14, 165, 233, 0.2)",
              borderRadius: "24px",
              color: "#f8fafc",
              boxShadow: "0 10px 40px -10px rgba(14,165,233,0.15)",
            },
          }}
        />
      </body>
    </html>
  );
}