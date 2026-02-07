import "./globals.css";

export const metadata = {
  title: "HOCKER.ONE",
  description: "Control Plane del ecosistema HOCKER"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}