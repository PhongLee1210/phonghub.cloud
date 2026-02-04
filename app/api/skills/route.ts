import { SKILLS } from "@/config/skills";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ skills: SKILLS });
}
