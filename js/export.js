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
    const closedSales = getClosedSales();
    const expenses = getExpenses();

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

    // Sales summary
    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    csv += '=== RESUMEN EJECUTIVO ===\n';
    csv += 'Concepto,Monto\n';
    csv += `Ingresos Totales,$${totalRevenue.toFixed(2)}\n`;
    csv += `Gastos Totales,$${totalExpenses.toFixed(2)}\n`;
    csv += `Ganancia Neta,$${netProfit.toFixed(2)}\n\n`;

    // Payment method breakdown
    const cash = sales.filter(s => s.paymentMethod === 'Efectivo').reduce((sum, s) => sum + s.total, 0);
    const transfer = sales.filter(s => s.paymentMethod === 'Transferencia').reduce((sum, s) => sum + s.total, 0);
    const other = sales.filter(s => s.paymentMethod === 'Otro').reduce((sum, s) => sum + s.total, 0);

    csv += '=== VENTAS POR MÉTODO DE PAGO ===\n';
    csv += 'Método,Monto\n';
    csv += `Efectivo,$${cash.toFixed(2)}\n`;
    csv += `Transferencia,$${transfer.toFixed(2)}\n`;
    csv += `Otro,$${other.toFixed(2)}\n\n`;

    // Detailed sales
    csv += '=== DETALLE DE VENTAS ===\n';
    csv += 'Fecha,Hora,Método de Pago,Items,Total\n';
    sales.forEach(sale => {
        const date = new Date(sale.closedAt);
        const dateStr = date.toLocaleDateString('es-MX');
        const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        const itemsStr = sale.items ? sale.items.map(i => `${i.name} x${i.quantity}`).join('; ') : 'N/A';
        const paymentMethod = sale.paymentMethod || 'N/A';

        csv += `${dateStr},${timeStr},${paymentMethod},"${itemsStr}",$${sale.total.toFixed(2)}\n`;
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
