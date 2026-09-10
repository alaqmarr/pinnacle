/**
 * lib/mail.ts
 * 
 * Dynamic Nodemailer transporter factory and email utilities for Pinnacle Distributing.
 * Reads SMTP credentials dynamically from the SQLite GlobalSetting table at runtime.
 * Supports Gmail 16-character App Passwords, custom SMTP servers (AWS SES, SendGrid, Mailgun, etc.),
 * connection verification, and robust graceful error handling.
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { getGlobalSettings, GlobalSettingData } from "@/lib/settings";

export interface MailTransporterResult {
  transporter: Transporter;
  fromEmail: string;
  fromName: string;
  settings: GlobalSettingData;
}

export interface VerifySmtpResult {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
}

/**
 * Factory function creating a Nodemailer transporter instance initialized dynamically
 * from current SQLite GlobalSetting credentials.
 * 
 * @param overrideSettings - Optional settings override (useful for testing credentials in admin form before saving)
 * @returns Promise<MailTransporterResult | null> - Returns null if SMTP is unconfigured.
 */
export async function getMailTransporter(
  overrideSettings?: Partial<GlobalSettingData>
): Promise<MailTransporterResult | null> {
  const settings = overrideSettings 
    ? { ...(await getGlobalSettings()), ...overrideSettings }
    : await getGlobalSettings();

  // Validate minimum required credentials
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
    return null;
  }

  const port = Number(settings.smtpPort) || 587;
  const isPort465 = port === 465;
  const secure = settings.smtpSecure ?? isPort465;

  // Sanitize Gmail 16-character app passwords by stripping whitespace (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
  const sanitizedPass = settings.smtpPass.replace(/\s+/g, "");

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: port,
    secure: secure,
    auth: {
      user: settings.smtpUser.trim(),
      pass: sanitizedPass,
    },
    tls: {
      // In production reject unauthorized certificates; in dev/test allow self-signed if needed
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
    connectionTimeout: 10000, // 10 seconds timeout
    greetingTimeout: 5000,   // 5 seconds greeting timeout
  });

  const fromEmail = settings.smtpFrom?.trim() || settings.smtpUser.trim();
  const fromName = settings.smtpFromName?.trim() || settings.companyName || "Pinnacle Distributing";

  return {
    transporter,
    fromEmail,
    fromName,
    settings,
  };
}

/**
 * Tests and verifies the SMTP connection using 	ransporter.verify().
 * Used by the /api/admin/test-smtp endpoint and settings dashboard.
 * 
 * @param customSettings - Optional credentials to test before committing to DB.
 * @returns Promise<VerifySmtpResult>
 */
export async function verifySmtpConnection(
  customSettings?: Partial<GlobalSettingData>
): Promise<VerifySmtpResult> {
  try {
    const config = await getMailTransporter(customSettings);

    if (!config) {
      return {
        success: false,
        error: "SMTP configuration is incomplete. Host, username, and password are required.",
      };
    }

    // Attempt verification handshake with SMTP server
    await config.transporter.verify();

    return {
      success: true,
      message: `Successfully connected to SMTP server ${config.settings.smtpHost}:${config.settings.smtpPort}.`,
    };
  } catch (error: any) {
    console.error("[MailService] SMTP verification failed:", error);

    let friendlyMessage = error.message || "Failed to establish connection to SMTP server.";

    if (error.code === "EAUTH") {
      friendlyMessage = "Authentication failed (code: EAUTH). Please verify your username and password. If you are using Gmail, 2-Step Verification must be enabled, and you must use a 16-character App Password (not your primary Google password).";
    } else if (error.code === "ECONNREFUSED") {
      friendlyMessage = "Connection refused (code: ECONNREFUSED). Please verify the host and port.";
    } else if (error.code === "ETIMEDOUT") {
      friendlyMessage = "Connection timed out (code: ETIMEDOUT). Check your firewall, network, or try switching port between 587 (STARTTLS) and 465 (SSL).";
    } else if (error.code === "ESOCKET") {
      friendlyMessage = `Socket communication error (code: ESOCKET): ${error.message}`;
    }

    return {
      success: false,
      error: friendlyMessage,
      code: error.code,
    };
  }
}

/**
 * High-level mail sender utility.
 * Sends email using configured SMTP settings. If SMTP is unconfigured, logs a warning
 * and returns { success: false, skipped: true } without throwing an exception.
 * 
 * @param options - SendMailOptions (to, subject, html, text, replyTo, from)
 * @returns Promise<SendMailResult>
 */
export async function sendMail(options: SendMailOptions): Promise<SendMailResult> {
  try {
    const mailConfig = await getMailTransporter();

    if (!mailConfig) {
      console.warn("[MailService] SMTP is unconfigured in Admin Settings. Email skipped:", {
        to: options.to,
        subject: options.subject,
      });
      return {
        success: false,
        skipped: true,
        error: "SMTP credentials are not configured in Admin Settings.",
      };
    }

    const { transporter, fromEmail, fromName } = mailConfig;
    const sender = options.from || `"${fromName}" <${fromEmail}>`;

    const info = await transporter.sendMail({
      from: sender,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
      replyTo: options.replyTo || fromEmail,
    });

    console.log(`[MailService] Email delivered successfully. Message ID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("[MailService] Failed to send email:", error);
    return {
      success: false,
      error: error.message || "Failed to deliver email.",
    };
  }
}

/**
 * Helper generating styled HTML email for new Contact Form Inquiries.
 */
export function generateInquiryEmailHtml({
  name,
  email,
  phone,
  message,
}: {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <div style="border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0; font-size: 20px;">New Contact Inquiry Received</h2>
        <p style="color: #64748b; margin: 5px 0 0; font-size: 14px;">Pinnacle Distributing Customer Portal</p>
      </div>
      <div style="margin-bottom: 20px;">
        <p style="margin: 8px 0;"><strong>Name:</strong> ${name}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #0284c7;">${email}</a></p>
        <p style="margin: 8px 0;"><strong>Phone:</strong> ${phone || "Not provided"}</p>
      </div>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #0284c7;">
        <h4 style="margin: 0 0 10px; color: #334155; font-size: 14px;">Message Content:</h4>
        <p style="margin: 0; color: #1e293b; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${message}</p>
      </div>
      <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        Pinnacle Distributing • Packaging & Janitorial Supplies
      </div>
    </div>
  `;
}
