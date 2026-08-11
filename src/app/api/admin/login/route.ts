import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { passkey } = await request.json();
    const expectedPasskey = process.env.ADMIN_PASSKEY || 'admin123';

    if (!passkey || passkey !== expectedPasskey) {
      return NextResponse.json({ error: 'Invalid admin passkey' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    
    // Set cookie on response
    response.cookies.set('pvideo_admin_token', 'admin_authenticated_secret_session', {
      path: '/',
      httpOnly: false, // Allow client access for extra resilience
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
