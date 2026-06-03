/* ==========================================================
   SHIELDPLAN AI — SPA Router
   Handles client-side page navigation via URL hash
   ========================================================== */

/**
 * Route map: hash -> page element ID
 */
const ROUTES = {
    'login': 'page-login',
    'signup': 'page-signup',
    'dashboard': 'page-dashboard',
    'workflow': 'page-workflow',
    'physics': 'page-physics',
    'reports': 'page-reports',
};

/**
 * Default route when no hash is present.
 */
const DEFAULT_ROUTE = 'dashboard';

/**
 * Initialize the router.
 */
function initRouter() {
    // Listen for hash changes
    window.addEventListener('hashchange', handleRoute);

    // Handle initial route
    if (!window.location.hash) {
        window.location.hash = DEFAULT_ROUTE;
    } else {
        handleRoute();
    }
}

/**
 * Handle route change: show correct page, update nav, trigger init.
 */
function handleRoute() {
    const hash = window.location.hash.replace('#', '') || DEFAULT_ROUTE;
    const pageId = ROUTES[hash];

    if (!pageId) {
        // Unknown route, redirect to dashboard
        window.location.hash = DEFAULT_ROUTE;
        return;
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });

    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === hash);
    });

    // Trigger page-specific initialization
    triggerPageInit(hash);
}

/**
 * Trigger initialization functions when a page loads.
 */
function triggerPageInit(page) {
    switch (page) {
        case 'dashboard':
            updateDashboardStats();
            break;
        case 'workflow':
            loadModalities();
            break;
        case 'login':
            initLoginForm();
            break;
        case 'signup':
            initSignupForm();
            break;
        case 'reports':
            updateReportSummaryBanner();
            break;
    }
}

// Initialize router on DOM ready
document.addEventListener('DOMContentLoaded', initRouter);
