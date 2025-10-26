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
    const activeSales = getActiveSales();
    const container = document.getElementById('active-sales-list');

    if (!activeSales || activeSales.length === 0) {
        container.innerHTML = '<p class="text-center">No hay ventas activas</p>';
        return;
    }

    container.innerHTML = activeSales.map(sale => `
        <div class="card" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4>Venta #${sale.id.slice(-6)}</h4>
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
                <button class="danger" onclick="deleteActiveSaleConfirm('${sale.id}')">
                    Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Load and display closed sales
 */
function loadClosedSales() {
    const closedSales = getClosedSales();
    const container = document.getElementById('closed-sales-list');

    if (!closedSales || closedSales.length === 0) {
        container.innerHTML = '<p class="text-center">No hay ventas cerradas</p>';
        return;
    }

    // Sort by closed date, most recent first
    const sortedSales = [...closedSales].sort((a, b) =>
        new Date(b.closedAt) - new Date(a.closedAt)
    );

    container.innerHTML = sortedSales.map(sale => `
        <div class="card" style="margin-bottom: 1rem; opacity: 0.9;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <h4>Venta #${sale.id.slice(-6)}</h4>
                        <span style="background: var(--color-success); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                            ${sale.paymentMethod || 'Pagado'}
                        </span>
                    </div>
                    <p style="color: var(--color-text-light); font-size: 0.875rem; margin: 0.5rem 0;">
                        ${new Date(sale.closedAt).toLocaleString('es-MX')}
                    </p>
                    <div style="margin-top: 0.5rem; font-size: 0.875rem;">
                        ${sale.items.length} item${sale.items.length > 1 ? 's' : ''}
                    </div>
                    <div style="margin-top: 0.5rem; font-weight: bold; font-size: 1.125rem; color: var(--color-primary);">
                        Total: $${sale.total.toFixed(2)} MXN
                    </div>
                </div>
            </div>
        </div>
    `).join('');
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
        showCustomAmountModal(item);
        return;
    }

    // Check if item requires selection (like Charola Combinada)
    if (item.requiresSelection && item.priceOptions) {
        showPriceOptionsModal(item, categoryId);
        return;
    }

    // Check if item already exists in sale
    const existingItem = currentSale.items.find(i => i.id === itemId);

    if (existingItem) {
        // When adding the same item again, increment quantity by 1
        existingItem.quantity++;
        existingItem.subtotal = existingItem.price * existingItem.quantity;
    } else {
        // First time adding this item - quantity starts at 1
        currentSale.items.push({
            id: itemId,
            name: item.name,
            price: item.price, // Price per unit (or per bundle for bundle items)
            quantity: 1, // Start with 1 item/bundle
            subtotal: item.price
        });
    }

    updateSaleSummary();
}

/**
 * Show custom amount modal for items like delivery
 */
function showCustomAmountModal(item) {
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
        confirmCustomAmount(item.id, item.name);
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
async function confirmCustomAmount(itemId, itemName) {
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
    const content = document.getElementById('sale-summary-content');

    // Track previous length for auto-expand
    const previousLength = currentSale._previousLength || 0;
    currentSale._previousLength = currentSale.items.length;

    if (currentSale.items.length === 0) {
        itemsList.innerHTML = '<p style="color: var(--color-text-light); font-size: 0.875rem; text-align: center;">No hay items seleccionados</p>';
        if (subtotalEl) subtotalEl.textContent = '$0.00';
        if (totalEl) totalEl.textContent = '$0.00 MXN';

        // Update compact view
        if (itemsCountBadge) itemsCountBadge.textContent = '0 items';
        if (totalCompact) totalCompact.textContent = '$0.00';
        return;
    }

    // Auto-expand when first item is added
    if (previousLength === 0 && currentSale.items.length === 1) {
        if (content && (content.style.display === 'none' || content.style.display === '')) {
            toggleSaleSummary();
        }
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

    const totalEl = document.getElementById('sale-total');
    const totalCompact = document.getElementById('sale-total-compact');

    if (totalEl) totalEl.textContent = `$${total.toFixed(2)} MXN`;
    if (totalCompact) totalCompact.textContent = `$${total.toFixed(2)}`;
}

/**
 * Remove item from sale
 */
function removeItemFromSale(index) {
    currentSale.items.splice(index, 1);
    updateSaleSummary();
}

/**
 * Increment item quantity
 */
function incrementItem(index) {
    const item = currentSale.items[index];
    item.quantity++;
    item.subtotal = item.price * item.quantity;
    updateSaleSummary();
}

/**
 * Decrement item quantity
 */
function decrementItem(index) {
    const item = currentSale.items[index];
    if (item.quantity > 1) {
        item.quantity--;
        item.subtotal = item.price * item.quantity;
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
        showToast('Error al guardar la venta', 'error');
    }
}

/**
 * Show close sale modal
 */
function showCloseSaleModal(saleId) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';

    modal.innerHTML = `
        <div class="card" style="max-width: 400px; width: 90%; margin: 1rem;">
            <h3>Cerrar Venta</h3>
            <p style="margin-bottom: 1rem;">Selecciona el método de pago:</p>
            <button class="primary" onclick="confirmCloseSale('${saleId}', 'Efectivo'); this.parentElement.parentElement.remove();"
                style="width: 100%; margin-bottom: 0.5rem;">
                💵 Efectivo
            </button>
            <button class="primary" onclick="confirmCloseSale('${saleId}', 'Transferencia'); this.parentElement.parentElement.remove();"
                style="width: 100%; margin-bottom: 0.5rem;">
                🏦 Transferencia
            </button>
            <button class="primary" onclick="confirmCloseSale('${saleId}', 'Otro'); this.parentElement.parentElement.remove();"
                style="width: 100%; margin-bottom: 0.5rem;">
                💳 Otro
            </button>
            <button class="secondary" onclick="this.parentElement.parentElement.remove()" style="width: 100%; margin-top: 1rem;">
                Cancelar
            </button>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Confirm close sale
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
async function deleteActiveSaleConfirm(saleId) {
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

    try {
        await deleteActiveSale(saleId);
        showToast('Venta eliminada correctamente', 'success');
        loadActiveSales();
    } catch (error) {
        console.error('Error deleting sale:', error);
        showToast('Error al eliminar la venta', 'error');
    }
}
