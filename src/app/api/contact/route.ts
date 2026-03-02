import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import Anthropic from "@anthropic-ai/sdk";

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "james@signetscience.com";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

/* ------------------------------------------------------------------ */
/*  Simple rate limiting (in-memory, per-IP, resets on cold start)     */
/* ------------------------------------------------------------------ */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5; // 5 submissions per hour per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

/* ------------------------------------------------------------------ */
/*  FAQ context for AI suggestions                                     */
/* ------------------------------------------------------------------ */

const FAQ_CONTEXT = `KodaPost is a social media carousel creation tool for indie brands and content creators.

Key facts:
- Supports JPEG, PNG, WebP, HEIC files up to 10 MB each, 1-10 photos per carousel
- 5-step workflow: Upload, Craft, Design, Review, Publish
- Camera emulation filters: Kodak Gold, Fuji Velvia, Polaroid, and more
- AI-generated text overlays and captions via Koda assistant
- Direct publishing to Instagram, TikTok, LinkedIn, YouTube, Reddit, Lemon8
- Also works via @kodacontentbot on Telegram
- Free tier available; premium plans unlock unlimited generation
- Project data stored in browser local storage
- Instagram publishing requires Professional account (Creator or Business)
- Filters are live CSS overlays, changeable at any time
- Interactive tour available via Menu > Help > Take a Tour
- Cancel subscription anytime from Profile > Billing settings
- User guide available at /guide`;

/* ------------------------------------------------------------------ */
/*  POST handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { action } = body;

  /* ---------------------------------------------------------------- */
  /*  AI Suggestion                                                    */
  /* ---------------------------------------------------------------- */
  if (action === "suggest") {
    const { query } = body;
    if (!query || query.length < 5) {
      return NextResponse.json({ suggestion: null });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json({ suggestion: null });
    }

    try {
      const client = new Anthropic({ apiKey: anthropicKey });
      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: `You are a helpful support assistant for KodaPost, a social media carousel creation tool. Answer user questions concisely based on the product knowledge below. If the question is not related to KodaPost or you are unsure, respond with exactly "NO_MATCH".

${FAQ_CONTEXT}`,
        messages: [
          {
            role: "user",
            content: query,
          },
        ],
      });

      const text =
        message.content[0]?.type === "text" ? message.content[0].text : "";

      if (text === "NO_MATCH" || text.includes("NO_MATCH")) {
        return NextResponse.json({ suggestion: null });
      }

      return NextResponse.json({ suggestion: text });
    } catch {
      return NextResponse.json({ suggestion: null });
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Contact Form Submission                                          */
  /* ---------------------------------------------------------------- */
  if (action === "contact") {
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Rate limit check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error:
            "Too many requests. Please wait before submitting another message.",
        },
        { status: 429 }
      );
    }

    // Send email via Resend
    if (!RESEND_API_KEY) {
      // Fallback: log to console when Resend is not configured
      console.log("=== CONTACT FORM SUBMISSION (Resend not configured) ===");
      console.log(`From: ${name} <${email}>`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      console.log("=====================================================");

      return NextResponse.json({
        success: true,
        message: "Message received. We will get back to you soon.",
      });
    }

    try {
      const resend = new Resend(RESEND_API_KEY);

      await resend.emails.send({
        from: FROM_EMAIL,
        to: SUPPORT_EMAIL,
        replyTo: email,
        subject: `[KodaPost Support] ${subject}`,
        text: [
          `New support request from ${name} (${email})`,
          "",
          `Subject: ${subject}`,
          "",
          "Message:",
          message,
          "",
          "---",
          `IP: ${ip}`,
          `Submitted: ${new Date().toISOString()}`,
        ].join("\n"),
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #18181b; padding: 24px; border-radius: 12px 12px 0 0;">
              <h2 style="color: #fff; margin: 0; font-size: 18px;">New Support Request</h2>
            </div>
            <div style="background: #f4f4f5; padding: 24px; border-radius: 0 0 12px 12px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #71717a; font-size: 14px; width: 80px;">From</td>
                  <td style="padding: 8px 0; color: #18181b; font-size: 14px;">${name} &lt;${email}&gt;</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #71717a; font-size: 14px;">Subject</td>
                  <td style="padding: 8px 0; color: #18181b; font-size: 14px;">${subject}</td>
                </tr>
              </table>
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 16px 0;" />
              <div style="color: #18181b; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 16px 0;" />
              <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                Reply directly to this email to respond to ${name}.
              </p>
            </div>
          </div>
        `,
      });

      // Send confirmation to the user
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "We received your message - KodaPost Support",
        text: [
          `Hi ${name},`,
          "",
          "Thanks for reaching out to KodaPost support. We received your message and will get back to you within 24 hours.",
          "",
          `Your subject: ${subject}`,
          "",
          "In the meantime, you might find these resources helpful:",
          "- User Guide: https://kodapost.com/guide",
          "- FAQ: https://kodapost.com/support#faq",
          "",
          "Best,",
          "The KodaPost Team",
        ].join("\n"),
      });

      return NextResponse.json({
        success: true,
        message: "Message sent successfully.",
      });
    } catch (err) {
      console.error("Failed to send email via Resend:", err);
      return NextResponse.json(
        { error: "Failed to send your message. Please try again later." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
