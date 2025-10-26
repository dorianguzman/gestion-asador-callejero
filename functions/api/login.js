/**
 * Cloudflare Pages Function: Login API
 * POST /api/login - Verify password and create session
 */

const COOKIE_NAME = 'asador_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export async function onRequest(context) {
    const { request, env } = context;
    const { method } = request;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: corsHeaders
        });
    }

    try {
        const { password } = await request.json();
        const AUTH_PASSWORD = env.AUTH_PASSWORD;

        // Check if password is configured
        if (!AUTH_PASSWORD) {
            console.error('AUTH_PASSWORD not configured');
            return new Response(JSON.stringify({
                success: false,
                message: 'Sistema no configurado correctamente'
            }), {
                status: 500,
                headers: corsHeaders
            });
        }

        // Verify password
        if (password !== AUTH_PASSWORD) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Contraseña incorrecta'
            }), {
                status: 401,
                headers: corsHeaders
            });
        }

        // Password correct - create session cookie
        const sessionData = {
            authenticated: true,
            timestamp: Date.now()
        };

        // Sign the session data with HMAC
        const sessionToken = await createSignedToken(sessionData, AUTH_PASSWORD);

        // Set cookie and return success
        const headers = new Headers(corsHeaders);
        headers.set('Set-Cookie', `${COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`);

        return new Response(JSON.stringify({
            success: true,
            message: 'Acceso concedido',
            redirect: '/'
        }), {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: 'Error al procesar solicitud'
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

/**
 * Create a signed token using HMAC-SHA256
 */
async function createSignedToken(data, secret) {
    const payload = JSON.stringify(data);
    const encoder = new TextEncoder();

    // Import the secret key
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    // Sign the payload
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
    );

    // Convert signature to hex
    const signatureHex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    // Combine payload and signature
    const token = btoa(payload) + '.' + signatureHex;

    return token;
}
