import type { Metadata, Viewport } from "next";
import { Orbitron, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import PwaRegister from "@/components/PwaRegister";
import { WorkspaceProvider } from "@/components/WorkspaceContext";
import ShellFrame from "@/components/ShellFrame";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "Hocker ONE",
    template: "%s | Hocker ONE",
  },
  description: "Sistema operativo Hocker ONE.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hocker ONE",
  },
  robots: {
    index: true,
    follow: true,
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
      className={`${orbitron.variable} ${dmSans.variable} ${jetBrainsMono.variable} dark h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-screen overflow-x-hidden bg-slate-950 text-white antialiased selection:bg-sky-500/30">
        <WorkspaceProvider>
          <div className="relative min-h-screen overflow-hidden">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_28%),linear-gradient(180deg,#020617_0%,#020617_100%)]" />
            <div className="pointer-events-none fixed left-1/2 top-[-6rem] h-80 w-80 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl animate-[pulse_10s_ease-in-out_infinite]" />
            <div className="pointer-events-none fixed bottom-0 right-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl animate-[pulse_12s_ease-in-out_infinite]" />

            <ShellFrame>{children}</ShellFrame>
          </div>

          <PwaRegister />

          <Toaster
            position="top-center"
            theme="dark"
            expand={false}
            richColors
            toastOptions={{
              style: {
                background: "rgba(15, 23, 32, 0.88)",
                backdropFilter: "blur(18px)",
                border: "1px solid rgba(14, 165, 233, 0.16)",
                borderRadius: "22px",
                color: "#f8fafc",
                boxShadow: "0 10px 40px -10px rgba(14,165,233,0.12)",
              },
            }}
          />
        </WorkspaceProvider>
      </body>
    </html>
  );
}
