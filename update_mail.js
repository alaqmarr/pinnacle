const fs = require('fs');

const path = 'lib/mail.ts';
const content = fs.readFileSync(path, 'utf8');

const splitToken = 'export interface InquiryEmailProps {';
const parts = content.split(splitToken);
if (parts.length < 2) {
    console.error('Could not find split token');
    process.exit(1);
}

const newTemplateCode = `export interface InquiryEmailProps {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message: string;
  subject?: string | null;
}

function withProfessionalWrapper(title: string, subtitle: string, bodyContent: string): string {
  return \`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: #0f172a; padding: 40px 30px; border-bottom: 4px solid #0284c7;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">PINNACLE</h1>
              <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px;">Packaging &amp; Janitorial</p>
            </td>
          </tr>
          
          <!-- Title Section -->
          <tr>
            <td style="padding: 30px 40px 10px 40px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 600;">\${title}</h2>
              \${subtitle ? \`<p style="color: #64748b; margin: 8px 0 0 0; font-size: 15px;">\${subtitle}</p>\` : ''}
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; color: #334155; font-size: 15px; line-height: 1.6;">
              \${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #64748b; margin: 0 0 8px 0; font-size: 13px;">&copy; \${new Date().getFullYear()} Pinnacle Distributing. All rights reserved.</p>
              <p style="color: #94a3b8; margin: 0; font-size: 12px;">Dallas Logistics Office &bull; <a href="tel:8005550199" style="color: #0284c7; text-decoration: none;">(800) 555-0199</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  \`;
}

export function generateInquiryEmailHtml({
  name,
  email,
  phone,
  company,
  message,
  subject,
}: InquiryEmailProps): string {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = phone ? escapeHtml(phone) : null;
  const safeCompany = company ? escapeHtml(company) : null;
  const safeMessage = escapeHtml(message).replace(/\\n/g, "<br>");
  const safeSubject = subject ? escapeHtml(subject) : "Website Contact Form Submission";

  const bodyContent = \`
    <div style="background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 20px; border-radius: 0 8px 8px 0; margin: 0 0 24px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #1e293b;"><strong style="color: #0f172a; display: inline-block; width: 100px;">Name:</strong> \${safeName}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #1e293b;"><strong style="color: #0f172a; display: inline-block; width: 100px;">Email:</strong> <a href="mailto:\${safeEmail}" style="color: #0284c7; text-decoration: none;">\${safeEmail}</a></p>
      \${safePhone ? \`<p style="margin: 0 0 8px 0; font-size: 14px; color: #1e293b;"><strong style="color: #0f172a; display: inline-block; width: 100px;">Phone:</strong> \${safePhone}</p>\` : ""}
      \${safeCompany ? \`<p style="margin: 0; font-size: 14px; color: #1e293b;"><strong style="color: #0f172a; display: inline-block; width: 100px;">Company:</strong> \${safeCompany}</p>\` : ""}
    </div>
    <h3 style="color: #0f172a; font-size: 16px; margin: 0 0 12px 0;">Message:</h3>
    <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px; line-height: 1.6; color: #334155;">
      \${safeMessage}
    </div>
  \`;

  return withProfessionalWrapper(safeSubject, "You have received a new contact submission.", bodyContent);
}

export interface QuoteNotificationEmailProps {
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  company?: string | null;
  addressText?: string | null;
  notes?: string | null;
  orderNumber?: string;
  quoteNumber?: string;
  items: Array<{ name: string; sku?: string | null; quantity: number }>;
}

export function generateQuoteNotificationEmailHtml(props: QuoteNotificationEmailProps): string {
  const reference = escapeHtml(props.quoteNumber || props.orderNumber || "QUOTE");
  const safeCustomerName = escapeHtml(props.customerName);
  const safeCustomerEmail = props.customerEmail ? escapeHtml(props.customerEmail) : null;
  const safeCustomerPhone = props.customerPhone ? escapeHtml(props.customerPhone) : null;
  const safeCompany = props.company ? escapeHtml(props.company) : "N/A";
  const safeAddressText = props.addressText ? escapeHtml(props.addressText) : "N/A";
  const safeNotes = props.notes ? escapeHtml(props.notes) : null;

  const itemRows = props.items.length > 0
    ? props.items
        .map(
          (item) => \`
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a; font-weight: 500;">\${escapeHtml(item.name)}</td>
            <td style="padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #64748b; font-family: monospace;">\${escapeHtml(item.sku || "N/A")}</td>
            <td style="padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a; font-weight: 600; text-align: center;">\${Number(item.quantity) || 1}</td>
          </tr>
        \`
        )
        .join("")
    : "";

  const bodyContent = \`
    <div style="background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 20px; border-radius: 0 8px 8px 0; margin: 0 0 32px 0;">
      <h3 style="color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0;">Customer Details</h3>
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 14px;">
        <tr><td width="130" style="padding: 4px 0; color: #64748b;"><strong>Contact Name:</strong></td><td style="padding: 4px 0; color: #0f172a;">\${safeCustomerName}</td></tr>
        <tr><td width="130" style="padding: 4px 0; color: #64748b;"><strong>Email:</strong></td><td style="padding: 4px 0;"><a href="mailto:\${safeCustomerEmail}" style="color: #0284c7; text-decoration: none;">\${safeCustomerEmail || "N/A"}</a></td></tr>
        <tr><td width="130" style="padding: 4px 0; color: #64748b;"><strong>Phone:</strong></td><td style="padding: 4px 0; color: #0f172a;">\${safeCustomerPhone || "N/A"}</td></tr>
        <tr><td width="130" style="padding: 4px 0; color: #64748b;"><strong>Company:</strong></td><td style="padding: 4px 0; color: #0f172a;">\${safeCompany}</td></tr>
        <tr><td width="130" style="padding: 4px 0; color: #64748b;"><strong>Delivery Address:</strong></td><td style="padding: 4px 0; color: #0f172a;">\${safeAddressText}</td></tr>
        \${safeNotes ? \`<tr><td width="130" style="padding: 4px 0; color: #64748b; vertical-align: top;"><strong>Notes:</strong></td><td style="padding: 4px 0; color: #0f172a;">\${safeNotes}</td></tr>\` : ""}
      </table>
    </div>

    <h3 style="color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Requested Items (\${props.items.length})</h3>
    <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: left;">
        <thead>
          <tr>
            <th style="background-color: #f8fafc; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Product</th>
            <th style="background-color: #f8fafc; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">SKU</th>
            <th style="background-color: #f8fafc; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; text-align: center;">Quantity</th>
          </tr>
        </thead>
        <tbody>
          \${itemRows}
        </tbody>
      </table>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <a href="\${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/orders" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 15px;">View in Admin Dashboard</a>
    </div>
  \`;

  return withProfessionalWrapper(\`Quote Request Received: \${reference}\`, "Action Required: Commercial Sales Desk", bodyContent);
}

export interface CustomerQuoteConfirmationEmailProps {
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  addressText?: string | null;
  notes?: string | null;
  orderNumber?: string;
  quoteNumber?: string;
  itemCount?: number;
  items?: Array<{ name: string; sku?: string | null; quantity: number }>;
}

export function generateCustomerQuoteConfirmationEmailHtml({
  customerName,
  customerEmail,
  customerPhone,
  addressText,
  notes,
  orderNumber,
  quoteNumber,
  itemCount,
  items,
}: CustomerQuoteConfirmationEmailProps): string {
  const reference = escapeHtml(quoteNumber || orderNumber || "QUOTE");
  const safeCustomerName = escapeHtml(customerName);
  const count = itemCount !== undefined ? itemCount : (items ? items.length : 1);

  const itemRows = items && items.length > 0
    ? items
        .map(
          (item) => \`
          <tr>
            <td style="padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a; font-weight: 500;">\${escapeHtml(item.name)}</td>
            <td style="padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #64748b; font-family: monospace;">\${escapeHtml(item.sku || "N/A")}</td>
            <td style="padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #0f172a; font-weight: 600; text-align: center;">\${Number(item.quantity) || 1}</td>
          </tr>
        \`
        )
        .join("")
    : "";

  const bodyContent = \`
    <p>Dear \${safeCustomerName},</p>
    <p>Thank you for submitting your quotation inquiry for <strong>\${count}</strong> commercial item(s). Our sales team is reviewing your requested items and will follow up shortly with wholesale pricing, freight options, and availability within 1 business day.</p>
    
    <div style="background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 20px; border-radius: 0 8px 8px 0; margin: 24px 0;">
      <p style="margin: 0; font-size: 15px; color: #0f172a;"><strong>Reference Number:</strong> \${reference}</p>
    </div>

    \${itemRows ? \`
      <h3 style="color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin: 32px 0 12px 0;">Requested Items (\${items!.length})</h3>
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: left;">
          <thead>
            <tr>
              <th style="background-color: #f8fafc; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Product</th>
              <th style="background-color: #f8fafc; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">SKU</th>
              <th style="background-color: #f8fafc; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; text-align: center;">Quantity</th>
            </tr>
          </thead>
          <tbody>
            \${itemRows}
          </tbody>
        </table>
      </div>
    \` : ""}

    <p style="color: #64748b; font-size: 14px;">If you have urgent requirements or need immediate dispatch assistance, please contact our Dallas Logistics Office at (800) 555-0199 or reply directly to this email.</p>
  \`;

  return withProfessionalWrapper(\`Quote Inquiry Received: \${reference}\`, "Thank you for choosing Pinnacle Distributing", bodyContent);
}
`;

fs.writeFileSync(path, parts[0] + newTemplateCode);
console.log('Successfully updated mail.ts');
