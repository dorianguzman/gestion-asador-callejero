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
