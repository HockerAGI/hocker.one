import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 25%, rgba(56,189,248,.28), transparent 28%), linear-gradient(180deg, #020617 0%, #0f172a 100%)",
        }}
      >
        <div
          style={{
            width: "82%",
            height: "82%",
            borderRadius: "28%",
            background:
              "linear-gradient(145deg, #22d3ee 0%, #38bdf8 26%, #2563eb 58%, #1d4ed8 100%)",
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,.18), 0 28px 56px rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 300,
              fontWeight: 900,
              letterSpacing: "-0.08em",
              lineHeight: 1,
              color: "#ffffff",
              transform: "translateY(-8px)",
              fontFamily:
                'Inter, "Segoe UI", Arial, Helvetica, sans-serif',
            }}
          >
            h
          </div>
        </div>
      </div>
    ),
    size
  );
}