/*
 * DASHBOARD.JS - Reports and Dashboard
 * Handles P&L reports and data visualization
 */

let revenueExpensesChart = null;
let expenseBreakdownChart = null;

/**
 * Initialize dashboard
 */
function initializeDashboard() {
    // Generate initial report (default is "Este Mes")
    generateReport();
}

/**
 * Generate report based on selected period
 */
function generateReport() {
    const period = document.getElementById('report-period').value;

    let closedSales = getClosedSales();
    let expenses = getExpenses();

    // Fallback to localStorage if API fails (test mode only)
    if (isTestMode()) {
        if (!closedSales || closedSales.length === 0) {
            closedSales = JSON.parse(localStorage.getItem('salesClosed') || '[]');
        }
        if (!expenses || expenses.length === 0) {
            expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        }
    }

    // Filter by period
    const periodRange = getPeriodRange(period);
    const filteredSales = filterByPeriod(closedSales, periodRange);
    const filteredExpenses = filterByPeriod(expenses, periodRange);

    // Calculate totals with tips separated
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTips = filteredSales.reduce((sum, sale) => sum + (sale.tip || 0), 0);
    const revenueWithoutTips = totalRevenue - totalTips;
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Update KPIs
    document.getElementById('kpi-revenue').textContent = `$${revenueWithoutTips.toFixed(2)} MXN`;
    document.getElementById('kpi-tips').textContent = `$${totalTips.toFixed(2)} MXN`;
    document.getElementById('kpi-expenses').textContent = `$${totalExpenses.toFixed(2)} MXN`;

    const profitEl = document.getElementById('kpi-profit');
    profitEl.textContent = `$${netProfit.toFixed(2)} MXN`;
    profitEl.style.color = netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)';

    // Update additional analytics
    updatePaymentBreakdown(filteredSales);
    updateAverageSales(filteredSales, periodRange);
    updateTopProducts(filteredSales);

    // Update charts
    updateRevenueExpensesChart(periodRange);
    updateExpenseBreakdownChart(filteredExpenses);
}

/**
 * Get period range based on selected period type
 */
function getPeriodRange(period) {
    const now = new Date();
    let start, end;

    switch (period) {
        case 'today':
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;

        case 'week':
            // Monday to Sunday
            const dayOfWeek = now.getDay();
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so go back 6 days
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            break;

        case 'biweekly':
            // Last 14 days
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13);
            end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;

        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;

        case 'quarter':
            // Current quarter (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
            const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
            start = new Date(now.getFullYear(), quarterStartMonth, 1);
            end = new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999);
            break;

        case 'semester':
            // Current semester (H1: Jan-Jun, H2: Jul-Dec)
            const semesterStartMonth = now.getMonth() < 6 ? 0 : 6;
            start = new Date(now.getFullYear(), semesterStartMonth, 1);
            end = new Date(now.getFullYear(), semesterStartMonth + 6, 0, 23, 59, 59, 999);
            break;

        case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;

        case 'all':
            start = null;
            end = null;
            break;

        default:
            // Default to this month
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    return { start, end, period };
}

/**
 * Filter data by period
 */
function filterByPeriod(data, periodRange) {
    // If period is "all", return all data
    if (!periodRange.start && !periodRange.end) {
        return data;
    }

    return data.filter(item => {
        const date = new Date(item.closedAt || item.date || item.createdAt);
        return date >= periodRange.start && date <= periodRange.end;
    });
}

/**
 * Update revenue vs expenses chart
 */
function updateRevenueExpensesChart(periodRange) {
    let closedSales = getClosedSales();
    let expenses = getExpenses();

    // Fallback to localStorage if API fails (test mode only)
    if (isTestMode()) {
        if (!closedSales || closedSales.length === 0) {
            closedSales = JSON.parse(localStorage.getItem('salesClosed') || '[]');
        }
        if (!expenses || expenses.length === 0) {
            expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        }
    }

    // Filter data by period
    const filteredSales = filterByPeriod(closedSales, periodRange);
    const filteredExpenses = filterByPeriod(expenses, periodRange);

    let labels, revenueData, expenseData;

    switch (periodRange.period) {
        case 'today':
            // Show hourly data (24 hours)
            labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
            revenueData = new Array(24).fill(0);
            expenseData = new Array(24).fill(0);

            filteredSales.forEach(sale => {
                const hour = new Date(sale.closedAt).getHours();
                revenueData[hour] += sale.total;
            });

            filteredExpenses.forEach(expense => {
                const hour = new Date(expense.date || expense.createdAt).getHours();
                expenseData[hour] += expense.amount;
            });
            break;

        case 'week':
        case 'biweekly':
            // Show daily data
            const days = periodRange.period === 'week' ? 7 : 14;
            labels = [];
            revenueData = new Array(days).fill(0);
            expenseData = new Array(days).fill(0);

            // Generate labels
            for (let i = 0; i < days; i++) {
                const date = new Date(periodRange.start);
                date.setDate(date.getDate() + i);
                labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
            }

            filteredSales.forEach(sale => {
                const date = new Date(sale.closedAt);
                const daysDiff = Math.floor((date - periodRange.start) / (1000 * 60 * 60 * 24));
                if (daysDiff >= 0 && daysDiff < days) {
                    revenueData[daysDiff] += sale.total;
                }
            });

            filteredExpenses.forEach(expense => {
                const date = new Date(expense.date || expense.createdAt);
                const daysDiff = Math.floor((date - periodRange.start) / (1000 * 60 * 60 * 24));
                if (daysDiff >= 0 && daysDiff < days) {
                    expenseData[daysDiff] += expense.amount;
                }
            });
            break;

        case 'month':
            // Show daily data for the month
            const daysInMonth = new Date(periodRange.end.getFullYear(), periodRange.end.getMonth() + 1, 0).getDate();
            labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
            revenueData = new Array(daysInMonth).fill(0);
            expenseData = new Array(daysInMonth).fill(0);

            filteredSales.forEach(sale => {
                const day = new Date(sale.closedAt).getDate() - 1;
                revenueData[day] += sale.total;
            });

            filteredExpenses.forEach(expense => {
                const day = new Date(expense.date || expense.createdAt).getDate() - 1;
                expenseData[day] += expense.amount;
            });
            break;

        case 'quarter':
        case 'semester':
        case 'year':
        case 'all':
            // Show monthly data
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

            if (periodRange.period === 'all') {
                // For "all", show all months that have data
                labels = monthNames;
                revenueData = new Array(12).fill(0);
                expenseData = new Array(12).fill(0);

                filteredSales.forEach(sale => {
                    const monthIndex = new Date(sale.closedAt).getMonth();
                    revenueData[monthIndex] += sale.total;
                });

                filteredExpenses.forEach(expense => {
                    const monthIndex = new Date(expense.date || expense.createdAt).getMonth();
                    expenseData[monthIndex] += expense.amount;
                });
            } else {
                // For specific periods, show only relevant months
                const startMonth = periodRange.start.getMonth();
                const endMonth = periodRange.end.getMonth();
                const monthsInPeriod = endMonth - startMonth + 1;

                labels = [];
                for (let i = 0; i < monthsInPeriod; i++) {
                    labels.push(monthNames[startMonth + i]);
                }

                revenueData = new Array(monthsInPeriod).fill(0);
                expenseData = new Array(monthsInPeriod).fill(0);

                filteredSales.forEach(sale => {
                    const monthIndex = new Date(sale.closedAt).getMonth() - startMonth;
                    if (monthIndex >= 0 && monthIndex < monthsInPeriod) {
                        revenueData[monthIndex] += sale.total;
                    }
                });

                filteredExpenses.forEach(expense => {
                    const monthIndex = new Date(expense.date || expense.createdAt).getMonth() - startMonth;
                    if (monthIndex >= 0 && monthIndex < monthsInPeriod) {
                        expenseData[monthIndex] += expense.amount;
                    }
                });
            }
            break;

        default:
            // Default to monthly view
            labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            revenueData = new Array(12).fill(0);
            expenseData = new Array(12).fill(0);
    }

    const ctx = document.getElementById('revenueExpensesChart').getContext('2d');

    if (revenueExpensesChart) {
        revenueExpensesChart.destroy();
    }

    revenueExpensesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ingresos',
                    data: revenueData,
                    borderColor: '#2E7D32',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    tension: 0.3
                },
                {
                    label: 'Gastos',
                    data: expenseData,
                    borderColor: '#D84315',
                    backgroundColor: 'rgba(216, 67, 21, 0.1)',
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Update expense breakdown chart
 */
function updateExpenseBreakdownChart(filteredExpenses) {
    // Group expenses by category
    const breakdown = {};

    filteredExpenses.forEach(expense => {
        const category = expense.category || 'otros';
        breakdown[category] = (breakdown[category] || 0) + expense.amount;
    });

    const labels = Object.keys(breakdown);
    const data = Object.values(breakdown);

    // Category names in Spanish
    const categoryNames = {
        'ingredientes': 'Ingredientes',
        'gas': 'Gas',
        'transporte': 'Transporte',
        'salarios': 'Salarios',
        'renta': 'Renta',
        'servicios': 'Servicios',
        'otros': 'Otros'
    };

    const displayLabels = labels.map(key => categoryNames[key] || key);

    const ctx = document.getElementById('expenseBreakdownChart').getContext('2d');

    if (expenseBreakdownChart) {
        expenseBreakdownChart.destroy();
    }

    expenseBreakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: displayLabels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#D84315',
                    '#BF360C',
                    '#FF6F00',
                    '#F57C00',
                    '#E65100',
                    '#FF3D00',
                    '#DD2C00'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return label + ': $' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

/**
 * Update payment method breakdown
 */
function updatePaymentBreakdown(sales) {
    let cash = 0;
    let transfer = 0;
    let other = 0;

    sales.forEach(sale => {
        // Check if sale has payment breakdown (split payment)
        if (sale.paymentBreakdown && Object.values(sale.paymentBreakdown).some(v => v > 0)) {
            // Use breakdown amounts
            cash += sale.paymentBreakdown.Efectivo || 0;
            transfer += sale.paymentBreakdown.Transferencia || 0;
            other += sale.paymentBreakdown.Otro || 0;
        } else {
            // Legacy: use primary payment method
            if (sale.paymentMethod === 'Efectivo') {
                cash += sale.total;
            } else if (sale.paymentMethod === 'Transferencia') {
                transfer += sale.total;
            } else if (sale.paymentMethod === 'Otro') {
                other += sale.total;
            }
        }
    });

    document.getElementById('payment-cash').textContent = `$${cash.toFixed(2)}`;
    document.getElementById('payment-transfer').textContent = `$${transfer.toFixed(2)}`;
    document.getElementById('payment-other').textContent = `$${other.toFixed(2)}`;
}

/**
 * Update average sales metrics
 */
function updateAverageSales(sales, periodRange) {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate days in period
    let daysInPeriod;

    if (!periodRange.start || !periodRange.end) {
        // For "all" period, calculate from first sale to last sale
        if (sales.length > 0) {
            const dates = sales.map(s => new Date(s.closedAt || s.createdAt));
            const firstDate = new Date(Math.min(...dates));
            const lastDate = new Date(Math.max(...dates));
            daysInPeriod = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
        } else {
            daysInPeriod = 1;
        }
    } else {
        // Calculate days between start and end
        const now = new Date();
        let endDate = periodRange.end;

        // If the end date is in the future, use today instead
        if (endDate > now) {
            endDate = now;
        }

        daysInPeriod = Math.ceil((endDate - periodRange.start) / (1000 * 60 * 60 * 24)) + 1;
    }

    const avgDaily = daysInPeriod > 0 ? totalRevenue / daysInPeriod : 0;

    document.getElementById('kpi-avg-sale').textContent = `$${avgSale.toFixed(2)} MXN`;
    document.getElementById('total-sales-count').textContent = totalSales;
    document.getElementById('kpi-avg-daily').textContent = `$${avgDaily.toFixed(2)} MXN`;
    document.getElementById('days-in-period').textContent = daysInPeriod;
}

/**
 * Update top products
 */
function updateTopProducts(sales) {
    // Count products across all sales
    const productCount = {};
    const productRevenue = {};

    sales.forEach(sale => {
        if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach(item => {
                const name = item.name;
                productCount[name] = (productCount[name] || 0) + item.quantity;
                productRevenue[name] = (productRevenue[name] || 0) + item.subtotal;
            });
        }
    });

    // Convert to array and sort by quantity
    const products = Object.keys(productCount).map(name => ({
        name,
        quantity: productCount[name],
        revenue: productRevenue[name]
    })).sort((a, b) => b.quantity - a.quantity);

    // Display top 5
    const container = document.getElementById('top-products');
    if (products.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-light); text-align: center;">No hay datos para mostrar</p>';
        return;
    }

    const top5 = products.slice(0, 5);
    const medals = ['🥇', '🥈', '🥉'];

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 2px solid var(--color-bg); text-align: left;">
                    <th style="padding: 0.5rem;">#</th>
                    <th style="padding: 0.5rem;">Producto</th>
                    <th style="padding: 0.5rem; text-align: right;">Cantidad</th>
                    <th style="padding: 0.5rem; text-align: right;">Ingresos</th>
                </tr>
            </thead>
            <tbody>
                ${top5.map((product, index) => `
                    <tr style="border-bottom: 1px solid var(--color-bg);">
                        <td style="padding: 0.5rem; font-size: 1.25rem;">${medals[index] || (index + 1)}</td>
                        <td style="padding: 0.5rem; font-weight: 500;">${product.name}</td>
                        <td style="padding: 0.5rem; text-align: right;">${product.quantity}</td>
                        <td style="padding: 0.5rem; text-align: right; font-weight: 600; color: var(--color-success);">$${product.revenue.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}
