import { NextResponse } from "next/server";
import { testFirebaseAdminConnectivity } from "@/lib/firebase/admin";

export async function GET() {
  const result = await testFirebaseAdminConnectivity();

  if (result.ok) {
    return NextResponse.json(result);
  }

  return NextResponse.json(result, { status: 500 });
}
