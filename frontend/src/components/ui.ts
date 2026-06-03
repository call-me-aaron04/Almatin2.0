/* ======== UI Components ======== */

/* ----- Toast Notifications ----- */
export function showToast(message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' }[type];
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ----- Modal ----- */
export function showModal(html: string) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  if (!overlay || !content) return;

  content.innerHTML = html;
  overlay.classList.remove('hidden');

  const close = () => overlay.classList.add('hidden');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  const closeBtn = content.querySelector('.modal-close');
  if (closeBtn) closeBtn.addEventListener('click', close);
}

export function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}

/* ----- Particle Background ----- */
export class ParticleBackground {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Array<{
    x: number; y: number; vx: number; vy: number; size: number; alpha: number;
  }> = [];
  private animId = 0;
  private density = 60;

  private ready = false;

  constructor(canvasId: string, density = 60) {
    this.density = density;
    const el = document.getElementById(canvasId);
    if (!el || !(el instanceof HTMLCanvasElement)) {
      console.warn('Particle canvas element not found or not a <canvas>');
      this.ready = false;
      return;
    }
    this.canvas = el as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      console.warn('Could not get 2D context for particle canvas');
      this.ready = false;
      return;
    }
    this.ready = true;
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.init();
  }

  private resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private init() {
    if (!this.canvas || !this.ctx) return;
    this.particles = [];
    const count = Math.floor((this.canvas.width * this.canvas.height) / 20000) * (this.density / 60);
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }
    this.animate();
  }

  private animate = () => {
    if (!this.ready) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const isLight = document.documentElement.classList.contains('light');

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = isLight
        ? `rgba(0, 102, 204, ${p.alpha * 0.3})`
        : `rgba(0, 180, 255, ${p.alpha})`;
      this.ctx.fill();
    }

    // Draw connections
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          const alpha = (1 - dist / 120) * 0.15;
          this.ctx.strokeStyle = isLight
            ? `rgba(0, 102, 204, ${alpha})`
            : `rgba(0, 180, 255, ${alpha})`;
          this.ctx.stroke();
        }
      }
    }

    this.animId = requestAnimationFrame(this.animate);
  }

  setDensity(density: number) {
    this.density = density;
    cancelAnimationFrame(this.animId);
    if (this.canvas && this.ctx) this.init();
  }

  destroy() {
    cancelAnimationFrame(this.animId);
  }
}

/* ----- Formatting helpers ----- */
export function formatNumber(n: number, decimals = 2): string {
  if (Math.abs(n) >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(decimals);
}

export function statusClass(status: string): string {
  const s = status.toUpperCase();
  if (s === 'SAFE') return 'safe';
  if (s === 'WARNING') return 'warning';
  return 'fail';
}
