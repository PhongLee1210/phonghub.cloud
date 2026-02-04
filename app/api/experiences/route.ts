import { EXPERIENCES } from "@/config/experience";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ experiences: EXPERIENCES });
}
