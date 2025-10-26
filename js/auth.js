/*
 * AUTH.JS - Simplified Authentication
 * No authentication needed - app initializes directly
 * Data is stored in Cloudflare D1 (tied to Cloudflare account, not user)
 */

/**
 * Initialize authentication on page load
 */
async function initializeAuth() {
    console.log('✅ Initializing app (no auth required)');

    // Hide login screen immediately
    hideLoginScreen();

    // Initialize the app
    initializeApp();

    return true;
}

/**
 * Hide login screen
 */
function hideLoginScreen() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * Logout function (placeholder - redirects to home)
 */
async function logout() {
    const confirmed = await showConfirm(
        'Todos los cambios no guardados se perderán.',
        'Cerrar Sesión',
        {
            confirmText: 'Sí, salir',
            cancelText: 'Cancelar',
            icon: '👋'
        }
    );

    if (confirmed) {
        window.location.reload();
    }
}

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});
