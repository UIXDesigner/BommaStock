import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { error: "Inngest is not configured in Phase 1." },
    { status: 501 },
  );
}

export function POST() {
  return NextResponse.json(
    { error: "Inngest is not configured in Phase 1." },
    { status: 501 },
  );
}
