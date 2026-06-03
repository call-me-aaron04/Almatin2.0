/**
 * SHIELDPLAN — Main Entry Point
 * Initializes the SPA, 5-step workflow wizard, router, particle background, theme.
 */
import { router } from './lib/router.js';
import { appState } from './lib/state.js';
import { ParticleBackground, showToast } from './components/ui.js';
import {
  advanceToStep, generateReport, validateAndAdvance,
} from './workflow/steps.js';
import { getReports } from './lib/api.js';

let particleInstance: ParticleBackground | null = null;

function initParticles(density?: number) {
  if (particleInstance) particleInstance.destroy();
  particleInstance = new ParticleBackground('particle-canvas', density ?? appState.get().particleDensity);
}

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.classList.toggle('light', theme === 'light');
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'light' ? '☀️' : '🌙';
  appState.set({ theme });
}

function getPreferredTheme(): 'dark' | 'light' {
  const stored = localStorage.getItem('shieldplan-state');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.theme === 'light' || parsed.theme === 'dark') return parsed.theme;
    } catch { /* ignore */ }
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function renderDashboard() {
  const page = document.getElementById('page-dashboard');
  if (!page) return;

  const state = appState.get();
  const modIcon = state.selectedModality?.icon || '🛡️';
  const modName = state.selectedModality?.name || '—';

  page.innerHTML = `
    <h1 class="page-title">Dashboard</h1>
    <p class="page-subtitle">Overview of your shielding analysis projects</p>

    <div class="dashboard-grid">
      <div class="card stat-card holographic-card">
        <div class="stat-icon">${modIcon}</div>
        <div class="stat-value">${modName}</div>
        <div class="stat-label">Active Modality</div>
      </div>
      <div class="card stat-card holographic-card">
        <div class="stat-icon">📋</div>
        <div class="stat-value">${state.reports.length}</div>
        <div class="stat-label">Reports Generated</div>
      </div>
      <div class="card stat-card holographic-card">
        <div class="stat-icon">${state.complianceResult ? (state.complianceResult.status === 'SAFE' ? '✅' : '⚠️') : '⏳'}</div>
        <div class="stat-value">${state.complianceResult ? (state.complianceResult.complianceScore * 100).toFixed(0) + '%' : '—'}</div>
        <div class="stat-label">Latest Compliance</div>
      </div>
      <div class="card stat-card holographic-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-value">${state.selectedMachine?.model || '—'}</div>
        <div class="stat-label">Selected Machine</div>
      </div>
    </div>

    <h2 style="font-size:1.1rem;font-weight:600;margin-bottom:12px">Quick Actions</h2>
    <div class="dashboard-actions">
      <a class="action-card" href="#workflow">
        <span class="action-icon">⚡</span>
        <div>
          <div class="action-text">New Analysis</div>
          <div class="action-desc">Start a 5-step shielding workflow</div>
        </div>
      </a>
      <a class="action-card" href="#reports">
        <span class="action-icon">📋</span>
        <div>
          <div class="action-text">View Reports</div>
          <div class="action-desc">Browse generated analysis reports</div>
        </div>
      </a>
      <a class="action-card" href="#settings">
        <span class="action-icon">⚙️</span>
        <div>
          <div class="action-text">Settings</div>
          <div class="action-desc">Configure theme and preferences</div>
        </div>
      </a>
    </div>
  `;
}

/* ======== Workflow Page (5-Step Wizard) ======== */
function renderWorkflow() {
  const page = document.getElementById('page-workflow');
  if (!page) return;

  const stepNames = [
    'Modality', 'Machine & Room', 'Wall Config', 'Occupancy', 'Report',
  ];

  page.innerHTML = `
    <h1 class="page-title">Shielding Analysis Workflow</h1>
    <p class="page-subtitle">Engineering-grade radiation shielding design — 5-step workflow</p>

    <div class="workflow-container">
      <div class="step-indicators">
        ${stepNames.map((name, i) => {
          const s = i + 1;
          return `<div class="sidebar-step" data-step="${s}" onclick="window._goToStep(${s})">
            <div class="step-dot">${s}</div>
            <span class="step-label">${name}</span>
          </div>`;
        }).join('')}
      </div>

      <div class="workflow-steps">
        ${renderStep1()}
        ${renderStep2()}
        ${renderStep3()}
        ${renderStep4()}
        ${renderStep5()}
      </div>
    </div>
  `;
}

function renderStep1() {
  return `
    <div class="workflow-step active" data-step="1" id="step-1">
      <div class="step-header">
        <div class="step-number">1</div>
        <div>
          <h3>Select Imaging Modality</h3>
          <p>Choose the radiation modality — different modalities require different shielding rules</p>
        </div>
      </div>
      <div class="step-content">
        <div id="modality-grid" class="option-grid"></div>
        <div class="step-error hidden" id="step-error-1"></div>
      </div>
      <div class="step-nav">
        <button class="btn btn-primary" onclick="window._advance()">Next →</button>
      </div>
    </div>`;
}

function renderStep2() {
  return `
    <div class="workflow-step" data-step="2" id="step-2">
      <div class="step-header">
        <div class="step-number">2</div>
        <div>
          <h3>Machine &amp; Room Setup</h3>
          <p>Select manufacturer, search/choose machine (auto-loads params), facility type, and room dimensions</p>
        </div>
      </div>
      <div class="step-content">
        <h4 style="font-size:0.9rem;margin-bottom:10px;color:var(--text-secondary)">🔍 Search Machine</h4>
        <div class="search-box" style="margin-bottom:16px">
          <input class="form-input" id="search-query" type="text" placeholder="Search machines, manufacturers..." style="font-size:0.95rem;padding:12px 16px" />
          <div id="search-results" class="search-results-dropdown"></div>
        </div>

        <label style="font-size:0.85rem;color:var(--text-secondary);display:block;margin:16px 0 8px">Or browse by Manufacturer</label>
        <div id="manufacturer-grid" class="option-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))"></div>

        <label style="font-size:0.85rem;color:var(--text-secondary);display:block;margin:16px 0 8px">Machine Model</label>
        <div id="machine-grid" class="option-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
          <div class="option-card loading">Select a manufacturer first</div>
        </div>

        <div id="machine-params" class="hidden" style="margin-top:16px;padding:16px;background:var(--bg-input);border-radius:var(--radius-md)">
          <h4 style="font-size:0.9rem;margin-bottom:10px;color:var(--text-secondary)">⚙️ Auto-Loaded Machine Parameters</h4>
          <div class="param-grid" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">
            <div><span class="param-tag">kVp</span><span id="param-display-kvp">—</span></div>
            <div><span class="param-tag">mA</span><span id="param-display-ma">—</span></div>
            <div><span class="param-tag">Workload</span><span id="param-display-workload">—</span></div>
            <div><span class="param-tag">Type</span><span id="param-display-type">—</span></div>
            <div><span class="param-tag">Beam Angle</span><span id="param-display-beam-angle">—</span></div>
            <div><span class="param-tag">SF</span><span id="param-display-sf">—</span></div>
            <div><span class="param-tag">SI</span><span id="param-display-si">—</span></div>
            <div><span class="param-tag">Leakage</span><span id="param-display-leakage">—</span></div>
          </div>
        </div>

        <div style="border-top:1px solid var(--border-color);margin:20px 0 16px;padding-top:16px">
          <h4 style="font-size:0.9rem;margin-bottom:12px;color:var(--text-secondary)">🏠 Facility &amp; Room</h4>
          <div class="form-row" style="grid-template-columns:1fr 1fr;margin-bottom:12px">
            <div class="form-group">
              <label for="facility-type">Facility Type</label>
              <select class="form-select" id="facility-type">
                <option value="New">New Facility</option>
                <option value="Existing">Existing Facility</option>
                <option value="Retrofit">Retrofit Facility</option>
              </select>
            </div>
            <div class="form-group">
              <label for="room-type">Room Type</label>
              <select class="form-select" id="room-type">
                <option value="Examination">Examination Room</option>
                <option value="Treatment">Treatment Room</option>
                <option value="Control">Control Room</option>
                <option value="Storage">Storage Room</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <label style="font-size:0.85rem;color:var(--text-secondary);display:block;margin:12px 0 8px">Room Dimensions (meters)</label>
          <div class="form-row" style="grid-template-columns:repeat(3,1fr);margin-bottom:8px">
            <div class="form-group">
              <label for="room-length">Length (m)</label>
              <input class="form-input" id="room-length" type="number" step="0.5" min="1" max="20" value="7" oninput="window._validateRoom()" />
            </div>
            <div class="form-group">
              <label for="room-width">Width (m)</label>
              <input class="form-input" id="room-width" type="number" step="0.5" min="1" max="20" value="5.5" oninput="window._validateRoom()" />
            </div>
            <div class="form-group">
              <label for="room-height">Height (m)</label>
              <input class="form-input" id="room-height" type="number" step="0.5" min="1" max="10" value="3" oninput="window._validateRoom()" />
            </div>
          </div>
          <div id="room-validation" class="hidden" style="margin-bottom:12px"></div>

          <h4 style="font-size:0.9rem;margin:16px 0 4px;color:var(--text-secondary)">Adjacent Rooms per Wall</h4>
          <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:10px">For each wall direction, select what room or area is on the other side</p>
          <div id="adjacent-rooms-list" class="wall-config-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))"></div>
        </div>

        <div class="step-error hidden" id="step-error-2"></div>
      </div>
      <div class="step-nav">
        <button class="btn btn-secondary" onclick="window._goToStep(1)">← Back</button>
        <button class="btn btn-primary" onclick="window._saveAndAdvance()">Next →</button>
      </div>
    </div>`;
}

function renderStep3() {
  return `
    <div class="workflow-step" data-step="3" id="step-3">
      <div class="step-header">
        <div class="step-number">3</div>
        <div>
          <h3>Wall Configuration</h3>
          <p>Assign shielding material and thickness to each surface · Set adjacent areas and distances</p>
        </div>
      </div>
      <div class="step-content">
        <div id="wall-material-grid" class="wall-config-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))"></div>
        <div id="wall-material-detail" class="wall-config-detail hidden">
          <div class="wall-config-header">
            <h4 id="wall-material-title">Configure Material</h4>
            <button class="btn-ghost" onclick="document.getElementById('wall-material-detail').classList.add('hidden')">✕</button>
          </div>
          <div class="form-row" style="grid-template-columns:1fr 1fr">
            <div class="form-group">
              <label for="wall-material-select">Shielding Material</label>
              <select class="form-select" id="wall-material-select">
                <option value="Concrete">Concrete</option>
                <option value="Lead">Lead</option>
                <option value="Brick">Brick</option>
                <option value="Gypsum">Gypsum</option>
                <option value="Steel">Steel</option>
                <option value="Borated Polyethylene">Borated Polyethylene</option>
              </select>
            </div>
            <div class="form-group">
              <label for="wall-thickness-input">Thickness (cm)</label>
              <input class="form-input" id="wall-thickness-input" type="number" step="0.5" min="0.1" max="200" value="30" />
            </div>
          </div>
          <div class="form-row" style="grid-template-columns:1fr 1fr;margin-top:8px">
            <div class="form-group">
              <label for="wall-material-adjacent">Adjacent Area</label>
              <select class="form-select" id="wall-material-adjacent">
                <option value="Corridor">Corridor</option>
                <option value="Office">Office</option>
                <option value="Public Area">Public Area</option>
                <option value="Control Room">Control Room</option>
                <option value="Outdoor Area">Outdoor Area</option>
                <option value="Waiting Hall">Waiting Hall</option>
                <option value="Storage">Storage</option>
                <option value="Mechanical Room">Mechanical Room</option>
                <option value="Basement">Basement</option>
              </select>
            </div>
            <div class="form-group">
              <label for="wall-material-distance">Distance from Source (m)</label>
              <input class="form-input" id="wall-material-distance" type="number" step="0.1" min="0.5" max="10" value="3.5" />
            </div>
          </div>
          <button class="btn btn-primary" onclick="window._saveWallMaterial()">Apply</button>
        </div>
        <div id="room-3d-container" style="height:280px;margin-bottom:16px"></div>
        <div class="step-error hidden" id="step-error-3"></div>
      </div>
      <div class="step-nav">
        <button class="btn btn-secondary" onclick="window._goToStep(2)">← Back</button>
        <button class="btn btn-primary" onclick="window._advance()">Next →</button>
      </div>
    </div>`;
}

function renderStep4() {
  return `
    <div class="workflow-step" data-step="4" id="step-4">
      <div class="step-header">
        <div class="step-number">4</div>
        <div>
          <h3>Occupancy Configuration</h3>
          <p>Set occupancy levels per adjacent area — uses standard NCRP 147 occupancy factors</p>
        </div>
      </div>
      <div class="step-content">
        <div id="occupancy-configs"></div>
        <div class="step-error hidden" id="step-error-4"></div>
      </div>
      <div class="step-nav">
        <button class="btn btn-secondary" onclick="window._goToStep(3)">← Back</button>
        <button class="btn btn-primary" onclick="window._advance()">Next →</button>
      </div>
    </div>`;
}

function renderStep5() {
  return `
    <div class="workflow-step" data-step="5" id="step-5">
      <div class="step-header">
        <div class="step-number">5</div>
        <div>
          <h3>Engineering Report</h3>
          <p>Generate a comprehensive shielding analysis report with compliance verification, recommendations, and export options</p>
        </div>
      </div>
      <div class="step-content">
        <div style="text-align:center;margin-bottom:20px">
          <button class="btn btn-primary" id="generate-report-btn" onclick="window._generateReport()" style="font-size:1rem;padding:14px 32px">🚀 Generate Full Report</button>
        </div>
        <div id="report-status"></div>
        <div id="report-content"></div>
        <div class="step-error hidden" id="step-error-5"></div>
      </div>
      <div class="step-nav">
        <button class="btn btn-secondary" onclick="window._goToStep(4)">← Back</button>
        <button class="btn btn-secondary" onclick="window._resetWorkflow()">🔄 Start New Analysis</button>
      </div>
    </div>`;
}

/* ======== Reports Page ======== */
function renderReports() {
  const page = document.getElementById('page-reports');
  if (!page) return;

  const state = appState.get();
  const reports = state.reports;

  page.innerHTML = `
    <h1 class="page-title">Reports</h1>
    <p class="page-subtitle">View and manage your analysis reports</p>

    ${reports.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No reports yet. Complete a shielding analysis to generate your first report.</p>
        <a href="#workflow" class="btn btn-primary" style="margin-top:16px;display:inline-flex">Start Analysis</a>
      </div>
    ` : `
      <div class="reports-list">
        ${reports.map(r => `
          <div class="card holographic-card report-detailed" data-report-id="${r.id}">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
              <div class="report-header">
                <div class="report-icon">📋</div>
                <div class="report-info">
                  <h3>${r.title}</h3>
                  <div class="report-date">${new Date(r.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:10px">
                <span class="report-badge ${r.status === 'SAFE' ? 'safe' : r.status === 'WARNING' ? 'warning' : 'fail'}">${r.status}</span>
                <button class="btn-ghost report-toggle" onclick="this.closest('.report-detailed').classList.toggle('expanded')">▼</button>
              </div>
            </div>
            <div class="report-body">
              ${r.summary ? `<p style="margin-bottom:8px;font-size:0.9rem;color:var(--text-secondary)">${r.summary}</p>` : ''}
              ${r.modalityName ? `<p style="font-size:0.8rem;color:var(--text-muted)">Modality: ${r.modalityName}${r.machineModel ? ` · Machine: ${r.machineModel}` : ''}</p>` : ''}
              <p style="font-size:0.8rem;color:var(--text-muted)">Report #${r.id} · ${new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

/* ======== Settings Page ======== */
function renderSettings() {
  const page = document.getElementById('page-settings');
  if (!page) return;

  const state = appState.get();

  page.innerHTML = `
    <h1 class="page-title">Settings</h1>
    <p class="page-subtitle">Configure application preferences</p>

    <div class="card" style="max-width:560px">
      <div class="settings-section">
        <h3>Appearance</h3>
        <div class="setting-item">
          <label for="setting-theme">Dark Mode</label>
          <label class="toggle-switch">
            <input type="checkbox" id="setting-theme" ${state.theme === 'dark' ? 'checked' : ''} />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <label for="setting-particles">Particle Density</label>
          <input type="range" id="setting-particles" min="20" max="120" value="${state.particleDensity}" style="width:160px" />
        </div>
      </div>

      <div class="settings-section">
        <h3>About</h3>
        <div class="setting-item">
          <label>Version</label>
          <span style="color:var(--text-muted)">2.0.0</span>
        </div>
        <div class="setting-item">
          <label>Backend API</label>
          <span style="color:var(--text-muted)">http://localhost:8000</span>
        </div>
        <div class="setting-item">
          <label>Workflow Steps</label>
          <span style="color:var(--text-muted)">5-Step Engineering Wizard</span>
        </div>
      </div>
    </div>
  `;
}

/* ======== Page Router Handler ======== */
function handlePageChange(page: string) {
  document.querySelectorAll('.page').forEach((el) => el.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) {
    pageEl.classList.add('active');
  }

  switch (page) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'workflow':
      renderWorkflow();
      setTimeout(() => advanceToStep(1), 100);
      break;
    case 'reports':
      renderReports();
      break;
    case 'settings':
      renderSettings();
      break;
  }
}

/* ======== Bind global functions for inline handlers ======== */
(window as any)._advance = () => validateAndAdvance();
(window as any)._saveAndAdvance = () => validateAndAdvance();
(window as any)._goToStep = (step: number) => advanceToStep(step);
(window as any)._generateReport = () => {
  const btn = document.getElementById('generate-report-btn') as HTMLButtonElement;
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Analyzing...'; }
  generateReport().finally(() => {
    if (btn) { btn.disabled = false; btn.textContent = '🚀 Generate Full Report'; }
  });
};
(window as any)._resetWorkflow = () => {
  appState.resetWorkflow();
  showToast('Workflow reset. Starting fresh.', 'info');
  setTimeout(() => advanceToStep(1), 200);
};

/* ======== Initialize Settings Bindings ======== */
function initSettings() {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = appState.get().theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(`Switched to ${next} theme`, 'info', 2000);
    });
  }

  document.addEventListener('change', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'setting-theme') {
      const next = (target as HTMLInputElement).checked ? 'dark' : 'light';
      applyTheme(next);
    }
    if (target.id === 'setting-particles') {
      const density = parseInt((target as HTMLInputElement).value);
      appState.set({ particleDensity: density });
      initParticles(density);
    }
  });
}

/* ======== Init ======== */
document.addEventListener('DOMContentLoaded', () => {
  const preferred = getPreferredTheme();
  applyTheme(preferred);

  try { initParticles(); } catch (e) { console.warn('Particle init failed:', e); }

  router.onRoute(handlePageChange);
  initSettings();

  getReports().then((reports) => appState.set({ reports })).catch(() => {});

  router.handleRoute();
});
