import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PwaRegister from "@/components/PwaRegister";
import { WorkspaceProvider } from "@/components/WorkspaceContext";
import InteractiveBackground from "@/components/InteractiveBackground";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: { default: "Hocker ONE", template: "%s | Hocker ONE" },
  description: "Centro de Mando Unificado de Hocker IA Technologies.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/brand/hocker-one-isotype.png",
    shortcut: "/brand/hocker-one-isotype.png",
    apple: "/brand/hocker-one-isotype.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hocker ONE",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-[100dvh] bg-slate-950 text-slate-100 antialiased selection:bg-sky-500/30 overflow-y-auto`}
      >
        <InteractiveBackground />
        <WorkspaceProvider>
          {children}
        </WorkspaceProvider>
        <PwaRegister />
        <Toaster
          position="top-center"
          theme="dark"
          expand={false}
          richColors
        />
      </body>
    </html>
  );
}
