/**
 * Cloudflare Pages Function: Reopen Closed Sale
 * POST /api/sales-active/reopen - Reopen a closed sale (move back to active)
 */

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

    try {
        // POST reopen a closed sale
        if (method === 'POST') {
            const { saleId } = await request.json();

            if (!saleId) {
                return new Response(JSON.stringify({ error: 'Sale ID required' }), {
                    status: 400,
                    headers: corsHeaders
                });
            }

            // Get the closed sale
            const closedSale = await env.DB.prepare(
                'SELECT * FROM sales_closed WHERE id = ?'
            ).bind(saleId).first();

            if (!closedSale) {
                return new Response(JSON.stringify({ error: 'Closed sale not found' }), {
                    status: 404,
                    headers: corsHeaders
                });
            }

            const now = Date.now();

            // Begin transaction - move sale from closed to active
            await env.DB.batch([
                env.DB.prepare(
                    'INSERT INTO sales_active (id, items, total, delivery_fee, created_at) VALUES (?, ?, ?, ?, ?)'
                ).bind(
                    closedSale.id,
                    closedSale.items,
                    closedSale.total,
                    closedSale.delivery_fee,
                    now
                ),
                env.DB.prepare(
                    'DELETE FROM sales_closed WHERE id = ?'
                ).bind(saleId)
            ]);

            // Return the reopened sale
            const reopenedSale = {
                id: closedSale.id,
                items: JSON.parse(closedSale.items),
                total: closedSale.total,
                deliveryFee: closedSale.delivery_fee,
                createdAt: new Date(now).toISOString()
            };

            return new Response(JSON.stringify(reopenedSale), {
                headers: corsHeaders
            });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: corsHeaders
        });

    } catch (error) {
        console.error('Reopen Sale API error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
