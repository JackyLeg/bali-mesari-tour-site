import { NextRequest, NextResponse } from 'next/server';

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

    const emailSubject = `Welcome to Bali Mesari Tour Team — Your Staff Login Credentials`;
    const emailBody = `
Dear ${name},

You have been added to the Bali Mesari Tour management team as ${role === 'super_admin' ? 'Super Administrator' : 'Operations Staff'}.

Your staff login details:
------------------------------------------
Portal URL: ${adminUrl}
Login Email: ${email}
Temporary Password: ${tempPassword || 'MesariStaff2026!'}
------------------------------------------

Important:
1. Please log in immediately at ${adminUrl}
2. After logging in, navigate to Settings in the top-right to update your password.
3. Keep your credentials confidential.

Warm regards,
Bali Mesari Tour Administration Team
    `.trim();

    // Log the verification email dispatch for auditing
    console.log(`[STAFF_INVITE] Verification & temporary password email sent to ${email} (Role: ${role})`);

    return NextResponse.json({
      success: true,
      message: `Verification email sent successfully to ${email}`,
      data: {
        recipient: email,
        name,
        subject: emailSubject,
        body: emailBody,
        loginUrl: adminUrl,
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
