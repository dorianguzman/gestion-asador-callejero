/**
 * Cloudflare Pages Function: Closed Sales API
 * GET /api/sales-closed - Get all closed sales
 * POST /api/sales-closed - Close a sale (move from active to closed)
 * DELETE /api/sales-closed?id=xxx - Delete a closed sale
 */

export async function onRequest(context) {
    const { request, env } = context;
    const { method } = request;
    const url = new URL(request.url);

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // GET all closed sales
        if (method === 'GET') {
            const results = await env.DB.prepare(
                'SELECT * FROM sales_closed ORDER BY closed_at DESC LIMIT 100'
            ).all();

            const sales = results.results.map(row => ({
                id: row.id,
                items: JSON.parse(row.items),
                total: row.total,
                deliveryFee: row.delivery_fee,
                paymentMethod: row.payment_method,
                createdAt: new Date(row.created_at).toISOString(),
                closedAt: new Date(row.closed_at).toISOString()
            }));

            return new Response(JSON.stringify(sales), {
                headers: corsHeaders
            });
        }

        // POST close a sale
        if (method === 'POST') {
            const { saleId, paymentMethod } = await request.json();

            // Get the active sale
            const activeSale = await env.DB.prepare(
                'SELECT * FROM sales_active WHERE id = ?'
            ).bind(saleId).first();

            if (!activeSale) {
                return new Response(JSON.stringify({ error: 'Sale not found' }), {
                    status: 404,
                    headers: corsHeaders
                });
            }

            const now = Date.now();

            // Begin transaction - move sale from active to closed
            await env.DB.batch([
                env.DB.prepare(
                    'INSERT INTO sales_closed (id, items, total, delivery_fee, payment_method, created_at, closed_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
                ).bind(
                    activeSale.id,
                    activeSale.items,
                    activeSale.total,
                    activeSale.delivery_fee,
                    paymentMethod,
                    activeSale.created_at,
                    now
                ),
                env.DB.prepare(
                    'DELETE FROM sales_active WHERE id = ?'
                ).bind(saleId)
            ]);

            return new Response(JSON.stringify({ success: true }), {
                headers: corsHeaders
            });
        }

        // DELETE a closed sale
        if (method === 'DELETE') {
            const id = url.searchParams.get('id');
            if (!id) {
                return new Response(JSON.stringify({ error: 'ID required' }), {
                    status: 400,
                    headers: corsHeaders
                });
            }

            await env.DB.prepare(
                'DELETE FROM sales_closed WHERE id = ?'
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
        console.error('Sales Closed API error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
