/**
 * Cloudflare Pages Function: Logout API
 * POST /api/logout - Clear session and logout
 */

const COOKIE_NAME = 'asador_session';

export async function onRequest(context) {
    const { request } = context;
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

    // Clear session cookie
    const headers = new Headers(corsHeaders);
    headers.set('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);

    return new Response(JSON.stringify({
        success: true,
        message: 'Sesión cerrada correctamente'
    }), {
        status: 200,
        headers
    });
}
