import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "cove-fire-rescue",
    storage: "backblaze-b2",
    auth: "firebase",
  });
}
