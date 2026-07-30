import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/utils";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  return NextResponse.json({ authenticated: true, user: { email: session.email, name: session.name } });
}
