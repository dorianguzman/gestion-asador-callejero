/*
 * APP.JS - Main Application Logic
 * Ties everything together and handles navigation
 */

/**
 * Initialize the application
 */
async function initializeApp() {
    console.log('🚀 Initializing Asador Callejero app...');

    try {
        // Load data from GitHub
        await initializeData();

        // Initialize sections
        initializeSales();
        initializeExpenses();
        initializeDashboard();
        initializeSettings();

        // Update status indicators
        updateOnlineStatus();
        updateSyncStatus();

        // Set up event listeners
        setupEventListeners();

        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        showToast('Error al cargar la aplicación', 'error');
    }
}

/**
 * Set up global event listeners
 */
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.menu-card').forEach(card => {
        card.addEventListener('click', function() {
            const section = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showSection(section);
        });
    });

    // Expense form
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleExpenseSubmit);
    }

    // Set default date to today
    const expenseDateInput = document.getElementById('expense-date');
    if (expenseDateInput) {
        expenseDateInput.valueAsDate = new Date();
    }
}

/**
 * Show a specific section
 */
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(sectionName);
    if (section) {
        section.classList.add('active');
    }

    // Show/hide back button
    const backBtn = document.getElementById('back-btn');
    if (sectionName === 'home') {
        backBtn.style.display = 'none';
    } else {
        backBtn.style.display = 'inline-flex';
    }

    // Reload section data if needed
    if (sectionName === 'ventas') {
        loadActiveSales();
    } else if (sectionName === 'gastos') {
        loadExpenses();
        // Reset expense form when entering section
        const formCard = document.getElementById('expense-form-card');
        if (formCard) formCard.style.display = 'none';
    } else if (sectionName === 'reportes') {
        generateReport();
    } else if (sectionName === 'ajustes') {
        loadSettings();
    }
}

/**
 * Go back to home
 */
function goToHome() {
    showSection('home');
}

/**
 * Initialize expenses section
 */
function initializeExpenses() {
    loadExpenses();
    // Hide expense form initially
    const formCard = document.getElementById('expense-form-card');
    if (formCard) formCard.style.display = 'none';
}

/**
 * Select expense category and show form
 */
function selectExpenseCategory(category) {
    const categoryNames = {
        'ingredientes': 'Ingredientes',
        'servicios': 'Servicios (Gas, Agua, Luz)',
        'transporte': 'Transporte',
        'salarios': 'Salarios',
        'renta': 'Renta',
        'otros': 'Otros'
    };

    // Set category in hidden field
    document.getElementById('expense-category').value = category;
    document.getElementById('selected-category-name').textContent = categoryNames[category];

    // Initialize date labels
    initializeDateLabels();

    // Reset amount
    clearAmount();

    // Show form card
    document.getElementById('expense-form-card').style.display = 'block';

    // Scroll to form
    document.getElementById('expense-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Initialize date labels
 */
function initializeDateLabels() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDate = (date) => {
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    };

    document.getElementById('today-date').textContent = formatDate(today);
    document.getElementById('yesterday-date').textContent = formatDate(yesterday);

    // Select today by default
    selectExpenseDate('today');
}

/**
 * Select expense date
 */
function selectExpenseDate(option) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let selectedDate;
    let displayText;

    // Remove selected class from all date cards
    document.querySelectorAll('.date-option-card').forEach(card => {
        card.classList.remove('selected');
    });

    if (option === 'today') {
        selectedDate = today;
        displayText = 'Hoy, ' + today.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
        document.querySelectorAll('.date-option-card')[0].classList.add('selected');
    } else if (option === 'yesterday') {
        selectedDate = yesterday;
        displayText = 'Ayer, ' + yesterday.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
        document.querySelectorAll('.date-option-card')[1].classList.add('selected');
    } else if (option === 'custom') {
        // Show native date picker
        const dateInput = document.getElementById('expense-date');
        dateInput.style.display = 'block';
        dateInput.focus();
        dateInput.showPicker();

        dateInput.addEventListener('change', function() {
            selectedDate = new Date(this.value + 'T00:00:00');
            displayText = selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            document.getElementById('selected-date-text').textContent = displayText;
            document.getElementById('selected-date-display').style.display = 'block';
            document.querySelectorAll('.date-option-card')[2].classList.add('selected');
            dateInput.style.display = 'none';
        }, { once: true });
        return;
    }

    // Format date as YYYY-MM-DD for input
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    document.getElementById('expense-date').value = `${year}-${month}-${day}`;

    // Update display
    document.getElementById('selected-date-text').textContent = displayText;
    document.getElementById('selected-date-display').style.display = 'block';
}

/**
 * Add quick amount
 */
function addQuickAmount(amount) {
    const currentAmount = parseFloat(document.getElementById('amount-display-input').value) || 0;
    const newAmount = currentAmount + amount;
    document.getElementById('amount-display-input').value = newAmount.toFixed(2);
    document.getElementById('expense-amount').value = newAmount.toFixed(2);
}

/**
 * Update amount from display input
 */
function updateAmountFromDisplay(value) {
    // Remove non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');

    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    const formatted = parts.length > 2
        ? parts[0] + '.' + parts.slice(1).join('')
        : cleanValue;

    document.getElementById('expense-amount').value = formatted;
}

/**
 * Clear amount
 */
function clearAmount() {
    document.getElementById('amount-display-input').value = '';
    document.getElementById('expense-amount').value = '';
}

/**
 * Add digit to amount using keypad
 */
function addDigitToAmount(digit) {
    const input = document.getElementById('amount-display-input');
    const currentValue = input.value || '';

    // Prevent multiple decimal points
    if (digit === '.' && currentValue.includes('.')) {
        return;
    }

    // Limit to 2 decimal places
    const parts = currentValue.split('.');
    if (parts.length === 2 && parts[1].length >= 2) {
        return;
    }

    const newValue = currentValue + digit;
    input.value = newValue;
    document.getElementById('expense-amount').value = newValue;
}

/**
 * Backspace amount
 */
function backspaceAmount() {
    const input = document.getElementById('amount-display-input');
    const currentValue = input.value || '';
    const newValue = currentValue.slice(0, -1);
    input.value = newValue;
    document.getElementById('expense-amount').value = newValue;
}

/**
 * Cancel expense form
 */
function cancelExpenseForm() {
    clearExpenseForm();
    document.getElementById('expense-form-card').style.display = 'none';
}

/**
 * Load and display expenses
 */
function loadExpenses() {
    const expenses = getExpenses();
    const container = document.getElementById('expenses-list');

    if (!expenses || expenses.length === 0) {
        container.innerHTML = '<p class="text-center">No hay gastos registrados</p>';
        return;
    }

    // Sort by date, most recent first
    const sortedExpenses = [...expenses].sort((a, b) =>
        new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );

    const categoryNames = {
        'ingredientes': 'Ingredientes',
        'servicios': 'Servicios',
        'transporte': 'Transporte',
        'salarios': 'Salarios',
        'renta': 'Renta',
        'otros': 'Otros'
    };

    const categoryIcons = {
        'ingredientes': '🥩',
        'servicios': '🔥',
        'transporte': '🚗',
        'salarios': '👥',
        'renta': '🏠',
        'otros': '📦'
    };

    container.innerHTML = sortedExpenses.map(expense => {
        const icon = categoryIcons[expense.category] || '📦';
        return `
            <div class="expense-item-card" id="expense-${expense.id}">
                <div style="margin-right: 0.75rem; font-size: 1.5rem;">
                    ${icon}
                </div>
                <div class="expense-item-info">
                    <div class="expense-item-category">${categoryNames[expense.category] || expense.category}</div>
                    <div class="expense-item-description">${expense.description}</div>
                    <div class="expense-item-date">${new Date(expense.date || expense.createdAt).toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.25rem;">
                    <div class="expense-item-amount">-$${expense.amount.toFixed(2)}</div>
                    <button class="expense-item-delete" onclick="editExpense('${expense.id}')" title="Editar gasto" style="background: #E3F2FD; color: #1976D2;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="expense-item-delete" onclick="deleteExpenseConfirm('${expense.id}')" title="Eliminar gasto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Handle expense form submission
 */
async function handleExpenseSubmit(event) {
    event.preventDefault();

    const form = document.getElementById('expense-form');
    const dateInput = document.getElementById('expense-date');
    const descriptionInput = document.getElementById('expense-description');
    const amountInput = document.getElementById('expense-amount');
    const categoryInput = document.getElementById('expense-category');

    const date = dateInput.value;
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const editingId = form.dataset.editingId;

    // Custom validation in Spanish
    if (!date) {
        showToast('Por favor selecciona una fecha', 'warning');
        dateInput.focus();
        return;
    }

    if (!description) {
        showToast('Por favor ingresa una descripción', 'warning');
        descriptionInput.focus();
        return;
    }

    if (!amount || amount <= 0) {
        showToast('Por favor ingresa un monto válido', 'warning');
        amountInput.focus();
        return;
    }

    if (!category) {
        showToast('Por favor selecciona una categoría', 'warning');
        return;
    }

    try {
        if (editingId) {
            // Update existing expense
            await updateExpense(editingId, {
                date: date,
                description: description,
                amount: amount,
                category: category
            });
            showToast('Gasto actualizado correctamente', 'success');
            delete form.dataset.editingId;
        } else {
            // Add new expense
            await addExpense({
                date: date,
                description: description,
                amount: amount,
                category: category
            });
            showToast('Gasto registrado correctamente', 'success');
        }

        // Clear and hide form
        clearExpenseForm();
        document.getElementById('expense-form-card').style.display = 'none';

        // Reload expenses list
        loadExpenses();
    } catch (error) {
        console.error('Error saving expense:', error);
        showToast('Error al guardar el gasto', 'error');
    }
}

/**
 * Clear expense form
 */
function clearExpenseForm() {
    const form = document.getElementById('expense-form');
    form.reset();
    document.getElementById('expense-category').value = '';

    // Clear editing mode
    delete form.dataset.editingId;

    // Reset form title
    const formTitle = document.querySelector('#expense-form-card h3');
    if (formTitle && document.getElementById('selected-category-name')) {
        formTitle.textContent = 'Nuevo Gasto - ' + document.getElementById('selected-category-name').textContent;
    }

    // Reset date selection
    document.querySelectorAll('.date-option-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.getElementById('selected-date-display').style.display = 'none';

    // Reset amount
    clearAmount();
}

/**
 * Edit expense
 */
function editExpense(expenseId) {
    const expenses = getExpenses();
    const expense = expenses.find(e => e.id === expenseId);

    if (!expense) {
        showToast('Gasto no encontrado', 'error');
        return;
    }

    // Store expense ID for update
    document.getElementById('expense-form').dataset.editingId = expenseId;

    // Select category (this will show the form)
    selectExpenseCategory(expense.category);

    // Populate form fields
    setTimeout(() => {
        document.getElementById('expense-date').value = expense.date;
        document.getElementById('expense-description').value = expense.description;
        document.getElementById('amount-display-input').value = expense.amount.toFixed(2);
        document.getElementById('expense-amount').value = expense.amount.toFixed(2);

        // Update date display
        const selectedDate = new Date(expense.date + 'T00:00:00');
        const displayText = selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        document.getElementById('selected-date-text').textContent = displayText;
        document.getElementById('selected-date-display').style.display = 'block';

        // Update form title
        document.querySelector('#expense-form-card h3').textContent = 'Editar Gasto - ' + document.getElementById('selected-category-name').textContent;

        // Scroll to form
        document.getElementById('expense-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/**
 * Delete expense with confirmation
 */
async function deleteExpenseConfirm(expenseId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
        return;
    }

    try {
        await deleteExpense(expenseId);
        showToast('Gasto eliminado correctamente', 'success');
        loadExpenses();
    } catch (error) {
        console.error('Error deleting expense:', error);
        showToast('Error al eliminar el gasto', 'error');
    }
}

/**
 * Initialize settings section
 */
function initializeSettings() {
    loadSettings();
}

/**
 * Load settings
 */
function loadSettings() {
    const repoEl = document.getElementById('repo-name');
    const lastSyncEl = document.getElementById('last-sync-display');

    if (repoEl) repoEl.textContent = 'Cloudflare D1 Database';
    if (lastSyncEl) lastSyncEl.textContent = 'Tiempo real';
}

/**
 * Show menu management (placeholder)
 */
function showMenuManagement() {
    showToast('Gestión de menú - Próximamente', 'info');
}

/**
 * Force sync (reload data from D1)
 */
async function forceSyncGitHub() {
    try {
        updateSyncStatus('syncing');
        showToast('Recargando datos...', 'info');

        // Force reload data from D1
        isDataLoaded = false;
        await initializeData();

        // Reload current section
        const currentSection = document.querySelector('.section.active').id;
        if (currentSection === 'ventas') {
            loadActiveSales();
        } else if (currentSection === 'gastos') {
            loadExpenses();
        } else if (currentSection === 'reportes') {
            generateReport();
        }

        updateSyncStatus('idle');
        loadSettings();

        showToast('Datos recargados correctamente', 'success');
    } catch (error) {
        console.error('Error reloading data:', error);
        updateSyncStatus('idle');
        showToast('Error al recargar datos', 'error');
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}

// Note: initializeApp() is called from auth.js after successful authentication
