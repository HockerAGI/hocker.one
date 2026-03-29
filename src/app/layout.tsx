import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PwaRegister from "@/components/PwaRegister";
import { WorkspaceProvider } from "@/components/WorkspaceContext";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#020617", // Sincronizado con el nuevo background táctico
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: { default: "Hocker ONE", template: "%s | Hocker ONE" },
  description: "Sistema de Conciencia Digital Unificada. Control total sobre el ecosistema AGI Technologies.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Hocker ONE" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark"> {/* Forzamos modo dark para el búnker */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-950 selection:bg-blue-500/30`}>
        <WorkspaceProvider>
          {children}
        </WorkspaceProvider>
        <PwaRegister />
        <Toaster position="bottom-right" theme="dark" closeButton />
      </body>
    </html>
  );
}
