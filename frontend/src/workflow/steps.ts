/**
 * SHIELDPLAN — 5-Step Engineering Workflow Wizard
 *
 * Step 1: Modality          — Select imaging modality
 * Step 2: Machine & Room    — Load manufacturers by modality, select machine (auto-params),
 *                             facility type (New/Existing), room dimensions
 * Step 3: Wall Config       — Walls: materials, thickness, adjacent areas
 * Step 4: Occupancy         — People × Hours → T = N × H / 168
 * Step 5: Report            — Generate full report from all inputs
 */
import { appState, RoomType } from '../lib/state.js';
import {
  getModalities, getManufacturers,
  getMachineById, searchProducts,
  runShieldingAnalysis, runLeakageAnalysis, runComplianceCheck,
  createReport, getReports,
  type Modality, type Manufacturer, type Machine,
  type ShieldingResult, type ComplianceResult,
} from '../lib/api.js';
import { showToast, formatNumber, statusClass } from '../components/ui.js';
import { Room3D } from '../components/room3d.js';
import type { WallData } from '../components/room3d.js';
import { generateFullReport } from './report-generator.js';

let currentStep = 1;
const TOTAL_STEPS = 5;

function getEl(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function showStep(step: number) {
  document.querySelectorAll('.workflow-step').forEach((el) => {
    (el as HTMLElement).style.display = parseInt(el.getAttribute('data-step') || '0') === step ? 'block' : 'none';
  });
  document.querySelectorAll('.sidebar-step').forEach((el) => {
    el.classList.toggle('active', parseInt(el.getAttribute('data-step') || '0') === step);
  });
  currentStep = step;
  appState.set({ currentWorkflowStep: step });
}

function clearStepError(step: number) {
  const err = getEl(`step-error-${step}`);
  if (err) { err.classList.add('hidden'); err.innerHTML = ''; }
}

function showStepError(step: number, msg: string) {
  const err = getEl(`step-error-${step}`);
  if (err) { err.classList.remove('hidden'); err.innerHTML = msg; }
}

/* =============================================
   STEP 1: MODALITY SELECTION
   ============================================= */
export async function loadModalities() {
  clearStepError(1);
  const grid = getEl('modality-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="option-card loading">Loading modalities...</div>';
  try {
    const modalities = await getModalities();
    if (!modalities || modalities.length === 0) throw new Error('No modalities available');
    grid.innerHTML = '';
    modalities.forEach((mod) => {
      const card = document.createElement('div');
      card.className = 'option-card';
      card.dataset.modality = mod.name;
      card.innerHTML = `<span style="font-size:1.5rem">${mod.icon || '🔦'}</span><span>${mod.name}</span><span style="font-size:0.75rem;color:var(--text-muted)">${mod.description || ''}</span>`;
      card.addEventListener('click', () => {
        document.querySelectorAll('#modality-grid .option-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        appState.set({
          selectedModality: mod, selectedManufacturer: null, selectedMachine: null,
          shieldingResult: null, leakageResult: null, complianceResult: null,
        });
        showToast(`Selected: ${mod.name}`, 'success');
      });
      grid.appendChild(card);
    });
  } catch (err: any) {
    grid.innerHTML = '<div class="option-card" style="cursor:default">⚠️ Failed to load modalities</div>';
    showStepError(1, `Could not load modalities: ${err.message}. Make sure the backend is running.`);
  }
}

/* =============================================
   STEP 2: MACHINE & ROOM
   — Load manufacturers by selected modality
   — Search & select machine (auto-loads params)
   — Facility type (New / Existing)
   — Room dimensions
   ============================================= */
let searchDebounceTimer: any = null;

export function initStep2() {
  const state = appState.get();

  // Machine search input
  const queryInput = getEl('search-query') as HTMLInputElement;
  if (queryInput) {
    queryInput.value = state.searchQuery;
    queryInput.addEventListener('input', () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => performSearch(), 300);
    });
  }

  // Facility type
  const facilitySelect = getEl('facility-type') as HTMLSelectElement;
  if (facilitySelect && state.selectedFacility) facilitySelect.value = state.selectedFacility;

  // Room type
  const roomTypeSelect = getEl('room-type') as HTMLSelectElement;
  if (roomTypeSelect) roomTypeSelect.value = state.selectedRoomType;

  // Room dimensions
  const dims = state.selectedRoomCustom;
  const lenInput = getEl('room-length') as HTMLInputElement;
  const widInput = getEl('room-width') as HTMLInputElement;
  const heiInput = getEl('room-height') as HTMLInputElement;
  if (lenInput && dims) lenInput.value = String(dims.length);
  if (widInput && dims) widInput.value = String(dims.width);
  if (heiInput && dims) heiInput.value = String(dims.height);

  loadManufacturersList();
  renderAdjacentRooms();
}

async function performSearch() {
  const query = (getEl('search-query') as HTMLInputElement)?.value || '';
  appState.set({ searchQuery: query });

  if (query.length < 2) {
    const results = getEl('search-results');
    if (results) results.innerHTML = '<div style="font-size:0.85rem;color:var(--text-muted);padding:12px">Type at least 2 characters to search</div>';
    return;
  }

  const results = getEl('search-results');
  if (!results) return;
  results.innerHTML = '<div class="option-card loading">Searching...</div>';

  try {
    const data = await searchProducts(query);
    let html = '';
    if (data.modalities.length > 0) {
      html += '<div style="font-size:0.8rem;color:var(--text-muted);margin:8px 0 4px">Modalities</div>';
      html += data.modalities.map(m => `<div class="search-result-item" onclick="window._selectModalityById(${m.id})">${m.icon || '🔦'} ${m.name}</div>`).join('');
    }
    if (data.manufacturers.length > 0) {
      html += '<div style="font-size:0.8rem;color:var(--text-muted);margin:8px 0 4px">Manufacturers</div>';
      html += data.manufacturers.map(m => `<div class="search-result-item">${m.name} (${m.modality.name})</div>`).join('');
    }
    if (data.machines.length > 0) {
      html += '<div style="font-size:0.8rem;color:var(--text-muted);margin:8px 0 4px">Machines</div>';
      html += data.machines.map(m => `
        <div class="search-result-item" onclick="window._selectMachineFromSearch(${m.id})">
          ${m.model} <span style="color:var(--text-muted)">· ${m.manufacturer.name} · ${m.type || ''}</span>
        </div>
      `).join('');
    }
    if (!html) html = '<div style="font-size:0.85rem;color:var(--text-muted);padding:12px">No results found</div>';
    results.innerHTML = html;
  } catch {
    results.innerHTML = '<div style="font-size:0.85rem;color:var(--text-muted);padding:12px">Search failed</div>';
  }
}

async function loadManufacturersList() {
  const mod = appState.get().selectedModality;
  if (!mod) return;
  const grid = getEl('manufacturer-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="option-card loading">Loading manufacturers...</div>';
  try {
    const manufacturers = await getManufacturers(mod.id);
    grid.innerHTML = '';
    manufacturers.forEach((mf) => {
      const card = document.createElement('div');
      card.className = 'option-card';
      card.innerHTML = `<span>${mf.name}</span><span style="font-size:0.75rem;color:var(--text-muted)">${mf.country || ''} · ${mf.machines.length} machines</span>`;
      card.addEventListener('click', () => {
        document.querySelectorAll('#manufacturer-grid .option-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        appState.set({ selectedManufacturer: mf, selectedMachine: null });
        loadMachines(mf.machines);
      });
      grid.appendChild(card);
    });
  } catch {
    grid.innerHTML = '<div class="option-card" style="cursor:default">⚠️ Failed to load manufacturers</div>';
  }
}

function loadMachines(machines: Machine[]) {
  const grid = getEl('machine-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (machines.length === 0) {
    grid.innerHTML = '<div class="option-card">No machines available</div>';
    return;
  }
  machines.forEach((m) => {
    const card = document.createElement('div');
    card.className = 'option-card option-card-icon';
    const specs = [m.kvp ? `${m.kvp} kVp` : '', m.ma ? `${m.ma} mA` : '', m.workload ? `${m.workload} mA-min/wk` : ''].filter(Boolean).join(' · ');
    card.innerHTML = `<span>${m.model}</span><span style="font-size:0.75rem;color:var(--text-muted)">${specs}</span>`;
    card.addEventListener('click', () => selectMachine(m, card));
    grid.appendChild(card);
  });
}

function selectMachine(machine: Machine, element?: HTMLElement) {
  if (element) {
    document.querySelectorAll('#machine-grid .option-card').forEach((c) => c.classList.remove('selected'));
    element.classList.add('selected');
  }
  appState.set({ selectedMachine: machine });

  const paramsEl = getEl('machine-params');
  if (paramsEl) paramsEl.classList.remove('hidden');

  const setText = (id: string, val: string) => { const el = getEl(id); if (el) el.textContent = val; };
  setText('param-display-kvp', machine.kvp ? `${machine.kvp} kVp` : '—');
  setText('param-display-ma', machine.ma ? `${machine.ma} mA` : '—');
  setText('param-display-workload', machine.workload ? `${machine.workload} mA-min/wk` : '—');
  setText('param-display-type', machine.type || '—');
  setText('param-display-beam-angle', machine.beamAngle ? `${machine.beamAngle}°` : '—');
  setText('param-display-sf', machine.sourceFactor ? `${machine.sourceFactor.toFixed(2)}` : '—');
  setText('param-display-si', machine.safetyIndex ? `${machine.safetyIndex.toFixed(2)}` : '—');
  setText('param-display-leakage', machine.leakageValue ? `${(machine.leakageValue * 100).toFixed(2)}%` : '—');

  // Auto-fill source input params
  const src = appState.get().sourceInput;
  appState.set({
    sourceInput: {
      ...src,
      beamAngle: machine.beamAngle ?? src.beamAngle,
      sourceFactor: machine.sourceFactor ?? src.sourceFactor,
      safetyIndex: machine.safetyIndex ?? src.safetyIndex,
      leakageRadiation: machine.leakageValue ?? src.leakageRadiation,
    },
  });

  showToast(`Selected: ${machine.model}`, 'success');
}

(window as any)._selectMachineFromSearch = async (machineId: number) => {
  try {
    const machine = await getMachineById(machineId);
    if (machine) {
      selectMachine(machine);
      showToast(`Selected: ${machine.model}`, 'success');
    } else {
      showToast('Machine not found', 'error');
    }
  } catch { /* ignore */ }
};

(window as any)._selectModalityById = (id: number) => {
  showToast('Switch to Step 1 to change modality', 'info');
};

function validateRoomInputs() {
  const l = parseFloat((getEl('room-length') as HTMLInputElement)?.value || '0');
  const w = parseFloat((getEl('room-width') as HTMLInputElement)?.value || '0');
  const h = parseFloat((getEl('room-height') as HTMLInputElement)?.value || '0');
  const validationEl = getEl('room-validation');
  if (!validationEl) return;

  const errors: string[] = [];
  if (l <= 0 || w <= 0 || h <= 0) {
    errors.push('All dimensions must be positive values.');
  }
  if (l < 1 || w < 1) {
    errors.push('Room seems too small for medical imaging (min 1m each).');
  }
  if (l > 30 || w > 30) {
    errors.push('Dimensions exceed typical room sizes (>30m).');
  }
  if (h < 2 || h > 6) {
    errors.push('Ceiling height outside typical range (2-6m).');
  }
  if (!Number.isFinite(l) || !Number.isFinite(w) || !Number.isFinite(h)) {
    errors.push('Invalid numbers — ensure values are in meters (e.g. 7.5, not 750cm).');
  }

  if (errors.length > 0) {
    validationEl.innerHTML = errors.map(e => `<div class="validation-item warning">⚠️ ${e}</div>`).join('');
    validationEl.classList.remove('hidden');
  } else {
    validationEl.classList.add('hidden');
  }
}

export function saveMachineAndRoom() {
  const mod = appState.get().selectedModality;
  if (!mod) { showStepError(2, 'Please select a modality first (go back to Step 1).'); return; }

  const machine = appState.get().selectedMachine;
  if (!machine) { showStepError(2, 'Please select a machine model.'); return; }

  const facility = (getEl('facility-type') as HTMLSelectElement)?.value || 'New';
  const roomType = (getEl('room-type') as HTMLSelectElement)?.value as RoomType || 'Examination';
  const l = parseFloat((getEl('room-length') as HTMLInputElement)?.value || '0');
  const w = parseFloat((getEl('room-width') as HTMLInputElement)?.value || '0');
  const h = parseFloat((getEl('room-height') as HTMLInputElement)?.value || '0');

  if (!l || !w || !h || l < 1 || w < 1 || h < 1) {
    showStepError(2, 'Please enter valid room dimensions (minimum 1m each, in meters).');
    return;
  }
  if (l > 30 || w > 30 || h > 6) {
    showStepError(2, 'Dimensions outside reasonable range for medical rooms.');
    return;
  }
  clearStepError(2);

  appState.set({
    selectedFacility: facility,
    selectedRoomType: roomType,
    selectedRoomCustom: { length: l, width: w, height: h },
  });

  appState.completeStep(2);
  showToast(`Machine: ${machine.model} · Room: ${l}m × ${w}m × ${h}m (${facility})`, 'success');
}

const WALL_DIRECTIONS = [
  { id: 'north', label: 'North Wall', icon: '⬆️', color: 'var(--accent)' },
  { id: 'south', label: 'South Wall', icon: '⬇️', color: 'var(--accent)' },
  { id: 'east', label: 'East Wall', icon: '➡️', color: 'var(--accent)' },
  { id: 'west', label: 'West Wall', icon: '⬅️', color: 'var(--accent)' },
  { id: 'ceiling', label: 'Ceiling', icon: '🔝', color: 'var(--warning)' },
  { id: 'floor', label: 'Floor', icon: '🔽', color: 'var(--text-muted)' },
];

const AREA_OPTIONS = [
  'Corridor', 'Office', 'Control Room', 'Public Area',
  'Waiting Hall', 'Storage', 'Mechanical Room', 'Outdoor Area', 'Basement',
];

function renderAdjacentRooms() {
  const list = getEl('adjacent-rooms-list');
  if (!list) return;
  const walls = appState.get().walls;

  list.innerHTML = WALL_DIRECTIONS.map((wd) => {
    const wall = walls.find(w => w.id === wd.id);
    const currentArea = wall?.adjacentArea || 'Corridor';
    const currentDist = wall?.distance ?? 3.5;
    return `
      <div class="wall-config-card" style="border-left:4px solid ${wd.color}">
        <div class="wall-card-header">
          <span class="wall-direction">${wd.icon} ${wd.label}</span>
          <span class="wall-status configured">✓</span>
        </div>
        <div class="wall-card-body">
          <div class="form-group" style="margin:0;margin-bottom:6px">
            <label style="font-size:0.68rem">Adjacent Area</label>
            <select class="form-select" style="font-size:0.78rem;padding:6px 8px"
                    data-wall-id="${wd.id}" onchange="window._setWallAdjacent('${wd.id}', this.value)">
              ${AREA_OPTIONS.map(opt => `
                <option value="${opt}" ${opt === currentArea ? 'selected' : ''}>${opt}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group" style="margin:0">
            <label style="font-size:0.68rem">Distance from Source (m)</label>
            <input class="form-input" type="number" step="0.1" min="0.5" max="10"
                   value="${currentDist}" style="font-size:0.78rem;padding:6px 8px"
                   onchange="window._setWallDistance('${wd.id}', this.value)" />
          </div>
        </div>
      </div>
    `;
  }).join('');
}

(window as any)._setWallAdjacent = (wallId: string, area: string) => {
  const currentWalls = appState.get().walls;
  const oldArea = currentWalls.find(w => w.id === wallId)?.adjacentArea;
  const walls = currentWalls.map(w => {
    if (w.id === wallId) return { ...w, adjacentArea: area };
    return w;
  });
  appState.set({ walls });
  // Sync adjacentRooms for backward compat
  const rooms = appState.get().adjacentRooms.filter(r => r.type !== oldArea);
  if (!rooms.some(r => r.type === area)) {
    rooms.push({ name: area, type: area });
  }
  appState.set({ adjacentRooms: rooms });
};

(window as any)._setWallDistance = (wallId: string, distance: string) => {
  const dist = parseFloat(distance);
  if (isNaN(dist) || dist <= 0) return;
  const walls = appState.get().walls.map(w => {
    if (w.id === wallId) return { ...w, distance: dist };
    return w;
  });
  appState.set({ walls });
};

(window as any)._validateRoom = () => { validateRoomInputs(); };

/* =============================================
   STEP 3: WALL CONFIGURATION
   — Materials, thickness, adjacent areas per wall
   ============================================= */
export function initStep3() {
  renderWallMaterialGrid();
  updateRoom3D();
}

function renderWallMaterialGrid() {
  const grid = getEl('wall-material-grid');
  if (!grid) return;
  const walls = appState.get().walls;

  grid.innerHTML = walls.map((w) => `
    <div class="wall-config-card" data-wall="${w.id}" onclick="window._editWallMaterial('${w.id}')" style="border-left: 4px solid ${w.surfaceType === 'ceiling' ? 'var(--warning)' : w.surfaceType === 'floor' ? 'var(--text-muted)' : 'var(--accent)'}">
      <div class="wall-card-header">
        <span class="wall-direction">${w.label}</span>
        <span class="wall-status ${w.thickness > 0 ? 'configured' : 'pending'}">${w.thickness > 0 ? '✓' : '○'}</span>
      </div>
      <div class="wall-card-body">
        <div><span class="param-tag">Material</span> ${w.material}</div>
        <div><span class="param-tag">Thickness</span> ${w.thickness} cm</div>
        <div><span class="param-tag">Adjacent</span> ${w.adjacentArea}</div>
        <div><span class="param-tag">Distance</span> ${w.distance} m</div>
      </div>
    </div>
  `).join('');
}

(window as any)._editWallMaterial = (wallId: string) => {
  const walls = appState.get().walls;
  const wall = walls.find(w => w.id === wallId);
  if (!wall) return;

  const detail = getEl('wall-material-detail');
  const title = getEl('wall-material-title');
  if (!detail || !title) return;

  title.textContent = `Configure: ${wall.label}`;
  detail.classList.remove('hidden');
  detail.dataset.wallId = wallId;

  (getEl('wall-material-select') as HTMLSelectElement).value = wall.material;
  (getEl('wall-thickness-input') as HTMLInputElement).value = String(wall.thickness);
  (getEl('wall-material-adjacent') as HTMLSelectElement).value = wall.adjacentArea;
  (getEl('wall-material-distance') as HTMLInputElement).value = String(wall.distance);
};

export function saveWallMaterial() {
  const detail = getEl('wall-material-detail');
  if (!detail || !detail.dataset.wallId) return;

  const wallId = detail.dataset.wallId;
  const material = (getEl('wall-material-select') as HTMLSelectElement).value;
  const thickness = parseFloat((getEl('wall-thickness-input') as HTMLInputElement).value || '0');
  const adjacentArea = (getEl('wall-material-adjacent') as HTMLSelectElement).value;
  const distance = parseFloat((getEl('wall-material-distance') as HTMLInputElement).value || '0');

  if (thickness <= 0) {
    showStepError(3, 'Thickness must be greater than zero.');
    return;
  }
  if (thickness > 200) {
    showStepError(3, 'Thickness seems excessive (max 200cm recommended).');
    return;
  }
  if (distance <= 0) {
    showStepError(3, 'Distance must be greater than zero.');
    return;
  }
  clearStepError(3);

  const walls = appState.get().walls.map((w) => {
    if (w.id === wallId) return { ...w, material, thickness, adjacentArea, distance };
    return w;
  });

  appState.set({ walls });
  detail.classList.add('hidden');
  renderWallMaterialGrid();
  updateRoom3D();
  showToast(`${walls.find(w => w.id === wallId)?.label} configured: ${material} ${thickness}cm`, 'success');
}

export function confirmWallMaterials() {
  const walls = appState.get().walls;
  if (walls.some(w => w.thickness <= 0)) {
    showStepError(3, 'Please configure thickness for all surfaces.');
    return;
  }
  clearStepError(3);
  appState.completeStep(3);
  showToast('Wall materials confirmed', 'success');
}

(window as any)._saveWallMaterial = () => { saveWallMaterial(); };

/* =============================================
   STEP 4: OCCUPANCY
   — Derived from adjacent areas configured in Step 2
   — Uses standard fixed occupancy factors (NCRP 147)
   ============================================= */

/** Standard occupancy factors per adjacent area type (NCRP 147) */
const OCCUPANCY_FACTORS: Record<string, number> = {
  'Control Room': 1.0,
  'Office': 0.25,
  'Corridor': 0.25,
  'Public Area': 0.25,
  'Waiting Hall': 0.125,
  'Storage': 0.0625,
  'Mechanical Room': 0.0625,
  'Outdoor Area': 0.0625,
  'Basement': 0.0625,
};

const OCCUPANCY_LEVELS = [
  { label: 'Full (T = 1.00)', value: 1.0, badge: 'HIGH' },
  { label: 'High (T = 0.50)', value: 0.5, badge: 'HIGH' },
  { label: 'Partial (T = 0.25)', value: 0.25, badge: 'MEDIUM' },
  { label: 'Occasional (T = 0.125)', value: 0.125, badge: 'LOW' },
  { label: 'Infrequent (T = 0.0625)', value: 0.0625, badge: 'LOW' },
];

/** Default people/hours per area type for report informational fields */
const DEFAULT_OCCUPANCY_INFO: Record<string, { workers: number; publicCount: number; weeklyHours: number }> = {
  'Control Room': { workers: 2, publicCount: 0, weeklyHours: 40 },
  'Office': { workers: 3, publicCount: 0, weeklyHours: 40 },
  'Corridor': { workers: 0, publicCount: 10, weeklyHours: 60 },
  'Public Area': { workers: 0, publicCount: 20, weeklyHours: 50 },
  'Waiting Hall': { workers: 0, publicCount: 15, weeklyHours: 50 },
  'Storage': { workers: 0, publicCount: 2, weeklyHours: 10 },
  'Mechanical Room': { workers: 1, publicCount: 0, weeklyHours: 10 },
  'Outdoor Area': { workers: 0, publicCount: 0, weeklyHours: 0 },
  'Basement': { workers: 0, publicCount: 0, weeklyHours: 0 },
};

function getDefaultFactor(areaType: string): number {
  return OCCUPANCY_FACTORS[areaType] ?? 0.25;
}

function getDefaultOccInfo(areaType: string) {
  return DEFAULT_OCCUPANCY_INFO[areaType] ?? { workers: 0, publicCount: 0, weeklyHours: 40 };
}

function factorBadge(factor: number): string {
  if (factor >= 0.8) return 'HIGH';
  if (factor >= 0.4) return 'MEDIUM';
  return 'LOW';
}

/** Sync the occupancyConfigs array from the current walls (for report display) */
function syncOccupancyConfigs() {
  const walls = appState.get().walls;
  const existingConfigs = appState.get().occupancyConfigs;
  const areaMap = new Map<string, { walls: string[]; factor: number }>();
  walls.forEach((w) => {
    const area = w.adjacentArea;
    if (!areaMap.has(area)) {
      areaMap.set(area, { walls: [], factor: w.occupancyFactor || getDefaultFactor(area) });
    }
    areaMap.get(area)!.walls.push(w.label);
  });

  const configs = Array.from(areaMap.entries()).map(([area, info]) => {
    const existing = existingConfigs.find(c => c.areaType === area) || getDefaultOccInfo(area);
    return {
      areaType: area,
      workers: existing.workers,
      publicCount: existing.publicCount,
      weeklyHours: existing.weeklyHours,
      daysPerWeek: 5,
      shifts: 1,
      occupancyFactor: info.factor,
      classification: (info.factor >= 0.8 ? 'HIGH' : info.factor >= 0.25 ? 'MEDIUM' : 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    };
  });

  appState.set({ occupancyConfigs: configs });
}

export function initStep4() {
  syncOccupancyConfigs();
  renderOccupancyConfigs();
}

function renderOccupancyConfigs() {
  const container = getEl('occupancy-configs');
  if (!container) return;

  const walls = appState.get().walls;
  const occConfigs = appState.get().occupancyConfigs;

  // Group walls by adjacent area
  const areaMap = new Map<string, { walls: string[]; factor: number }>();
  walls.forEach((w) => {
    const area = w.adjacentArea;
    if (!areaMap.has(area)) {
      areaMap.set(area, { walls: [], factor: w.occupancyFactor || getDefaultFactor(area) });
    }
    areaMap.get(area)!.walls.push(w.label);
  });

  // --- Wall Factor Summary Table ---
  const wallSummaryRows = walls.map(w => {
    const factor = w.occupancyFactor > 0 ? w.occupancyFactor : getDefaultFactor(w.adjacentArea);
    const badge = factorBadge(factor);
    const surfSign = w.surfaceType === 'ceiling' ? '🔝' : w.surfaceType === 'floor' ? '🔽' : '🧱';
    return `
      <tr>
        <td>${surfSign} ${w.label}</td>
        <td>${w.material}</td>
        <td>${w.thickness} cm</td>
        <td>${w.adjacentArea}</td>
        <td><strong style="color:var(--accent)">${factor.toFixed(4)}</strong></td>
        <td><span class="report-badge ${statusClass(badge === 'HIGH' ? 'FAIL' : badge === 'MEDIUM' ? 'WARNING' : 'SAFE')}" style="font-size:0.65rem">${badge}</span></td>
      </tr>
    `;
  }).join('');

  const summaryHtml = `
    <div class="card" style="margin-bottom:20px;padding:16px 20px">
      <h4 style="font-size:0.9rem;font-weight:600;margin-bottom:10px;color:var(--text-secondary)">📋 Wall Occupancy Factor Summary</h4>
      <div style="overflow-x:auto">
        <table class="report-table" style="font-size:0.75rem;margin-bottom:0">
          <thead>
            <tr>
              <th>Surface</th>
              <th>Material</th>
              <th>Thickness</th>
              <th>Adjacent Area</th>
              <th>Occupancy Factor (T)</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>${wallSummaryRows}</tbody>
        </table>
      </div>
    </div>
  `;

  // --- Occupancy Cards ---
  const cardsHtml = Array.from(areaMap.entries()).map(([area, info]) => {
    const factor = info.factor;
    const badge = factorBadge(factor);
    const wallList = info.walls.join(', ');
    // Find matching occupancy config for persisted values
    const occCfg = occConfigs.find(c => c.areaType === area) || getDefaultOccInfo(area);
    return `
      <div class="occupancy-card" data-area="${area}">
        <div class="occupancy-header">
          <div>
            <h4>${area}</h4>
            <span style="font-size:0.75rem;color:var(--text-muted)">Walls: ${wallList}</span>
          </div>
          <span class="report-badge ${statusClass(badge === 'HIGH' ? 'FAIL' : badge === 'MEDIUM' ? 'WARNING' : 'SAFE')}">${badge}</span>
        </div>
        <div class="form-row" style="grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div class="form-group">
            <label style="font-size:0.75rem">Occupancy Level</label>
            <select class="form-select occ-level-select" data-area="${area}" style="font-size:0.8rem;padding:6px 8px">
              ${OCCUPANCY_LEVELS.map(lvl => `
                <option value="${lvl.value}" ${Math.abs(lvl.value - factor) < 0.001 ? 'selected' : ''}>${lvl.label}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group" style="display:flex;align-items:flex-end;padding-bottom:4px">
            <span style="font-size:1.1rem;font-weight:700;color:var(--accent)">T = ${factor.toFixed(4)}</span>
          </div>
        </div>
        <div class="form-row" style="grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid var(--border-color)">
          <div class="form-group">
            <label style="font-size:0.68rem">Workers (N)</label>
            <input class="form-input occ-info-input" type="number" data-area="${area}" data-field="workers"
                   value="${occCfg.workers}" min="0" style="font-size:0.78rem;padding:6px 8px" />
          </div>
          <div class="form-group">
            <label style="font-size:0.68rem">Public</label>
            <input class="form-input occ-info-input" type="number" data-area="${area}" data-field="publicCount"
                   value="${occCfg.publicCount}" min="0" style="font-size:0.78rem;padding:6px 8px" />
          </div>
          <div class="form-group">
            <label style="font-size:0.68rem">Hours/Week (H)</label>
            <input class="form-input occ-info-input" type="number" data-area="${area}" data-field="weeklyHours"
                   value="${occCfg.weeklyHours}" min="0" max="168" style="font-size:0.78rem;padding:6px 8px" />
          </div>
        </div>
        <div style="margin-top:6px;padding:8px 10px;background:var(--bg-card);border-radius:var(--radius-sm);font-size:0.78rem;color:var(--text-muted)">
          Report info: T = ${occCfg.workers + occCfg.publicCount} × ${occCfg.weeklyHours} / 168
        </div>
      </div>
    `;
  }).join('');

  // If no walls configured (shouldn't happen), show a message
  if (areaMap.size === 0) {
    container.innerHTML = '<div class="empty-state"><p>No adjacent areas configured. Please complete Step 2 first.</p></div>';
  } else {
    container.innerHTML = summaryHtml + cardsHtml;
  }

  // Bind level selectors
  container.querySelectorAll('.occ-level-select').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      const select = e.target as HTMLSelectElement;
      const area = select.dataset.area || '';
      const factor = parseFloat(select.value);
      // Update the occupancyFactor on all walls with this adjacent area
      const walls = appState.get().walls.map(w => {
        if (w.adjacentArea === area) return { ...w, occupancyFactor: factor };
        return w;
      });
      appState.set({ walls });
      syncOccupancyConfigs();
      renderOccupancyConfigs();
    });
  });

  // Bind info input changes
  container.querySelectorAll('.occ-info-input').forEach((input) => {
    input.addEventListener('change', (e) => {
      const el = e.target as HTMLInputElement;
      const area = el.dataset.area || '';
      const field = el.dataset.field || '';
      const value = parseInt(el.value) || 0;
      const configs = [...appState.get().occupancyConfigs];
      const idx = configs.findIndex(c => c.areaType === area);
      if (idx >= 0 && field in configs[idx]) {
        (configs[idx] as any)[field] = value;
        appState.set({ occupancyConfigs: configs });
        renderOccupancyConfigs();
      }
    });
  });
}

export function confirmOccupancy() {
  // Ensure all walls have their occupancyFactor synced (immutable)
  const walls = appState.get().walls.map(w => ({
    ...w,
    occupancyFactor: w.occupancyFactor > 0 ? w.occupancyFactor : getDefaultFactor(w.adjacentArea),
  }));
  appState.set({ walls });
  appState.completeStep(4);
  showToast('Occupancy configured — ready for report', 'success');
}

/* =============================================
   STEP 5: GENERATE REPORT
   ============================================= */
export async function generateReport() {
  clearStepError(5);
  const state = appState.get();
  const mod = state.selectedModality;
  const machine = state.selectedMachine;
  const room = state.selectedRoomCustom;
  const walls = state.walls;
  const src = state.sourceInput;

  if (!mod) { showStepError(5, 'Missing modality data.'); return; }
  if (!machine) { showStepError(5, 'Missing machine data.'); return; }
  if (!room) { showStepError(5, 'Missing room dimensions.'); return; }

  const statusEl = getEl('report-status');
  if (statusEl) statusEl.innerHTML = '<div class="option-card loading" style="min-width:200px">Running engineering analysis...</div>';

  const kvp = machine.kvp || 100;
  const ma = machine.ma || 500;
  const workload = machine.workload || 40;
  const useFactor = 0.5;

  try {
    // 1. Shielding Analysis
    const shieldingInput = {
      modality: mod.name,
      kvp, ma, workload,
      roomLength: room.length,
      roomWidth: room.width,
      roomHeight: room.height,
      walls: walls.map(w => ({
        id: w.id,
        label: w.label,
        material: w.material,
        thickness: w.thickness,
        distance: w.distance,
        adjacentArea: w.adjacentArea,
        occupancyFactor: w.occupancyFactor,
        surfaceType: w.surfaceType,
      })),
      useFactor,
      sourceInput: {
        sourceLocation: src.sourceLocation,
        sourceToPatientDist: src.sourceToPatientDist,
        beamAngle: src.beamAngle,
        sourceFactor: src.sourceFactor,
        safetyIndex: src.safetyIndex,
        leakageRadiation: src.leakageRadiation,
      },
    };

    const shielding = await runShieldingAnalysis(shieldingInput);

    // 2. Leakage
    const leakageInput = {
      modality: mod.name,
      kvp, workload,
      roomLength: room.length,
      roomWidth: room.width,
      walls: walls.map(w => ({ id: w.id, material: w.material, thickness: w.thickness, distance: w.distance })),
    };
    const leakage = await runLeakageAnalysis(leakageInput);

    // 3. Compliance
    const compliance = await runComplianceCheck({
      modality: mod.name,
      doseAtWall: shielding.result.doseAtWall,
      annualDose: shielding.result.annualDose,
      wallResults: shielding.result.wallDetails.map(w => ({ wall: w.wall, annualDose: w.annualDose, isSafe: w.isSafe })),
    });

    appState.set({
      shieldingResult: shielding.result,
      leakageResult: leakage.result,
      complianceResult: compliance.result,
      validationErrors: shielding.validation || [],
      recommendations: shielding.recommendations || [],
    });

    renderReport(shielding.result, leakage.result, compliance.result, shielding.validation || []);

    // Auto-save report
    try {
      const recs = compliance.result.recommendations || [];
      await createReport({
        title: `${mod.name} Shielding — ${state.selectedFacility || 'New'} · ${machine.model}`,
        summary: `${shielding.result.wallDetails.filter((w: any) => w.isSafe).length}/${walls.length} walls safe · Annual dose: ${shielding.result.annualDose.toFixed(3)} mSv/yr · ${compliance.result.status}`,
        status: compliance.result.status,
        reportData: JSON.stringify({ shielding: shielding.result, leakage: leakage.result, compliance: compliance.result }),
        recommendations: JSON.stringify(recs),
        errorLogs: JSON.stringify(shielding.validation || []),
        modalityName: mod.name,
        roomType: state.selectedRoomType,
        facilityType: state.selectedFacility || '',
        machineModel: machine.model,
      });
      const updated = await getReports().catch(() => []);
      appState.set({ reports: updated });
    } catch { /* report saving optional */ }

    if (statusEl) statusEl.innerHTML = '';
    showToast('Report generated successfully!', compliance.result.status === 'SAFE' ? 'success' : 'warning');
    appState.completeStep(5);

  } catch (err: any) {
    if (statusEl) statusEl.innerHTML = `<div class="step-error">Analysis failed: ${err.message}</div>`;
    showStepError(5, `Analysis failed: ${err.message}. Ensure the backend is running.`);
  }
}

function renderReport(shielding: ShieldingResult, leakage: any, compliance: ComplianceResult, validation: any[]) {
  const container = getEl('report-content');
  if (!container) return;

  const fullReportHtml = generateFullReport(shielding, leakage, compliance, validation);

  container.innerHTML = `
    ${fullReportHtml}

    <!-- Export Buttons -->
    <div style="margin-top:24px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
      <button class="btn btn-primary" onclick="window._printReport()">🖨️ Print Report</button>
      <button class="btn btn-secondary" onclick="window._exportAsText()">📄 Export Text</button>
      <button class="btn btn-secondary" onclick="window._exportAsMarkdown()">📝 Export Markdown</button>
      <button class="btn btn-secondary" onclick="window._exportAsJson()">📊 Export JSON</button>
    </div>
  `;
}

function machineParams(): string {
  const m = appState.get().selectedMachine;
  if (!m) return '—';
  return [
    m.kvp ? `${m.kvp} kVp` : '',
    m.ma ? `${m.ma} mA` : '',
    m.workload ? `${m.workload} mA-min/wk` : '',
    m.beamAngle ? `Beam ${m.beamAngle}°` : '',
    m.sourceFactor ? `SF ${m.sourceFactor}` : '',
    m.safetyIndex ? `SI ${m.safetyIndex}` : '',
    m.leakageValue ? `Leak ${(m.leakageValue * 100).toFixed(1)}%` : '',
  ].filter(Boolean).join(' · ');
}

(window as any)._printReport = () => {
  const printContent = document.querySelector('.report-print-area');
  if (printContent) {
    window.print();
  }
};

(window as any)._exportAsText = () => {
  const el = document.querySelector('.report-print-area');
  if (!el) return;
  const text = el.textContent || '';
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shieldplan-report.txt';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Text report downloaded', 'success');
};

(window as any)._exportAsMarkdown = () => {
  const el = document.querySelector('.report-print-area');
  if (!el) return;
  const html = el.innerHTML || '';
  // Simple HTML-to-Markdown conversion
  const md = html
    .replace(/<h2[^>]*>/gi, '## ')
    .replace(/<h4[^>]*>/gi, '### ')
    .replace(/<\/h[24]>/gi, '\n\n')
    .replace(/<table[^>]*>/gi, '\n')
    .replace(/<tr[^>]*>/gi, '')
    .replace(/<th[^>]*>/gi, '| ')
    .replace(/<td[^>]*>/gi, '| ')
    .replace(/<\/tr>/gi, '|\n')
    .replace(/<\/table>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  const blob = new Blob(['# SHIELDPLAN Report\n\n' + md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shieldplan-report.md';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Markdown report downloaded', 'success');
};

(window as any)._exportAsJson = () => {
  const state = appState.get();
  const data = {
    project: {
      modality: state.selectedModality?.name,
      manufacturer: state.selectedManufacturer?.name,
      machine: state.selectedMachine?.model,
      facility: state.selectedFacility,
      roomType: state.selectedRoomType,
    },
    room: state.selectedRoomCustom,
    walls: state.walls,
    occupancy: state.occupancyConfigs,
    source: state.sourceInput,
    shielding: state.shieldingResult,
    leakage: state.leakageResult,
    compliance: state.complianceResult,
    generatedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shieldplan-report.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('JSON report downloaded', 'success');
};

/* =============================================
   STEP NAVIGATION
   ============================================= */
export async function advanceToStep(step: number) {
  if (step < 1 || step > TOTAL_STEPS) return;
  showStep(step);

  switch (step) {
    case 1:
      await loadModalities();
      break;
    case 2:
      initStep2();
      break;
    case 3:
      initStep3();
      break;
    case 4:
      initStep4();
      break;
    case 5:
      // Report step — show last generated or guide to generate
      const state = appState.get();
      if (state.shieldingResult && state.complianceResult) {
        renderReport(state.shieldingResult, state.leakageResult, state.complianceResult, state.validationErrors || []);
      } else {
        const container = getEl('report-content');
        if (container) container.innerHTML = '<div class="empty-state"><p>Click "Generate Report" to run the full analysis.</p></div>';
      }
      break;
  }
}

export function validateAndAdvance() {
  clearStepError(currentStep);
  const state = appState.get();

  switch (currentStep) {
    case 1:
      if (!state.selectedModality) { showStepError(1, 'Please select a modality.'); return; }
      appState.completeStep(1);
      break;
    case 2:
      saveMachineAndRoom();
      if (!state.selectedRoomCustom) return;
      break;
    case 3:
      confirmWallMaterials();
      if (state.walls.some(w => w.thickness <= 0)) return;
      break;
    case 4:
      confirmOccupancy();
      break;
    case 5:
      return; // Report step — no advancing
  }

  advanceToStep(currentStep + 1);
}

/* =============================================
   3D ROOM VISUALIZATION
   ============================================= */
let room3d: Room3D | null = null;

function updateRoom3D() {
  const state = appState.get();
  const walls: WallData[] = state.walls.map(w => ({
    id: w.id,
    label: w.label.replace(' Wall', '').replace('Ceiling', 'Ceil').replace('Floor', 'Flr'),
    material: w.material,
    thickness: w.thickness,
    distance: w.distance,
    adjacentArea: w.adjacentArea,
    occupancyFactor: w.occupancyFactor,
  }));
  const dims = state.selectedRoomCustom || { length: 7, width: 5.5, height: 3 };

  const container = document.getElementById('room-3d-container');
  if (!container) return;

  if (room3d) {
    room3d.destroy();
    room3d = null;
  }

  try {
    room3d = new Room3D('room-3d-container');
    room3d.update(walls, dims);
  } catch (err) {
    console.warn('3D room visualization unavailable:', err);
  }
}
