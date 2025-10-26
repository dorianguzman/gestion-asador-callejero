/**
 * Cloudflare Pages Middleware: Session Authentication
 * Checks for valid session cookie on all requests
 */

const COOKIE_NAME = 'asador_session';

export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Allow login page and API endpoints without authentication
    if (pathname === '/login.html' ||
        pathname === '/login' ||
        pathname.startsWith('/api/login') ||
        pathname.startsWith('/api/logout')) {
        return next();
    }

    // Get password from environment
    const AUTH_PASSWORD = env.AUTH_PASSWORD;

    // If no password configured, allow access (for local dev)
    if (!AUTH_PASSWORD) {
        console.warn('⚠️ AUTH_PASSWORD not set - authentication disabled');
        return next();
    }

    // Get session cookie
    const cookies = parseCookies(request.headers.get('Cookie') || '');
    const sessionToken = cookies[COOKIE_NAME];

    // If no session cookie, redirect to login
    if (!sessionToken) {
        return redirectToLogin();
    }

    // Verify session token
    const isValid = await verifyToken(sessionToken, AUTH_PASSWORD);

    if (!isValid) {
        // Invalid session - clear cookie and redirect to login
        return redirectToLogin(true);
    }

    // Valid session - continue to app
    return next();
}

/**
 * Redirect to login page
 */
function redirectToLogin(clearCookie = false) {
    const headers = new Headers({
        'Location': '/login.html'
    });

    if (clearCookie) {
        headers.set('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
    }

    return new Response(null, {
        status: 302,
        headers
    });
}

/**
 * Parse cookies from Cookie header
 */
function parseCookies(cookieHeader) {
    const cookies = {};
    cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            cookies[name] = value;
        }
    });
    return cookies;
}

/**
 * Verify a signed token
 */
async function verifyToken(token, secret) {
    try {
        const [payloadB64, signatureHex] = token.split('.');

        if (!payloadB64 || !signatureHex) {
            return false;
        }

        // Decode payload
        const payload = atob(payloadB64);
        const data = JSON.parse(payload);

        // Check if session is expired (7 days)
        const maxAge = 60 * 60 * 24 * 7 * 1000; // 7 days in milliseconds
        if (Date.now() - data.timestamp > maxAge) {
            return false;
        }

        // Verify signature
        const encoder = new TextEncoder();

        // Import the secret key
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        // Convert hex signature back to ArrayBuffer
        const signatureBytes = new Uint8Array(
            signatureHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
        );

        // Verify the signature
        const isValid = await crypto.subtle.verify(
            'HMAC',
            key,
            signatureBytes,
            encoder.encode(payload)
        );

        return isValid;
    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}
