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
    // Populate year selector
    populateYearSelector();

    // Set current month and year as default
    const now = new Date();
    document.getElementById('report-month').value = (now.getMonth() + 1).toString();
    document.getElementById('report-year').value = now.getFullYear().toString();

    // Generate initial report
    generateReport();
}

/**
 * Populate year selector
 */
function populateYearSelector() {
    const yearSelect = document.getElementById('report-year');
    const currentYear = new Date().getFullYear();

    // Add years from 2020 to current year + 1
    for (let year = 2020; year <= currentYear + 1; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    yearSelect.value = currentYear.toString();
}

/**
 * Generate report based on selected period
 */
function generateReport() {
    const month = document.getElementById('report-month').value;
    const year = document.getElementById('report-year').value;

    if (!year) {
        showToast('Por favor selecciona un año', 'warning');
        return;
    }

    const closedSales = getClosedSales();
    const expenses = getExpenses();

    // Filter by period
    const filteredSales = filterByPeriod(closedSales, month, year);
    const filteredExpenses = filterByPeriod(expenses, month, year);

    // Calculate totals
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Update KPIs
    document.getElementById('kpi-revenue').textContent = `$${totalRevenue.toFixed(2)} MXN`;
    document.getElementById('kpi-expenses').textContent = `$${totalExpenses.toFixed(2)} MXN`;

    const profitEl = document.getElementById('kpi-profit');
    profitEl.textContent = `$${netProfit.toFixed(2)} MXN`;
    profitEl.style.color = netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)';

    // Update additional analytics
    updatePaymentBreakdown(filteredSales);
    updateAverageSales(filteredSales, month, year);
    updateTopProducts(filteredSales);

    // Update charts
    updateRevenueExpensesChart(month, year);
    updateExpenseBreakdownChart(filteredExpenses);
}

/**
 * Filter data by period
 */
function filterByPeriod(data, month, year) {
    return data.filter(item => {
        const date = new Date(item.closedAt || item.date || item.createdAt);
        const itemYear = date.getFullYear();
        const itemMonth = date.getMonth() + 1;

        const yearMatch = itemYear.toString() === year;
        const monthMatch = !month || itemMonth.toString() === month;

        return yearMatch && monthMatch;
    });
}

/**
 * Update revenue vs expenses chart
 */
function updateRevenueExpensesChart(month, year) {
    const closedSales = getClosedSales();
    const expenses = getExpenses();

    let labels, revenueData, expenseData;

    if (month) {
        // Show daily data for the selected month
        const daysInMonth = new Date(year, month, 0).getDate();
        labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());

        revenueData = new Array(daysInMonth).fill(0);
        expenseData = new Array(daysInMonth).fill(0);

        closedSales.forEach(sale => {
            const date = new Date(sale.closedAt);
            if (date.getFullYear().toString() === year && (date.getMonth() + 1).toString() === month) {
                const day = date.getDate() - 1;
                revenueData[day] += sale.total;
            }
        });

        expenses.forEach(expense => {
            const date = new Date(expense.date || expense.createdAt);
            if (date.getFullYear().toString() === year && (date.getMonth() + 1).toString() === month) {
                const day = date.getDate() - 1;
                expenseData[day] += expense.amount;
            }
        });
    } else {
        // Show monthly data for the entire year
        labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        revenueData = new Array(12).fill(0);
        expenseData = new Array(12).fill(0);

        closedSales.forEach(sale => {
            const date = new Date(sale.closedAt);
            if (date.getFullYear().toString() === year) {
                const monthIndex = date.getMonth();
                revenueData[monthIndex] += sale.total;
            }
        });

        expenses.forEach(expense => {
            const date = new Date(expense.date || expense.createdAt);
            if (date.getFullYear().toString() === year) {
                const monthIndex = date.getMonth();
                expenseData[monthIndex] += expense.amount;
            }
        });
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
    const cash = sales.filter(s => s.paymentMethod === 'Efectivo').reduce((sum, s) => sum + s.total, 0);
    const transfer = sales.filter(s => s.paymentMethod === 'Transferencia').reduce((sum, s) => sum + s.total, 0);
    const other = sales.filter(s => s.paymentMethod === 'Otro').reduce((sum, s) => sum + s.total, 0);

    document.getElementById('payment-cash').textContent = `$${cash.toFixed(2)}`;
    document.getElementById('payment-transfer').textContent = `$${transfer.toFixed(2)}`;
    document.getElementById('payment-other').textContent = `$${other.toFixed(2)}`;
}

/**
 * Update average sales metrics
 */
function updateAverageSales(sales, month, year) {
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate days in period
    let daysInPeriod;
    if (month) {
        daysInPeriod = new Date(year, month, 0).getDate();
    } else {
        // Full year
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31);
        daysInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
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

    // Display top 10
    const container = document.getElementById('top-products');
    if (products.length === 0) {
        container.innerHTML = '<p style="color: var(--color-text-light); text-align: center;">No hay datos para mostrar</p>';
        return;
    }

    const top10 = products.slice(0, 10);
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
                ${top10.map((product, index) => `
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
