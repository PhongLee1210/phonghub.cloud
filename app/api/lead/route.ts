import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { CONTACT_INFO } from "@/config/contact";
import { LeadEmail } from "@/lib/lead/email-template";
import { checkLeadRateLimit } from "@/lib/lead/rate-limit";
import { leadFormSchema } from "@/lib/lead/schema";

/**
 * Constructed per request, not at module scope: the Resend constructor throws
 * when the key is absent, and at module scope that threw during `next build`'s
 * page-data collection — so a build without the secret (CI, a preview box)
 * failed outright instead of just failing to send at runtime.
 */
function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY);
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = await checkLeadRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      {
        status: 429,
        headers: rateLimit.retryAfterSeconds
          ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  const body = await req.json();
  const parsed = leadFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid form data", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { name, email, topic, message, source } = parsed.data;

  const { error } = await getResend().emails.send({
    from: "Portfolio <onboarding@resend.dev>",
    to: CONTACT_INFO.email,
    replyTo: email,
    subject: `New lead from ${name}`,
    react: LeadEmail({ name, email, topic, message, source }),
  });

  if (error) {
    console.error("[api/lead] Resend error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
