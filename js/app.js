/*
 * APP.JS - Main Application Logic
 * Ties everything together and handles navigation
 */

/**
 * Check if running in test mode (localhost)
 */
function isTestMode() {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
}

/**
 * Update database status banner
 */
function updateDatabaseStatus(isAvailable) {
    const databaseBanner = document.getElementById('database-banner');
    if (!databaseBanner) return;

    if (!isAvailable) {
        // Database not available - show banner
        databaseBanner.style.display = 'flex';
    } else {
        // Database available - hide banner
        databaseBanner.style.display = 'none';
    }
}

/**
 * Initialize connection monitoring
 */
function initializeConnectionMonitor() {
    // Show test mode badge if on localhost
    const testModeBadge = document.getElementById('test-mode-badge');
    if (testModeBadge && isTestMode()) {
        testModeBadge.style.display = 'block';
    }

    const updateConnectionStatus = () => {
        const isOnline = navigator.onLine;
        const isTest = isTestMode();
        const banner = document.getElementById('connection-banner');

        if (!isOnline && !isTest) {
            // Production mode + offline: Show banner and disable functionality
            if (banner) {
                banner.style.display = 'flex';
            }
            disableAllForms();
        } else {
            // Online or test mode: Hide banner and enable functionality
            if (banner) {
                banner.style.display = 'none';
            }
            enableAllForms();
        }
    };

    // Set up event listeners
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);

    // Initial check
    updateConnectionStatus();
}

/**
 * Disable all forms and buttons when offline in production
 */
function disableAllForms() {
    // Disable all buttons except navigation
    document.querySelectorAll('button:not(.menu-card button):not(.tab-btn)').forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    });

    // Disable all inputs
    document.querySelectorAll('input, textarea, select').forEach(input => {
        input.disabled = true;
        input.style.opacity = '0.5';
    });
}

/**
 * Enable all forms and buttons when online
 */
function enableAllForms() {
    // Enable all buttons
    document.querySelectorAll('button').forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '';
        btn.style.cursor = '';
    });

    // Enable all inputs
    document.querySelectorAll('input, textarea, select').forEach(input => {
        input.disabled = false;
        input.style.opacity = '';
    });
}

/**
 * Initialize the application
 */
async function initializeApp() {
    console.log('🚀 Initializing Asador Callejero app...');

    try {
        // Initialize connection monitoring
        initializeConnectionMonitor();

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
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-amount-value').textContent = '0.00';

    // Show form card
    const formCard = document.getElementById('expense-form-card');
    formCard.style.display = 'block';

    // Scroll to form - works better on mobile with a slight delay
    setTimeout(() => {
        formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
 * Show expense amount modal
 */
function showExpenseAmountModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-content">
                <div class="modal-icon">💵</div>
                <h3 class="modal-title">Ingresar Monto del Gasto</h3>
                <p class="modal-message">Ingresa la cantidad del gasto en pesos mexicanos.</p>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; text-align: left;">Monto (MXN):</label>
                    <input type="number" id="expense-amount-modal-input"
                        style="width: 100%; padding: 0.875rem; font-size: 1.5rem; text-align: center; border: 2px solid var(--color-primary); border-radius: var(--radius-md); font-weight: 600;"
                        placeholder="0.00" step="10" min="0.01" autofocus>
                </div>

                <div class="modal-actions">
                    <button class="modal-btn modal-btn-cancel" id="expense-amount-modal-cancel">
                        Cancelar
                    </button>
                    <button class="modal-btn modal-btn-confirm" id="expense-amount-modal-confirm">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Trigger animation
    setTimeout(() => modal.classList.add('active'), 10);

    const input = document.getElementById('expense-amount-modal-input');
    const confirmBtn = document.getElementById('expense-amount-modal-confirm');
    const cancelBtn = document.getElementById('expense-amount-modal-cancel');

    const handleConfirm = async () => {
        const amount = parseFloat(input.value);

        if (!amount || amount <= 0) {
            await showAlert(
                'Por favor ingresa un monto mayor a cero.',
                'Monto Inválido',
                {
                    icon: '⚠️',
                    buttonColor: 'var(--color-warning)'
                }
            );
            input.focus();
            return;
        }

        // Update the expense amount
        document.getElementById('expense-amount').value = amount.toFixed(2);
        document.getElementById('expense-amount-value').textContent = amount.toFixed(2);

        // Close modal
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentNode) {
                document.body.removeChild(modal);
            }
        }, 300);
    };

    const handleCancel = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) handleCancel();
    });

    // Focus on input and handle Enter key
    setTimeout(() => {
        input.focus();
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
            }
        });
    }, 100);
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
    let expenses = getExpenses();

    // Fallback to localStorage if API fails (test mode only)
    if (isTestMode() && (!expenses || expenses.length === 0)) {
        const localExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        if (localExpenses.length > 0) {
            expenses = localExpenses;
        }
    }

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
            <div style="background: white; border-radius: 6px; padding: 0.5rem 0.625rem; margin-bottom: 0.375rem; box-shadow: 0 1px 2px rgba(0,0,0,0.08); display: flex; align-items: center; gap: 0.5rem;">
                <div style="font-size: 1rem;">
                    ${icon}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; font-size: 0.85rem; color: var(--color-text); margin-bottom: 0.0625rem;">${categoryNames[expense.category] || expense.category}</div>
                    <div style="font-size: 0.8rem; color: var(--color-text); margin-bottom: 0.0625rem;">${expense.description}</div>
                    <div style="font-size: 0.7rem; color: var(--color-text-light);">${new Date(expense.date || expense.createdAt).toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                </div>
                <div style="font-weight: 700; font-size: 0.9rem; color: var(--color-danger); white-space: nowrap; margin-right: 0.25rem;">
                    -$${expense.amount.toFixed(2)}
                </div>
                <button class="expense-item-delete" onclick="editExpense('${expense.id}')" title="Editar gasto" style="background: #E8F5E9; color: #2E7D32;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="expense-item-delete" onclick="deleteExpenseConfirm('${expense.id}')" title="Eliminar gasto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
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

        // Fallback to localStorage for offline mode (test mode only)
        if (isTestMode()) {
            const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');

            if (editingId) {
                // Update existing expense in localStorage
                const expenseIndex = expenses.findIndex(e => e.id === editingId);
                if (expenseIndex !== -1) {
                    expenses[expenseIndex] = {
                        ...expenses[expenseIndex],
                        date: date,
                        description: description,
                        amount: amount,
                        category: category
                    };
                    localStorage.setItem('expenses', JSON.stringify(expenses));
                    showToast('Gasto actualizado (modo offline)', 'success');
                    delete form.dataset.editingId;
                } else {
                    showToast('Error al actualizar el gasto', 'error');
                    return;
                }
            } else {
                // Add new expense to localStorage
                const newExpense = {
                    id: 'exp-' + Date.now(),
                    date: date,
                    description: description,
                    amount: amount,
                    category: category,
                    createdAt: new Date().toISOString()
                };
                expenses.unshift(newExpense);
                localStorage.setItem('expenses', JSON.stringify(expenses));
                showToast('Gasto registrado (modo offline)', 'success');
            }

            // Clear and hide form
            clearExpenseForm();
            document.getElementById('expense-form-card').style.display = 'none';

            // Reload expenses list
            loadExpenses();
        } else {
            showToast('Error al guardar - Verifica tu conexión', 'error');
        }
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
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-amount-value').textContent = '0.00';
}

/**
 * Edit expense
 */
function editExpense(expenseId) {
    let expenses = getExpenses();

    // Fallback to localStorage if API fails (test mode only)
    if (isTestMode() && (!expenses || expenses.length === 0)) {
        expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    }

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
        document.getElementById('expense-amount').value = expense.amount.toFixed(2);
        document.getElementById('expense-amount-value').textContent = expense.amount.toFixed(2);

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
    const confirmed = await showConfirm(
        'Esta acción no se puede deshacer.',
        'Eliminar Gasto',
        {
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            confirmColor: 'var(--color-danger)',
            icon: '⚠️'
        }
    );

    if (!confirmed) {
        return;
    }

    try {
        await deleteExpense(expenseId);
        showToast('Gasto eliminado correctamente', 'success');
        loadExpenses();
    } catch (error) {
        console.error('Error deleting expense:', error);

        // Fallback to localStorage for offline mode (test mode only)
        if (isTestMode()) {
            const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
            const expenseIndex = expenses.findIndex(e => e.id === expenseId);

            if (expenseIndex !== -1) {
                expenses.splice(expenseIndex, 1);
                localStorage.setItem('expenses', JSON.stringify(expenses));
                showToast('Gasto eliminado (modo offline)', 'success');
                loadExpenses();
            } else {
                showToast('Error al eliminar el gasto', 'error');
            }
        } else {
            showToast('Error al eliminar - Verifica tu conexión', 'error');
        }
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
 * Show menu management
 */
function showMenuManagement() {
    const menu = getMenu();
    if (!menu) {
        showToast('Error al cargar menú', 'error');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'menu-editor-modal';

    const categoriesHTML = menu.categories.map((category, catIndex) => {
        const itemsHTML = category.items.map((item, itemIndex) => `
            <div style="background: #f5f5f5; padding: 0.75rem; margin: 0.5rem 0; border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: var(--color-text);">${item.name}</div>
                    <div style="font-size: 0.875rem; color: var(--color-text-light);">$${item.price.toFixed(2)}</div>
                    ${item.quantity ? `<div style="font-size: 0.75rem; color: var(--color-success);">Pack de ${item.quantity}</div>` : ''}
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; cursor: pointer;">
                        <input type="checkbox" ${item.available ? 'checked' : ''} onchange="toggleItemAvailability(${catIndex}, ${itemIndex})" style="cursor: pointer;">
                        Disponible
                    </label>
                    <button onclick="editMenuItem(${catIndex}, ${itemIndex})" style="background: #E8F5E9; color: #2E7D32; border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button onclick="deleteMenuItem(${catIndex}, ${itemIndex})" style="background: #FFEBEE; color: var(--color-danger); border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        return `
            <div style="background: white; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <h4 style="margin: 0; color: var(--color-primary);">${category.name}</h4>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="addMenuItem(${catIndex})" style="background: var(--color-primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
                            + Item
                        </button>
                        <button onclick="editCategory(${catIndex})" style="background: #E8F5E9; color: #2E7D32; border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer;">
                            ✏️
                        </button>
                        <button onclick="deleteCategory(${catIndex})" style="background: #FFEBEE; color: var(--color-danger); border: none; padding: 0.5rem; border-radius: 6px; cursor: pointer;">
                            🗑️
                        </button>
                    </div>
                </div>
                <div>${itemsHTML}</div>
            </div>
        `;
    }).join('');

    modal.innerHTML = `
        <div class="modal-container" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0;">Gestión de Menú</h3>
                    <button onclick="closeMenuEditor()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-text-light);">×</button>
                </div>

                <div id="menu-categories-list">
                    ${categoriesHTML}
                </div>

                <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
                    <button onclick="addNewCategory()" style="flex: 1; background: var(--color-primary); color: white; border: none; padding: 1rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        + Nueva Categoría
                    </button>
                    <button onclick="saveMenuChanges()" style="flex: 1; background: var(--color-success); color: white; border: none; padding: 1rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        💾 Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

/**
 * Close menu editor
 */
function closeMenuEditor() {
    const modal = document.getElementById('menu-editor-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => document.body.removeChild(modal), 300);
    }
}

/**
 * Toggle item availability
 */
function toggleItemAvailability(catIndex, itemIndex) {
    const menu = getMenu();
    menu.categories[catIndex].items[itemIndex].available = !menu.categories[catIndex].items[itemIndex].available;

    // Update the menu in cache (will be saved when user clicks save button)
    dataCache.menu = menu;
}

/**
 * Add new category
 */
async function addNewCategory() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-content">
                <h3>Nueva Categoría</h3>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Nombre de la categoría:</label>
                    <input type="text" id="new-category-name" placeholder="Ej: Postres" style="width: 100%; padding: 0.75rem; border: 2px solid var(--color-primary); border-radius: 8px; font-size: 1rem;">
                </div>
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="modal-btn modal-btn-confirm" onclick="confirmAddCategory()">Agregar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => {
        modal.classList.add('active');
        document.getElementById('new-category-name').focus();
    }, 10);
}

/**
 * Confirm add category
 */
function confirmAddCategory() {
    const name = document.getElementById('new-category-name').value.trim();
    if (!name) {
        showToast('Por favor ingresa un nombre', 'warning');
        return;
    }

    const menu = getMenu();
    const newCategoryId = name.toLowerCase().replace(/\s+/g, '-');

    menu.categories.push({
        id: newCategoryId,
        name: name,
        items: []
    });

    dataCache.menu = menu;

    // Close modal and refresh
    document.querySelector('.modal-overlay:last-child').remove();
    closeMenuEditor();
    showMenuManagement();
    showToast('Categoría agregada', 'success');
}

/**
 * Edit category
 */
async function editCategory(catIndex) {
    const menu = getMenu();
    const category = menu.categories[catIndex];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-content">
                <h3>Editar Categoría</h3>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Nombre:</label>
                    <input type="text" id="edit-category-name" value="${category.name}" style="width: 100%; padding: 0.75rem; border: 2px solid var(--color-primary); border-radius: 8px; font-size: 1rem;">
                </div>
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="modal-btn modal-btn-confirm" onclick="confirmEditCategory(${catIndex})">Guardar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => {
        modal.classList.add('active');
        document.getElementById('edit-category-name').focus();
    }, 10);
}

/**
 * Confirm edit category
 */
function confirmEditCategory(catIndex) {
    const name = document.getElementById('edit-category-name').value.trim();
    if (!name) {
        showToast('Por favor ingresa un nombre', 'warning');
        return;
    }

    const menu = getMenu();
    menu.categories[catIndex].name = name;
    dataCache.menu = menu;

    document.querySelector('.modal-overlay:last-child').remove();
    closeMenuEditor();
    showMenuManagement();
    showToast('Categoría actualizada', 'success');
}

/**
 * Delete category
 */
async function deleteCategory(catIndex) {
    const menu = getMenu();
    const category = menu.categories[catIndex];

    const confirmed = await showConfirm(
        `¿Eliminar la categoría "${category.name}" y todos sus items?`,
        'Eliminar Categoría',
        {
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            confirmColor: 'var(--color-danger)',
            icon: '⚠️'
        }
    );

    if (!confirmed) return;

    menu.categories.splice(catIndex, 1);
    dataCache.menu = menu;

    closeMenuEditor();
    showMenuManagement();
    showToast('Categoría eliminada', 'success');
}

/**
 * Add menu item
 */
async function addMenuItem(catIndex) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-content">
                <h3>Nuevo Item</h3>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Nombre:</label>
                    <input type="text" id="new-item-name" placeholder="Ej: Taco de Pollo" style="width: 100%; padding: 0.75rem; border: 2px solid var(--color-primary); border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Precio (MXN):</label>
                    <input type="number" id="new-item-price" placeholder="0.00" step="0.01" min="0" style="width: 100%; padding: 0.75rem; border: 2px solid var(--color-primary); border-radius: 8px; font-size: 1rem;">
                </div>
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="modal-btn modal-btn-confirm" onclick="confirmAddMenuItem(${catIndex})">Agregar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => {
        modal.classList.add('active');
        document.getElementById('new-item-name').focus();
    }, 10);
}

/**
 * Confirm add menu item
 */
function confirmAddMenuItem(catIndex) {
    const name = document.getElementById('new-item-name').value.trim();
    const price = parseFloat(document.getElementById('new-item-price').value);

    if (!name) {
        showToast('Por favor ingresa un nombre', 'warning');
        return;
    }
    if (!price || price <= 0) {
        showToast('Por favor ingresa un precio válido', 'warning');
        return;
    }

    const menu = getMenu();
    const itemId = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

    menu.categories[catIndex].items.push({
        id: itemId,
        name: name,
        price: price,
        available: true
    });

    dataCache.menu = menu;

    document.querySelector('.modal-overlay:last-child').remove();
    closeMenuEditor();
    showMenuManagement();
    showToast('Item agregado', 'success');
}

/**
 * Edit menu item
 */
async function editMenuItem(catIndex, itemIndex) {
    const menu = getMenu();
    const item = menu.categories[catIndex].items[itemIndex];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-content">
                <h3>Editar Item</h3>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Nombre:</label>
                    <input type="text" id="edit-item-name" value="${item.name}" style="width: 100%; padding: 0.75rem; border: 2px solid var(--color-primary); border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Precio (MXN):</label>
                    <input type="number" id="edit-item-price" value="${item.price}" step="0.01" min="0" style="width: 100%; padding: 0.75rem; border: 2px solid var(--color-primary); border-radius: 8px; font-size: 1rem;">
                </div>
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                    <button class="modal-btn modal-btn-confirm" onclick="confirmEditMenuItem(${catIndex}, ${itemIndex})">Guardar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => {
        modal.classList.add('active');
        document.getElementById('edit-item-name').focus();
    }, 10);
}

/**
 * Confirm edit menu item
 */
function confirmEditMenuItem(catIndex, itemIndex) {
    const name = document.getElementById('edit-item-name').value.trim();
    const price = parseFloat(document.getElementById('edit-item-price').value);

    if (!name) {
        showToast('Por favor ingresa un nombre', 'warning');
        return;
    }
    if (!price || price <= 0) {
        showToast('Por favor ingresa un precio válido', 'warning');
        return;
    }

    const menu = getMenu();
    menu.categories[catIndex].items[itemIndex].name = name;
    menu.categories[catIndex].items[itemIndex].price = price;
    dataCache.menu = menu;

    document.querySelector('.modal-overlay:last-child').remove();
    closeMenuEditor();
    showMenuManagement();
    showToast('Item actualizado', 'success');
}

/**
 * Delete menu item
 */
async function deleteMenuItem(catIndex, itemIndex) {
    const menu = getMenu();
    const item = menu.categories[catIndex].items[itemIndex];

    const confirmed = await showConfirm(
        `¿Eliminar "${item.name}"?`,
        'Eliminar Item',
        {
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            confirmColor: 'var(--color-danger)',
            icon: '⚠️'
        }
    );

    if (!confirmed) return;

    menu.categories[catIndex].items.splice(itemIndex, 1);
    dataCache.menu = menu;

    closeMenuEditor();
    showMenuManagement();
    showToast('Item eliminado', 'success');
}

/**
 * Save menu changes to D1
 */
async function saveMenuChanges() {
    try {
        updateSyncStatus('syncing');

        await updateMenu(dataCache.menu);

        updateSyncStatus('idle');
        showToast('Menú guardado exitosamente', 'success');
        closeMenuEditor();
    } catch (error) {
        console.error('Error saving menu:', error);
        updateSyncStatus('idle');
        showToast('Error al guardar menú', 'error');
    }
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
 * Update online status indicator
 */
function updateOnlineStatus() {
    const statusEl = document.getElementById('online-status');
    if (!statusEl) return;

    if (navigator.onLine) {
        statusEl.classList.add('online');
        statusEl.classList.remove('offline');
        statusEl.querySelector('.status-text').textContent = 'En línea';
    } else {
        statusEl.classList.add('offline');
        statusEl.classList.remove('online');
        statusEl.querySelector('.status-text').textContent = 'Sin conexión';
    }
}

/**
 * Update sync status indicator
 */
function updateSyncStatus(status = 'idle') {
    const syncEl = document.getElementById('sync-status');
    const textEl = document.getElementById('last-sync-text');

    if (!syncEl || !textEl) return;

    if (status === 'syncing') {
        syncEl.classList.add('syncing');
        textEl.textContent = 'Sincronizando...';
    } else {
        syncEl.classList.remove('syncing');
        const now = new Date();
        textEl.textContent = `Actualizado ${now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
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

/**
 * Show custom confirmation modal
 * @param {string} message - The message to display
 * @param {string} title - The modal title
 * @param {object} options - Optional configuration
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
function showConfirm(message, title = 'Confirmar', options = {}) {
    return new Promise((resolve) => {
        const {
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            confirmColor = 'var(--color-primary)',
            icon = '⚠️'
        } = options;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-content">
                    <div class="modal-icon">${icon}</div>
                    <h3 class="modal-title">${title}</h3>
                    <p class="modal-message">${message}</p>
                    <div class="modal-actions">
                        <button class="modal-btn modal-btn-cancel" id="modal-cancel">
                            ${cancelText}
                        </button>
                        <button class="modal-btn modal-btn-confirm" id="modal-confirm" style="background: ${confirmColor};">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Trigger animation
        setTimeout(() => modal.classList.add('active'), 10);

        const handleConfirm = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
                resolve(true);
            }, 300);
        };

        const handleCancel = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
                resolve(false);
            }, 300);
        };

        document.getElementById('modal-confirm').addEventListener('click', handleConfirm);
        document.getElementById('modal-cancel').addEventListener('click', handleCancel);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) handleCancel();
        });

        // Handle Enter key
        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
                document.removeEventListener('keypress', handleKeyPress);
            } else if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keypress', handleKeyPress);
            }
        };
        document.addEventListener('keypress', handleKeyPress);
    });
}

/**
 * Show alert modal
 * @param {string} message - The message to display
 * @param {string} title - The modal title
 * @param {object} options - Optional configuration
 * @returns {Promise<void>}
 */
function showAlert(message, title = 'Aviso', options = {}) {
    return new Promise((resolve) => {
        const {
            buttonText = 'Entendido',
            buttonColor = 'var(--color-primary)',
            icon = 'ℹ️'
        } = options;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-content">
                    <div class="modal-icon">${icon}</div>
                    <h3 class="modal-title">${title}</h3>
                    <p class="modal-message">${message}</p>
                    <div class="modal-actions">
                        <button class="modal-btn modal-btn-confirm" id="modal-ok" style="background: ${buttonColor};">
                            ${buttonText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Trigger animation
        setTimeout(() => modal.classList.add('active'), 10);

        const handleOk = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                document.body.removeChild(modal);
                resolve();
            }, 300);
        };

        document.getElementById('modal-ok').addEventListener('click', handleOk);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) handleOk();
        });

        // Handle Enter key
        const handleKeyPress = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
                handleOk();
                document.removeEventListener('keypress', handleKeyPress);
            }
        };
        document.addEventListener('keypress', handleKeyPress);
    });
}

// Note: initializeApp() is called from auth.js after successful authentication
