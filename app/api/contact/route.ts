import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGlobalSettings } from "@/lib/settings";
import { sendMail, generateInquiryEmailHtml } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    const fieldErrors: Record<string, string> = {};

    if (!name || typeof name !== "string" || !name.trim()) {
      fieldErrors.name = "Required";
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      fieldErrors.email = "Required";
    } else if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { success: false, error: "Invalid email address format." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      fieldErrors.message = "Required";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required contact fields.",
          fieldErrors,
        },
        { status: 400 }
      );
    }

    // Embed subject into message content for parsing and email notification
    const formattedMessage = subject
      ? `[Subject: ${subject.trim()}]\n\n${message.trim()}`
      : message.trim();

    // 1. Save inquiry into database
    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        message: formattedMessage,
        status: "NEW",
      },
    });

    // 2. Fetch site settings to find recipient notification email
    const settings = await getGlobalSettings();
    const recipientEmail =
      settings.notificationEmail?.trim() || settings.contactEmail?.trim() || "orders@pinnacledistributing.com";

    // 3. Dispatch notification email via Nodemailer
    const emailHtml = generateInquiryEmailHtml({
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : undefined,
      message: formattedMessage,
    });

    sendMail({
      to: recipientEmail,
      subject: `[New Inquiry] ${subject ? `${subject.trim()} - ` : ""}${name.trim()} - Pinnacle Distributing`,
      html: emailHtml,
      replyTo: email.trim(),
    }).catch((err) => console.warn("[ContactAPI] Email send skipped/failed:", err));

    return NextResponse.json({
      success: true,
      inquiryId: inquiry.id,
      inquiry: {
        id: inquiry.id,
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        subject: subject || "General Inquiry",
        message: inquiry.message,
        status: inquiry.status,
      },
      message: "Your inquiry has been received successfully. Our commercial sales team will follow up shortly.",
    });
  } catch (error: any) {
    console.error("[ContactAPI] Error submitting contact inquiry:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process contact inquiry." },
      { status: 500 }
    );
  }
}
