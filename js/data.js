/*
 * DATA.JS - Data Management with Cloudflare D1
 * Uses D1 database via Cloudflare Pages Functions
 */

// In-memory cache
let dataCache = {
    menu: null,
    salesActive: [],
    salesClosed: [],
    expenses: [],
    config: {}
};

let isDataLoaded = false;
let isDatabaseAvailable = false;

/**
 * Initialize data from D1
 */
async function initializeData() {
    if (isDataLoaded) {
        console.log('✅ Data already loaded');
        return dataCache;
    }

    try {
        updateSyncStatus('syncing');

        // Try to load data from D1 via API
        let menu, salesActive, salesClosed, expenses;

        try {
            [menu, salesActive, salesClosed, expenses] = await Promise.all([
                fetch('/api/menu').then(r => r.ok ? r.json() : null),
                fetch('/api/sales-active').then(r => r.ok ? r.json() : []),
                fetch('/api/sales-closed').then(r => r.ok ? r.json() : []),
                fetch('/api/expenses').then(r => r.ok ? r.json() : [])
            ]);

            // Check if database is available (at least menu loaded from API)
            isDatabaseAvailable = menu !== null;

            if (!isDatabaseAvailable) {
                console.log('⚠️ Database not available - need to configure D1');
                if (typeof updateDatabaseStatus === 'function') {
                    updateDatabaseStatus(false);
                }
            } else {
                console.log('✅ Database connected');
                if (typeof updateDatabaseStatus === 'function') {
                    updateDatabaseStatus(true);
                }
            }
        } catch (apiError) {
            console.log('⚠️ API not available (running locally?), using local data');
            isDatabaseAvailable = false;
            if (typeof updateDatabaseStatus === 'function') {
                updateDatabaseStatus(false);
            }
            menu = null;
            salesActive = [];
            salesClosed = [];
            expenses = [];
        }

        // If menu is null, load from local file
        if (!menu) {
            console.log('📁 Loading menu from local file');
            const response = await fetch('data/menu.json');
            dataCache.menu = await response.json();

            // Try to save to D1 if API is available
            try {
                await fetch('/api/menu', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataCache.menu)
                });
            } catch (saveError) {
                console.log('⚠️ Could not save menu to D1 (running locally?)');
            }
        } else {
            dataCache.menu = menu;
        }

        dataCache.salesActive = salesActive || [];
        dataCache.salesClosed = salesClosed || [];
        dataCache.expenses = expenses || [];
        dataCache.config = {
            version: '1.0',
            appName: 'Asador Callejero Catorce',
            currency: 'MXN'
        };

        isDataLoaded = true;
        updateSyncStatus('idle');
        console.log('✅ Data loaded successfully');

        return dataCache;
    } catch (error) {
        console.error('❌ Error loading data:', error);
        updateSyncStatus('idle');

        // Fallback to local menu
        try {
            const response = await fetch('data/menu.json');
            dataCache.menu = await response.json();
            dataCache.salesActive = [];
            dataCache.salesClosed = [];
            dataCache.expenses = [];
            dataCache.config = {
                version: '1.0',
                appName: 'Asador Callejero Catorce',
                currency: 'MXN'
            };
            isDataLoaded = true;
            console.log('✅ Loaded from local fallback');
        } catch (localError) {
            console.error('❌ Error loading local data:', localError);
        }

        return dataCache;
    }
}

/**
 * Get menu data
 */
function getMenu() {
    return dataCache.menu;
}

/**
 * Get active sales
 */
function getActiveSales() {
    return dataCache.salesActive || [];
}

/**
 * Get closed sales
 */
function getClosedSales() {
    return dataCache.salesClosed || [];
}

/**
 * Get expenses
 */
function getExpenses() {
    return dataCache.expenses || [];
}

/**
 * Add new active sale
 */
async function addActiveSale(sale) {
    try {
        updateSyncStatus('syncing');

        const response = await fetch('/api/sales-active', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: sale.items,
                total: sale.total,
                deliveryFee: sale.deliveryFee || 0
            })
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const savedSale = await response.json();

        // Update cache
        dataCache.salesActive.push(savedSale);

        updateSyncStatus('idle');
        return savedSale;
    } catch (error) {
        console.error('Error adding sale:', error);
        updateSyncStatus('idle');
        if (typeof showToast === 'function') {
            showToast('Error al guardar venta - Verifica conexión a base de datos', 'error');
        }
        throw error;
    }
}

/**
 * Close a sale (move from active to closed)
 */
async function closeSale(saleId, paymentMethod) {
    try {
        updateSyncStatus('syncing');

        const response = await fetch('/api/sales-closed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ saleId, paymentMethod })
        });

        if (!response.ok) {
            throw new Error('Failed to close sale');
        }

        // Update cache
        const saleIndex = dataCache.salesActive.findIndex(s => s.id === saleId);
        if (saleIndex !== -1) {
            const sale = dataCache.salesActive[saleIndex];
            sale.status = 'closed';
            sale.paymentMethod = paymentMethod;
            sale.closedAt = new Date().toISOString();

            dataCache.salesClosed.unshift(sale);
            dataCache.salesActive.splice(saleIndex, 1);
        }

        updateSyncStatus('idle');
        return true;
    } catch (error) {
        console.error('Error closing sale:', error);
        updateSyncStatus('idle');
        throw error;
    }
}

/**
 * Close a sale with payment breakdown and tip
 */
async function closeSaleWithPayment(saleId, paymentMethod, paymentBreakdown, tip) {
    try {
        updateSyncStatus('syncing');

        const response = await fetch('/api/sales-closed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                saleId,
                paymentMethod,
                paymentBreakdown,
                tip
            })
        });

        if (!response.ok) {
            throw new Error('Failed to close sale');
        }

        // Update cache
        const saleIndex = dataCache.salesActive.findIndex(s => s.id === saleId);
        if (saleIndex !== -1) {
            const sale = dataCache.salesActive[saleIndex];
            sale.status = 'closed';
            sale.paymentMethod = paymentMethod;
            sale.paymentBreakdown = paymentBreakdown;
            sale.tip = tip;
            sale.closedAt = new Date().toISOString();

            dataCache.salesClosed.unshift(sale);
            dataCache.salesActive.splice(saleIndex, 1);
        }

        updateSyncStatus('idle');
        return true;
    } catch (error) {
        console.error('Error closing sale with payment:', error);
        updateSyncStatus('idle');
        throw error;
    }
}

/**
 * Delete an active sale
 */
async function deleteActiveSale(saleId) {
    try {
        updateSyncStatus('syncing');

        const response = await fetch(`/api/sales-active?id=${saleId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete sale');
        }

        // Update cache
        const saleIndex = dataCache.salesActive.findIndex(s => s.id === saleId);
        if (saleIndex !== -1) {
            dataCache.salesActive.splice(saleIndex, 1);
        }

        updateSyncStatus('idle');
    } catch (error) {
        console.error('Error deleting sale:', error);
        updateSyncStatus('idle');
        throw error;
    }
}

/**
 * Add new expense
 */
async function addExpense(expense) {
    try {
        updateSyncStatus('syncing');

        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense)
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const savedExpense = await response.json();

        // Update cache
        dataCache.expenses.unshift(savedExpense);

        updateSyncStatus('idle');
        return savedExpense;
    } catch (error) {
        console.error('Error adding expense:', error);
        updateSyncStatus('idle');
        if (typeof showToast === 'function') {
            showToast('Error al guardar gasto - Verifica conexión a base de datos', 'error');
        }
        throw error;
    }
}

/**
 * Update expense
 */
async function updateExpense(expenseId, expense) {
    try {
        updateSyncStatus('syncing');

        const response = await fetch(`/api/expenses?id=${expenseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(expense)
        });

        if (!response.ok) {
            throw new Error('Failed to update expense');
        }

        const updatedExpense = await response.json();

        // Update cache
        const expenseIndex = dataCache.expenses.findIndex(e => e.id === expenseId);
        if (expenseIndex !== -1) {
            dataCache.expenses[expenseIndex] = updatedExpense;
        }

        updateSyncStatus('idle');
        return updatedExpense;
    } catch (error) {
        console.error('Error updating expense:', error);
        updateSyncStatus('idle');
        throw error;
    }
}

/**
 * Delete expense
 */
async function deleteExpense(expenseId) {
    try {
        updateSyncStatus('syncing');

        const response = await fetch(`/api/expenses?id=${expenseId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete expense');
        }

        // Update cache
        const expenseIndex = dataCache.expenses.findIndex(e => e.id === expenseId);
        if (expenseIndex !== -1) {
            dataCache.expenses.splice(expenseIndex, 1);
        }

        updateSyncStatus('idle');
    } catch (error) {
        console.error('Error deleting expense:', error);
        updateSyncStatus('idle');
        throw error;
    }
}

/**
 * Update menu
 */
async function updateMenu(menu) {
    try {
        updateSyncStatus('syncing');

        await fetch('/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(menu)
        });

        dataCache.menu = menu;

        updateSyncStatus('idle');
    } catch (error) {
        console.error('Error updating menu:', error);
        updateSyncStatus('idle');
        throw error;
    }
}
