/*
 * SALES.JS - Sales Management
 * Handles sales UI and logic
 */

let currentSale = {
    items: [],
    total: 0,
    deliveryFee: 0
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
                                    <span style="font-weight: bold;">$${item.price ? item.price.toFixed(2) : '0.00'}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>

        <div id="current-sale-summary" style="position: sticky; bottom: 0; background: var(--color-white); padding: 1rem; margin: -1rem; margin-top: 1rem; box-shadow: 0 -4px 8px rgba(0,0,0,0.1); border-radius: var(--radius-lg);">
            <h4>Venta Actual</h4>
            <div id="sale-items-list" style="max-height: 200px; overflow-y: auto; margin: 0.5rem 0;">
                <p style="color: var(--color-text-light); font-size: 0.875rem;">No hay items seleccionados</p>
            </div>
            <div style="border-top: 2px solid var(--color-primary); padding-top: 0.5rem; margin-top: 0.5rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>Subtotal:</span>
                    <span id="sale-subtotal">$0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <label for="delivery-fee" style="margin: 0;">Domicilio:</label>
                    <input type="number" id="delivery-fee" value="0" step="10" min="0"
                        style="width: 100px; padding: 0.25rem; text-align: right;"
                        onchange="updateSaleTotal()">
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.125rem;">
                    <span>Total:</span>
                    <span id="sale-total">$0.00 MXN</span>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="primary" onclick="saveSale()" style="flex: 1;">
                    Guardar Venta
                </button>
                <button class="secondary" onclick="clearCurrentSale()">
                    Limpiar
                </button>
            </div>
        </div>
    `;

    document.getElementById('sale-form').innerHTML = formHtml;
    updateSaleSummary();
}

/**
 * Add item to current sale
 */
function addItemToSale(itemId, categoryId) {
    const menu = getMenu();
    const category = menu.categories.find(c => c.id === categoryId);
    const item = category.items.find(i => i.id === itemId);

    if (!item) return;

    // Check if item requires selection (like Charola Combinada)
    if (item.requiresSelection && item.priceOptions) {
        showPriceOptionsModal(item, categoryId);
        return;
    }

    // Check if item already exists in sale
    const existingItem = currentSale.items.find(i => i.id === itemId);

    if (existingItem) {
        existingItem.quantity++;
        existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
        currentSale.items.push({
            id: itemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
            subtotal: item.price * (item.quantity || 1)
        });
    }

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
 * Update sale summary display
 */
function updateSaleSummary() {
    const itemsList = document.getElementById('sale-items-list');
    const subtotalEl = document.getElementById('sale-subtotal');
    const totalEl = document.getElementById('sale-total');

    if (currentSale.items.length === 0) {
        itemsList.innerHTML = '<p style="color: var(--color-text-light); font-size: 0.875rem;">No hay items seleccionados</p>';
        subtotalEl.textContent = '$0.00';
        totalEl.textContent = '$0.00 MXN';
        return;
    }

    itemsList.innerHTML = currentSale.items.map((item, index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--color-bg); border-radius: 8px; margin-bottom: 0.5rem;">
            <div style="flex: 1;">
                <div style="font-weight: 500;">${item.name}</div>
                <div style="font-size: 0.875rem; color: var(--color-text-light);">
                    ${item.quantity}x $${item.price.toFixed(2)}
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-weight: bold;">$${item.subtotal.toFixed(2)}</span>
                <button onclick="removeItemFromSale(${index})" style="background: var(--color-danger); color: white; border: none; border-radius: 4px; width: 24px; height: 24px; font-size: 0.875rem; cursor: pointer;">×</button>
            </div>
        </div>
    `).join('');

    updateSaleTotal();
}

/**
 * Update sale total
 */
function updateSaleTotal() {
    const deliveryFeeInput = document.getElementById('delivery-fee');
    const deliveryFee = deliveryFeeInput ? parseFloat(deliveryFeeInput.value) || 0 : 0;

    const subtotal = currentSale.items.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal + deliveryFee;

    currentSale.deliveryFee = deliveryFee;
    currentSale.total = total;

    const subtotalEl = document.getElementById('sale-subtotal');
    const totalEl = document.getElementById('sale-total');

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)} MXN`;
}

/**
 * Remove item from sale
 */
function removeItemFromSale(index) {
    currentSale.items.splice(index, 1);
    updateSaleSummary();
}

/**
 * Clear current sale
 */
function clearCurrentSale() {
    if (currentSale.items.length > 0) {
        if (!confirm('¿Estás seguro de que quieres limpiar la venta actual?')) {
            return;
        }
    }

    currentSale = {
        items: [],
        total: 0,
        deliveryFee: 0
    };

    updateSaleSummary();

    const deliveryFeeInput = document.getElementById('delivery-fee');
    if (deliveryFeeInput) deliveryFeeInput.value = '0';
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
            deliveryFee: currentSale.deliveryFee
        });

        showToast('Venta guardada correctamente', 'success');

        // Clear current sale
        currentSale = {
            items: [],
            total: 0,
            deliveryFee: 0
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
    if (!confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
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
