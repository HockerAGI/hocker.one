import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { WorkspaceProvider } from "@/components/WorkspaceContext";
import ShellFrame from "@/components/ShellFrame";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
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
  icons: [
    { rel: "icon", url: "/brand/hocker-one-isotype.png" },
    { rel: "apple-touch-icon", url: "/brand/hocker-one-logo.png" },
  ],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-[#020617] text-slate-50 antialiased selection:bg-sky-400/30 selection:text-white">
        <WorkspaceProvider>
          <ShellFrame>{children}</ShellFrame>
          <PwaRegister />
        </WorkspaceProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}