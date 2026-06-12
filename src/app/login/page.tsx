import type { Metadata } from "next";
import { HockerOwnerLoginSurface } from "@/components/hocker-2c/auth/HockerOwnerLoginSurface";

export const metadata: Metadata = {
  title: "Login | Hocker ONE",
  description: "Acceso privado al centro owner de Hocker ONE.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function LoginPage() {
  return <HockerOwnerLoginSurface />;
}
