/*
 * EXPORT.JS - CSV Export Functionality
 * Handles exporting sales, expenses, and reports to CSV format
 */

/**
 * Main export function
 */
function exportData() {
    const month = document.getElementById('report-month').value;
    const year = document.getElementById('report-year').value;

    if (!year) {
        showToast('Por favor selecciona un periodo para exportar', 'warning');
        return;
    }

    // Get data
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
    const filteredSales = filterByPeriod(closedSales, month, year);
    const filteredExpenses = filterByPeriod(expenses, month, year);

    // Create filename
    const monthName = month ? getMonthName(month) : 'anual';
    const filename = `reporte_${monthName}_${year}`;

    // Export CSV
    exportToCsv(filteredSales, filteredExpenses, filename);
}

/**
 * Export to CSV
 */
function exportToCsv(sales, expenses, filename) {
    // Create CSV content
    let csv = '';

    // Header
    csv += '=== REPORTE ASADOR CALLEJERO ===\n';
    csv += `Fecha de generación: ${new Date().toLocaleString('es-MX')}\n\n`;

    // Sales summary with tips separated
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalTips = sales.reduce((sum, s) => sum + (s.tip || 0), 0);
    const revenueWithoutTips = totalRevenue - totalTips;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    csv += '=== RESUMEN EJECUTIVO ===\n';
    csv += 'Concepto,Monto\n';
    csv += `Ingresos Totales,$${revenueWithoutTips.toFixed(2)}\n`;
    csv += `Propinas,$${totalTips.toFixed(2)}\n`;
    csv += `Total con Propinas,$${totalRevenue.toFixed(2)}\n`;
    csv += `Gastos Totales,$${totalExpenses.toFixed(2)}\n`;
    csv += `Ganancia Neta,$${netProfit.toFixed(2)}\n\n`;

    // Payment method breakdown
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

    csv += '=== VENTAS POR MÉTODO DE PAGO ===\n';
    csv += 'Método,Monto\n';
    csv += `Efectivo,$${cash.toFixed(2)}\n`;
    csv += `Transferencia,$${transfer.toFixed(2)}\n`;
    csv += `Otro,$${other.toFixed(2)}\n\n`;

    // Detailed sales
    csv += '=== DETALLE DE VENTAS ===\n';
    csv += 'Fecha,Hora,Método de Pago,Breakdown de Pago,Items,Subtotal,Propina,Total\n';
    sales.forEach(sale => {
        const date = new Date(sale.closedAt);
        const dateStr = date.toLocaleDateString('es-MX');
        const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        const itemsStr = sale.items ? sale.items.map(i => `${i.name} x${i.quantity}`).join('; ') : 'N/A';
        const paymentMethod = sale.paymentMethod || 'N/A';

        // Payment breakdown
        let paymentBreakdownStr = 'N/A';
        if (sale.paymentBreakdown) {
            const breakdown = Object.entries(sale.paymentBreakdown)
                .filter(([_, amount]) => amount > 0)
                .map(([method, amount]) => `${method}: $${amount.toFixed(2)}`)
                .join(' + ');
            if (breakdown) paymentBreakdownStr = breakdown;
        }

        const tip = sale.tip || 0;
        const subtotal = sale.total - tip;

        csv += `${dateStr},${timeStr},${paymentMethod},"${paymentBreakdownStr}","${itemsStr}",$${subtotal.toFixed(2)},$${tip.toFixed(2)},$${sale.total.toFixed(2)}\n`;
    });

    csv += '\n';

    // Detailed expenses
    csv += '=== DETALLE DE GASTOS ===\n';
    csv += 'Fecha,Categoría,Descripción,Monto\n';
    expenses.forEach(expense => {
        const date = new Date(expense.date || expense.createdAt);
        const dateStr = date.toLocaleDateString('es-MX');
        const categoryNames = {
            'ingredientes': 'Ingredientes',
            'gas': 'Gas',
            'transporte': 'Transporte',
            'salarios': 'Salarios',
            'renta': 'Renta',
            'servicios': 'Servicios',
            'otros': 'Otros'
        };
        const category = categoryNames[expense.category] || expense.category;

        csv += `${dateStr},${category},"${expense.description}",$${expense.amount.toFixed(2)}\n`;
    });

    // Download CSV
    downloadCsv(csv, `${filename}.csv`);
}

/**
 * Download CSV file
 */
function downloadCsv(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showToast('Reporte CSV descargado correctamente', 'success');
}

/**
 * Get month name in Spanish
 */
function getMonthName(monthNumber) {
    const months = {
        '1': 'enero',
        '2': 'febrero',
        '3': 'marzo',
        '4': 'abril',
        '5': 'mayo',
        '6': 'junio',
        '7': 'julio',
        '8': 'agosto',
        '9': 'septiembre',
        '10': 'octubre',
        '11': 'noviembre',
        '12': 'diciembre'
    };
    return months[monthNumber] || 'mes';
}
