/**
 * Cloudflare Pages Function: Active Sales API
 * GET /api/sales-active - Get all active sales
 * POST /api/sales-active - Add new sale
 * PUT /api/sales-active - Update sale
 * DELETE /api/sales-active?id=xxx - Delete sale
 */

export async function onRequest(context) {
    const { request, env } = context;
    const { method } = request;
    const url = new URL(request.url);

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // GET all active sales
        if (method === 'GET') {
            const results = await env.DB.prepare(
                'SELECT * FROM sales_active ORDER BY created_at DESC'
            ).all();

            const sales = results.results.map(row => ({
                id: row.id,
                items: JSON.parse(row.items),
                total: row.total,
                deliveryFee: row.delivery_fee,
                createdAt: new Date(row.created_at).toISOString()
            }));

            return new Response(JSON.stringify(sales), {
                headers: corsHeaders
            });
        }

        // POST new sale
        if (method === 'POST') {
            const sale = await request.json();
            const id = Date.now().toString();

            await env.DB.prepare(
                'INSERT INTO sales_active (id, items, total, delivery_fee, created_at) VALUES (?, ?, ?, ?, ?)'
            ).bind(
                id,
                JSON.stringify(sale.items),
                sale.total,
                sale.deliveryFee || 0,
                Date.now()
            ).run();

            return new Response(JSON.stringify({ id, ...sale }), {
                headers: corsHeaders
            });
        }

        // DELETE sale
        if (method === 'DELETE') {
            const id = url.searchParams.get('id');
            if (!id) {
                return new Response(JSON.stringify({ error: 'ID required' }), {
                    status: 400,
                    headers: corsHeaders
                });
            }

            await env.DB.prepare(
                'DELETE FROM sales_active WHERE id = ?'
            ).bind(id).run();

            return new Response(JSON.stringify({ success: true }), {
                headers: corsHeaders
            });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: corsHeaders
        });

    } catch (error) {
        console.error('Sales Active API error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
