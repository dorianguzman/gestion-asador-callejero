/**
 * Cloudflare Pages Function: Expenses API
 * GET /api/expenses - Get all expenses
 * POST /api/expenses - Add new expense
 * PUT /api/expenses?id=xxx - Update expense
 * DELETE /api/expenses?id=xxx - Delete expense
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
        // GET all expenses
        if (method === 'GET') {
            const results = await env.DB.prepare(
                'SELECT * FROM expenses ORDER BY date DESC, created_at DESC'
            ).all();

            const expenses = results.results.map(row => ({
                id: row.id,
                description: row.description,
                amount: row.amount,
                category: row.category,
                date: row.date,
                createdAt: new Date(row.created_at).toISOString()
            }));

            return new Response(JSON.stringify(expenses), {
                headers: corsHeaders
            });
        }

        // POST new expense
        if (method === 'POST') {
            const expense = await request.json();
            const id = Date.now().toString();

            await env.DB.prepare(
                'INSERT INTO expenses (id, description, amount, category, date, created_at) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(
                id,
                expense.description,
                expense.amount,
                expense.category,
                expense.date,
                Date.now()
            ).run();

            return new Response(JSON.stringify({ id, ...expense, createdAt: new Date().toISOString() }), {
                headers: corsHeaders
            });
        }

        // PUT update expense
        if (method === 'PUT') {
            const id = url.searchParams.get('id');
            if (!id) {
                return new Response(JSON.stringify({ error: 'ID required' }), {
                    status: 400,
                    headers: corsHeaders
                });
            }

            const expense = await request.json();

            await env.DB.prepare(
                'UPDATE expenses SET description = ?, amount = ?, category = ?, date = ? WHERE id = ?'
            ).bind(
                expense.description,
                expense.amount,
                expense.category,
                expense.date,
                id
            ).run();

            // Get the updated expense
            const result = await env.DB.prepare(
                'SELECT * FROM expenses WHERE id = ?'
            ).bind(id).first();

            if (!result) {
                return new Response(JSON.stringify({ error: 'Expense not found' }), {
                    status: 404,
                    headers: corsHeaders
                });
            }

            const updatedExpense = {
                id: result.id,
                description: result.description,
                amount: result.amount,
                category: result.category,
                date: result.date,
                createdAt: new Date(result.created_at).toISOString()
            };

            return new Response(JSON.stringify(updatedExpense), {
                headers: corsHeaders
            });
        }

        // DELETE expense
        if (method === 'DELETE') {
            const id = url.searchParams.get('id');
            if (!id) {
                return new Response(JSON.stringify({ error: 'ID required' }), {
                    status: 400,
                    headers: corsHeaders
                });
            }

            await env.DB.prepare(
                'DELETE FROM expenses WHERE id = ?'
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
        console.error('Expenses API error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
