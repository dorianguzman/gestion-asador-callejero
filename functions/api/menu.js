/**
 * Cloudflare Pages Function: Menu API
 * GET /api/menu - Get menu
 * POST /api/menu - Update menu
 */

export async function onRequest(context) {
    const { request, env } = context;
    const { method } = request;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Handle OPTIONS (preflight)
    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // GET menu
        if (method === 'GET') {
            const result = await env.DB.prepare(
                'SELECT data FROM menu WHERE id = ?'
            ).bind('default').first();

            if (!result) {
                // Return default menu from local file if not in DB
                return new Response(JSON.stringify(null), {
                    headers: corsHeaders
                });
            }

            return new Response(result.data, {
                headers: corsHeaders
            });
        }

        // POST menu (update)
        if (method === 'POST') {
            const menu = await request.json();

            await env.DB.prepare(
                'INSERT OR REPLACE INTO menu (id, data, updated_at) VALUES (?, ?, ?)'
            ).bind(
                'default',
                JSON.stringify(menu),
                Date.now()
            ).run();

            return new Response(JSON.stringify({ success: true }), {
                headers: corsHeaders
            });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: corsHeaders
        });

    } catch (error) {
        console.error('Menu API error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
