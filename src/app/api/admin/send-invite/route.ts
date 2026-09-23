import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * 📧 Create nodemailer transporter supporting:
 * 1. Google OAuth 2.0 (Client ID, Secret, Refresh Token)
 * 2. Gmail App Password (16-char code — recommended for fast setup)
 * 3. Custom SMTP (Host, Port, User, Pass)
 */
function getEmailTransporter() {
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;

  // 1. Google OAuth2 configuration
  if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    gmailUser
  ) {
    return {
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: gmailUser,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        },
      }),
      sender: gmailUser,
      authType: 'Google OAuth2',
    };
  }

  // 2. Gmail App Password (super easy, no cloud console tokens needed)
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  if (gmailUser && gmailPass) {
    return {
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      }),
      sender: gmailUser,
      authType: 'Gmail App Password',
    };
  }

  // 3. Custom SMTP provider (SendGrid, Mailgun, SES, etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }),
      sender: process.env.SMTP_FROM || process.env.SMTP_USER,
      authType: 'Custom SMTP',
    };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role, tempPassword, loginUrl } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const host = req.headers.get('host') || 'balimesari.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const adminUrl = loginUrl || `${protocol}://${host}/admin`;
    const password = tempPassword || 'MesariStaff2026!';
    const roleTitle = role === 'super_admin' ? 'Super Administrator' : 'Operations Staff';

    const emailSubject = `Welcome to Bali Mesari Tour Team — Your Staff Login Credentials`;
    
    // Plain text version
    const textContent = `
Dear ${name},

You have been granted access to the Bali Mesari Tour management portal as ${roleTitle}.

Your staff login credentials:
------------------------------------------
Portal URL: ${adminUrl}
Login Email: ${email}
Temporary Password: ${password}
------------------------------------------

Important steps:
1. Log in at ${adminUrl}
2. Go to "Settings & Password" in the top bar to set a private password.
3. Keep your credentials confidential.

Warm regards,
Bali Mesari Tour Administration Team
    `.trim();

    // Responsive HTML email with Bali Mesari luxury branding
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td style="background-color: #064e3b; padding: 36px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Bali Mesari Tour</h1>
              <p style="margin: 8px 0 0 0; color: #a7f3d0; font-size: 13px; font-weight: 500;">Staff Management &amp; Dispatch Portal</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #111827;">Hello ${name},</h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                You have been registered as a <strong>${roleTitle}</strong> on the official Bali Mesari Tour administration platform. Here are your temporary login credentials:
              </p>

              <!-- Credentials Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; color: #065f46; margin-bottom: 12px;">Login Credentials</div>
                    
                    <div style="margin-bottom: 10px;">
                      <span style="font-size: 12px; color: #64748b; display: inline-block; width: 120px;">Portal URL:</span>
                      <a href="${adminUrl}" style="font-size: 13px; color: #047857; text-decoration: none; font-weight: 600;">${adminUrl}</a>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                      <span style="font-size: 12px; color: #64748b; display: inline-block; width: 120px;">Login Email:</span>
                      <strong style="font-size: 13px; color: #0f172a;">${email}</strong>
                    </div>

                    <div>
                      <span style="font-size: 12px; color: #64748b; display: inline-block; width: 120px;">Temp Password:</span>
                      <span style="font-family: monospace; font-size: 14px; font-weight: 700; background-color: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 6px; border: 1px solid #fde68a;">${password}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" style="display: inline-block; background-color: #064e3b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(6, 78, 59, 0.25);">
                      Sign In to Admin Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice -->
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 0 10px 10px 0; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #166534;">
                  <strong>Security Note:</strong> Please change your temporary password immediately in the <em>Settings &amp; Password</em> menu after logging in.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                Need help? Contact the Superadmin team or reply directly to this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                &copy; ${new Date().getFullYear()} Bali Mesari Tour &amp; Travel. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const emailSetup = getEmailTransporter();
    let sentRealEmail = false;
    let deliveryMessage = 'Email prepared';

    if (emailSetup) {
      try {
        await emailSetup.transporter.sendMail({
          from: `"Bali Mesari Tour" <${emailSetup.sender}>`,
          to: email,
          subject: emailSubject,
          text: textContent,
          html: htmlContent,
        });
        sentRealEmail = true;
        deliveryMessage = `Direct email successfully delivered to ${email} via ${emailSetup.authType}`;
        console.log(`[STAFF_INVITE] Sent real email to ${email} using ${emailSetup.authType}`);
      } catch (sendError: any) {
        console.error('[STAFF_INVITE] Failed to send via transporter:', sendError);
        deliveryMessage = `SMTP/OAuth error: ${sendError.message || 'Check email credentials'}`;
      }
    } else {
      console.log(`[STAFF_INVITE] No Google/SMTP credentials configured in .env.local. Prepared credentials for ${email}.`);
      deliveryMessage = 'No email credentials configured in .env.local. Direct mailto/copy fallback active.';
    }

    return NextResponse.json({
      success: true,
      sentRealEmail,
      message: deliveryMessage,
      authType: emailSetup ? emailSetup.authType : 'None (Fallback mode)',
      data: {
        recipient: email,
        name,
        subject: emailSubject,
        body: textContent,
        loginUrl: adminUrl,
        tempPassword: password,
      },
    });
  } catch (error: any) {
    console.error('Error generating invite email:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to dispatch email' },
      { status: 500 }
    );
  }
}
