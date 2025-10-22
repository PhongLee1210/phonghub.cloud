import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Accept the request but don't process or store the form data
    return NextResponse.json("Message received!", { status: 200 });
  } catch (error) {
    console.log(error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
