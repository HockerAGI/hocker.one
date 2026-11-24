"use client";
import Image from "next/image";
import Link from "next/link";
import AuthBox from "@/components/AuthBox";

export function HockerOwnerLoginSurface() {
  return (
    <main className="hko-login min-h-[100dvh] text-white">
      <div className="hko-login-frame">
        <header className="hko-login-header">
          <Link href="/" aria-label="Volver al inicio de HOCKER ONE" className="hko-login-brand">
            <Image src="/brand/hocker-one-logo.png" alt="HOCKER ONE" width={216} height={66}
              className="h-auto w-[178px] object-contain sm:w-[216px]" priority />
          </Link>
          <span className="hko-login-private">Acceso privado</span>
        </header>
        <section className="hko-login-center" aria-labelledby="hko-login-title">
          <div className="hko-login-intro">
            <p className="hko-login-overline">HOCKER ONE <span aria-hidden="true">/</span> Tu espacio</p>
            <h1 id="hko-login-title">Bienvenido a <span>tu espacio.</span></h1>
            <p>Una entrada. Tu ecosistema conectado. NOVA y las decisiones importantes, sin distracciones.</p>
          </div>
          <AuthBox className="hko-auth-card" />
        </section>
        <footer className="hko-login-footer">
          <span>HOCKER AGI Technologies</span>
          <span>Sesión protegida · Owner Gate</span>
        </footer>
      </div>
    </main>
  );
}
