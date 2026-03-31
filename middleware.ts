import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rutas críticas de la Matriz
const PROTECTED_PATHS = ["/dashboard", "/chat", "/commands", "/nodes", "/agis", "/supply", "/governance"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  // Verificación de identidad en tiempo real
  const { data: { user } } = await supabase.auth.getUser();

  // Bloqueo de intrusos en la Matriz
  if (PROTECTED_PATHS.some(p => pathname.startsWith(p)) && !user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Redirección de salida: Si el Director ya está autenticado, no necesita ver el Login
  if (pathname === "/" && user) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  /* [FUTURE_SYNC]: Aquí inyectaremos la lógica de 'Child Apps'.
     Si el host es 'cliente.hocker.one', el middleware los enviará 
     a su propia interfaz sin tocar el núcleo de mando.
  */

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.png$).*)"],
};
