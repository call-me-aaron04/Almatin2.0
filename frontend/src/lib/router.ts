/** Simple hash-based SPA router */

type RouteHandler = (page: string) => void;

class Router {
  private handlers: RouteHandler[] = [];
  private currentPage = 'dashboard';

  constructor() {
    window.addEventListener('hashchange', () => this.handleRoute());
    // Intercept nav clicks for smooth transitions
    document.addEventListener('click', (e) => {
      const link = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (link) {
        e.preventDefault();
        const hash = link.getAttribute('href') || '#dashboard';
        window.location.hash = hash;
      }
    });
  }

  onRoute(handler: RouteHandler) {
    this.handlers.push(handler);
  }

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const validPages = ['dashboard', 'workflow', 'reports', 'settings'];
    const page = validPages.includes(hash) ? hash : 'dashboard';
    this.currentPage = page;
    this.handlers.forEach((h) => h(page));
    this.updateNavIndicator(page);
  }

  private updateNavIndicator(page: string) {
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.toggle('active', link.getAttribute('data-page') === page);
    });
  }

  navigate(page: string) {
    window.location.hash = page;
  }

  getCurrentPage() {
    return this.currentPage;
  }
}

export const router = new Router();
