import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PwaRegister from "@/components/PwaRegister";
import { WorkspaceProvider } from "@/components/WorkspaceContext";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Configuración de hardware para que se comporte como App Nativa
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Bloquea el zoom accidental en pantallas táctiles
};

export const metadata: Metadata = {
  title: {
    default: "Hocker ONE",
    template: "%s | Hocker ONE",
  },
  description:
    "Hocker ONE es el centro privado de control para dirigir tu ecosistema con claridad, orden y una experiencia premium.",
  metadataBase: new URL("https://hocker.one"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hocker ONE",
  },
  formatDetection: {
    telephone: false, // Protege los IDs y números largos de ser convertidos en links de llamada
  },
  openGraph: {
    title: "Hocker ONE",
    description:
      "Centro privado de control para dirigir tu ecosistema con claridad, orden y una experiencia premium.",
    url: "https://hocker.one",
    siteName: "Hocker ONE",
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hocker ONE",
    description:
      "Centro privado de control para dirigir tu ecosistema con claridad, orden y una experiencia premium.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500/30 selection:text-blue-900`}
      >
        <WorkspaceProvider>
          {children}
        </WorkspaceProvider>
        
        {/* El tejido silencioso de la PWA */}
        <PwaRegister />
        
        {/* El motor global de notificaciones visuales */}
        <Toaster position="bottom-right" richColors theme="light" closeButton />
      </body>
    </html>
  );
}
