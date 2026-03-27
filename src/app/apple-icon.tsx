import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
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
            "radial-gradient(circle at 30% 25%, rgba(56,189,248,.25), transparent 28%), linear-gradient(180deg, #020617 0%, #0f172a 100%)",
        }}
      >
        <div
          style={{
            width: "84%",
            height: "84%",
            borderRadius: "26%",
            background:
              "linear-gradient(145deg, #22d3ee 0%, #38bdf8 26%, #2563eb 58%, #1d4ed8 100%)",
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,.18), 0 18px 34px rgba(0,0,0,.38)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 104,
              fontWeight: 900,
              letterSpacing: "-0.08em",
              lineHeight: 1,
              color: "#ffffff",
              transform: "translateY(-3px)",
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