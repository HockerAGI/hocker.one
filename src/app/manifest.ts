import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hocker ONE",
    short_name: "Hocker ONE",
    description: "Sistema operativo conversacional del ecosistema HOCKER para coordinar NOVA, AGIs, acciones y evidencia.",
    start_url: "/chat",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#06152D",
    theme_color: "#06152D",
    categories: ["productivity", "business", "utilities"],
    lang: "es-MX",
    icons: [
      {
        src: "/brand/hocker-one-isotype.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/brand/hocker-one-isotype.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/brand/hocker-one-logo.png",
        sizes: "1200x320",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
