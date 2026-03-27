import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Hocker ONE",
    template: "%s | Hocker ONE",
  },
  description:
    "Hocker ONE es el centro privado de control para dirigir tu ecosistema con claridad, orden y una experiencia premium.",
  metadataBase: new URL("https://hocker.one"),
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-950 text-slate-100`}
      >
        <PwaRegister />
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </body>
    </html>
  );
}