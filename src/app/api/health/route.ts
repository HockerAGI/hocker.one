import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "hocker-one",
    env: process.env.HOCKER_ENV ?? "unknown"
  });
}