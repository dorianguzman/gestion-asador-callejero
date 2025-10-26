/**
 * Cloudflare Pages Middleware: Basic Authentication
 * Protects the entire site with HTTP Basic Auth
 */

const REALM = 'Asador Callejero - Área Restringida';
const USERNAME = 'admin'; // You can change this

export async function onRequest(context) {
    const { request, env, next } = context;

    // Get password from environment variable
    const AUTH_PASSWORD = env.AUTH_PASSWORD;

    // If no password is set, allow access (for local development)
    if (!AUTH_PASSWORD) {
        console.warn('⚠️ AUTH_PASSWORD not set - authentication disabled');
        return next();
    }

    // Get Authorization header
    const authHeader = request.headers.get('Authorization');

    // If no auth header, request authentication
    if (!authHeader) {
        return unauthorizedResponse();
    }

    // Parse Basic Auth credentials
    const [scheme, encoded] = authHeader.split(' ');

    // Verify scheme is "Basic"
    if (!encoded || scheme !== 'Basic') {
        return unauthorizedResponse();
    }

    // Decode credentials
    const buffer = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(buffer);
    const [username, password] = decoded.split(':');

    // Verify credentials
    if (username === USERNAME && password === AUTH_PASSWORD) {
        // Authentication successful - continue to the app
        return next();
    }

    // Authentication failed
    return unauthorizedResponse();
}

/**
 * Return 401 Unauthorized response
 */
function unauthorizedResponse() {
    return new Response('Acceso no autorizado. Por favor ingresa tus credenciales.', {
        status: 401,
        statusText: 'Unauthorized',
        headers: {
            'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
            'Content-Type': 'text/plain; charset=UTF-8'
        }
    });
}
