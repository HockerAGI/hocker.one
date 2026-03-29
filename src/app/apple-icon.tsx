import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default async function AppleIcon() {
  // Configuración del enlace táctico al activo visual exacto
  const isotypeUrl = new URL(
    "/brand/hocker-one-isotype.png", // Asegúrate de que el nombre coincida exactamente en public/brand/
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://hocker.one"
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            width: "88%",
            height: "88%",
            borderRadius: "22%",
            background: "linear-gradient(145deg, #38bdf8 0%, #2563eb 50%, #1d4ed8 100%)",
            boxShadow:
              "inset 0 2px 4px rgba(255,255,255,0.3), 0 12px 24px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden", // Sella los bordes
          }}
        >
          {/* Inyección directa del isótopo original para identidad absoluta en el celular */}
          <img
            src={isotopeUrl.toString()}
            alt="Hocker ONE Isotype"
            style={{
              width: "70%",
              height: "70%",
              objectFit: "contain",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
