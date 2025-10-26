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
function logout() {
    if (confirm('¿Estás seguro de que quieres salir?')) {
        window.location.reload();
    }
}

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});
