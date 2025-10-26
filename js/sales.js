/*
 * SALES.JS - Sales Management
 * Handles sales UI and logic
 */

let currentSale = {
    items: [],
    total: 0
};

/**
 * Initialize sales section
 */
function initializeSales() {
    // Set up tab switching
    const tabBtns = document.querySelectorAll('#ventas .tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName, btn);
        });
    });

    // Load initial data
    loadActiveSales();
    loadClosedSales();
    renderNewSaleForm();
}

/**
 * Switch between tabs
 */
function switchTab(tabName, btnElement) {
    // Update tab buttons
    document.querySelectorAll('#ventas .tab-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');

    // Update tab content
    document.querySelectorAll('#ventas .tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');

    // Reload data if needed
    if (tabName === 'ventas-activas') {
        loadActiveSales();
    } else if (tabName === 'ventas-cerradas') {
        loadClosedSales();
    } else if (tabName === 'nueva-venta') {
        renderNewSaleForm();
    }
}

/**
 * Load and display active sales
 */
function loadActiveSales() {
    let activeSales = getActiveSales();

    // Fallback to localStorage if API fails (test mode only)
    if (isTestMode() && (!activeSales || activeSales.length === 0)) {
        const localSales = JSON.parse(localStorage.getItem('salesActive') || '[]');
        if (localSales.length > 0) {
            activeSales = localSales;
        }
    }

    const container = document.getElementById('active-sales-list');

    if (!activeSales || activeSales.length === 0) {
        container.innerHTML = '<p class="text-center">No hay ventas activas</p>';
        return;
    }

    container.innerHTML = activeSales.map(sale => `
        <div class="card" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4>Venta #${sale.id ? sale.id.slice(-6) : 'N/A'}</h4>
                    <p style="color: var(--color-text-light); font-size: 0.875rem; margin: 0.5rem 0;">
                        ${new Date(sale.createdAt).toLocaleString('es-MX')}
                    </p>
                    <div style="margin-top: 1rem;">
                        ${sale.items.map(item => `
                            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0;">
                                <span>${item.quantity}x ${item.name}</span>
                                <span>$${item.subtotal.toFixed(2)}</span>
                            </div>
                        `).join('')}
                        ${sale.deliveryFee > 0 ? `
                            <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; color: var(--color-text-light);">
                                <span>Servicio a Domicilio</span>
                                <span>$${sale.deliveryFee.toFixed(2)}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div style="border-top: 2px solid var(--color-primary); margin-top: 0.5rem; padding-top: 0.5rem; font-weight: bold; display: flex; justify-content: space-between;">
                        <span>Total:</span>
                        <span>$${sale.total.toFixed(2)} MXN</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="primary" onclick="showCloseSaleModal('${sale.id}')" style="flex: 1;">
                    Cerrar Venta
                </button>
                <button class="expense-item-delete" onclick="editActiveSale('${sale.id}')" title="Editar venta" style="background: #E8F5E9; color: #2E7D32; padding: 0.75rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="expense-item-delete" onclick="deleteActiveSaleConfirm('${sale.id}')" title="Eliminar venta" style="padding: 0.75rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Load and display closed sales
 */
function loadClosedSales() {
    let closedSales = getClosedSales();

    // Fallback to localStorage if API fails (test mode only)
    if (isTestMode() && (!closedSales || closedSales.length === 0)) {
        const localSales = JSON.parse(localStorage.getItem('salesClosed') || '[]');
        if (localSales.length > 0) {
            closedSales = localSales;
        }
    }

    const container = document.getElementById('closed-sales-list');

    if (!closedSales || closedSales.length === 0) {
        container.innerHTML = '<p class="text-center">No hay ventas cerradas</p>';
        return;
    }

    // Sort by closed date, most recent first
    const sortedSales = [...closedSales].sort((a, b) =>
        new Date(b.closedAt) - new Date(a.closedAt)
    );

    container.innerHTML = sortedSales.map(sale => {
        const hasTip = sale.tip && sale.tip > 0;
        const hasPaymentBreakdown = sale.paymentBreakdown && Object.values(sale.paymentBreakdown).some(v => v > 0);
        const saleSubtotal = hasTip ? sale.total - sale.tip : sale.total;

        // Get all payment methods used (if there's a breakdown with multiple methods)
        let paymentMethodBadges = '';
        if (hasPaymentBreakdown) {
            const methodsUsed = Object.entries(sale.paymentBreakdown).filter(([_, amount]) => amount > 0);
            if (methodsUsed.length > 1) {
                // Multiple payment methods - show all
                paymentMethodBadges = methodsUsed.map(([method, _]) =>
                    `<span style="background: var(--color-success); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">${method}</span>`
                ).join('');
            } else {
                // Single payment method
                paymentMethodBadges = `<span style="background: var(--color-success); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">${sale.paymentMethod || 'Pagado'}</span>`;
            }
        } else {
            // No breakdown - show primary method
            paymentMethodBadges = `<span style="background: var(--color-success); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">${sale.paymentMethod || 'Pagado'}</span>`;
        }

        return `
        <div class="card" style="margin-bottom: 1rem; opacity: 0.9;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <h4>Venta #${sale.id ? sale.id.slice(-6) : 'N/A'}</h4>
                        ${paymentMethodBadges}
                        ${hasTip ? `<span style="background: var(--color-accent); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">Con propina</span>` : ''}
                    </div>
                    <p style="color: var(--color-text-light); font-size: 0.875rem; margin: 0.5rem 0;">
                        ${new Date(sale.closedAt).toLocaleString('es-MX')}
                    </p>
                    <div style="margin-top: 0.5rem; font-size: 0.875rem;">
                        ${sale.items.length} item${sale.items.length > 1 ? 's' : ''}
                    </div>
                    ${hasPaymentBreakdown ? `
                    <div style="margin-top: 0.75rem;">
                        <button onclick="togglePaymentBreakdown('${sale.id}')" style="background: var(--color-bg); border: none; padding: 0.5rem 0.75rem; border-radius: 8px; cursor: pointer; width: 100%; text-align: left; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease;">
                            <span style="font-weight: 600; font-size: 0.85rem; color: var(--color-primary);">Ver Desglose de Pago</span>
                            <svg id="breakdown-icon-${sale.id}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.3s ease;">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        <div id="breakdown-${sale.id}" style="display: none; margin-top: 0.5rem; background: var(--color-bg); padding: 0.75rem; border-radius: 8px; overflow: hidden; transition: all 0.3s ease;">
                            ${Object.entries(sale.paymentBreakdown).filter(([_, amount]) => amount > 0).map(([method, amount]) =>
                                `<div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.25rem;">
                                    <span style="font-weight: 500;">${method}:</span>
                                    <span style="font-weight: 600;">$${amount.toFixed(2)}</span>
                                </div>`
                            ).join('')}
                        </div>
                    </div>
                    ` : ''}
                    ${hasTip ? `
                    <div style="margin-top: 0.5rem; font-size: 0.875rem;">
                        <span style="color: var(--color-text-light);">Subtotal:</span> $${saleSubtotal.toFixed(2)}
                    </div>
                    <div style="font-size: 0.875rem; color: var(--color-success);">
                        + Propina: $${sale.tip.toFixed(2)}
                    </div>
                    ` : ''}
                    <div style="margin-top: 0.5rem; font-weight: bold; font-size: 1.125rem; color: var(--color-primary);">
                        Total: $${sale.total.toFixed(2)} MXN
                    </div>

                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-bg); justify-content: flex-end;">
                        <button class="expense-item-delete" onclick="editClosedSale('${sale.id}')" title="Editar venta" style="background: #E8F5E9; color: #2E7D32;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="expense-item-delete" onclick="deleteClosedSaleConfirm('${sale.id}')" title="Eliminar venta">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

/**
 * Render new sale form with product selection
 */
function renderNewSaleForm() {
    const menu = getMenu();
    const formContainer = document.getElementById('sale-form');

    if (!formContainer) {
        console.error('sale-form element not found');
        return;
    }

    if (!menu || !menu.categories) {
        formContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="color: var(--color-text-light);">Cargando menú...</p>
            </div>
        `;
        // Retry after 500ms
        setTimeout(renderNewSaleForm, 500);
        return;
    }

    const formHtml = `
        <div id="product-selection">
            ${menu.categories.map(category => {
                const availableItems = category.items ? category.items.filter(item => item.available !== false) : [];

                if (availableItems.length === 0) return '';

                return `
                    <div class="card" style="margin-bottom: 1rem;">
                        <h4>${category.name}</h4>
                        <div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem; margin-top: 0.5rem;">
                            ${availableItems.map(item => `
                                <button class="secondary" onclick="addItemToSale('${item.id}', '${category.id}')"
                                    style="display: flex; text-align: left; justify-content: space-between; width: 100%; align-items: center;">
                                    <span>${item.name}</span>
                                    <span style="font-weight: bold;">${item.requiresCustomAmount ? 'Variable' : '$' + (item.price ? item.price.toFixed(2) : '0.00')}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>

        <!-- Backdrop Overlay -->
        <div id="sale-backdrop" onclick="toggleSaleSummary()" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 998; transition: opacity 0.3s ease; opacity: 0;"></div>

        <div id="current-sale-summary" style="position: sticky; bottom: 0; background: var(--color-white); margin: -1rem; margin-top: 1rem; box-shadow: 0 -8px 24px rgba(0,0,0,0.15); border-radius: var(--radius-lg) var(--radius-lg) 0 0; z-index: 999; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
            <!-- Compact Header (always visible) -->
            <div onclick="toggleSaleSummary()" style="padding: 0.875rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; cursor: pointer; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: white; border-radius: var(--radius-lg) var(--radius-lg) 0 0; user-select: none; -webkit-tap-highlight-color: transparent;">
                <!-- Drag Handle -->
                <div style="display: flex; justify-content: center; margin-bottom: 0.125rem;">
                    <div style="width: 40px; height: 4px; background: rgba(255,255,255,0.4); border-radius: 2px;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.625rem;">
                        <span style="font-weight: 700; font-size: 1rem;">Venta Actual</span>
                        <span id="items-count-badge" style="background: rgba(255,255,255,0.3); padding: 0.25rem 0.625rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">0 items</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.875rem;">
                        <span id="sale-total-compact" style="font-weight: 700; font-size: 1.125rem;">$0.00</span>
                        <svg id="toggle-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                            <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Expandable Content -->
            <div id="sale-summary-content" style="padding: 0; display: none; opacity: 0; transition: opacity 0.3s ease;">
                <div id="sale-items-list" style="max-height: 50vh; overflow-y: auto; margin-bottom: 0; padding: 1rem; padding-bottom: 0.5rem; -webkit-overflow-scrolling: touch;">
                    <p style="color: var(--color-text-light); font-size: 0.875rem; text-align: center;">No hay items seleccionados</p>
                </div>
                <!-- Total Section with Enhanced Visual Hierarchy -->
                <div style="background: linear-gradient(to bottom, rgba(0,0,0,0.02), transparent); border-top: 3px solid var(--color-primary); padding: 1rem; margin: 0;">
                    <!-- Subtotal (shown when there's a discount) -->
                    <div id="subtotal-line" style="display: none; margin-bottom: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 500; font-size: 0.9rem; color: var(--color-text-light);">Subtotal:</span>
                            <span id="sale-subtotal" style="font-weight: 600; font-size: 1rem; color: var(--color-text);">$0.00</span>
                        </div>
                    </div>
                    <!-- Discount line (hidden when no discount) -->
                    <div id="discount-line" style="display: none; padding-bottom: 0.5rem; margin-bottom: 0.5rem; border-bottom: 1px solid rgba(0,0,0,0.1);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 600; font-size: 0.9rem; color: var(--color-success);">Descuento por promo:</span>
                            <span id="discount-amount" style="font-weight: 700; font-size: 1.1rem; color: var(--color-success);">-$0.00</span>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <span style="font-weight: 600; font-size: 1rem; color: var(--color-text-light);">Total:</span>
                        <span id="sale-total" style="font-weight: 700; font-size: 1.5rem; color: var(--color-primary);">$0.00 MXN</span>
                    </div>
                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 0.625rem;">
                        <button class="primary" onclick="saveSale()" style="flex: 1; font-size: 1rem; font-weight: 600; padding: 0.875rem; box-shadow: 0 2px 8px rgba(46, 125, 50, 0.3); transition: all 0.2s ease;">
                            Guardar Venta
                        </button>
                        <button class="secondary" onclick="clearCurrentSale()" style="font-weight: 600; padding: 0.875rem 1.25rem; transition: all 0.2s ease;">
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('sale-form').innerHTML = formHtml;
    updateSaleSummary();

    // Initialize swipe gesture after rendering
    setTimeout(() => initSaleSwipeGesture(), 100);
}

/**
 * Add item to current sale
 */
function addItemToSale(itemId, categoryId) {
    const menu = getMenu();
    const category = menu.categories.find(c => c.id === categoryId);
    const item = category.items.find(i => i.id === itemId);

    if (!item) return;

    // Check if item requires custom amount (like Delivery)
    if (item.requiresCustomAmount) {
        showCustomAmountModal(item, categoryId);
        return;
    }

    // Check if item requires selection (like Charola Combinada)
    if (item.requiresSelection && item.priceOptions) {
        showPriceOptionsModal(item, categoryId);
        return;
    }

    // Check if item already exists in sale
    const existingItemIndex = currentSale.items.findIndex(i => i.id === itemId);

    if (existingItemIndex !== -1) {
        // When adding the same item again, use incrementItem to handle bundle pricing
        incrementItem(existingItemIndex);
    } else {
        // First time adding this item - quantity starts at 1
        currentSale.items.push({
            id: itemId,
            categoryId: categoryId, // Store category for bundle lookup
            name: item.name,
            price: item.price, // Price per unit (or per bundle for bundle items)
            quantity: 1, // Start with 1 item/bundle
            subtotal: item.price
        });
        updateSaleSummary();
    }
}

/**
 * Show custom amount modal for items like delivery
 */
function showCustomAmountModal(item, categoryId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-content">
                <div class="modal-icon">💵</div>
                <h3 class="modal-title">${item.name}</h3>
                <p class="modal-message">${item.note || 'Ingresa el monto del servicio'}</p>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; text-align: left;">Monto (MXN):</label>
                    <input type="number" id="custom-amount-input"
                        style="width: 100%; padding: 0.875rem; font-size: 1.5rem; text-align: center; border: 2px solid var(--color-primary); border-radius: var(--radius-md); font-weight: 600;"
                        placeholder="0.00" step="10" min="0" autofocus>
                </div>

                <div class="modal-actions">
                    <button class="modal-btn modal-btn-cancel" id="custom-amount-cancel">
                        Cancelar
                    </button>
                    <button class="modal-btn modal-btn-confirm" id="custom-amount-confirm">
                        Agregar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Trigger animation
    setTimeout(() => modal.classList.add('active'), 10);

    const input = document.getElementById('custom-amount-input');
    const confirmBtn = document.getElementById('custom-amount-confirm');
    const cancelBtn = document.getElementById('custom-amount-cancel');

    const handleConfirm = () => {
        confirmCustomAmount(item.id, item.name, categoryId);
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

    // Focus on input
    setTimeout(() => {
        input.focus();

        // Allow Enter key to confirm
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleConfirm();
            }
        });
    }, 100);
}

/**
 * Confirm custom amount and add to sale
 */
async function confirmCustomAmount(itemId, itemName, categoryId) {
    const input = document.getElementById('custom-amount-input');
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

    // Add to sale
    currentSale.items.push({
        id: itemId + '-' + Date.now(), // Unique ID for each delivery entry
        categoryId: categoryId,
        name: itemName,
        price: amount,
        quantity: 1,
        subtotal: amount
    });

    // Remove modal with animation
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentNode) {
                document.body.removeChild(modal);
            }
        }, 300);
    }

    // Update summary
    updateSaleSummary();
}

/**
 * Show price options modal for items with multiple prices
 */
function showPriceOptionsModal(item, categoryId) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';

    modal.innerHTML = `
        <div class="card" style="max-width: 400px; width: 90%; margin: 1rem;">
            <h3>${item.name}</h3>
            <p style="margin-bottom: 1rem;">Selecciona una opción:</p>
            ${item.priceOptions.map(option => `
                <button class="secondary" onclick="addItemWithPrice('${item.id}', '${categoryId}', '${option.name}', ${option.price}); document.body.lastChild.remove();"
                    style="width: 100%; margin-bottom: 0.5rem; text-align: left; justify-content: space-between;">
                    <span>${option.name}</span>
                    <span style="font-weight: bold;">$${option.price.toFixed(2)}</span>
                </button>
            `).join('')}
            <button class="secondary" onclick="this.parentElement.parentElement.remove()" style="width: 100%; margin-top: 1rem;">
                Cancelar
            </button>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Add item with specific price
 */
function addItemWithPrice(itemId, categoryId, optionName, price) {
    const menu = getMenu();
    const category = menu.categories.find(c => c.id === categoryId);
    const item = category.items.find(i => i.id === itemId);

    currentSale.items.push({
        id: `${itemId}-${Date.now()}`,
        categoryId: categoryId,
        name: `${item.name} (${optionName})`,
        price: price,
        quantity: 1,
        subtotal: price
    });

    updateSaleSummary();
}

/**
 * Toggle sale summary expanded/collapsed with smooth animations
 */
function toggleSaleSummary() {
    const content = document.getElementById('sale-summary-content');
    const icon = document.getElementById('toggle-icon');
    const backdrop = document.getElementById('sale-backdrop');

    if (content.style.display === 'none' || content.style.display === '') {
        // Expand
        backdrop.style.display = 'block';
        content.style.display = 'block';

        // Trigger animations after display change
        requestAnimationFrame(() => {
            backdrop.style.opacity = '1';
            content.style.opacity = '1';
            icon.style.transform = 'rotate(180deg)';
        });
    } else {
        // Collapse
        backdrop.style.opacity = '0';
        content.style.opacity = '0';
        icon.style.transform = 'rotate(0deg)';

        // Hide after animation completes
        setTimeout(() => {
            backdrop.style.display = 'none';
            content.style.display = 'none';
        }, 300);
    }
}

/**
 * Initialize swipe gesture for sale summary
 */
function initSaleSwipeGesture() {
    const summary = document.getElementById('current-sale-summary');
    if (!summary) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    summary.addEventListener('touchstart', (e) => {
        // Only allow swipe from the header
        if (!e.target.closest('#current-sale-summary > div:first-child')) return;

        const content = document.getElementById('sale-summary-content');
        if (content.style.display !== 'block') return; // Only when expanded

        startY = e.touches[0].clientY;
        isDragging = true;
    }, { passive: true });

    summary.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        // Only allow downward swipe
        if (diff > 0 && diff < 200) {
            summary.style.transform = `translateY(${diff}px)`;
        }
    }, { passive: true });

    summary.addEventListener('touchend', () => {
        if (!isDragging) return;

        isDragging = false;
        const diff = currentY - startY;

        // If swiped down more than 80px, close it
        if (diff > 80) {
            toggleSaleSummary();
        }

        // Reset transform
        summary.style.transform = '';
        startY = 0;
        currentY = 0;
    });
}

/**
 * Update sale summary display
 */
function updateSaleSummary() {
    const itemsList = document.getElementById('sale-items-list');
    const subtotalEl = document.getElementById('sale-subtotal');
    const totalEl = document.getElementById('sale-total');

    // Compact view elements
    const itemsCountBadge = document.getElementById('items-count-badge');
    const totalCompact = document.getElementById('sale-total-compact');

    if (currentSale.items.length === 0) {
        itemsList.innerHTML = '<p style="color: var(--color-text-light); font-size: 0.875rem; text-align: center;">No hay items seleccionados</p>';
        if (subtotalEl) subtotalEl.textContent = '$0.00';
        if (totalEl) totalEl.textContent = '$0.00 MXN';

        // Update compact view
        if (itemsCountBadge) itemsCountBadge.textContent = '0 items';
        if (totalCompact) totalCompact.textContent = '$0.00';
        return;
    }

    // Update compact badge
    if (itemsCountBadge) {
        const totalItems = currentSale.items.reduce((sum, item) => sum + item.quantity, 0);
        itemsCountBadge.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
    }

    itemsList.innerHTML = currentSale.items.map((item, index) => `
        <div style="padding: 0.75rem 0.625rem; background: white; border-radius: 10px; margin-bottom: 0.625rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.06); transition: all 0.2s ease;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.625rem;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 700; font-size: 0.95rem; color: var(--color-text);">${item.name}</div>
                    <div style="font-size: 0.8rem; color: var(--color-text-light); margin-top: 0.125rem;">$${item.price.toFixed(2)} c/u</div>
                </div>
                <button onclick="removeItemFromSale(${index})" style="background: var(--color-danger); color: white; border: none; border-radius: 6px; width: 30px; height: 30px; font-size: 1.125rem; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(216, 67, 21, 0.3);" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" ontouchstart="this.style.transform='scale(0.95)'" ontouchend="this.style.transform='scale(1)'">×</button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; background: var(--color-bg); border-radius: 10px; padding: 0.25rem; gap: 0.375rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <button onclick="decrementItem(${index})" style="background: var(--color-primary); color: white; border: none; border-radius: 8px; width: 38px; height: 38px; font-size: 1.375rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(46, 125, 50, 0.3);" onmousedown="this.style.transform='scale(0.92)'" onmouseup="this.style.transform='scale(1)'" ontouchstart="this.style.transform='scale(0.92)'" ontouchend="this.style.transform='scale(1)'">−</button>
                    <span style="min-width: 40px; text-align: center; font-weight: 700; font-size: 1.15rem; color: var(--color-primary);">${item.quantity}</span>
                    <button onclick="incrementItem(${index})" style="background: var(--color-primary); color: white; border: none; border-radius: 8px; width: 38px; height: 38px; font-size: 1.375rem; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(46, 125, 50, 0.3);" onmousedown="this.style.transform='scale(0.92)'" onmouseup="this.style.transform='scale(1)'" ontouchstart="this.style.transform='scale(0.92)'" ontouchend="this.style.transform='scale(1)'">+</button>
                </div>
                <span style="font-weight: 700; font-size: 1.25rem; color: var(--color-success);">$${item.subtotal.toFixed(2)}</span>
            </div>
        </div>
    `).join('');

    updateSaleTotal();
}

/**
 * Update sale total
 */
function updateSaleTotal() {
    const total = currentSale.items.reduce((sum, item) => sum + item.subtotal, 0);
    currentSale.total = total;

    // Calculate total discount from bundle items
    const totalDiscount = currentSale.items.reduce((sum, item) => {
        return sum + (item.discount || 0);
    }, 0);

    // Calculate subtotal (before discount)
    const subtotal = total + totalDiscount;

    const totalEl = document.getElementById('sale-total');
    const totalCompact = document.getElementById('sale-total-compact');
    const subtotalLine = document.getElementById('subtotal-line');
    const subtotalEl = document.getElementById('sale-subtotal');
    const discountLine = document.getElementById('discount-line');
    const discountAmount = document.getElementById('discount-amount');

    if (totalEl) totalEl.textContent = `$${total.toFixed(2)} MXN`;
    if (totalCompact) totalCompact.textContent = `$${total.toFixed(2)}`;

    // Show/hide discount and subtotal lines
    if (discountLine && discountAmount && subtotalLine && subtotalEl) {
        if (totalDiscount > 0) {
            // Show subtotal, discount, and total
            subtotalLine.style.display = 'block';
            subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
            discountLine.style.display = 'block';
            discountAmount.textContent = `-$${totalDiscount.toFixed(2)}`;
        } else {
            // Hide subtotal and discount lines
            subtotalLine.style.display = 'none';
            discountLine.style.display = 'none';
        }
    }
}

/**
 * Remove item from sale
 */
function removeItemFromSale(index) {
    currentSale.items.splice(index, 1);
    updateSaleSummary();
}

/**
 * Find bundle item for a given item and quantity
 */
function findBundleItem(categoryId, baseItemName, targetQuantity) {
    const menu = getMenu();
    const category = menu.categories.find(c => c.id === categoryId);
    if (!category) return null;

    // Look for a bundle item (e.g., "Tortas 2x" for "Torta")
    const bundleItem = category.items.find(item => {
        // Check if this is a bundle item for the target quantity
        return item.quantity === targetQuantity &&
               item.name.includes('2x') &&
               item.available;
    });

    return bundleItem;
}

/**
 * Increment item quantity with bundle pricing detection (pairs only)
 */
function incrementItem(index) {
    const item = currentSale.items[index];
    const newQuantity = item.quantity + 1;

    // Check if incrementing to 2 and a bundle exists
    if (newQuantity === 2 && item.categoryId) {
        const bundleItem = findBundleItem(item.categoryId, item.name, 2);

        if (bundleItem && bundleItem.price < item.price * 2) {
            // Bundle is cheaper - switch to bundle pricing
            const regularPrice = item.price * 2;
            const discount = regularPrice - bundleItem.price;

            item.originalSinglePrice = item.price; // Store original single price
            item.bundlePriceForTwo = bundleItem.price; // Store bundle price
            item.id = bundleItem.id;
            item.name = bundleItem.name;
            item.price = bundleItem.price / 2; // Store unit price for display
            item.quantity = 2;
            item.subtotal = bundleItem.price;
            item.isBundle = true; // Mark as using bundle pricing
            item.discount = discount; // Store discount amount

            showToast(`Descuento aplicado: ${bundleItem.name}`, 'success');
            updateSaleSummary();
            return;
        }
    }

    // If already using bundle pricing and quantity >= 2
    if (item.isBundle && item.originalSinglePrice && item.bundlePriceForTwo) {
        const oldQuantity = item.quantity;
        item.quantity = newQuantity;

        // Promo only applies to pairs (even quantities)
        const pairs = Math.floor(newQuantity / 2);
        const singles = newQuantity % 2;

        // Calculate: (pairs × bundle_price) + (singles × original_price)
        item.subtotal = (pairs * item.bundlePriceForTwo) + (singles * item.originalSinglePrice);

        // Calculate discount
        const regularTotal = newQuantity * item.originalSinglePrice;
        item.discount = regularTotal - item.subtotal;

        // Show toast when completing a new pair (going from odd to even)
        if (oldQuantity % 2 === 1 && newQuantity % 2 === 0) {
            showToast(`Descuento aplicado: ${item.name}`, 'success');
        }

        updateSaleSummary();
        return;
    }

    // Regular increment (no bundle pricing available)
    item.quantity = newQuantity;
    item.subtotal = item.price * item.quantity;
    updateSaleSummary();
}

/**
 * Decrement item quantity with bundle pricing handling
 */
function decrementItem(index) {
    const item = currentSale.items[index];

    // If decrementing from 2 to 1 and using bundle pricing
    if (item.quantity === 2 && item.isBundle && item.categoryId) {
        // Find the single item version
        const menu = getMenu();
        const category = menu.categories.find(c => c.id === item.categoryId);

        if (category) {
            // Look for the single item (not a bundle, not requiring selection)
            const singleItem = category.items.find(i => {
                return !i.quantity && // Not a bundle
                       !i.requiresSelection && // Not a selection item
                       i.available &&
                       !i.name.includes('2x'); // Not the 2x version
            });

            if (singleItem) {
                // Switch to single item pricing
                item.id = singleItem.id;
                item.name = singleItem.name;
                item.price = singleItem.price;
                item.quantity = 1;
                item.subtotal = singleItem.price;
                item.isBundle = false;
                item.discount = 0; // Remove discount
                // Clear bundle pricing data
                delete item.originalSinglePrice;
                delete item.bundlePriceForTwo;

                updateSaleSummary();
                return;
            }
        }
    }

    if (item.quantity > 1) {
        item.quantity--;

        // If using bundle pricing, recalculate with pair logic
        if (item.isBundle && item.originalSinglePrice && item.bundlePriceForTwo) {
            const pairs = Math.floor(item.quantity / 2);
            const singles = item.quantity % 2;

            // Calculate: (pairs × bundle_price) + (singles × original_price)
            item.subtotal = (pairs * item.bundlePriceForTwo) + (singles * item.originalSinglePrice);

            // Calculate discount
            const regularTotal = item.quantity * item.originalSinglePrice;
            item.discount = regularTotal - item.subtotal;
        } else {
            // Regular pricing
            item.subtotal = item.price * item.quantity;
        }

        updateSaleSummary();
    } else {
        // If quantity would be 0, remove the item
        removeItemFromSale(index);
    }
}

/**
 * Clear current sale
 */
async function clearCurrentSale() {
    if (currentSale.items.length > 0) {
        const confirmed = await showConfirm(
            '¿Estás seguro de que quieres limpiar la venta actual?',
            'Limpiar Venta',
            {
                confirmText: 'Sí, limpiar',
                cancelText: 'Cancelar',
                icon: '🗑️'
            }
        );

        if (!confirmed) {
            return;
        }
    }

    currentSale = {
        items: [],
        total: 0
    };

    updateSaleSummary();
}

/**
 * Save sale as active
 */
async function saveSale() {
    if (currentSale.items.length === 0) {
        showToast('Agrega al menos un item a la venta', 'warning');
        return;
    }

    try {
        // Try API first
        await addActiveSale({
            items: currentSale.items,
            total: currentSale.total,
            deliveryFee: 0 // Always 0 since delivery is now a line item
        });

        showToast('Venta guardada correctamente', 'success');

        // Clear current sale
        currentSale = {
            items: [],
            total: 0
        };

        // Switch to active sales tab
        document.querySelector('.tab-btn[data-tab="ventas-activas"]').click();
    } catch (error) {
        console.error('Error saving sale:', error);

        // Fallback to localStorage for testing (test mode only)
        if (isTestMode()) {
            saveSaleOffline();
        } else {
            showToast('Error al guardar - Verifica tu conexión', 'error');
        }
    }
}

/**
 * Save sale offline (for testing without backend)
 */
function saveSaleOffline() {
    const sale = {
        id: 'test-' + Date.now(),
        items: currentSale.items,
        total: currentSale.total,
        status: 'active',
        createdAt: new Date().toISOString()
    };

    // Get existing sales from localStorage
    const salesActive = JSON.parse(localStorage.getItem('salesActive') || '[]');
    salesActive.push(sale);
    localStorage.setItem('salesActive', JSON.stringify(salesActive));

    showToast('Venta guardada (modo offline)', 'success');

    // Clear current sale
    currentSale = {
        items: [],
        total: 0
    };

    // Reload active sales and switch tab
    loadActiveSales();
    document.querySelector('.tab-btn[data-tab="ventas-activas"]').click();
}

/**
 * Show close sale modal with tip and split payment support
 */
function showCloseSaleModal(saleId) {
    let sales = getActiveSales();

    // Fallback to localStorage if API fails (test mode only)
    if (isTestMode() && (!sales || sales.length === 0)) {
        sales = JSON.parse(localStorage.getItem('salesActive') || '[]');
    }

    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
        console.error('Sale not found:', saleId);
        showToast('Venta no encontrada', 'error');
        return;
    }

    const saleTotal = sale.total;

    const modal = document.createElement('div');
    modal.id = 'payment-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; overflow-y: auto;';

    modal.innerHTML = `
        <div class="card" style="max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
            <h3 style="margin-bottom: 1rem;">Cerrar Venta</h3>

            <!-- Sale Total -->
            <div style="background: var(--color-bg); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-weight: 500;">Total venta:</span>
                    <span style="font-weight: 700; font-size: 1.125rem;">$${saleTotal.toFixed(2)}</span>
                </div>
            </div>

            <!-- Tip Section -->
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Propina (opcional):</label>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-bottom: 0.5rem;">
                    <button class="secondary tip-btn" onclick="setTipPercentage(${saleTotal}, 0)" style="padding: 0.625rem;">0%</button>
                    <button class="secondary tip-btn" onclick="setTipPercentage(${saleTotal}, 10)" style="padding: 0.625rem;">10%</button>
                    <button class="secondary tip-btn" onclick="setTipPercentage(${saleTotal}, 15)" style="padding: 0.625rem;">15%</button>
                    <button class="secondary tip-btn" onclick="setTipPercentage(${saleTotal}, 20)" style="padding: 0.625rem;">20%</button>
                </div>
                <button class="secondary" onclick="showCustomTipModal(${saleTotal})" style="width: 100%; margin-top: 0.5rem;">
                    Propina Personalizada
                </button>
                <div id="tip-display" style="display: none; margin-top: 0.5rem; padding: 0.5rem; background: var(--color-success); color: white; border-radius: 8px; text-align: center; font-weight: 600;">
                    Propina: $0.00
                </div>
            </div>

            <!-- Total with Tip -->
            <div style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 1.125rem;">Total a pagar:</span>
                    <span id="total-with-tip" style="font-weight: 700; font-size: 1.5rem;">$${saleTotal.toFixed(2)}</span>
                </div>
            </div>

            <!-- Payment Method Buttons -->
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.75rem;">Agregar Pago:</label>
                <button class="primary" onclick="showPaymentMethodModal('${saleId}', ${saleTotal}, 'Efectivo')" style="width: 100%; margin-bottom: 0.5rem; font-size: 1rem; padding: 0.875rem;">
                    Efectivo
                </button>
                <button class="primary" onclick="showPaymentMethodModal('${saleId}', ${saleTotal}, 'Transferencia')" style="width: 100%; margin-bottom: 0.5rem; font-size: 1rem; padding: 0.875rem;">
                    Transferencia
                </button>
                <button class="primary" onclick="showPaymentMethodModal('${saleId}', ${saleTotal}, 'Otro')" style="width: 100%; margin-bottom: 0.5rem; font-size: 1rem; padding: 0.875rem;">
                    Otro
                </button>
            </div>

            <!-- Payment Summary -->
            <div id="payment-summary" style="margin-bottom: 1rem; display: none;">
                <h4 style="margin-bottom: 0.5rem;">Pagos Recibidos:</h4>
                <div id="payment-list" style="background: var(--color-bg); padding: 0.75rem; border-radius: 8px; margin-bottom: 0.5rem; font-size: 0.875rem;">
                </div>
            </div>

            <!-- Remaining Amount -->
            <div id="remaining-payment" style="padding: 1rem; border-radius: 8px; background: var(--color-bg); text-align: center; margin-bottom: 1rem;">
                <span style="font-weight: 600; font-size: 1rem;">Pendiente: </span>
                <span id="remaining-amount" style="font-weight: 700; font-size: 1.5rem; color: var(--color-danger);">$${saleTotal.toFixed(2)}</span>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 0.5rem;">
                <button class="secondary" onclick="document.getElementById('payment-modal').remove()" style="flex: 1;">
                    Cancelar
                </button>
                <button id="confirm-payment-btn" class="primary" onclick="confirmCloseSaleWithPayment('${saleId}', ${saleTotal})" style="flex: 1;" disabled>
                    Confirmar Pago
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Initialize payment tracking
    window.currentPayments = {
        Efectivo: 0,
        Transferencia: 0,
        Otro: 0
    };
    window.currentTip = 0;
}

/**
 * Show payment method modal (popup style)
 */
function showPaymentMethodModal(saleId, saleTotal, methodName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-content">
                <h3 class="modal-title">${methodName}</h3>
                <p class="modal-message">Ingresa el monto recibido</p>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; text-align: left;">Monto (MXN):</label>
                    <input type="number" id="payment-method-input"
                        style="width: 100%; padding: 0.875rem; font-size: 1.5rem; text-align: center; border: 2px solid var(--color-primary); border-radius: var(--radius-md); font-weight: 600;"
                        placeholder="0.00" step="10" min="0" autofocus>
                </div>

                <div class="modal-actions">
                    <button class="modal-btn modal-btn-cancel" id="payment-cancel">
                        Cancelar
                    </button>
                    <button class="modal-btn modal-btn-confirm" id="payment-confirm">
                        Agregar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Trigger animation
    setTimeout(() => modal.classList.add('active'), 10);

    const input = document.getElementById('payment-method-input');
    const confirmBtn = document.getElementById('payment-confirm');
    const cancelBtn = document.getElementById('payment-cancel');

    const handleConfirm = () => {
        const amount = parseFloat(input.value) || 0;
        if (amount > 0) {
            window.currentPayments[methodName] = amount;
            updatePaymentSummary(saleTotal);
            modal.classList.remove('active');
            setTimeout(() => document.body.removeChild(modal), 300);
        }
    };

    const handleCancel = () => {
        modal.classList.remove('active');
        setTimeout(() => document.body.removeChild(modal), 300);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) handleCancel();
    });

    // Focus and Enter key support
    setTimeout(() => {
        input.focus();
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleConfirm();
        });
    }, 100);
}

/**
 * Show custom tip modal (popup style)
 */
function showCustomTipModal(saleTotal) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-content">
                <h3 class="modal-title">Propina Personalizada</h3>
                <p class="modal-message">Ingresa el monto de la propina</p>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; text-align: left;">Monto (MXN):</label>
                    <input type="number" id="tip-custom-input"
                        style="width: 100%; padding: 0.875rem; font-size: 1.5rem; text-align: center; border: 2px solid var(--color-primary); border-radius: var(--radius-md); font-weight: 600;"
                        placeholder="0.00" step="10" min="0" autofocus>
                </div>

                <div class="modal-actions">
                    <button class="modal-btn modal-btn-cancel" id="tip-cancel">
                        Cancelar
                    </button>
                    <button class="modal-btn modal-btn-confirm" id="tip-confirm">
                        Agregar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    const input = document.getElementById('tip-custom-input');
    const confirmBtn = document.getElementById('tip-confirm');
    const cancelBtn = document.getElementById('tip-cancel');

    const handleConfirm = () => {
        const amount = parseFloat(input.value) || 0;
        window.currentTip = amount;
        updateTipDisplay(saleTotal);
        updatePaymentSummary(saleTotal);
        modal.classList.remove('active');
        setTimeout(() => document.body.removeChild(modal), 300);
    };

    const handleCancel = () => {
        modal.classList.remove('active');
        setTimeout(() => document.body.removeChild(modal), 300);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) handleCancel();
    });

    setTimeout(() => {
        input.focus();
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleConfirm();
        });
    }, 100);
}

/**
 * Set tip percentage
 */
function setTipPercentage(saleTotal, percentage) {
    const tipAmount = saleTotal * (percentage / 100);
    window.currentTip = tipAmount;

    updateTipDisplay(saleTotal);
    updatePaymentSummary(saleTotal);

    // Highlight selected button
    document.querySelectorAll('.tip-btn').forEach(btn => {
        btn.style.background = '';
        btn.style.color = '';
    });
    event.target.style.background = 'var(--color-success)';
    event.target.style.color = 'white';
}

/**
 * Update tip display
 */
function updateTipDisplay(saleTotal) {
    const tipDisplay = document.getElementById('tip-display');
    const totalWithTip = document.getElementById('total-with-tip');
    const tip = window.currentTip || 0;

    if (tip > 0) {
        tipDisplay.style.display = 'block';
        tipDisplay.textContent = `Propina: $${tip.toFixed(2)}`;
    } else {
        tipDisplay.style.display = 'none';
    }

    const total = saleTotal + tip;
    totalWithTip.textContent = `$${total.toFixed(2)}`;
}

/**
 * Update payment summary and validation
 */
function updatePaymentSummary(saleTotal) {
    const payments = window.currentPayments || { Efectivo: 0, Transferencia: 0, Otro: 0 };
    const tip = window.currentTip || 0;
    const totalToPay = saleTotal + tip;

    // Calculate total paid
    const totalPaid = payments.Efectivo + payments.Transferencia + payments.Otro;
    const remaining = totalToPay - totalPaid;

    // Update payment list
    const paymentSummary = document.getElementById('payment-summary');
    const paymentList = document.getElementById('payment-list');
    const paymentsReceived = Object.entries(payments).filter(([_, amount]) => amount > 0);

    if (paymentsReceived.length > 0) {
        paymentSummary.style.display = 'block';
        paymentList.innerHTML = paymentsReceived
            .map(([method, amount]) => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>${method}:</span>
                    <strong>$${amount.toFixed(2)}</strong>
                </div>
            `).join('');
    } else {
        paymentSummary.style.display = 'none';
    }

    // Update remaining amount
    const remainingEl = document.getElementById('remaining-amount');
    const confirmBtn = document.getElementById('confirm-payment-btn');

    if (remaining < -0.01) {
        // Overpayment
        remainingEl.style.color = 'var(--color-warning)';
        remainingEl.textContent = `+$${Math.abs(remaining).toFixed(2)} (exceso)`;
        confirmBtn.disabled = true;
    } else if (remaining > 0.01) {
        // Underpayment
        remainingEl.style.color = 'var(--color-danger)';
        remainingEl.textContent = `$${remaining.toFixed(2)}`;
        confirmBtn.disabled = true;
    } else {
        // Exact payment
        remainingEl.style.color = 'var(--color-success)';
        remainingEl.textContent = '$0.00';
        confirmBtn.disabled = false;
    }
}

/**
 * Confirm close sale with payment breakdown and tip
 */
async function confirmCloseSaleWithPayment(saleId, saleTotal) {
    const tip = window.currentTip || 0;
    const payments = window.currentPayments || { Efectivo: 0, Transferencia: 0, Otro: 0 };

    const paymentBreakdown = {
        Efectivo: payments.Efectivo,
        Transferencia: payments.Transferencia,
        Otro: payments.Otro
    };

    // Determine primary payment method (largest amount)
    let primaryMethod = 'Efectivo';
    let maxAmount = payments.Efectivo;
    if (payments.Transferencia > maxAmount) {
        primaryMethod = 'Transferencia';
        maxAmount = payments.Transferencia;
    }
    if (payments.Otro > maxAmount) {
        primaryMethod = 'Otro';
    }

    try {
        await closeSaleWithPayment(saleId, primaryMethod, paymentBreakdown, tip);
        document.getElementById('payment-modal').remove();
        showToast(`Venta cerrada correctamente`, 'success');
        loadActiveSales();
        loadClosedSales();
    } catch (error) {
        console.error('Error closing sale:', error);

        // Fallback to offline mode (test mode only)
        if (isTestMode()) {
            closeSaleOffline(saleId, primaryMethod, paymentBreakdown, tip);
        } else {
            document.getElementById('payment-modal').remove();
            showToast('Error al cerrar venta - Verifica tu conexión', 'error');
        }
    }
}

/**
 * Close sale offline (for testing without backend)
 */
function closeSaleOffline(saleId, primaryMethod, paymentBreakdown, tip) {
    // Get active sales from localStorage
    const salesActive = JSON.parse(localStorage.getItem('salesActive') || '[]');
    const saleIndex = salesActive.findIndex(s => s.id === saleId);

    if (saleIndex === -1) {
        showToast('Venta no encontrada', 'error');
        return;
    }

    // Move sale to closed
    const sale = salesActive[saleIndex];
    sale.status = 'closed';
    sale.paymentMethod = primaryMethod;
    sale.paymentBreakdown = paymentBreakdown;
    sale.tip = tip;
    sale.total = sale.total + tip; // Add tip to total
    sale.closedAt = new Date().toISOString();

    // Update localStorage
    const salesClosed = JSON.parse(localStorage.getItem('salesClosed') || '[]');
    salesClosed.unshift(sale);
    salesActive.splice(saleIndex, 1);

    localStorage.setItem('salesActive', JSON.stringify(salesActive));
    localStorage.setItem('salesClosed', JSON.stringify(salesClosed));

    document.getElementById('payment-modal').remove();
    showToast('Venta cerrada (modo offline)', 'success');
    loadActiveSales();
    loadClosedSales();
}

/**
 * Confirm close sale (legacy - kept for compatibility)
 */
async function confirmCloseSale(saleId, paymentMethod) {
    try {
        await closeSale(saleId, paymentMethod);
        showToast(`Venta cerrada - Pago: ${paymentMethod}`, 'success');
        loadActiveSales();
    } catch (error) {
        console.error('Error closing sale:', error);
        showToast('Error al cerrar la venta', 'error');
    }
}

/**
 * Delete active sale with confirmation
 */
async function deleteActiveSaleConfirm(saleId, skipConfirmation = false) {
    if (!skipConfirmation) {
        const confirmed = await showConfirm(
            'Esta acción no se puede deshacer.',
            'Eliminar Venta',
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
    }

    try {
        await deleteActiveSale(saleId);
        if (!skipConfirmation) {
            showToast('Venta eliminada correctamente', 'success');
        }
        loadActiveSales();
    } catch (error) {
        console.error('Error deleting sale:', error);

        // Fallback to localStorage deletion (test mode only)
        if (isTestMode()) {
            let activeSales = JSON.parse(localStorage.getItem('salesActive') || '[]');
            const saleIndex = activeSales.findIndex(s => s.id === saleId);

            if (saleIndex !== -1) {
                activeSales.splice(saleIndex, 1);
                localStorage.setItem('salesActive', JSON.stringify(activeSales));
                loadActiveSales();
                if (!skipConfirmation) {
                    showToast('Venta eliminada correctamente', 'success');
                }
            } else {
                if (!skipConfirmation) {
                    showToast('Error al eliminar la venta', 'error');
                }
            }
        } else {
            if (!skipConfirmation) {
                showToast('Error al eliminar - Verifica tu conexión', 'error');
            }
        }
    }
}

/**
 * Toggle payment breakdown visibility
 */
function togglePaymentBreakdown(saleId) {
    const breakdown = document.getElementById(`breakdown-${saleId}`);
    const icon = document.getElementById(`breakdown-icon-${saleId}`);

    if (breakdown.style.display === 'none' || breakdown.style.display === '') {
        breakdown.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
    } else {
        breakdown.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
}

/**
 * Edit active sale - load it into the current sale form
 */
function editActiveSale(saleId) {
    let sales = getActiveSales();

    // Fallback to localStorage if API fails (test mode only)
    if (isTestMode() && (!sales || sales.length === 0)) {
        sales = JSON.parse(localStorage.getItem('salesActive') || '[]');
    }

    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
        showToast('Venta no encontrada', 'error');
        return;
    }

    // Load sale into current sale
    currentSale = {
        items: [...sale.items],
        total: sale.total
    };

    // Delete the active sale
    deleteActiveSaleConfirm(saleId, true);

    // Switch to new sale tab
    document.querySelector('.tab-btn[data-tab="nueva-venta"]').click();

    // Update summary
    updateSaleSummary();

    showToast('Venta cargada para edición', 'info');
}

/**
 * Edit closed sale - reopen it as active
 */
async function editClosedSale(saleId) {
    const confirmed = await showConfirm(
        '¿Deseas reabrir esta venta para editarla? Se moverá a ventas activas.',
        'Editar Venta Cerrada',
        {
            confirmText: 'Sí, editar',
            cancelText: 'Cancelar',
            icon: '✏️'
        }
    );

    if (!confirmed) {
        return;
    }

    try {
        // Use API to reopen the sale
        await reopenClosedSale(saleId);

        // Reload views
        loadActiveSales();
        loadClosedSales();

        // Switch to active sales tab
        document.querySelector('.tab-btn[data-tab="ventas-activas"]').click();

        showToast('Venta reabierta para edición', 'success');
    } catch (error) {
        console.error('Error reopening sale:', error);
        // Error toast is shown by the API function
    }
}

/**
 * Delete closed sale with confirmation
 */
async function deleteClosedSaleConfirm(saleId) {
    const confirmed = await showConfirm(
        'Esta acción eliminará permanentemente esta venta. ¿Estás seguro?',
        'Eliminar Venta Cerrada',
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
        // Use API to delete the sale
        await deleteClosedSale(saleId);

        loadClosedSales();
        showToast('Venta eliminada correctamente', 'success');
    } catch (error) {
        console.error('Error deleting sale:', error);
        // Error toast is shown by the API function
    }
}
