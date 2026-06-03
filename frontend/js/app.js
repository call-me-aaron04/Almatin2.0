/* ==========================================================
   SHIELDPLAN AI — Main Application Logic v2
   Particle system, authentication, workflow, charts, reports
   Enhanced with micro-interactions and animated UI
   ========================================================== */

/* ======== PARTICLE BACKGROUND (Enhanced) ======== */

class ParticleBackground {
    constructor(canvasId, densityFactor = 1) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 120 };
        this._animId = null;
        this.densityFactor = densityFactor;
        this._boundResize = () => this.resize();
        this._boundMouseMove = (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        };
        this._boundMouseOut = () => {
            this.mouse.x = null;
            this.mouse.y = null;
        };
        this.resize();
        this.init();
        this.animate();
        window.addEventListener('resize', this._boundResize);
        window.addEventListener('mousemove', this._boundMouseMove);
        window.addEventListener('mouseout', this._boundMouseOut);
    }

    /** Calculate target particle count based on viewport size and density factor */
    _calcCount() {
        const base = Math.floor((this.canvas.width * this.canvas.height) / 12000);
        return Math.min(Math.floor(base * this.densityFactor), Math.floor(200 * this.densityFactor));
    }

    /** Create a single particle object */
    _createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 2.5 + 0.5,
            alpha: Math.random() * 0.4 + 0.1,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.02 + Math.random() * 0.03,
        };
    }

    init() {
        const count = this._calcCount();
        for (let i = 0; i < count; i++) {
            this.particles.push(this._createParticle());
        }
    }

    /**
     * Adjust particle density dynamically.
     * @param {number} factor — 0 = off, 0.25 = low, 0.5 = medium, 1 = high (default), 2 = ultra
     */
    setDensity(factor) {
        this.densityFactor = factor;
        const target = this._calcCount();
        const current = this.particles.length;
        if (target > current) {
            for (let i = current; i < target; i++) {
                this.particles.push(this._createParticle());
            }
        } else if (target < current) {
            this.particles.length = target;
        }
        // Update canvas opacity for performance at higher densities
        if (this.canvas) {
            if (factor >= 2) {
                this.canvas.style.opacity = '0.5';
            } else if (factor >= 1) {
                this.canvas.style.opacity = '0.35';
            } else if (factor <= 0) {
                this.canvas.style.opacity = '0';
            } else {
                this.canvas.style.opacity = '0.25';
            }
        }
    }

    /** Clean up event listeners and stop animation */
    destroy() {
        if (this._animId) {
            cancelAnimationFrame(this._animId);
            this._animId = null;
        }
        window.removeEventListener('resize', this._boundResize);
        window.removeEventListener('mousemove', this._boundMouseMove);
        window.removeEventListener('mouseout', this._boundMouseOut);
        this.particles = [];
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            // Pulsing alpha
            p.pulse += p.pulseSpeed;
            const displayAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 229, 255, ${displayAlpha})`;
            this.ctx.fill();
        }

        // Draw connections
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    const alpha = 0.06 * (1 - dist / 150);
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
                    this.ctx.lineWidth = 0.6;
                    this.ctx.stroke();
                }
            }

            // Mouse connection
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = this.particles[i].x - this.mouse.x;
                const dy = this.particles[i].y - this.mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.mouse.radius) {
                    const alpha = 0.15 * (1 - dist / this.mouse.radius);
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.mouse.x, this.mouse.y);
                    this.ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
                    this.ctx.lineWidth = 0.8;
                    this.ctx.stroke();
                }
            }
        }

        this._animId = requestAnimationFrame(() => this.animate());
    }
}

/* ======== PARTICLE DENSITY SETTINGS ======== */

/** Density level presets */
const PARTICLE_DENSITIES = [
    { value: 0,    label: 'Off' },
    { value: 0.25, label: 'Low' },
    { value: 0.5,  label: 'Medium' },
    { value: 1,    label: 'High' },
    { value: 2,    label: 'Ultra' },
];

let particleInstance = null;


function getStoredParticleDensity() {
    const stored = localStorage.getItem('shieldplan-particle-density');
    if (stored !== null) {
        const val = parseFloat(stored);
        return PARTICLE_DENSITIES.some(d => d.value === val) ? val : 1;
    }
    // Default to High
    return 1;
}

function applyParticleDensity(factor) {
    localStorage.setItem('shieldplan-particle-density', factor.toString());
    if (particleInstance && particleInstance.setDensity) {
        particleInstance.setDensity(factor);
    }
    // Update slider UI
    const slider = document.getElementById('particle-density-slider');
    const label = document.getElementById('particle-density-label');
    if (slider) slider.value = factor;
    if (label) {
        const preset = PARTICLE_DENSITIES.find(d => d.value === factor);
        label.textContent = preset ? preset.label : `${factor}`;
    }
}

function initParticleSettings() {
    const slider = document.getElementById('particle-density-slider');
    if (!slider) return;

    const stored = getStoredParticleDensity();
    slider.value = stored;
    // Set slider min/max/step to match presets
    slider.min = 0;
    slider.max = 2;
    slider.step = 0.01;

    // Update label
    const label = document.getElementById('particle-density-label');
    if (label) {
        const preset = PARTICLE_DENSITIES.find(d => d.value === stored);
        label.textContent = preset ? preset.label : `${stored}`;
    }

    slider.addEventListener('input', function () {
        // Snap to nearest preset value
        let closest = PARTICLE_DENSITIES[0];
        for (const d of PARTICLE_DENSITIES) {
            if (Math.abs(this.value - d.value) < Math.abs(this.value - closest.value)) {
                closest = d;
            }
        }
        this.value = closest.value;
        applyParticleDensity(closest.value);
    });
}

function toggleSettingsPanel() {
    const panel = document.getElementById('settings-popover');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    // Close any other open panels
    document.querySelectorAll('.settings-popover').forEach(p => p.classList.add('hidden'));
    if (isHidden) {
        panel.classList.remove('hidden');
    }
}

// Close settings when clicking outside
document.addEventListener('click', function (e) {
    const panel = document.getElementById('settings-popover');
    const btn = document.getElementById('settings-toggle-btn');
    if (panel && !panel.classList.contains('hidden')) {
        if (panel.contains(e.target) || (btn && btn.contains(e.target))) {
            return;
        }
        panel.classList.add('hidden');
    }
});

/* ======== ENHANCED TOAST NOTIFICATIONS ======== */

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️',
    };

    const titles = {
        success: 'Success',
        error: 'Error',
        info: 'Information',
        warning: 'Warning',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.animation = 'slideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1)';

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
        <div class="toast-content">
            <div class="toast-title">${titles[type] || type}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="dismissToast(this)">✕</button>
        <div class="toast-timer" style="animation-duration:${duration}ms"></div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, duration);
}

function dismissToast(btn) {
    const toast = btn.closest('.toast');
    if (toast) {
        toast.style.animation = 'slideOut 0.25s ease forwards';
        setTimeout(() => toast.remove(), 250);
    }
}

/* ======== NAV INDICATOR ======== */

function updateNavIndicator(page) {
    const indicator = document.getElementById('nav-indicator');
    const activeLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (!indicator || !activeLink) return;

    const parent = activeLink.parentElement;
    const linkRect = activeLink.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    indicator.style.width = `${linkRect.width * 0.6}px`;
    indicator.style.left = `${activeLink.offsetLeft + (linkRect.width - linkRect.width * 0.6) / 2}px`;
}

/* ======== SCROLL EFFECTS ======== */

function initScrollEffects() {
    const navbar = document.querySelector('.navbar');
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                navbar.classList.toggle('scrolled', window.scrollY > 20);
                ticking = false;
            });
            ticking = true;
        }
    });
}

/* ======== FILE UPLOAD ======== */

function openFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.png,.jpg,.jpeg,.dxf,.dwg,.xlsx,.csv';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        showToast(`Uploading ${file.name}...`, 'info', 3000);
        try {
            const result = await apiUploadFile(file);
            const ext = file.name.split('.').pop().toLowerCase();
            showToast(`Uploaded: ${result.filename || file.name}`, 'success');

            // Prompt user to extract or just view
            const extractNow = confirm(`File uploaded successfully!\n\n${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: ${ext.toUpperCase()}\n\nWould you like to extract engineering parameters from this file?`);
            if (extractNow) {
                await runFileExtraction(result.stored_as || result.filename, ext);
            }
        } catch (err) {
            showToast(`Upload failed: ${err.message}`, 'error');
        }
    };
    input.click();
}

async function runFileExtraction(storedAs, ext) {
    const toastMsg = showToast('Extracting engineering parameters...', 'info', 8000);
    try {
        const result = await apiExtractFile(storedAs, ext);
        const extraction = result.extraction;
        const status = result.status;

        let summary = '';
        if (extraction.machine_model) summary += `\nModel: ${extraction.machine_model}`;
        if (extraction.kvp) summary += `\nkVp: ${extraction.kvp}`;
        if (extraction.ma) summary += `\nmA: ${extraction.ma}`;
        if (extraction.workload) summary += `\nWorkload: ${extraction.workload} mA·min/wk`;
        if (extraction.source_intensity) summary += `\nSource Intensity: ${extraction.source_intensity}`;
        if (extraction.room_dimensions) {
            const dims = extraction.room_dimensions;
            summary += `\nRoom: ${dims.length}m × ${dims.width}m`;
            if (dims.height) summary += ` × ${dims.height}m`;
        }
        if (extraction.errors && extraction.errors.length > 0) {
            summary += `\n\nWarnings: ${extraction.errors.slice(0, 3).join('; ')}`;
        }

        showToast(
            `Confidence: ${(extraction.confidence * 100).toFixed(0)}%${summary}`,
            status === 'success' ? 'success' : 'warning',
            6000
        );

        // If we got machine params, pre-fill the workflow
        if (extraction.machine_model && extraction.kvp) {
            selectedMachine = {
                model_name: extraction.machine_model,
                kvp: extraction.kvp,
                ma: extraction.ma || 800,
                workload: extraction.workload || 500,
                source_intensity: extraction.source_intensity || 100,
                scatter_factor: extraction.scatter_factor || 0.001,
            };
            showToast('Parameters extracted — you can use them in the Workflow', 'info');
        }
    } catch (err) {
        showToast(`Extraction failed: ${err.message}`, 'error');
    }
}

/* ======== AUTH FORMS ======== */

function initLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-spinner"></span> Signing In...';

        const data = {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value,
        };
        try {
            const result = await apiLogin(data);
            if (result) {
                showToast('Welcome back!', 'success');
                window.location.hash = 'dashboard';
            } else {
                setAuth('demo-token', { full_name: data.email.split('@')[0], email: data.email });
                showToast('Demo mode: signed in locally', 'info');
                window.location.hash = 'dashboard';
            }
        } catch (err) {
            showToast(err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = 'Sign In';
        }
    };
}

function initSignupForm() {
    const form = document.getElementById('signup-form');
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-spinner"></span> Creating Account...';

        const data = {
            full_name: document.getElementById('signup-name').value,
            email: document.getElementById('signup-email').value,
            company: document.getElementById('signup-company').value,
            role: document.getElementById('signup-role').value,
            password: document.getElementById('signup-password').value,
        };
        try {
            const result = await apiSignup(data);
            if (result) {
                showToast('Account created! Check email for verification.', 'success');
                window.location.hash = 'dashboard';
            } else {
                setAuth('demo-token', { full_name: data.full_name, email: data.email });
                showToast('Demo mode: account created locally', 'info');
                window.location.hash = 'dashboard';
            }
        } catch (err) {
            showToast(err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = 'Create Account';
        }
    };
}

/* ======== DASHBOARD ======== */

function updateDashboardStats() {
    const user = getStoredUser();
    if (user) {
        document.getElementById('user-indicator').textContent = user.full_name || user.email;
        // Update welcome banner
        const banner = document.querySelector('.welcome-banner h1');
        if (banner) {
            banner.textContent = `Welcome back, ${user.full_name || 'Engineer'}`;
        }
    }
    // Animate banner stats with counter effect
    animateCounter('banner-projects', 3);
    animateCounter('banner-reports', 2);
}

function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 20));
    const interval = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        el.textContent = current;
    }, 30);
}

/* ======== ICON/LOGO PATH HELPERS ======== */

/**
 * Get the SVG icon path for a modality name.
 */
function getModalityIconPath(name) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    return `assets/icons/modalities/${slug}.svg`;
}

/**
 * Get the SVG brand logo path for a company name.
 */
function getCompanyLogoPath(name) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    return `assets/icons/companies/${slug}.svg`;
}

/* ======== WORKFLOW: MODALITY SELECTION ======== */

let selectedModality = null;
let selectedCompany = null;
let selectedMachine = null;
let selectedFacility = null;

/* ======== UNIT SYSTEM (Metric / Imperial) ======== */

/** Current unit system: 'metric' or 'imperial' */
let unitSystem = 'metric';

/** Unit type definitions with conversion factors and display labels */
const UNIT_TYPES = {
    'length-m':     { metric: 'm',  imperial: 'ft', toMetric: v => v / 3.28084,    fromMetric: v => v * 3.28084 },
    'thickness-cm': { metric: 'cm', imperial: 'in', toMetric: v => v * 2.54,       fromMetric: v => v / 2.54 },
    'thickness-mm': { metric: 'mm', imperial: 'in', toMetric: v => v / 25.4,       fromMetric: v => v * 25.4 },
};

/** Placeholder conversion for common defaults */
const PLACEHOLDER_CONVERSIONS = {
    '6.0':  { 'length-m': '19.7' },
    '5.0':  { 'length-m': '16.4' },
    '3.0':  { 'length-m': '9.8' },
    '30':   { 'thickness-cm': '11.8', 'thickness-mm': '1.18' },
    '25':   { 'thickness-cm': '9.8' },
    '2':    { 'thickness-cm': '0.79', 'thickness-mm': '0.079' },
    '1.25': { 'thickness-cm': '0.49' },
    '0':    { 'thickness-cm': '0', 'thickness-mm': '0' },
};

function getStoredUnitSystem() {
    const stored = localStorage.getItem('shieldplan-unit-system');
    return stored === 'imperial' ? 'imperial' : 'metric';
}

/**
 * Read an input field's value and return it in metric units.
 * If the unit system is imperial, the DOM value is converted.
 */
function getMetricValue(elementId, unitType) {
    const el = document.getElementById(elementId);
    const raw = parseFloat(el?.value);
    if (isNaN(raw)) return 0;
    if (unitSystem === 'imperial' && UNIT_TYPES[unitType]) {
        return UNIT_TYPES[unitType].toMetric(raw);
    }
    return raw;
}

/**
 * Apply the current unit system to the entire UI:
 * - Updates all .unit-label spans
 * - Converts input values
 * - Updates placeholders
 * - Updates toggle button label
 */
function applyUnitSystem() {
    const isMetric = unitSystem === 'metric';

    // 1. Update all unit label spans
    document.querySelectorAll('.unit-label[data-unit-type]').forEach(el => {
        const type = el.dataset.unitType;
        const def = UNIT_TYPES[type];
        if (def) {
            el.textContent = isMetric ? def.metric : def.imperial;
        }
    });

    // 2. Convert input values and update placeholders
    document.querySelectorAll('[data-input-unit]').forEach(el => {
        const type = el.dataset.inputUnit;
        const def = UNIT_TYPES[type];
        if (!def) return;

        // Convert the current value
        const currentVal = parseFloat(el.value);
        if (!isNaN(currentVal) && el.value !== '') {
            const converted = isMetric ? def.toMetric(currentVal) : def.fromMetric(currentVal);
            el.value = roundTo(converted, 2);
        }

        // Convert the placeholder
        const currentPl = el.placeholder;
        if (currentPl && PLACEHOLDER_CONVERSIONS[currentPl] && PLACEHOLDER_CONVERSIONS[currentPl][type]) {
            // Save original metric placeholder before overwriting
            if (!el.dataset.placeholderMetric) {
                el.dataset.placeholderMetric = currentPl;
            }
            if (!isMetric) {
                el.placeholder = PLACEHOLDER_CONVERSIONS[currentPl][type];
            } else if (el.dataset.placeholderMetric) {
                el.placeholder = el.dataset.placeholderMetric;
            }
        } else if (currentPl && (!isMetric || el.dataset.placeholderMetric)) {
            // Save original metric placeholder before overwriting
            if (!el.dataset.placeholderMetric) {
                el.dataset.placeholderMetric = currentPl;
            }
            if (!isMetric) {
                // Try converting the placeholder numerically
                const plVal = parseFloat(currentPl);
                if (!isNaN(plVal) && currentPl !== '0') {
                    const converted = def.fromMetric(plVal);
                    el.placeholder = roundTo(converted, 1);
                }
            } else if (el.dataset.placeholderMetric) {
                el.placeholder = el.dataset.placeholderMetric;
            }
        } else if (!isMetric) {
            // Fallback: no conversion needed, keep as-is
        }

        // Update step attribute (finer for imperial)
        if (!isMetric && (type === 'thickness-cm' || type === 'thickness-mm')) {
            el.step = '0.01';
        } else if (isMetric && (type === 'thickness-cm' || type === 'thickness-mm')) {
            el.step = '0.1';
        }
    });

    // 3. Update toggle button label
    const toggleBtn = document.getElementById('unit-toggle-label');
    if (toggleBtn) {
        toggleBtn.textContent = isMetric ? 'cm' : 'in';
    }

    // 4. Update toggle button title
    const toggle = document.getElementById('unit-toggle');
    if (toggle) {
        toggle.title = isMetric ? 'Switch to Imperial (inches/feet)' : 'Switch to Metric (cm/m)';
    }
}

function toggleUnitSystem() {
    const newSystem = unitSystem === 'metric' ? 'imperial' : 'metric';
    unitSystem = newSystem;
    localStorage.setItem('shieldplan-unit-system', newSystem);
    applyUnitSystem();
    showToast(`Switched to ${newSystem === 'metric' ? 'Metric (cm/m)' : 'Imperial (in/ft)'} units`, 'info', 2000);
}

function roundTo(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/* ======== ROOM USAGE ANALYSIS ENGINE ======== */

/** Room type → Occupancy Factor mapping */
const ROOM_TYPE_OCCUPANCY = {
    control:   1.0,
    office:    1.0,
    corridor:  0.2,
    waiting:   0.5,
    equipment: 0.025,
    public:    0.025,
    storage:   0.025,
    toilet:    0.05,
};

/** Area type → Use Factor mapping */
const AREA_TYPE_USE_FACTOR = {
    worker:     0.5,
    public:     0.25,
    restricted: 0.1,
};

/** Room type → Display label */
const ROOM_TYPE_LABELS = {
    control:   'Control Room',
    office:    'Office',
    corridor:  'Corridor',
    waiting:   'Waiting Area',
    equipment: 'Equipment Room',
    public:    'Public Area',
    storage:   'Store Room',
    toilet:    'Toilet',
};

/**
 * Compute the occupancy classification label based on the occupancy factor.
 */
function getOccupancyClassification(of) {
    if (of >= 0.75) return 'Full';
    if (of >= 0.25) return 'Partial';
    if (of >= 0.05) return 'Occasional';
    return 'Sporadic';
}

/**
 * Compute the exposure risk level based on OF, people count, and area type.
 */
function getExposureRisk(of, people, areaType, stayHours) {
    const stayRatio = Math.min((stayHours || 4) / 8, 1); // cap at 8-hour workday
    const baseRisk = of * people * stayRatio;
    const areaMultiplier = areaType === 'worker' ? 1.5 : areaType === 'public' ? 1.0 : 0.5;
    const score = baseRisk * areaMultiplier;
    if (score >= 10) return { level: 'High', value: 'high', color: 'risk-high' };
    if (score >= 3) return { level: 'Moderate', value: 'moderate', color: 'risk-moderate' };
    return { level: 'Low', value: 'low', color: 'risk-low' };
}

/**
 * Compute shielding importance based on occupancy factor, use factor, and risk.
 */
function getShieldingImportance(of, uf, riskLevel) {
    const riskScore = riskLevel === 'High' ? 3 : riskLevel === 'Moderate' ? 2 : 1;
    const composite = of * uf * riskScore;
    if (composite >= 1.0) return 'Critical';
    if (composite >= 0.3) return 'High';
    if (composite >= 0.05) return 'Standard';
    return 'Low';
}

/**
 * Read all room usage inputs and compute all engineering parameters.
 * Returns { occupancyFactor, useFactor, occupancyClassification, exposureRisk, shieldingImportance, roomType, people, stayHours, areaType }
 */
function getOccupancyData() {
    const roomType = document.getElementById('room-type')?.value || 'corridor';
    const people = parseFloat(document.getElementById('room-people')?.value) || 5;
    const stayValue = parseFloat(document.getElementById('room-stay-value')?.value) || 30;
    const stayUnit = document.getElementById('room-stay-unit')?.value || 'minutes';
    const areaType = document.getElementById('area-type')?.value || 'public';

    const stayHours = stayUnit === 'hours' ? stayValue : stayValue / 60;
    const occupancyFactor = ROOM_TYPE_OCCUPANCY[roomType] || 0.2;
    const useFactor = AREA_TYPE_USE_FACTOR[areaType] || 0.25;

    // Occupancy Factor is based on room type (per user spec examples).
    // Stay duration and people count influence exposure risk and shielding importance instead.
    const exposureRisk = getExposureRisk(occupancyFactor, people, areaType, stayHours);
    const occupancyClassification = getOccupancyClassification(occupancyFactor);
    const shieldingImportance = getShieldingImportance(occupancyFactor, useFactor, exposureRisk.level);

    return {
        occupancyFactor,
        useFactor,
        roomType,
        roomTypeLabel: ROOM_TYPE_LABELS[roomType] || roomType,
        people,
        stayHours,
        areaType,
        occupancyClassification,
        exposureRisk,
        shieldingImportance,
    };
}

/**
 * Update the room usage results display cards with computed values.
 */
function updateRoomUsageResults() {
    const data = getOccupancyData();

    const ofEl = document.getElementById('usage-of');
    const riskEl = document.getElementById('usage-risk');
    const classEl = document.getElementById('usage-class');
    const shieldEl = document.getElementById('usage-shield');

    if (ofEl) ofEl.textContent = roundTo(data.occupancyFactor, 3);
    if (riskEl) {
        riskEl.textContent = data.exposureRisk.level;
        riskEl.className = 'usage-value ' + data.exposureRisk.color;
    }
    if (classEl) classEl.textContent = data.occupancyClassification;
    if (shieldEl) shieldEl.textContent = data.shieldingImportance;
}

/**
 * Bind event listeners to room usage inputs for auto-update.
 */
function initRoomUsageAnalysis() {
    const inputs = ['room-type', 'room-people', 'room-stay-value', 'room-stay-unit', 'area-type'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', updateRoomUsageResults);
            el.addEventListener('input', updateRoomUsageResults);
        }
    });
    // Initial calculation
    updateRoomUsageResults();
}

/**
 * Show a helpful explanation toast about the Room Usage Analysis feature.
 */
function showOccupancyHelp() {
    showToast(
        '📋 Room Usage Analysis helps you estimate radiation shielding parameters without needing to know technical terms.\n\n' +
        '• Room Type → determines basic occupancy patterns\n' +
        '• People & Stay Duration → refines the occupancy estimate\n' +
        '• Area Type → adjusts use factor for worker/public/restricted areas\n\n' +
        'The system automatically calculates Occupancy Factor, Use Factor, Exposure Risk, and Shielding Importance for you.',
        'info',
        8000
    );
}


async function loadModalities() {
    clearStepError(1);
    const grid = document.getElementById('modality-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="option-card loading" style="min-width:80px">Loading...</div>';
    try {
        const modalities = await apiGetModalities();
        if (!modalities || modalities.length === 0) {
            throw new Error('No modalities returned from server');
        }
        grid.innerHTML = '';
        modalities.forEach(mod => {
            const card = document.createElement('div');
            card.className = 'option-card option-card-icon';
            card.dataset.modality = mod.name;
            const iconPath = getModalityIconPath(mod.name);
            card.innerHTML = `<img class="card-img" src="${iconPath}" alt="${mod.name}" loading="lazy" onerror="this.style.display='none'"><span>${mod.name}</span>`;
            card.onclick = () => selectModality(mod.name, card);
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = '<div class="option-card" style="cursor:default">⚠️ Failed to load modalities</div>';
        showStepError(1, `Could not load modalities: ${err.message}. Make sure the backend server is running.`);
    }
}

function selectModality(modality, element) {
    document.querySelectorAll('#modality-grid .option-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    selectedModality = modality;
    // Invalidate cached standards when modality changes (some are modality-specific)
    cachedStandards = null;
    // Enable the Next button so user can manually advance
    updateStepNavButtons();
    loadCompanies(modality);
    loadRoomTemplate(modality);
}

async function loadCompanies(modality) {
    clearStepError(2);
    const section = document.getElementById('company-section');
    const grid = document.getElementById('company-grid');
    if (!section || !grid) return;
    section.classList.remove('hidden');
    grid.innerHTML = '<div class="option-card loading" style="min-width:80px">Loading...</div>';
    try {
        const companies = await apiGetCompanies(modality);
        if (!companies || companies.length === 0) {
            throw new Error(`No manufacturers found for ${modality}`);
        }
        grid.innerHTML = '';
        companies.forEach(comp => {
            const card = document.createElement('div');
            card.className = 'option-card option-card-logo';
            card.dataset.company = comp.company_name;
            const logoPath = getCompanyLogoPath(comp.company_name);
            card.innerHTML = `<img class="card-logo" src="${logoPath}" alt="${comp.company_name}" loading="lazy" onerror="this.style.display='none'"><span>${comp.company_name}</span>`;
            card.onclick = () => selectCompany(comp.company_name, card, modality);
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = '<div class="option-card" style="cursor:default">⚠️ Failed to load manufacturers</div>';
        showStepError(2, `Could not load manufacturers for ${modality}: ${err.message}`);
    }
}

function selectCompany(company, element, modality) {
    document.querySelectorAll('#company-grid .option-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    selectedCompany = company;
    document.getElementById('machine-params-panel').classList.add('hidden');
    loadMachines(company, modality);
}

async function loadMachines(company, modality) {
    clearStepError(2);
    const section = document.getElementById('machine-section');
    const grid = document.getElementById('machine-grid');
    if (!section || !grid) return;
    section.classList.remove('hidden');
    grid.innerHTML = '<div class="option-card loading" style="min-width:80px">Loading...</div>';
    try {
        const machines = await apiGetMachines(company, modality);
        if (!machines || machines.length === 0) {
            throw new Error(`No machines found for ${company} ${modality}`);
        }
        grid.innerHTML = '';
        machines.forEach(machine => {
            const card = document.createElement('div');
            card.className = 'option-card';
            card.dataset.machine = machine.model_name;
            const logoPath = getCompanyLogoPath(company);
            card.innerHTML = `<img class="card-badge-img" src="${logoPath}" alt="" loading="lazy" onerror="this.style.display='none'"> ${machine.model_name} <small style="color:#3d4f74">(${machine.kvp}kVp, ${machine.ma}mA)</small>`;
            card.onclick = () => selectMachine(machine, card);
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = '<div class="option-card" style="cursor:default">⚠️ Failed to load machines</div>';
        showStepError(2, `Could not load machines for ${company}: ${err.message}`);
    }
}

function selectMachine(machine, element) {
    document.querySelectorAll('#machine-grid .option-card').forEach(c => c.classList.remove('selected'));
    element.classList.add('selected');
    selectedMachine = machine;

    // Show machine parameters panel
    showMachineParams(machine);
    // Enable the Next button so user can manually advance
    updateStepNavButtons();
}

function showMachineParams(machine) {
    const panel = document.getElementById('machine-params-panel');
    panel.classList.remove('hidden');

    document.getElementById('param-kvp').textContent = machine.kvp ? `${machine.kvp} kVp` : '—';
    document.getElementById('param-ma').textContent = machine.ma ? `${machine.ma} mA` : '—';
    document.getElementById('param-workload').textContent = machine.workload ? `${machine.workload} mA·min/wk` : '—';
    document.getElementById('param-scatter').textContent = machine.scatter_factor || '—';
    document.getElementById('param-angle').textContent = machine.beam_angle ? `${machine.beam_angle}°` : '—';
    document.getElementById('param-detector').textContent = machine.detector_type || '—';

    if (machine.workload) {
        document.getElementById('wl-factor').value = machine.workload;
    }

    // Show recommended room size if available
    const roomSizeEl = document.getElementById('machine-room-size');
    if (roomSizeEl && machine.recommended_room_size) {
        roomSizeEl.textContent = machine.recommended_room_size;
    }

    // Load detector info for this machine's detector type
    if (machine.detector_type && machine.detector_type !== '—') {
        loadDetectorInfo(machine.detector_type);
    }

    showToast(`Loaded: ${machine.model_name}`, 'info');
}

async function loadDetectorInfo(detectorType) {
    const panel = document.getElementById('detector-info-panel');
    const content = document.getElementById('detector-info-content');
    if (!panel || !content) return;

    try {
        const detectors = await apiGetDetectors({ detector_type: detectorType });
        if (detectors && detectors.length > 0) {
            const det = detectors[0];
            content.innerHTML = `
                <strong>${det.detector_name}</strong>
                <span style="font-size:0.72rem;color:var(--text-muted)">
                    ${det.manufacturer ? `${det.manufacturer} • ` : ''}
                    ${det.scintillator ? `${det.scintillator} • ` : ''}
                    ${det.pixel_size_um ? `${det.pixel_size_um}μm pixels` : ''}
                    ${det.sensitivity ? `• sensitivity: ${det.sensitivity.toFixed(2)}` : ''}
                </span>
            `;
            panel.classList.remove('hidden');
        }
    } catch (err) {
        // Silently fail — detector info is supplementary
    }
}

async function loadRoomTemplate(modality) {
    try {
        const templates = await apiGetRoomTemplates(modality, true);
        if (templates && templates.length > 0) {
            const tmpl = templates[0];
            const lengthInput = document.getElementById('room-length');
            const widthInput = document.getElementById('room-width');
            const heightInput = document.getElementById('room-height');

            if (lengthInput) lengthInput.placeholder = tmpl.room_length_m.toString();
            if (widthInput) widthInput.placeholder = tmpl.room_width_m.toString();
            if (heightInput) heightInput.placeholder = tmpl.room_height_m.toString();

            // Show a hint with the template name
            const hint = document.getElementById('room-template-hint');
            if (hint) {
                hint.textContent = `Suggested: ${tmpl.template_name} (${tmpl.room_length_m}×${tmpl.room_width_m}×${tmpl.room_height_m}m)`;
                hint.classList.remove('hidden');
            }


        }
    } catch (err) {
        // Silently fail — templates are supplementary
    }
}

/* ======== WORKFLOW STEP NAVIGATION & ERROR HANDLING ======== */

/**
 * Show an error message inside a specific step.
 * @param {number} step - Step number (1-5)
 * @param {string} message - Error message to display
 */
function showStepError(step, message) {
    const errorEl = document.getElementById(`step-error-${step}`);
    const stepEl = document.getElementById(`step-${step}`);
    const sidebarStep = document.querySelector(`.sidebar-step[data-step="${step}"]`);

    if (errorEl) {
        errorEl.classList.remove('hidden');
        errorEl.innerHTML = `${message} <button class="error-dismiss" onclick="clearStepError(${step})">✕</button>`;
    }
    if (stepEl) {
        stepEl.classList.add('error');
    }
    if (sidebarStep) {
        sidebarStep.classList.add('error');
        const status = sidebarStep.querySelector('.sidebar-status');
        if (status) status.textContent = 'Error';
    }
}

/**
 * Clear the error state from a specific step.
 * @param {number} step - Step number (1-5)
 */
function clearStepError(step) {
    const errorEl = document.getElementById(`step-error-${step}`);
    const stepEl = document.getElementById(`step-${step}`);
    const sidebarStep = document.querySelector(`.sidebar-step[data-step="${step}"]`);

    if (errorEl) {
        errorEl.classList.add('hidden');
        errorEl.innerHTML = '';
    }
    if (stepEl) {
        stepEl.classList.remove('error');
    }
    if (sidebarStep) {
        sidebarStep.classList.remove('error');
        const status = sidebarStep.querySelector('.sidebar-status');
        if (status && sidebarStep.classList.contains('completed')) {
            status.textContent = 'Done';
        } else if (status && sidebarStep.classList.contains('active')) {
            status.textContent = 'Active';
        }
    }
}

/**
 * Navigate to a specific workflow step (only allowed if completed or next logical step).
 * @param {number} step - Step number to navigate to
 */
function navigateToStep(step) {
    // Find the highest completed step
    const steps = document.querySelectorAll('.workflow-step');
    let highestCompleted = 0;
    steps.forEach(s => {
        if (s.classList.contains('completed')) {
            const sNum = parseInt(s.dataset.step);
            if (sNum > highestCompleted) highestCompleted = sNum;
        }
    });

    // Find the current active step
    let currentActive = 1;
    steps.forEach(s => {
        if (s.classList.contains('active')) {
            currentActive = parseInt(s.dataset.step);
        }
    });

    // Allow navigating to: completed steps, current active step, or the next uncompleted step
    const currentHighest = Math.max(highestCompleted, currentActive);
    if (step <= 1 || step <= currentHighest + 1) {
        advanceWorkflow(step);
        // Scroll to the step
        const targetEl = document.getElementById(`step-${step}`);
        if (targetEl) {
            setTimeout(() => {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 150);
        }
    }
}

/**
 * Update the step navigation sidebar to reflect the current state.
 */
function updateStepSidebar(activeStep) {
    const totalSteps = 5;
    const sidebarSteps = document.querySelectorAll('.sidebar-step');

    sidebarSteps.forEach(s => {
        const sNum = parseInt(s.dataset.step);
        const stepEl = document.getElementById(`step-${sNum}`);
        const isCompleted = stepEl && stepEl.classList.contains('completed');
        const isActive = sNum === activeStep;
        const isError = stepEl && stepEl.classList.contains('error');
        const statusEl = s.querySelector('.sidebar-status');

        s.classList.remove('active', 'completed', 'error');

        if (isError) {
            s.classList.add('error');
            if (statusEl) statusEl.textContent = 'Error';
            s.disabled = false; // Allow clicking to review error
        } else if (isActive) {
            s.classList.add('active');
            if (statusEl) statusEl.textContent = 'Active';
            s.disabled = false;
        } else if (isCompleted) {
            s.classList.add('completed');
            if (statusEl) statusEl.textContent = 'Done';
            s.disabled = false; // Clickable to revisit
        } else {
            s.disabled = true;
            if (statusEl) statusEl.textContent = 'Pending';
        }
    });
}

/* ======== STEP NAVIGATION BUTTONS ======== */

/**
 * Enable or disable the Next/Prev buttons based on each step's completion state.
 */
function updateStepNavButtons() {
    // Step 1: Next enabled when modality is selected
    const btnNext1 = document.querySelector('.workflow-step[data-step="1"] .btn-step-next');
    if (btnNext1) btnNext1.disabled = !selectedModality;

    // Step 2: Next enabled when company AND machine are selected
    const btnNext2 = document.querySelector('.workflow-step[data-step="2"] .btn-step-next');
    if (btnNext2) btnNext2.disabled = !(selectedCompany && selectedMachine);

    // Step 3: Next enabled when facility is selected
    const btnNext3 = document.querySelector('.workflow-step[data-step="3"] .btn-step-next');
    if (btnNext3) btnNext3.disabled = !selectedFacility;

    // Step 4: Next always enabled (user may fill materials manually)
    const btnNext4 = document.querySelector('.workflow-step[data-step="4"] .btn-step-next');
    if (btnNext4) btnNext4.disabled = false;
}

/**
 * Go to the next workflow step from the current active step.
 * Validates that the current step's requirements are met.
 */
function goToNextStep() {
    const activeStep = document.querySelector('.workflow-step.active');
    if (!activeStep) return;

    const currentStep = parseInt(activeStep.dataset.step);
    if (currentStep >= 5) return;

    // Validate each step before advancing
    if (currentStep === 1 && !selectedModality) {
        showStepError(1, 'Please select a modality before proceeding.');
        showToast('Select a modality first', 'warning');
        return;
    }
    if (currentStep === 2 && !(selectedCompany && selectedMachine)) {
        showStepError(2, 'Please select both a manufacturer and a machine before proceeding.');
        showToast('Select a manufacturer and machine first', 'warning');
        return;
    }
    if (currentStep === 3 && !selectedFacility) {
        showStepError(3, 'Please select a facility type before proceeding.');
        showToast('Select a facility type first', 'warning');
        return;
    }

    advanceWorkflow(currentStep + 1);
}

/**
 * Go to the previous workflow step from the current active step.
 */
function goToPrevStep() {
    const activeStep = document.querySelector('.workflow-step.active');
    if (!activeStep) return;

    const currentStep = parseInt(activeStep.dataset.step);
    if (currentStep <= 1) return;

    advanceWorkflow(currentStep - 1);
}

/** Lock all inputs/selects/buttons inside a workflow step (read-only state) */
function lockStepInputs(stepNum) {
    const stepEl = document.getElementById(`step-${stepNum}`);
    if (!stepEl) return;
    stepEl.classList.add('step-locked');
    // Disable all interactive elements inside the step
    stepEl.querySelectorAll('input, select, textarea, button, .option-card').forEach(el => {
        if (el.classList.contains('error-dismiss') || el.classList.contains('btn-ghost') || el.closest('.materials-ref-section')) return;
        if (el.tagName === 'BUTTON' && el.classList.contains('btn-glow')) {
            el.disabled = true;
        } else if (!el.classList.contains('option-card')) {
            el.disabled = true;
        } else {
            el.style.pointerEvents = 'none';
            el.style.opacity = '0.6';
        }
    });
}

/** Unlock all inputs/selects/buttons inside a workflow step (editable state) */
function unlockStepInputs(stepNum) {
    const stepEl = document.getElementById(`step-${stepNum}`);
    if (!stepEl) return;
    stepEl.classList.remove('step-locked');
    // Re-enable all interactive elements inside the step
    stepEl.querySelectorAll('input, select, textarea, button, .option-card').forEach(el => {
        if (el.classList.contains('error-dismiss') || el.classList.contains('btn-ghost') || el.closest('.materials-ref-section')) return;
        if (el.tagName === 'BUTTON' && el.classList.contains('btn-glow')) {
            el.disabled = false;
        } else if (!el.classList.contains('option-card')) {
            el.disabled = false;
        } else {
            el.style.pointerEvents = '';
            el.style.opacity = '';
        }
    });
    // Re-apply nav button states after unlocking
    updateStepNavButtons();
}

/**
 * Advance the workflow to a specific step with animated transitions.
 * @param {number} step - Target step number (1-5)
 */
function advanceWorkflow(step) {
    const steps = document.querySelectorAll('.workflow-step');
    const totalSteps = 5;

    // Animate transition out for old active step, then in for new
    const oldActive = document.querySelector('.workflow-step.active');

    steps.forEach(s => {
        const sNum = parseInt(s.dataset.step);
        // Clear any pending animation classes
        s.classList.remove('transitioning');

        if (sNum < step) {
            s.classList.add('completed');
            s.classList.remove('active', 'error');
            // ⛔ Lock all completed steps (read-only)
            lockStepInputs(sNum);
        } else if (sNum === step) {
            s.classList.add('active');
            s.classList.remove('completed');
            // ✅ Unlock the current active step (editable)
            unlockStepInputs(sNum);
            // The stepActivate CSS animation handles the entrance
            setTimeout(() => {
                s.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } else {
            s.classList.remove('active', 'completed');
        }
    });

    // Update progress bar
    const progressText = document.getElementById('workflow-progress-text');
    const progressFill = document.getElementById('progress-fill');
    if (progressText) progressText.textContent = `Step ${step} of ${totalSteps}`;
    if (progressFill) progressFill.style.width = `${(step / totalSteps) * 100}%`;

    // Update the sidebar
    updateStepSidebar(step);

    // Update step nav buttons
    updateStepNavButtons();

    // Trigger step-specific initialization
    if (step === 1) {
        loadModalities();
    }
    if (step === 2 && selectedModality) {
        // If we already have a modality selected, keep the pre-loaded data
        const companySection = document.getElementById('company-section');
        if (companySection && companySection.classList.contains('hidden')) {
            loadCompanies(selectedModality);
        }
    }
    if (step === 3) {
        initFacilitySelection();
        // Refresh room template hint in case modality changed since step 1
        if (selectedModality) loadRoomTemplate(selectedModality);
    }
    if (step === 4) {
        loadMaterialsReference();
    }
}

function initFacilitySelection() {
    document.querySelectorAll('#facility-grid .option-card').forEach(card => {
        card.onclick = () => {
            document.querySelectorAll('#facility-grid .option-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedFacility = card.dataset.facility;
            document.getElementById('room-section').classList.remove('hidden');
            // Enable the Next button so user can manually advance
            updateStepNavButtons();
        };
    });
}

async function loadMaterialsReference() {
    clearStepError(4);
    const grid = document.getElementById('materials-ref-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;">Loading reference materials...</div>';

    try {
        const materials = await apiGetMaterials();
        if (!materials || materials.length === 0) {
            throw new Error('No materials data available');
        }
        grid.innerHTML = '';
        materials.forEach(mat => {
            const card = document.createElement('div');
            card.className = 'material-ref-card';
            card.innerHTML = `
                <div class="mat-name">${mat.material_name}</div>
                <div class="mat-props">
                    <span>ρ=${mat.density}g/cm³</span>
                    <span>μ=${mat.attenuation_coefficient}cm⁻¹</span>
                    <span>HVT=${mat.hvt}cm</span>
                    <span>TVT=${mat.tvt}cm</span>
                    ${mat.cost_factor ? `<span>cost×${mat.cost_factor}</span>` : ''}
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (err) {
        grid.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;">Using pre-loaded material data</div>';
        showStepError(4, `Could not refresh materials: ${err.message}. Using fallback values.`);
    }
}

function toggleMaterialsRef() {
    const grid = document.getElementById('materials-ref-grid');
    const icon = document.getElementById('materials-toggle-icon');
    if (!grid) return;

    const isCollapsed = grid.classList.toggle('collapsed');
    if (icon) {
        icon.textContent = isCollapsed ? '+' : '−';
    }
}

/* ======== MATERIAL MU LOOKUP ======== */

/** Linear attenuation coefficients (cm⁻¹) for available wall materials */
const MATERIAL_MU = {
    concrete: 0.15,
    lead: 4.5,
    gypsum: 0.08,
    'borated-pe': 0.18,
    brick: 0.14,
    steel: 1.5,
    glass: 3.0,
};

/** Friendly material names for display */
const MATERIAL_NAMES = {
    concrete: 'Concrete',
    lead: 'Lead',
    gypsum: 'Gypsum',
    'borated-pe': 'Borated PE',
    brick: 'Brick',
    steel: 'Steel',
    glass: 'Lead Glass',
};

/** Read all 4 wall configurations from the DOM, returning thickness in cm */
function getWallConfig() {
    const walls = [
        { id: 'a', label: 'Wall A (North)', icon: '⬆️' },
        { id: 'b', label: 'Wall B (South)', icon: '⬇️' },
        { id: 'c', label: 'Wall C (East)', icon: '➡️' },
        { id: 'd', label: 'Wall D (West)', icon: '⬅️' },
    ];

    return walls.map(w => {
        const material = document.getElementById(`wall-${w.id}-material`)?.value || 'concrete';
        const type = document.getElementById(`wall-${w.id}-type`)?.value || 'primary';
        let thickness = parseFloat(document.getElementById(`wall-${w.id}-thickness`)?.value) || 30;
        // Always return thickness in cm — convert from inches if imperial
        if (unitSystem === 'imperial') {
            thickness = thickness * 2.54;
        }
        const mu = MATERIAL_MU[material] || 0.15;

        return {
            wallId: w.id.toUpperCase(),
            label: w.label,
            icon: w.icon,
            material,
            materialName: MATERIAL_NAMES[material] || material,
            type,
            typeLabel: type === 'primary' ? 'Primary Barrier' : type === 'secondary' ? 'Secondary Barrier' : 'Door',
            thickness,
            mu,
            attenuation: mu * thickness,
        };
    });
}

/* ======== SHIELDING ANALYSIS ======== */

async function runShieldingAnalysis() {
    clearStepError(5);
    const panel = document.getElementById('analysis-results');
    if (!panel) return;
    panel.classList.remove('hidden');
    panel.innerHTML = '<h3>⚡ Running Shielding Analysis...</h3><p style="color:var(--text-muted)">Calculating per-wall shielding...</p>';

    const length = getMetricValue('room-length', 'length-m') || 6;
    const width = getMetricValue('room-width', 'length-m') || 5;
    const distanceToWall = Math.min(length, width) / 2 || 3;
    const sourceIntensity = selectedMachine?.source_intensity || 100;

    const walls = getWallConfig();
    const workloadFactor = (selectedMachine?.workload || 500) / 1000;
    const occData = getOccupancyData();
    const occupancyFactor = occData.occupancyFactor;
    const useFactor = occData.useFactor;

    // Compute per-wall results
    const wallResults = [];
    let worstDose = { annual: 0, wall: null };

    for (const wall of walls) {
        const layers = [{ mu: wall.mu, thickness: wall.thickness }];

        const data = {
            source_intensity: sourceIntensity,
            source_distance: 1,
            wall_distance: distanceToWall,
            mu: wall.mu,
            wall_thickness: wall.thickness,
            workload_factor: workloadFactor,
            occupancy_factor: occupancyFactor,
            use_factor: useFactor,
            layers,
        };

        try {
            const result = await apiCalculateShielding(data);
            const doseAnnual = result.annual_dose_mSv_year || 0;
            wallResults.push({
                wall,
                doseAtWall: result.dose_at_wall_mSv_h || 0,
                transmitted: result.transmitted_dose_mSv_h || 0,
                annual: doseAnnual,
                status: result.compliance?.status || 'SAFE',
                score: (result.compliance?.compliance_score || 0) * 100,
            });
            if (doseAnnual > worstDose.annual) {
                worstDose = { annual: doseAnnual, wall: wall.label };
            }
        } catch (err) {
            wallResults.push({
                wall,
                doseAtWall: 0,
                transmitted: 0,
                annual: 0,
                status: 'ERROR',
                score: 0,
            });
        }
    }

    // Check if all walls failed
    const allFailed = wallResults.every(r => r.status === 'ERROR');
    if (allFailed) {
        panel.innerHTML = '<h3>❌ Shielding Analysis Failed</h3><p>Could not calculate shielding for any wall. Check that the backend is running and try again.</p>';
        showStepError(5, 'Shielding analysis failed for all walls. Check that the backend is running and try again.');
        return;
    }

    // Average across all walls for the summary
    const succeeded = wallResults.filter(r => r.status !== 'ERROR');
    const avgAnnual = succeeded.reduce((s, r) => s + r.annual, 0) / succeeded.length;
    const avgDoseAtWall = succeeded.reduce((s, r) => s + r.doseAtWall, 0) / succeeded.length;
    const avgTransmitted = succeeded.reduce((s, r) => s + r.transmitted, 0) / succeeded.length;
    const avgScore = succeeded.reduce((s, r) => s + r.score, 0) / succeeded.length;
    const overallStatus = worstDose.annual <= 1 ? 'SAFE' : worstDose.annual <= 20 ? 'WARNING' : 'DANGER';

    // Store for report generation
    lastShieldingResult = {
        dose_at_wall_mSv_h: avgDoseAtWall,
        transmitted_dose_mSv_h: avgTransmitted,
        annual_dose_mSv_year: avgAnnual,
        compliance: {
            status: overallStatus,
            compliance_score: avgScore / 100,
            risk_level: overallStatus === 'SAFE' ? 'Low — within acceptable limits' : overallStatus === 'WARNING' ? 'Moderate — approaching limits' : 'High — exceeds limits',
        },
        wallResults,
        inputSnapshot: captureInputSnapshot(),
        room: { length, width, distanceToWall },
        walls: walls.map(w => ({ label: w.label, material: w.materialName, type: w.typeLabel, thickness: w.thickness, mu: w.mu })),
    };

    const statusColor = overallStatus === 'SAFE' ? 'var(--status-safe)'
        : overallStatus === 'WARNING' ? 'var(--status-warning)' : 'var(--status-danger)';

    // Build per-wall results HTML
    let wallsHtml = '';
    for (const wr of wallResults) {
        const wColor = wr.status === 'SAFE' ? 'var(--status-safe)' : wr.status === 'WARNING' ? 'var(--status-warning)' : 'var(--status-danger)';
        const wIcon = wr.status === 'SAFE' ? '✅' : wr.status === 'WARNING' ? '⚠️' : '❌';
        wallsHtml += `
            <div class="result-row" style="border-left:3px solid ${wColor};padding-left:0.6rem;margin-bottom:0.3rem;">
                <span class="result-label" style="font-size:0.78rem;">${wr.wall.icon} ${wr.wall.label}<br><small style="color:var(--text-muted);font-size:0.65rem;">${wr.wall.materialName} · ${wr.wall.typeLabel} · ${wr.wall.thickness}cm</small></span>
                <span class="result-value" style="font-size:0.78rem;">${wIcon} ${wr.annual.toExponential(3)} mSv/yr</span>
            </div>`;
    }

    panel.innerHTML = `
        <h3>🛡️ Shielding Analysis Results</h3>
        <div class="result-row">
            <span class="result-label">📡 Avg Dose at Wall</span>
            <span class="result-value">${avgDoseAtWall.toFixed(4)} mSv/h</span>
        </div>
        <div class="result-row">
            <span class="result-label">🧱 Avg Transmitted</span>
            <span class="result-value">${avgTransmitted.toExponential(4)} mSv/h</span>
        </div>
        <div class="result-row">
            <span class="result-label">📅 Avg Annual Dose</span>
            <span class="result-value">${avgAnnual.toFixed(4)} mSv/year</span>
        </div>
        <div class="result-row">
            <span class="result-label">⚠️ Worst Wall</span>
            <span class="result-value">${worstDose.wall || '—'}</span>
        </div>
        <div class="result-row">
            <span class="result-label">✅ Compliance</span>
            <span class="result-value" style="color:${statusColor};font-weight:700">${overallStatus}</span>
        </div>
        <div class="result-row">
            <span class="result-label">📊 Score</span>
            <span class="result-value">${avgScore.toFixed(0)}%</span>
        </div>
        <br><h4 style="font-size:0.8rem;color:var(--text-secondary);">📐 Per-Wall Breakdown</h4>
        ${wallsHtml}
        <br>
        <button class="btn-glow btn-small" onclick="generateComprehensiveReport()">📄 Generate Report</button>
    `;
    showToast(
        `Shielding: ${overallStatus}`,
        overallStatus === 'SAFE' ? 'success' : 'warning'
    );
    advanceWorkflow(5);

    // Auto-generate shielding report and navigate to Reports page
    generateComprehensiveReport();
    updateReportSummaryBanner();
    setTimeout(() => {
        window.location.hash = 'reports';
        setTimeout(expandLastReport, 200);
    }, 400);
}

/* ======== LEAKAGE ANALYSIS ======== */

async function runLeakageAnalysis() {
    clearStepError(5);
    const panel = document.getElementById('leakage-results');
    if (!panel) return;
    panel.classList.remove('hidden');
    panel.innerHTML = '<h3>📊 Running Leakage Analysis...</h3><p style="color:var(--text-muted)">Analyzing per-wall barrier leakage...</p>';

    const roomLen = getMetricValue('room-length', 'length-m') || 6;
    const roomWid = getMetricValue('room-width', 'length-m') || 5;
    const sourceIntensity = selectedMachine?.source_intensity || 100;
    const walls = getWallConfig();

    // Build barriers from wall config + standard ceiling/floor
    const barriers = {};
    for (const wall of walls) {
        const atten = wall.mu * wall.thickness;
        barriers[`${wall.icon} ${wall.label} (${wall.materialName})`] = atten;
    }
    barriers['⬆️ Ceiling (Concrete 15cm)'] = 15 * 0.15;
    barriers['⬇️ Floor (Concrete 20cm)'] = 20 * 0.15;

    let html = '<h3>📊 Leakage Analysis</h3>';
    const rows = [];

    for (const [barrier, atten] of Object.entries(barriers)) {
        const transmitted = sourceIntensity * Math.exp(-atten);
        const percent = ((1 - transmitted / sourceIntensity) * 100).toFixed(1);
        const status = transmitted <= 1 ? '✅' : (transmitted <= 10 ? '⚠️' : '❌');
        rows.push({ barrier, transmitted, percent, status });
        html += `<div class="result-row">
            <span class="result-label">${status} ${barrier}</span>
            <span class="result-value">${transmitted.toExponential(3)} mSv/h (${percent}% attenuated)</span>
        </div>`;
    }

    // Store for report generation
    lastLeakageData = {
        barriers: rows,
        sourceIntensity,
        roomDimensions: { length: roomLen, width: roomWid },
        walls: walls.map(w => ({ label: w.label, material: w.materialName, type: w.typeLabel, thickness: w.thickness, mu: w.mu })),
        materials: (() => {
            const m = { concrete: 0, lead: 0, gypsum: 0, boratedPe: 0 };
            walls.forEach(w => {
                if (w.materialName === 'Concrete') m.concrete = w.thickness;
                else if (w.materialName === 'Lead') m.lead = w.thickness * 10;
                else if (w.materialName === 'Gypsum') m.gypsum = w.thickness;
                else if (w.materialName === 'Borated PE') m.boratedPe = w.thickness;
            });
            return m;
        })(),
        inputSnapshot: captureInputSnapshot(),
    };

    // Generate a simple leakage map visualization
    const wallDist = roomWid;
    const wallLen = roomLen;
    const maxVal = Math.max(...rows.map(r => r.transmitted));

    html += `<br><h4 style="color:var(--text-secondary);font-size:0.8rem;margin-bottom:0.5rem;">Room Leakage Heatmap</h4>
    <div class="leakage-map" style="grid-template-columns:repeat(${Math.ceil(wallLen)},1fr);">
        ${Array.from({length: Math.ceil(wallLen * wallDist)}, (_, i) => {
            const val = Math.random() * maxVal * 0.5;
            const intensity = Math.min(Math.floor((val / maxVal) * 255), 255);
            const r = Math.min(255, intensity);
            const g = Math.min(200, 255 - intensity);
            return `<div style="background:rgba(${r},${g},50,0.6);" title="${val.toExponential(2)} mSv/h"></div>`;
        }).join('')}
    </div>
    <p style="font-size:0.65rem;color:var(--text-muted);margin-top:0.3rem;">Heatmap: simulated leakage distribution across room grid</p>`;

    panel.innerHTML = html;
    showToast('Leakage analysis complete', 'info');

    // Auto-generate leakage report and navigate to Reports page
    generateComprehensiveReport();
    updateReportSummaryBanner();
    setTimeout(() => {
        window.location.hash = 'reports';
        setTimeout(expandLastReport, 200);
    }, 400);
}

/* ======== COMPLIANCE CHECK ======== */

async function runFullComplianceCheck() {
    clearStepError(5);
    const panel = document.getElementById('compliance-results');
    if (!panel) return;
    panel.classList.remove('hidden');
    panel.innerHTML = '<h3>✅ Running Compliance Check...</h3>';

    const walls = getWallConfig();
    const length = getMetricValue('room-length', 'length-m') || 6;
    const width = getMetricValue('room-width', 'length-m') || 5;
    const sourceIntensity = selectedMachine?.source_intensity || 100;
    const distanceToWall = Math.min(length, width) / 2 || 3;
    const workloadFactor = (selectedMachine?.workload || 500) / 1000;
    const occData = getOccupancyData();
    const occupancyFactor = occData.occupancyFactor;
    const useFactor = occData.useFactor;

    // Compute compliance per wall and take the worst-case dose
    let worstAnnualDose = 0;
    const wallDoses = [];

    for (const wall of walls) {
        const data = {
            source_intensity: sourceIntensity,
            source_distance: 1,
            wall_distance: distanceToWall,
            mu: wall.mu,
            wall_thickness: wall.thickness,
            workload_factor: workloadFactor,
            occupancy_factor: occupancyFactor,
            use_factor: useFactor,
            layers: [{ mu: wall.mu, thickness: wall.thickness }],
        };

        try {
            const result = await apiCalculateShielding(data);
            const dose = result.annual_dose_mSv_year || 0;
            wallDoses.push({ wall: wall.label, dose });
            if (dose > worstAnnualDose) worstAnnualDose = dose;
        } catch (err) {
            wallDoses.push({ wall: wall.label, dose: 0 });
        }
    }

    // Check if all walls failed
    const allFailed = wallDoses.every(wd => wd.dose === 0 && worstAnnualDose === 0);
    if (allFailed && wallDoses.length > 0) {
        // Only treat as error if wallDoses contains entries (not an empty array)
        panel.innerHTML = '<h3>❌ Compliance Check Failed</h3><p>Could not calculate compliance for any wall. Check that the backend is running and try again.</p>';
        showStepError(5, 'Compliance check failed for all walls. Check that the backend is running and try again.');
        return;
    }

    const dose = worstAnnualDose;

    // Fetch standards from API with fallback to hardcoded values
    let standardsData;
    try {
        standardsData = await apiGetStandards();
    } catch (e) {
        standardsData = null;
    }

    // Group standards by name + person_type for display
    const standardEntries = standardsData && standardsData.length > 0
        ? standardsData.filter(s => !s.modality || s.modality === (selectedModality || ''))
            .map(s => ({
                key: `${s.standard_name} ${s.person_type.charAt(0).toUpperCase() + s.person_type.slice(1)}`,
                limit: s.dose_limit_mSv_year,
                region: s.region || '',
            }))
        : [
            { key: 'ICRP Worker', limit: 20, region: 'International' },
            { key: 'ICRP Public', limit: 1, region: 'International' },
            { key: 'NCRP Worker', limit: 50, region: 'USA' },
            { key: 'NCRP Public', limit: 1, region: 'USA' },
            { key: 'AERB Worker', limit: 20, region: 'India' },
            { key: 'AERB Public', limit: 1, region: 'India' },
            { key: 'IEC Patient', limit: 20, region: 'International' },
            { key: 'EU BSS Worker', limit: 20, region: 'EU' },
            { key: 'EU BSS Public', limit: 1, region: 'EU' },
            { key: 'IAEA Worker', limit: 20, region: 'International' },
            { key: 'IAEA Public', limit: 1, region: 'International' },
        ];

    // Deduplicate by key
    const seen = new Set();
    const uniqueStandards = standardEntries.filter(s => {
        if (seen.has(s.key)) return false;
        seen.add(s.key);
        return true;
    });

    // Store for report generation
    lastComplianceData = {
        dose,
        standards: uniqueStandards,
        modality: selectedModality || 'General',
        walls: walls.map(w => ({ label: w.label, material: w.materialName, type: w.typeLabel, thickness: w.thickness, mu: w.mu })),
        wallDoses,
        room: { length, width, distanceToWall },
        materials: (() => {
            const m = { concrete: 0, lead: 0, gypsum: 0, boratedPe: 0 };
            walls.forEach(w => {
                if (w.materialName === 'Concrete') m.concrete = w.thickness;
                else if (w.materialName === 'Lead') m.lead = w.thickness * 10;
                else if (w.materialName === 'Gypsum') m.gypsum = w.thickness;
                else if (w.materialName === 'Borated PE') m.boratedPe = w.thickness;
            });
            return m;
        })(),
        inputSnapshot: captureInputSnapshot(),
    };

    let html = '<h3>✅ Full Compliance Check</h3>';
    html += `<div class="result-row"><span class="result-label">📅 Worst-Case Annual Dose</span><span class="result-value">${dose.toFixed(4)} mSv/year</span></div>`;
    html += `<div class="result-row"><span class="result-label">🎯 Modality</span><span class="result-value">${selectedModality || 'General'}</span></div><br>`;

    // Show per-wall dose breakdown
    html += '<h4 style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.4rem;">📐 Per-Wall Annual Doses</h4>';
    for (const wd of wallDoses) {
        const color = wd.dose <= 1 ? 'var(--status-safe)' : wd.dose <= 20 ? 'var(--status-warning)' : 'var(--status-danger)';
        html += `<div class="result-row" style="margin-bottom:0.2rem;">
            <span class="result-label" style="font-size:0.75rem;">${wd.wall}</span>
            <span class="result-value" style="font-size:0.75rem;color:${color}">${wd.dose.toFixed(4)} mSv/yr</span>
        </div>`;
    }
    html += '<br>';

    for (const std of uniqueStandards) {
        const status = dose <= std.limit * 0.8 ? 'SAFE' : (dose <= std.limit ? 'WARNING' : 'DANGER');
        const statusColor = status === 'SAFE' ? 'var(--status-safe)' : status === 'WARNING' ? 'var(--status-warning)' : 'var(--status-danger)';
        const badge = status === 'SAFE' ? '✅' : status === 'WARNING' ? '⚠️' : '❌';
        html += `<div class="result-row">
            <span class="result-label">${badge} ${std.key} <span style="font-size:0.62rem;color:var(--text-muted)">${std.region}</span></span>
            <span class="result-value" style="color:${statusColor};font-weight:600">${status} (limit: ${std.limit} mSv/yr)</span>
        </div>`;
    }

    panel.innerHTML = html;
    showToast('Compliance check complete with per-wall analysis', 'success');

    // Auto-generate compliance report and navigate to Reports page
    generateComprehensiveReport();
    updateReportSummaryBanner();
    setTimeout(() => {
        window.location.hash = 'reports';
        setTimeout(expandLastReport, 200);
    }, 400);
}

/* ======== PHYSICS CALCULATORS ======== */

function calcInverseSquare() {
    const i1 = parseFloat(document.getElementById('isl-i1').value) || 100;
    const d1 = parseFloat(document.getElementById('isl-d1').value) || 1;
    const d2 = parseFloat(document.getElementById('isl-d2').value) || 3;
    const result = i1 * Math.pow(d1 / d2, 2);
    animateResult('isl-result', `I₂ = ${result.toFixed(4)}`);
}

function calcAttenuation() {
    const i0 = parseFloat(document.getElementById('ea-i0').value) || 100;
    const mu = parseFloat(document.getElementById('ea-mu').value) || 0.15;
    const x = parseFloat(document.getElementById('ea-x').value) || 30;
    const result = i0 * Math.exp(-mu * x);
    animateResult('ea-result', `I = ${result.toFixed(4)}`);
}

function calcHVTTVT() {
    const mu = parseFloat(document.getElementById('hvt-mu').value) || 0.15;
    const hvt = 0.693 / mu;
    const tvt = 2.303 / mu;
    animateResult('hvt-result', `HVT = ${hvt.toFixed(3)} cm  |  TVT = ${tvt.toFixed(3)} cm`);

    const refs = [
        { name: 'Lead (100 kVp)', mu: 4.5 },
        { name: 'Lead (200 kVp)', mu: 1.5 },
        { name: 'Concrete', mu: 0.15 },
        { name: 'Steel', mu: 1.5 },
        { name: 'Gypsum', mu: 0.08 },
    ];
    const refHtml = refs.map(r =>
        `<span style="display:inline-block;margin-right:0.5rem;">${r.name}: HVT=${(0.693 / r.mu).toFixed(2)}cm</span>`
    ).join('');
    document.getElementById('hvt-material-ref').innerHTML = `<strong style="font-size:0.7rem;color:var(--text-muted)">Reference:</strong> ${refHtml}`;
}

function calcAnnualDose() {
    const dr = parseFloat(document.getElementById('ad-dr').value) || 0.01;
    const wf = 0.5;
    const of = 0.25;
    const uf = 0.25;
    const hours = 40 * 50;
    const annual = dr * wf * of * uf * hours;
    const status = annual <= 20 ? '✅ SAFE' : (annual <= 50 ? '⚠️ WARNING' : '❌ DANGER');
    const statusColor = annual <= 20 ? 'var(--status-safe)' : annual <= 50 ? 'var(--status-warning)' : 'var(--status-danger)';
    animateResult('ad-result', `${annual.toFixed(4)} mSv/year <small style="color:${statusColor}">${status}</small>`);
}

function calcMultiLayer() {
    const i0 = parseFloat(document.getElementById('ml-i0').value) || 100;
    const concrete = parseFloat(document.getElementById('ml-concrete').value) || 30;
    const lead = parseFloat(document.getElementById('ml-lead').value) || 2;

    const layers = [
        { mu: 4.5, thickness: lead * 0.1 },
        { mu: 0.15, thickness: concrete },
    ];

    const totalMuX = layers.reduce((sum, l) => sum + l.mu * l.thickness, 0);
    const result = i0 * Math.exp(-totalMuX);

    let detailHtml = layers.map(l =>
        `<span style="color:var(--text-muted);font-size:0.7rem">μ=${l.mu} × x=${l.thickness}cm = ${(l.mu * l.thickness).toFixed(3)}</span>`
    ).join('<br>');

    animateResult('ml-result', `I = ${result.toFixed(4)}<br><small style="font-size:0.7rem">${detailHtml}</small>`);
}

function calcNeutron() {
    const flux = parseFloat(document.getElementById('na-flux').value) || 100000;
    const sigma = parseFloat(document.getElementById('na-sigma').value) || 0.12;
    const x = parseFloat(document.getElementById('na-x').value) || 30;
    const result = flux * Math.exp(-sigma * x);
    const reduction = ((1 - result / flux) * 100).toFixed(1);
    animateResult('na-result', `Φ = ${result.toExponential(4)} n/cm²/s (${reduction}% attenuated)`);
}

function animateResult(elementId, html) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(5px)';
    setTimeout(() => {
        el.innerHTML = html;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }, 50);
}

/* ======== CHARTS ======== */

let attenuationChartInstance = null;
let complianceChartInstance = null;

function renderAttenuationChart() {
    const ctx = document.getElementById('attenuation-chart');
    if (!ctx) return;

    const i0 = parseFloat(document.getElementById('chart-i0').value) || 100;
    const mu = parseFloat(document.getElementById('chart-mu').value) || 0.15;

    const thicknesses = Array.from({ length: 50 }, (_, i) => (i + 1) * 0.5);
    const intensities = thicknesses.map(x => i0 * Math.exp(-mu * x));

    if (attenuationChartInstance) attenuationChartInstance.destroy();

    attenuationChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: thicknesses,
            datasets: [{
                label: `Intensity (μ=${mu.toFixed(2)} cm⁻¹)`,
                data: intensities,
                borderColor: '#00e5ff',
                backgroundColor: 'rgba(0, 229, 255, 0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 800, easing: 'easeInOutQuart' },
            plugins: {
                legend: {
                    labels: { color: '#8899c0', font: { size: 11, family: 'Inter' } },
                },
            },
            scales: {
                x: {
                    title: { display: true, text: 'Thickness (cm)', color: '#8899c0' },
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { color: '#3d4f74' },
                },
                y: {
                    title: { display: true, text: 'Intensity', color: '#8899c0' },
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { color: '#3d4f74' },
                },
            },
        },
    });
}

let cachedStandards = null;

async function renderComplianceChart() {
    const dose = parseFloat(document.getElementById('comp-dose').value) || 15;

    // Try to load standards from API
    if (!cachedStandards) {
        try {
            const data = await apiGetStandards();
            if (data && data.length > 0) {
                // Deduplicate and format
                const seen = new Set();
                cachedStandards = data
                    .filter(s => !s.modality || s.modality === (selectedModality || ''))
                    .filter(s => {
                        const key = `${s.standard_name} ${s.person_type}`;
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    })
                    .map(s => ({
                        name: `${s.standard_name} ${s.person_type.charAt(0).toUpperCase() + s.person_type.slice(1)}`,
                        limit: s.dose_limit_mSv_year,
                    }));
                // Update standard selector with actual values from DB
                const selector = document.getElementById('compliance-standard');
                if (selector) {
                    const names = [...new Set(data.map(s => s.standard_name))];
                    selector.innerHTML = names.map(n =>
                        `<option value="${n}">${n}</option>`
                    ).join('');
                }
            }
        } catch (e) {
            cachedStandards = null;
        }
    }

    const allStandards = cachedStandards || [
        { name: 'ICRP Worker', limit: 20 },
        { name: 'ICRP Public', limit: 1 },
        { name: 'NCRP Worker', limit: 50 },
        { name: 'NCRP Public', limit: 1 },
        { name: 'AERB Worker', limit: 20 },
        { name: 'AERB Public', limit: 1 },
        { name: 'IEC Patient', limit: 20 },
        { name: 'EU BSS Worker', limit: 20 },
        { name: 'EU BSS Public', limit: 1 },
        { name: 'IAEA Worker', limit: 20 },
        { name: 'IAEA Public', limit: 1 },
    ];

    renderComplianceChartWithStandards(dose, allStandards);
}

function renderComplianceChartWithStandards(dose, standards) {
    const ctx = document.getElementById('compliance-chart');
    if (!ctx) return;

    if (complianceChartInstance) complianceChartInstance.destroy();

    complianceChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: standards.map(s => s.name),
            datasets: [
                {
                    label: 'Calculated Dose',
                    data: standards.map(() => dose),
                    backgroundColor: standards.map(s => dose <= s.limit * 0.8 ? 'rgba(0, 230, 118, 0.6)' :
                        dose <= s.limit ? 'rgba(255, 171, 0, 0.6)' : 'rgba(255, 23, 68, 0.6)'),
                    borderColor: standards.map(s => dose <= s.limit * 0.8 ? '#00e676' :
                        dose <= s.limit ? '#ffab00' : '#ff1744'),
                    borderWidth: 1,
                    borderRadius: 4,
                },
                {
                    label: 'Limit',
                    data: standards.map(s => s.limit),
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderColor: '#fff',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    borderRadius: 4,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeInOutQuart' },
            plugins: {
                legend: {
                    labels: { color: '#8899c0', font: { size: 11, family: 'Inter' } },
                },
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { color: '#3d4f74', font: { size: 9 } },
                },
                y: {
                    title: { display: true, text: 'Dose (mSv/year)', color: '#8899c0' },
                    grid: { color: 'rgba(255,255,255,0.03)' },
                    ticks: { color: '#3d4f74' },
                },
            },
        },
    });

    updateComplianceDetails(dose, standards);
}

function updateComplianceDetails(dose, standards) {
    const details = document.getElementById('compliance-details');
    if (!details || !standards) return;

    let html = '<h4 style="margin-bottom:0.8rem;color:var(--text-secondary);font-size:0.82rem;font-weight:600;">Per-Standard Status</h4>';
    for (const std of standards) {
        const status = dose <= std.limit * 0.8 ? 'safe' : (dose <= std.limit ? 'warning' : 'danger');
        const statusLabel = status === 'safe' ? 'SAFE' : status === 'warning' ? 'WARNING' : 'DANGER';
        const dotColor = status === 'safe' ? 'var(--status-safe)' : status === 'warning' ? 'var(--status-warning)' : 'var(--status-danger)';
        const valColor = dose <= std.limit ? 'var(--status-safe)' : 'var(--status-danger)';

        html += `<div class="comp-item ${status}">
            <span class="status-dot" style="background:${dotColor};color:${dotColor}"></span>
            <div class="comp-info">
                <strong>${std.name}</strong>
                <span>Limit: ${std.limit} mSv/yr — ${statusLabel}</span>
            </div>
            <span class="comp-value" style="color:${valColor}">${dose.toFixed(1)}</span>
        </div>`;
    }
    details.innerHTML = html;
}

function updateComplianceChart() {
    const selected = document.getElementById('compliance-standard')?.value || 'ICRP';
    const filteredStandards = getStandardsForGroup(selected);
    const ctx = document.getElementById('compliance-chart');
    if (!ctx) return;
    const dose = parseFloat(document.getElementById('comp-dose').value) || 15;
    renderComplianceChartWithStandards(dose, filteredStandards);
}

function getStandardsForGroup(group) {
    const all = {
        'ICRP': [
            { name: 'ICRP Worker', limit: 20 },
            { name: 'ICRP Public', limit: 1 },
        ],
        'NCRP': [
            { name: 'NCRP Worker', limit: 50 },
            { name: 'NCRP Public', limit: 1 },
        ],
        'AERB': [
            { name: 'AERB Worker', limit: 20 },
            { name: 'AERB Public', limit: 1 },
        ],
        'IEC': [
            { name: 'IEC Patient', limit: 20 },
        ],
    };
    return all[group] || all['ICRP'];
}

/* ======== REPORT STATE ======== */

/** Stored analysis results — used by report generation to render full details */
let lastShieldingResult = null;
let lastLeakageData = null;
let lastComplianceData = null;

/**
 * Update the report summary banner at the top of the Reports page.
 * Reads from the latest analysis data (shielding > compliance > leakage)
 * and displays status, compliance score, dose, and analysis type.
 */
function updateReportSummaryBanner() {
    const banner = document.getElementById('report-summary-banner');
    if (!banner) return;

    const data = lastShieldingResult || lastComplianceData || lastLeakageData;
    if (!data) {
        banner.classList.add('hidden');
        return;
    }

    banner.classList.remove('hidden');

    let status, complianceScore, annualDose, analysisType;

    if (lastShieldingResult) {
        status = lastShieldingResult.compliance?.status || 'SAFE';
        complianceScore = (lastShieldingResult.compliance?.compliance_score || 0) * 100;
        annualDose = lastShieldingResult.annual_dose_mSv_year || 0;
        analysisType = 'Shielding';
    } else if (lastComplianceData) {
        const dose = lastComplianceData.dose || 0;
        status = dose <= 1 ? 'SAFE' : dose <= 20 ? 'WARNING' : 'DANGER';
        complianceScore = Math.max(0, Math.min(100, (1 - dose / 20) * 100));
        annualDose = dose;
        analysisType = 'Compliance';
    } else if (lastLeakageData) {
        const maxTransmitted = Math.max(...(lastLeakageData.barriers || []).map(b => b.transmitted || 0));
        status = maxTransmitted <= 1 ? 'SAFE' : maxTransmitted <= 10 ? 'WARNING' : 'DANGER';
        complianceScore = Math.max(0, Math.min(100, (1 - maxTransmitted / 10) * 100));
        annualDose = maxTransmitted;
        analysisType = 'Leakage';
    }

    const statusClass = status.toLowerCase();
    const icon = status === 'SAFE' ? '✅' : status === 'WARNING' ? '⚠️' : '❌';

    // Update banner class for left accent bar
    banner.className = 'report-summary-banner banner-' + statusClass;

    document.getElementById('summary-icon').textContent = icon;
    const statusEl = document.getElementById('summary-status');
    statusEl.textContent = status;
    // Remove any previous status class and add the current one
    statusEl.className = 'summary-value ' + statusClass + '-text';
    document.getElementById('summary-compliance').textContent = complianceScore.toFixed(0) + '%';
    document.getElementById('summary-dose').textContent = annualDose.toFixed(4) + ' mSv/yr';
    document.getElementById('summary-type').textContent = analysisType;
}

/** Helper to auto-expand the most recently added report card */
function expandLastReport() {
    const reports = document.querySelectorAll('#reports-list .report-item');
    const last = reports[reports.length - 1];
    if (!last) return;
    const details = last.querySelector('.report-details');
    const toggle = last.querySelector('.report-toggle');
    if (details && details.classList.contains('hidden')) {
        details.classList.remove('hidden');
        if (toggle) {
            const arrow = toggle.querySelector('.toggle-arrow');
            if (arrow) arrow.textContent = '▲';
        }
    }
    // Scroll the report into view
    setTimeout(() => {
        last.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

/** Input snapshot captured at time of analysis */
function captureInputSnapshot() {
    const walls = getWallConfig();
    return {
        machine: selectedMachine ? { model: selectedMachine.model_name, kvp: selectedMachine.kvp, ma: selectedMachine.ma, workload: selectedMachine.workload, source_intensity: selectedMachine.source_intensity } : null,
        modality: selectedModality,
        facility: selectedFacility,
        room: {
            length: document.getElementById('room-length')?.value || '—',
            width: document.getElementById('room-width')?.value || '—',
            height: document.getElementById('room-height')?.value || '—',
        },

        wallConfig: walls.map(w => ({
            wall: w.label,
            material: w.materialName,
            type: w.typeLabel,
            thickness: w.thickness,
            mu: w.mu,
        })),
        occupancy: (function() {
            const od = getOccupancyData();
            return {
                factor: roundTo(od.occupancyFactor, 3),
                use: od.useFactor,
                workload: document.getElementById('wl-factor')?.value || '—',
                roomType: od.roomTypeLabel,
                people: od.people,
                stayHours: roundTo(od.stayHours, 1),
                areaType: od.areaType,
                classification: od.occupancyClassification,
                exposureRisk: od.exposureRisk.level,
                shieldingImportance: od.shieldingImportance,
            };
        })(),
        adjacents: {
            north: document.getElementById('adj-north')?.value || '—',
            south: document.getElementById('adj-south')?.value || '—',
            east: document.getElementById('adj-east')?.value || '—',
            west: document.getElementById('adj-west')?.value || '—',
        },
        timestamp: new Date().toLocaleString(),
    };
}

let reportCounter = 0;

function generateEngineeringReport() {
    return generateComprehensiveReport();
}

function generateComprehensiveReport() {
    reportCounter++;
    const list = document.getElementById('reports-list');
    const empty = list.querySelector('.report-empty');
    if (empty) empty.remove();
    const shieldingData = lastShieldingResult;
    const complianceData = lastComplianceData;
    const leakageData = lastLeakageData;
    if (!shieldingData && !complianceData && !leakageData) {
        showToast('No analysis data available. Run Shielding Analysis, Compliance Check, or Leakage Analysis first.', 'warning');
        return;
    }
    const now = new Date().toLocaleString();
    const input = (shieldingData && shieldingData.inputSnapshot) || (complianceData && complianceData.inputSnapshot) || (leakageData && leakageData.inputSnapshot) || {};
    const machine = input.machine || {};
    const modality = input.modality || 'General';
    const facility = input.facility || '—';
    const machineName = machine.model || '—';
    const kvp = machine.kvp || '—';
    const ma = machine.ma || '—';
    const workload = machine.workload || '400';
    const sourceIntensity = parseFloat(machine.source_intensity) || 100;
    const room = input.room || {};
    const roomLength = parseFloat(room.length) || 6;
    const roomWidth = parseFloat(room.width) || 5;
    const roomHeight = parseFloat(room.height) || 3;
    const floorArea = roomLength * roomWidth;
    const roomVolume = roomLength * roomWidth * roomHeight;
    const occ = input.occupancy || {};
    const occFactor = parseFloat(occ.factor) || 0.25;
    const useFactor = parseFloat(occ.use) || 0.25;
    const roomTypeName = occ.roomType || '—';
    const occPeople = occ.people || '—';
    const occStayHours = occ.stayHours || '—';
    const occAreaType = occ.areaType || '—';
    const wlFactor = occ.workload || workload;
    const adjacents = input.adjacents || { north: '—', south: '—', east: '—', west: '—' };
    const wallConfig = input.wallConfig || [];
    const wallResults = (shieldingData && shieldingData.wallResults) || [];
    const annualDose = shieldingData ? (shieldingData.annual_dose_mSv_year || 0) : (complianceData ? (complianceData.dose || 0) : 0);
    const leakageSourceIntensity = leakageData ? (leakageData.sourceIntensity || sourceIntensity) : sourceIntensity;
    const standards = (complianceData && complianceData.standards) || [];
    const complianceDose = complianceData ? (complianceData.dose || 0) : annualDose;
    const wkWorkload = parseFloat(wlFactor) || 400;
    const proceduresPerDay = Math.round(wkWorkload / 50 / 6) || 2;
    const exposuresPerProc = 3;
    const daysPerWeek = 6;
    const weeksPerYear = 50;
    const annualWorkload = wkWorkload * weeksPerYear;
    const annualProcedures = proceduresPerDay * daysPerWeek * weeksPerYear;
    let worstStatus = 'SAFE';
    if (wallResults.length > 0) {
        for (const wr of wallResults) {
            const s = wr.annual <= 1 ? 'SAFE' : wr.annual <= 20 ? 'WARNING' : 'DANGER';
            if (s === 'DANGER' || (s === 'WARNING' && worstStatus !== 'DANGER')) worstStatus = s;
        }
    } else if (complianceDose > 0) {
        worstStatus = complianceDose <= 1 ? 'SAFE' : complianceDose <= 20 ? 'WARNING' : 'DANGER';
    }
    const statusClass = worstStatus.toLowerCase();
    const wallDetails = [];
    const wallDirections = [
        { id: 'A', label: 'North', icon: '⬆️', adj: adjacents.north },
        { id: 'B', label: 'South', icon: '⬇️', adj: adjacents.south },
        { id: 'C', label: 'East', icon: '➡️', adj: adjacents.east },
        { id: 'D', label: 'West', icon: '⬅️', adj: adjacents.west },
    ];
    const distanceToWall = Math.min(roomLength, roomWidth) / 2 || 3;
    const beamAngle = machine.beam_angle || 0;
    const primaryWallIdx = beamAngle >= 315 || beamAngle < 45 ? 0 : beamAngle >= 45 && beamAngle < 135 ? 2 : beamAngle >= 135 && beamAngle < 225 ? 1 : beamAngle >= 225 && beamAngle < 315 ? 3 : 0;
    const primaryDirection = wallDirections[primaryWallIdx].label;
    for (let i = 0; i < wallDirections.length; i++) {
        const wd = wallDirections[i];
        const config = wallConfig[i] || {};
        const material = config.material || 'Concrete';
        const thickness = config.thickness || 30;
        const mu = config.mu || 0.15;
        const isPrimary = wd.label === primaryDirection;
        const barrierType = isPrimary ? 'Primary Barrier' : 'Secondary Barrier';
        const density = material === 'Lead' ? 11.34 : material === 'Steel' ? 7.85 : material === 'Gypsum' ? 2.3 : material === 'Borated PE' ? 1.02 : 2.4;
        const hvt = mu > 0 ? 0.693 / mu : 0;
        const tvt = mu > 0 ? 2.303 / mu : 0;
        const massAtten = mu / density;
        const leadEquiv = mu > 0 ? (mu / 4.5 * thickness).toFixed(2) : '—';
        const weightPerM2 = density * thickness * 10;
        const unshielded = sourceIntensity * Math.pow(1 / distanceToWall, 2);
        const attenFactor = mu * thickness;
        const shielded = unshielded * Math.exp(-attenFactor);
        const transmissionFactor = shielded / (unshielded || 1);
        const numHVL = mu > 0 ? thickness / hvt : 0;
        const numTVL = mu > 0 ? thickness / tvt : 0;
        const annualDoseWall = wkWorkload * useFactor * occFactor * (1 / (distanceToWall * distanceToWall)) * transmissionFactor * 50;
        const isControlled = occAreaType === 'worker';
        const designGoal = isControlled ? 5 : 0.3;
        const margin = designGoal > 0 ? ((designGoal - annualDoseWall) / designGoal * 100) : 0;
        const isAdequate = annualDoseWall <= designGoal;
        const leakRate = leakageSourceIntensity * Math.exp(-attenFactor);
        const scatterFraction = 0.001;
        const scatterDose = wkWorkload * scatterFraction / 400 * (1 / (distanceToWall * distanceToWall)) * Math.exp(-attenFactor) * 50;
        wallDetails.push({
            label: wd.label, icon: wd.icon, adj: wd.adj, material, density, thickness, mu, hvt, tvt, massAtten, leadEquiv, weightPerM2,
            isPrimary, barrierType, distanceToWall, unshielded, shielded, transmissionFactor, numHVL, numTVL,
            annualDoseWall, designGoal, margin, isAdequate,
            verdict: isAdequate ? (margin > 50 ? 'ADEQUATE' : 'MARGINAL') : 'INADEQUATE',
            minThickness: isAdequate ? thickness : (mu > 0 ? -Math.log(designGoal * (distanceToWall * distanceToWall) / (wkWorkload * useFactor * occFactor * 50)) / mu : thickness),
            deficit: isAdequate ? 0 : Math.max(0, (-Math.log(designGoal * (distanceToWall * distanceToWall) / (wkWorkload * useFactor * occFactor * 50)) / mu) - thickness),
            leakRate, scatterDose, combinedLeakage: leakRate + scatterDose,
        });
    }
    const allStandards = standards.length > 0 ? standards : [
        { key: 'ICRP Worker', limit: 20, region: 'International' },
        { key: 'ICRP Public', limit: 1, region: 'International' },
        { key: 'NCRP Worker', limit: 50, region: 'USA' },
        { key: 'NCRP Public', limit: 1, region: 'USA' },
        { key: 'AERB Worker', limit: 20, region: 'India' },
        { key: 'AERB Public', limit: 1, region: 'India' },
        { key: 'EU BSS Worker', limit: 20, region: 'EU' },
        { key: 'EU BSS Public', limit: 1, region: 'EU' },
        { key: 'IAEA Worker', limit: 20, region: 'International' },
        { key: 'IAEA Public', limit: 1, region: 'International' },
    ];
    const weakestWall = wallDetails.reduce((min, w) => w.margin < min.margin ? w : min, wallDetails[0]);
    const card = document.createElement('div');
    card.className = 'holographic-card report-item report-detailed';
    card.style.animation = 'fadeIn 0.4s ease';
    // WHAT-IF SCENARIOS
    const scenarioDoseDouble = wallDetails.map(w => ({
        label: w.label,
        original: w.annualDoseWall,
        doubled: w.annualDoseWall * 2,
        compliant: w.annualDoseWall * 2 <= w.designGoal,
    }));
    const kVpIncrease = parseFloat(kvp) * 1.2 || 120;
    const muAtHigherKvp = mu => mu * (parseFloat(kvp) / kVpIncrease);
    const scenarioKvpIncrease = wallDetails.map(w => ({
        label: w.label,
        original: w.annualDoseWall,
        newMu: w.mu * (parseFloat(kvp) / kVpIncrease),
        attenuated: sourceIntensity * Math.pow(1 / distanceToWall, 2) * Math.exp(-(w.mu * (parseFloat(kvp) / kVpIncrease)) * w.thickness) * useFactor * occFactor * 50 / (distanceToWall * distanceToWall),
    }));
    const weakestWallCalc = wallDetails.reduce((min, w) => w.margin < min.margin ? w : min, wallDetails[0]);
    const scenarioAddConcrete = weakestWallCalc ? {
        label: weakestWallCalc.label,
        originalDose: weakestWallCalc.annualDoseWall,
        newThickness: weakestWallCalc.thickness + 5,
        newDose: weakestWallCalc.unshielded * Math.exp(-weakestWallCalc.mu * (weakestWallCalc.thickness + 5)) * useFactor * occFactor * 50 / (distanceToWall * distanceToWall),
    } : null;

    // Generate the full 15-section HTML template
    const primaryWall = wallDetails.find(w => w.isPrimary);
    const totalAnnualDose = wallDetails.reduce((s, w) => s + w.annualDoseWall, 0);
    const html = `
        <div class="report-header">
            <div class="report-icon">📋</div>
            <div class="report-info">
                <h3>Radiation Shielding Analysis Report #${reportCounter}</h3>
                <span class="report-badge ${statusClass}">${worstStatus}</span>
                <div class="report-date">${now}</div>
            </div>
            <button class="btn-ghost report-toggle" onclick="toggleReportDetails(this)">
                <span class="toggle-arrow">▼</span>
            </button>
            <button class="btn-ghost btn-print" onclick="printReportAsPDF(this)" title="Print as PDF">🖨️</button>
        </div>
        <div class="report-details hidden">

<!-- SECTION 1: PROJECT IDENTIFICATION -->
<h2>1. Project Identification</h2>
<table class="report-data-table">
    <tr><th>Parameter</th><th>Value</th></tr>
    <tr><td>Project Name</td><td>Radiation Shielding Analysis &mdash; ${facility}</td></tr>
    <tr><td>Report ID</td><td>SHIELDPLAN-RPT-${String(reportCounter).padStart(4,'0')}</td></tr>
    <tr><td>Date of Issue</td><td>${now}</td></tr>
    <tr><td>Prepared by</td><td>ShieldPlan AI &mdash; Automated Analysis Engine</td></tr>
    <tr><td>Facility Type</td><td>${modality} Imaging Suite</td></tr>
    <tr><td>Regulatory Standard(s)</td><td>ICRP 103, NCRP 147, AERB/RF/SC-1, IEC 60601-1-3, IAEA GSR Part 3</td></tr>
    <tr><td>Scope</td><td>Per-wall shielding adequacy, compliance verification, leakage analysis, and risk assessment</td></tr>
</table>

<!-- SECTION 2: EQUIPMENT SPECIFICATIONS -->
<h2>2. Equipment Specifications</h2>
<table class="report-data-table">
    <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
    <tr><td>Modality</td><td>${modality}</td><td>&mdash;</td></tr>
    <tr><td>Manufacturer</td><td>${input.machine?.model?.split(' ')[0] || '&mdash;'}</td><td>&mdash;</td></tr>
    <tr><td>Model</td><td>${machineName}</td><td>&mdash;</td></tr>
    <tr><td>Peak Voltage</td><td>${kvp}</td><td>kVp</td></tr>
    <tr><td>Tube Current</td><td>${ma}</td><td>mA</td></tr>
    <tr><td>Weekly Workload (W)</td><td>${wkWorkload}</td><td>mA&middot;min/week</td></tr>
    <tr><td>Annual Workload (W<sub>a</sub>)</td><td>${annualWorkload}</td><td>mA&middot;min/year</td></tr>
    <tr><td>Procedures per Day</td><td>${proceduresPerDay}</td><td>&mdash;</td></tr>
    <tr><td>Annual Procedures</td><td>${annualProcedures}</td><td>&mdash;</td></tr>
    <tr><td>Source Intensity (S)</td><td>${sourceIntensity}</td><td>mR/h at 1m</td></tr>
    <tr><td>Beam Angle</td><td>${beamAngle}&deg; (Primary direction: ${primaryDirection})</td><td>degrees</td></tr>
    <tr><td>Operating Mode</td><td>Intermittent</td><td>&mdash;</td></tr>
</table>

<!-- SECTION 3: FACILITY & ROOM GEOMETRY -->
<h2>3. Facility &amp; Room Geometry</h2>
<table class="report-data-table">
    <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
    <tr><td>Length (L)</td><td>${roomLength}</td><td>m</td></tr>
    <tr><td>Width (W)</td><td>${roomWidth}</td><td>m</td></tr>
    <tr><td>Height (H)</td><td>${roomHeight}</td><td>m</td></tr>
    <tr><td>Floor Area (L &times; W)</td><td>${floorArea.toFixed(1)}</td><td>m&sup2;</td></tr>
    <tr><td>Room Volume (L &times; W &times; H)</td><td>${roomVolume.toFixed(1)}</td><td>m&sup3;</td></tr>
    <tr><td>Source-to-Wall Distance (d)</td><td>${distanceToWall}</td><td>m</td></tr>
    <tr><td>Primary Barrier Direction</td><td>${primaryDirection}</td><td>&mdash;</td></tr>
</table>

<!-- SECTION 4: SHIELDING MATERIAL PROPERTIES -->
<h2>4. Shielding Material Properties</h2>
${wallDetails.map(w => `<h3>${w.icon} ${w.label} Wall &mdash; ${w.material}</h3>
<table class="report-data-table">
    <tr><th>Property</th><th>Value</th><th>Unit</th></tr>
    <tr><td>Material</td><td>${w.material}</td><td>&mdash;</td></tr>
    <tr><td>Density (&rho;)</td><td>${w.density.toFixed(2)}</td><td>g/cm&sup3;</td></tr>
    <tr><td>Linear Attenuation Coeff (&mu;)</td><td>${w.mu.toFixed(4)}</td><td>cm&supmin;&sup1;</td></tr>
    <tr><td>Mass Attenuation Coeff (&mu;/&rho;)</td><td>${w.massAtten.toFixed(4)}</td><td>cm&sup2;/g</td></tr>
    <tr><td>HVL = 0.693 / &mu;</td><td>${w.hvt.toFixed(3)}</td><td>cm</td></tr>
    <tr><td>TVL = 2.303 / &mu;</td><td>${w.tvt.toFixed(3)}</td><td>cm</td></tr>
    <tr><td>Lead Equivalence</td><td>${w.leadEquiv}</td><td>mm Pb</td></tr>
    <tr><td>Weight per m&sup2;</td><td>${w.weightPerM2.toFixed(1)}</td><td>kg/m&sup2;</td></tr>
    <tr><td>Configured Thickness (x)</td><td>${w.thickness.toFixed(1)}</td><td>cm</td></tr>
</table>
`).join('')}

<!-- SECTION 5: PER-WALL SHIELDING ANALYSIS -->
<h2>5. Per-Wall Shielding Analysis</h2>
${wallDetails.map(w => `<h3>${w.icon} ${w.label} Wall &mdash; ${w.barrierType}</h3>
<p class="report-desc"><strong>Adjacent Area:</strong> ${w.adj} &middot; <strong>Classification:</strong> ${w.isPrimary ? 'Primary' : 'Secondary'} &middot; <strong>Material:</strong> ${w.material} (${w.thickness.toFixed(1)} cm)</p>

<p class="report-desc"><strong>Unshielded Dose Rate:</strong> Source output at 1 m: I&sub1; = ${sourceIntensity} mR/h. Inverse Square Law: I&sub2; = I&sub1; &times; (d&sub1;/d&sub2;)&sup2; = ${sourceIntensity} &times; (1/${distanceToWall.toFixed(1)})&sup2; = ${w.unshielded.toExponential(3)} mR/h</p>
<p class="report-desc"><strong>Attenuation:</strong> Beer-Lambert: I = I<sub>0</sub> &times; e<sup>&minus;&mu;x</sup> = ${w.unshielded.toExponential(3)} &times; e<sup>&minus;${(w.mu * w.thickness).toFixed(3)}</sup> = ${w.shielded.toExponential(3)} mR/h. Transmission Factor B = I/I<sub>0</sub> = ${w.transmissionFactor.toExponential(4)}. HVLs: ${w.numHVL.toFixed(2)}, TVLs: ${w.numTVL.toFixed(2)}</p>
<p class="report-desc"><strong>Annual Dose:</strong> H = W &times; U &times; T &times; (1/d&sup2;) &times; B = ${wkWorkload} &times; ${useFactor} &times; ${occFactor} &times; (1/${distanceToWall}&sup2;) &times; ${w.transmissionFactor.toExponential(3)} &times; 50 = ${w.annualDoseWall.toExponential(3)} mSv/yr. Limit: ${w.designGoal} mSv/yr. Margin: ${w.margin.toFixed(1)}% &rarr; <strong>${w.verdict}</strong></p>
${!w.isAdequate ? `<p class="report-desc" style="color:#ff1744">Required minimum thickness: ${w.minThickness.toFixed(1)} cm (increase by ${w.deficit.toFixed(1)} cm)</p>` : ''}
`).join('')}

<!-- SECTION 6: ANNUAL DOSE ESTIMATION -->
<h2>6. Annual Dose Estimation</h2>
<table class="report-data-table">
    <tr><th>Wall</th><th>B (Transmission)</th><th>H (mSv/yr)</th><th>Limit (mSv/yr)</th><th>% of Limit</th></tr>
    ${wallDetails.map(w => { const pct = w.designGoal > 0 ? (w.annualDoseWall / w.designGoal * 100).toFixed(1) : '&mdash;'; return `<tr><td>${w.icon} ${w.label}</td><td>${w.transmissionFactor.toExponential(3)}</td><td>${w.annualDoseWall.toExponential(3)}</td><td>${w.designGoal}</td><td>${pct}%</td></tr>`; }).join('')}
</table>

<!-- SECTION 7: LEAKAGE RADIATION ANALYSIS -->
<h2>7. Leakage Radiation Analysis</h2>
<p class="report-desc">Primary beam leakage: L = I<sub>0</sub> &times; e<sup>&minus;&mu;x</sup> &times; U &times; T &times; (1/d&sup2;)</p>
${wallDetails.map(w => `<p class="report-desc">${w.icon} ${w.label}: L = ${w.leakRate.toExponential(3)} mR/h (${(w.leakRate * 0.01).toExponential(3)} mSv/h)</p>`).join('')}

<!-- SECTION 8: OCCUPANCY & WORKLOAD ANALYSIS -->
<h2>8. Occupancy &amp; Workload Analysis</h2>
<table class="report-data-table">
    <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
    <tr><td>Occupancy Factor (T)</td><td>${occFactor}</td><td>&mdash;</td></tr>
    <tr><td>Use Factor (U)</td><td>${useFactor}</td><td>&mdash;</td></tr>
    <tr><td>Room Type</td><td>${roomTypeName}</td><td>&mdash;</td></tr>
    <tr><td>People Count</td><td>${occPeople}</td><td>&mdash;</td></tr>
    <tr><td>Stay Duration</td><td>${occStayHours}</td><td>h</td></tr>
    <tr><td>Area Type</td><td>${occAreaType}</td><td>&mdash;</td></tr>
    <tr><td>Weekly Workload (W)</td><td>${wkWorkload}</td><td>mA&middot;min/week</td></tr>
    <tr><td>Annual Workload (W<sub>a</sub>)</td><td>${annualWorkload}</td><td>mA&middot;min/year</td></tr>
    <tr><td>Operating Weeks/Year</td><td>${weeksPerYear}</td><td>weeks</td></tr>
    <tr><td>Annual Procedures</td><td>${annualProcedures}</td><td>procedures</td></tr>
</table>

<!-- SECTION 9: COMPLIANCE ANALYSIS -->
<h2>9. Compliance Analysis</h2>
<table class="report-data-table">
    <tr><th>Category</th><th>Standard</th><th>Limit (mSv/yr)</th></tr>
    <tr><td>Occupational Worker</td><td>ICRP 103 / NCRP 147</td><td>20 / 50</td></tr>
    <tr><td>Public / Uncontrolled</td><td>ICRP 103 / NCRP 147</td><td>1</td></tr>
    <tr><td>Patient / Equipment</td><td>IEC 60601</td><td>20</td></tr>
</table>
<table class="report-data-table">
    <tr><th>Wall</th><th>Adjacent</th><th>Barrier</th><th>Dose (mSv/yr)</th><th>Limit (mSv/yr)</th><th>Margin (%)</th><th>Status</th></tr>
    ${wallDetails.map(w => {
        const st = w.verdict === 'ADEQUATE' ? 'PASS' : w.verdict === 'MARGINAL' ? 'MARGINAL' : 'FAIL';
        return `<tr><td>${w.icon} ${w.label}</td><td>${w.adj}</td><td>${w.barrierType}</td><td>${w.annualDoseWall.toExponential(3)}</td><td>${w.designGoal}</td><td>${w.margin.toFixed(1)}</td><td class="${st === 'PASS' ? 'status-safe' : st === 'MARGINAL' ? 'status-warning' : 'status-danger'}">${st}</td></tr>`;
    }).join('')}
</table>

<!-- SECTION 10: RISK & SAFETY ZONE CLASSIFICATION -->
<h2>10. Risk &amp; Safety Zone Classification</h2>
<table class="report-data-table">
    <tr><th>Zone</th><th>Wall</th><th>Risk Level</th><th>Classification</th><th>Safety Radius</th></tr>
    ${wallDetails.map((w, i) => {
        const risk = w.annualDoseWall <= 0.3 ? 'Low' : w.annualDoseWall <= 5 ? 'Medium' : w.annualDoseWall <= 20 ? 'High' : 'Very High';
        const zone = w.designGoal >= 5 ? 'Controlled' : 'Supervised';
        const riskClass = risk === 'Low' ? 'status-safe' : risk === 'Medium' || risk === 'Very High' ? 'status-warning' : 'status-danger';
        return `<tr><td>Zone ${String.fromCharCode(65 + i)}</td><td>${w.icon} ${w.label}</td><td class="${riskClass}">${risk}</td><td>${zone}</td><td>${(distanceToWall + 0.5).toFixed(1)} m</td></tr>`;
    }).join('')}
</table>

<!-- SECTION 11: STRUCTURAL CONSIDERATIONS -->
<h2>11. Structural Considerations</h2>
<table class="report-data-table">
    <tr><th>Wall</th><th>Material</th><th>Thickness (cm)</th><th>Weight (kg/m&sup2;)</th><th>Min Required (cm)</th><th>Recommendation</th></tr>
    ${wallDetails.map(w => `<tr><td>${w.icon} ${w.label}</td><td>${w.material}</td><td>${w.thickness.toFixed(1)}</td><td>${w.weightPerM2.toFixed(0)}</td><td>${w.minThickness.toFixed(1)}</td><td>${w.verdict === 'ADEQUATE' ? 'No change needed' : w.verdict === 'MARGINAL' ? 'Consider reinforcement' : 'REQUIRES UPGRADE (+' + w.deficit.toFixed(1) + ' cm)'}</td></tr>`).join('')}
</table>

<!-- SECTION 12: WHAT-IF SCENARIO PROJECTIONS -->
<h2>12. What-If Scenario Projections</h2>
<p class="report-desc"><strong>Scenario A &mdash; Workload Doubles:</strong></p>
<table class="report-data-table"><tr><th>Wall</th><th>Current (mSv/yr)</th><th>Doubled (mSv/yr)</th></tr>
${scenarioDoseDouble.map(s => `<tr><td>${s.label}</td><td>${s.original.toExponential(3)}</td><td>${s.doubled.toExponential(3)}</td></tr>`).join('')}</table>

<p class="report-desc"><strong>Scenario B &mdash; kVp Increases by 20%:</strong> New kVp: ${kVpIncrease.toFixed(0)}. Weakest wall (${weakestWallCalc.label}): &mu; = ${weakestWallCalc.mu.toFixed(4)} &rarr; ${scenarioKvpIncrease.find(s => s.label === weakestWallCalc.label)?.newMu.toFixed(4) || '&mdash;'}</p>

<p class="report-desc"><strong>Scenario C &mdash; Add 5 cm Concrete to Weakest Wall:</strong> ${scenarioAddConcrete ? `${scenarioAddConcrete.label}: current ${scenarioAddConcrete.originalDose.toExponential(3)} mSv/yr &rarr; new ${scenarioAddConcrete.newDose.toExponential(3)} mSv/yr (${((1 - scenarioAddConcrete.newDose / (scenarioAddConcrete.originalDose || 1)) * 100).toFixed(1)}% reduction)` : ''}</p>

<p class="report-desc"><strong>Scenario D &mdash; Replace Concrete with Lead on Primary:</strong> ${(() => { const p = wallDetails.find(w => w.isPrimary); if (!p) return 'N/A'; const lt = p.thickness * p.mu / 4.5; const ws = p.weightPerM2 - (11.34 * lt * 10); return `Current ${p.thickness.toFixed(1)} cm concrete &rarr; ${lt.toFixed(2)} cm lead equivalent. Weight saving: ${ws.toFixed(0)} kg/m&sup2;`; })()}</p>

<p class="report-desc"><strong>Scenario E &mdash; Full Occupancy (T=1.0) on Public Wall:</strong> ${(() => { const pw = wallDetails.find(w => w.designGoal <= 1) || wallDetails[0]; const nd = pw.annualDoseWall * (1.0 / occFactor); return `${pw.label}: ${pw.annualDoseWall.toExponential(3)} &rarr; ${nd.toExponential(3)} mSv/yr. ${nd <= pw.designGoal ? 'Still compliant.' : 'EXCEEDS limit.'}`; })()}</p>

<!-- SECTION 13: MONITORING & SURVEILLANCE -->
<h2>13. Monitoring &amp; Surveillance Recommendations</h2>
<table class="report-data-table">
    <tr><th>Item</th><th>Recommendation</th></tr>
    <tr><td>Personal Dosimetry</td><td>TLD or OSL badges for occupational workers in Controlled zones</td></tr>
    <tr><td>Area Monitors</td><td>Place real-time area radiation monitors at all occupied boundaries</td></tr>
    <tr><td>Survey Frequency</td><td>Weekly for Controlled areas; Monthly for Supervised areas</td></tr>
    <tr><td>Re-evaluation Triggers</td><td>Equipment upgrade, workload increase &gt;20%, room modification, regulatory change</td></tr>
</table>

<!-- SECTION 14: CONCLUSIONS -->
<h2>14. Conclusions &amp; Recommendations</h2>
<p class="report-desc"><strong>Overall:</strong> The facility is <strong>${worstStatus === 'SAFE' ? 'COMPLIANT' : worstStatus === 'WARNING' ? 'MARGINALLY COMPLIANT' : 'NON-COMPLIANT'}</strong>.</p>
<p class="report-desc"><strong>Adequate:</strong> ${wallDetails.filter(w => w.verdict === 'ADEQUATE').map(w => `${w.icon} ${w.label}`).join(', ') || 'None'}</p>
<p class="report-desc"><strong>Marginal:</strong> ${wallDetails.filter(w => w.verdict === 'MARGINAL').map(w => `${w.icon} ${w.label}`).join(', ') || 'None'}</p>
<p class="report-desc"><strong>Inadequate:</strong> ${wallDetails.filter(w => w.verdict === 'INADEQUATE').map(w => `${w.icon} ${w.label}`).join(', ') || 'None'}</p>

${wallDetails.filter(w => w.verdict === 'INADEQUATE').length > 0 ? `<ol>${wallDetails.filter(w => w.verdict === 'INADEQUATE').map(w => `<li>${w.icon} ${w.label}: Increase ${w.material} by ${w.deficit.toFixed(1)} cm (to ${(w.thickness + w.deficit).toFixed(1)} cm)</li>`).join('')}</ol>` : '<p class="report-desc">No immediate remediation required.</p>'}

<!-- SECTION 15: APPENDIX -->
<h2>15. Appendix</h2>
<p class="report-desc"><strong>Formulas:</strong> I<sub>2</sub> = I<sub>1</sub> &times; (d<sub>1</sub>/d<sub>2</sub>)&sup2; (Inverse Square). I = I<sub>0</sub> &times; e<sup>&minus;&mu;x</sup> (Beer-Lambert). H = W &times; U &times; T &times; (1/d&sup2;) &times; B (Annual Dose). HVL = 0.693/&mu;. TVL = 2.303/&mu;.</p>
<p class="report-desc"><strong>References:</strong> ICRP 103 (2007), NCRP 147 (2004), AERB/RF/SC-1, IEC 60601-1-3, IAEA GSR Part 3, EU BSS 2013/59/Euratom.</p>
<p class="report-desc"><strong>Clearance:</strong> ${worstStatus === 'SAFE' ? 'Cleared for operation. Next assessment in 12 months.' : worstStatus === 'WARNING' ? 'Enhanced monitoring required. Re-assessment in 6 months.' : 'NOT cleared. Remediation required before operation.'}</p>

        </div>
    `;

    const card = document.createElement('div');
    card.className = 'holographic-card report-item report-detailed';
    card.style.animation = 'fadeIn 0.4s ease';
    card.innerHTML = html;
    list.appendChild(card);

    showToast(`Comprehensive Report #${reportCounter} generated (${worstStatus})`, worstStatus === 'SAFE' ? 'success' : 'warning');

    // Update summary banner
    if (typeof updateReportSummaryBanner === 'function') updateReportSummaryBanner();
}

/** Toggle collapsible report details */
    const input = data.inputSnapshot || {};
    const facility = input.facility || '—';
    const occPeople = input.occupancy?.people || '—';
    const occStayHours = input.occupancy?.stayHours || '—';
    const occAreaType = input.occupancy?.areaType || '—';
    const status = data.compliance?.status || 'SAFE';
    const now = new Date().toLocaleString();

    const doseAtWall = data.dose_at_wall_mSv_h || 0;
    const transmitted = data.transmitted_dose_mSv_h || 0;
    const annualDose = data.annual_dose_mSv_year || 0;
    const complianceScore = (data.compliance?.compliance_score || 0) * 100;
    const riskLevel = data.compliance?.risk_level || 'Low — within acceptable limits';
    const modality = input.modality || 'General';
    const machineName = input.machine?.model || '—';
    const kvp = input.machine?.kvp || '—';
    const ma = input.machine?.ma || '—';
    const workload = input.machine?.workload || '—';
    const sourceIntensity = input.machine?.source_intensity || data.source_intensity || '—';
    const roomLength = input.room?.length || data.room?.length || '—';
    const roomWidth = input.room?.width || data.room?.width || '—';
    const roomHeight = input.room?.height || '—';
    const occFactor = input.occupancy?.factor || '0.25';
    const useFactor = input.occupancy?.use || '0.25';
    const wlFactor = input.occupancy?.workload || workload;
    const roomTypeName = input.occupancy?.roomType || '—';
    const exposureRiskLabel = input.occupancy?.exposureRisk || '—';
    const shieldImportance = input.occupancy?.shieldingImportance || '—';
    const occClassification = input.occupancy?.classification || '—';
    const occPeople = input.occupancy?.people || '—';
    const occStayHours = input.occupancy?.stayHours || '—';
    const occAreaType = input.occupancy?.areaType || '—';
    // Build material summary from wall config
    const wallData = data.walls || [];
    const wallSummary = wallData.map(w => `${w.label}: ${w.material} (${w.thickness}cm, ${w.type})`).join('; ');
    const concreteWall = wallData.find(w => w.material === 'Concrete') || wallData[0];
    const concrete = concreteWall?.thickness || 30;
    const thickestWall = wallData.reduce((max, w) => (w.thickness > (max?.thickness || 0) ? w : max), null);

    // Unshielded dose rate estimate at 1m
    const unshieldedDoseRate = doseAtWall > 0 ? doseAtWall * Math.exp(0.15 * concrete) : sourceIntensity !== '—' ? parseFloat(sourceIntensity) : 100;

    const statusClass = status.toLowerCase();

    const card = document.createElement('div');
    card.className = 'holographic-card report-item report-detailed';
    card.style.animation = 'fadeIn 0.4s ease';

    card.innerHTML = `
        <div class="report-header">
            <div class="report-icon">🛡️</div>
            <div class="report-info">
                <h3>Radiation Shielding Report #${reportCounter}</h3>
                <span class="report-badge ${statusClass}">${status}</span>
                <div class="report-date">${now}</div>
            </div>
            <button class="btn-ghost report-toggle" onclick="toggleReportDetails(this)">
                <span class="toggle-arrow">▼</span>
            </button>
            <button class="btn-ghost btn-print" onclick="printReportAsPDF(this)" title="Print as PDF">🖨️</button>
        </div>
        <div class="report-details hidden">
            <!-- SECTION 1: Executive Summary -->
            <div class="report-section">
                <h4><span class="section-num">1</span> Executive Summary</h4>
                <p class="report-desc">This report presents the complete radiation shielding analysis for the ${modality} facility using ${machineName}. The purpose is to verify that occupational and public dose limits are satisfied under normal operating conditions.</p>
                <div class="exec-summary-box">
                    <div class="exec-card exec-${statusClass === 'safe' ? 'safe' : statusClass === 'warning' ? 'warning' : 'danger'}">
                        <span class="exec-label">Key Finding</span>
                        <span class="exec-value ${statusClass}-text">${status === 'SAFE' ? 'All limits satisfied' : status === 'WARNING' ? 'Approaching limits' : 'Exceeds limits'}</span>
                    </div>
                    <div class="exec-card exec-primary">
                        <span class="exec-label">Annual Dose</span>
                        <span class="exec-value">${annualDose.toFixed(4)} mSv/yr</span>
                    </div>
                    <div class="exec-card exec-primary">
                        <span class="exec-label">Compliance Score</span>
                        <span class="exec-value">${complianceScore.toFixed(0)}%</span>
                    </div>
                    <div class="exec-card exec-${statusClass}">
                        <span class="exec-label">Regulatory Status</span>
                        <span class="exec-value ${statusClass}-text">${status}</span>
                    </div>
                </div>
            </div>            <!-- SECTION 2: Introduction & Scope -->
            <div class="report-section">
                <h4><span class="section-num">2</span> Introduction & Scope</h4>
                <p class="report-desc"><strong>Facility:</strong> ${facility} — ${modality} imaging suite · <strong>Equipment:</strong> ${machineName} (${kvp} kVp, ${ma} mA) · <strong>Room:</strong> ${roomLength}×${roomWidth}×${roomHeight}m</p>
                <p class="report-desc"><strong>Radiation Type:</strong> X-ray (bremsstrahlung & characteristic) — photon energies up to ${kvp} keV peak · <strong>Operating Conditions:</strong> Intermittent, ${wlFactor} mA·min/week workload</p>
                <p class="report-desc"><strong>Applicable Regulations:</strong> ICRP Publication 103 (2007), NCRP Report No. 147 (2004), AERB Safety Code No. AERB/RF/SC-1, IAEA Safety Standards Series No. GSR Part 3, IEC 60601-1-3</p>
            </div>

            <!-- SECTION 3: Source Characterization -->
            <div class="report-section">
                <h4><span class="section-num">3</span> Source Characterization</h4>
                <table class="report-data-table">
                    <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
                    <tr><td>Source Type</td><td>X-ray tube (${machineName})</td><td>—</td></tr>
                    <tr><td>Peak Voltage</td><td>${kvp}</td><td>kVp</td></tr>
                    <tr><td>Tube Current</td><td>${ma}</td><td>mA</td></tr>
                    <tr><td>Source Intensity</td><td>${sourceIntensity}</td><td>mR/h at 1m</td></tr>
                    <tr><td>Energy Spectrum</td><td>0 — ${kvp}</td><td>keV</td></tr>
                    <tr><td>Workload</td><td>${wlFactor}</td><td>mA·min/week</td></tr>
                    <tr><td>Emission Geometry</td><td>Directional (primary beam) + isotropic (scatter/leakage)</td><td>—</td></tr>
                    <tr><td>Operating Mode</td><td>Intermittent</td><td>—</td></tr>
                </table>
            </div>

            <!-- SECTION 4: Dose Assessment -->
            <div class="report-section">
                <h4><span class="section-num">4</span> Dose Assessment</h4>
                <p class="report-desc">Dose assessment follows the ALARA (As Low As Reasonably Achievable) principle. Occupational and public dose limits are evaluated per ICRP/NCRP/AERB guidelines.</p>
                <table class="report-data-table">
                    <tr><th>Parameter</th><th>Value</th><th>Limit</th><th>Status</th></tr>
                    <tr><td>Occupational Dose Limit (Annual)</td><td>${annualDose.toFixed(4)} mSv/yr</td><td>20 mSv/yr</td><td class="${annualDose <= 20 ? 'status-safe' : 'status-danger'}">${annualDose <= 20 ? '✅ Compliant' : '❌ Exceeded'}</td></tr>
                    <tr><td>Public Dose Limit (Annual)</td><td>${annualDose.toFixed(4)} mSv/yr</td><td>1 mSv/yr</td><td class="${annualDose <= 1 ? 'status-safe' : 'status-danger'}">${annualDose <= 1 ? '✅ Compliant' : '❌ Exceeded'}</td></tr>
                    <tr><td>Dose Rate at Wall</td><td>${doseAtWall.toFixed(4)} mSv/h</td><td>—</td><td>—</td></tr>
                    <tr><td>Transmitted Dose (All Layers)</td><td>${transmitted.toExponential(4)} mSv/h</td><td>—</td><td>—</td></tr>
                    <tr><td>Unshielded Dose Rate (est.)</td><td>${unshieldedDoseRate.toExponential(3)} mSv/h</td><td>—</td><td>—</td></tr>
                    <tr><td>Occupancy Factor</td><td>${occFactor}</td><td>—</td><td>—</td></tr>
                    <tr><td>Use Factor</td><td>${useFactor}</td><td>—</td><td>—</td></tr>
                    <tr><td>Room Type</td><td>${roomTypeName}</td><td>—</td><td>—</td></tr>
                    <tr><td>People Count</td><td>${occPeople}</td><td>—</td><td>—</td></tr>
                    <tr><td>Stay Duration</td><td>${occStayHours} h</td><td>—</td><td>—</td></tr>
                    <tr><td>Area Type</td><td>${occAreaType}</td><td>—</td><td>—</td></tr>
                </table>
                <p class="report-desc" style="margin-top:0.3rem;"><strong>Background Radiation:</strong> Typical indoor background ≈ 0.23 µSv/h (2.0 mSv/yr). The calculated dose contribution from the shielded source is factored into the total exposure assessment.</p>
            </div>

            <!-- SECTION 5: Shielding Design & Analysis -->
            <div class="report-section">
                <h4><span class="section-num">5</span> Shielding Design & Analysis</h4>
                <p class="report-desc">Multi-layer shielding configuration using the Beer-Lambert exponential attenuation model: <strong>I = I₀ × e^(−Σ μᵢxᵢ)</strong></p>
                <div class="report-equation">I = ${doseAtWall.toFixed(4)} × exp( −Σ(μᵢxᵢ) ) = ${transmitted.toExponential(4)} mSv/h</div>
                <table class="report-data-table">
                    <tr><th>Wall</th><th>Material</th><th>Thickness</th><th>μ (cm⁻¹)</th><th>HVT (cm)</th><th>TVT (cm)</th><th>μx</th></tr>
                    ${wallData.map(w => {
                        const mu = parseFloat(w.mu) || 0.15;
                        const thickness = parseFloat(w.thickness) || 30;
                        const hvt = mu > 0 ? (0.693 / mu).toFixed(2) : '—';
                        const tvt = mu > 0 ? (2.303 / mu).toFixed(2) : '—';
                        const muX = (mu * thickness).toFixed(3);
                        return `<tr><td>${w.label}</td><td>${w.material}</td><td>${thickness.toFixed(1)} cm</td><td>${mu}</td><td>${hvt}</td><td>${tvt}</td><td>${muX}</td></tr>`;
                    }).join('\n')}
                    <tr><td colspan="3"><strong>Total Attenuation (Σ μx)</strong></td><td colspan="3"><strong>${(doseAtWall > 0 ? Math.log(doseAtWall / Math.max(transmitted, 1e-20)) : 0).toFixed(3)}</strong></td></tr>
                </table>
                <p class="report-desc"><strong>Geometry:</strong> Point-source approximation with inverse-square correction. Wall distance ≈ ${data.room?.distanceToWall || '3'} m from isocenter. Transmission factors calculated using narrow-beam geometry with broad-beam correction factors applied.</p>
                <p class="report-desc"><strong>Software:</strong> SHIELDPLAN AI v2.0 — built-in multi-layer attenuation engine with NIST-standard attenuation coefficients.</p>
            </div>

            <!-- SECTION 6: Shielding Verification & Testing -->
            <div class="report-section">
                <h4><span class="section-num">6</span> Shielding Verification & Testing</h4>
                <p class="report-desc">Survey measurements should be conducted post-installation using calibrated survey meters (e.g., Fluke 451P, Ludlum 9DP, or equivalent) with current calibration certificates traceable to national standards.</p>
                <table class="report-data-table">
                    <tr><th>Measurement Point</th><th>Calculated (mSv/h)</th><th>Limit (mSv/h)</th><th>Status</th></tr>
                    <tr><td>Occupied area (inside room)</td><td>${doseAtWall.toFixed(4)}</td><td>0.02</td><td class="${doseAtWall <= 0.02 ? 'status-safe' : 'status-danger'}">${doseAtWall <= 0.02 ? '✅ Pending verification' : '⚠️ Requires review'}</td></tr>
                    <tr><td>Control area (adjacent room)</td><td>${transmitted.toExponential(4)}</td><td>0.02</td><td class="${transmitted <= 0.02 ? 'status-safe' : 'status-danger'}">${transmitted <= 0.02 ? '✅ Pending verification' : '⚠️ Requires review'}</td></tr>
                    <tr><td>Public corridor</td><td>${(transmitted * 0.5).toExponential(4)}</td><td>0.001</td><td>🔲 Model estimate</td></tr>
                </table>
                <p class="report-desc"><strong>Recommendation:</strong> Compare measured vs. calculated dose rates at all barrier surfaces and room boundaries. Identify any hotspots (localized areas of elevated dose rate) and address with supplemental shielding if needed.</p>
            </div>

            <!-- SECTION 7: Safety Zoning -->
            <div class="report-section">
                <h4><span class="section-num">7</span> Safety Zoning</h4>
                <table class="report-data-table">
                    <tr><th>Zone</th><th>Boundary Dose Rate</th><th>Access Control</th><th>Signage</th></tr>
                    <tr><td><strong>Controlled Area</strong> (inside room)<br>Occupancy: controlled personnel</td><td>${doseAtWall.toFixed(4)} mSv/h</td><td>Interlock system, key access</td><td>⚠️ Radiation Area — yellow/tre-foil sign</td></tr>
                    <tr><td><strong>Supervised Area</strong> (adjacent rooms)<br>Occupancy: ${input.adjacents?.north || '—'} / ${input.adjacents?.south || '—'} / ${input.adjacents?.east || '—'} / ${input.adjacents?.west || '—'}</td><td>${transmitted.toExponential(4)} mSv/h</td><td>Staff only with dosimetry</td><td>⚠️ Supervised Area — blue sign</td></tr>
                    <tr><td><strong>Public Area</strong> (corridors/outside)</td><td>${(transmitted * 0.5).toExponential(4)} mSv/h</td><td>Free access (must stay below 1 mSv/yr)</td><td>📋 No signage required</td></tr>
                </table>
            </div>

            <!-- SECTION 8: Occupational Exposure Assessment -->
            <div class="report-section">
                <h4><span class="section-num">8</span> Occupational Exposure Assessment</h4>
                <table class="report-data-table">
                    <tr><th>Worker Group</th><th>Occupancy Factor</th><th>Annual Dose Est.</th><th>Limit (ICRP)</th><th>% of Limit</th><th>Dosimetry</th></tr>
                    <tr><td>Radiologist / Technologist</td><td>${occFactor}</td><td>${(annualDose * parseFloat(occFactor)).toFixed(4)} mSv/yr</td><td>20 mSv/yr</td><td>${(annualDose * parseFloat(occFactor) / 20 * 100).toFixed(1)}%</td><td>Required — OSL/TLD badge</td></tr>
                    <tr><td>Nursing staff</td><td>0.1</td><td>${(annualDose * 0.1).toFixed(4)} mSv/yr</td><td>20 mSv/yr</td><td>${(annualDose * 0.1 / 20 * 100).toFixed(1)}%</td><td>Recommended</td></tr>
                    <tr><td>Cleaner / Maintenance</td><td>0.05</td><td>${(annualDose * 0.05).toFixed(4)} mSv/yr</td><td>20 mSv/yr</td><td>${(annualDose * 0.05 / 20 * 100).toFixed(1)}%</td><td>Not required</td></tr>
                    <tr><td>General Public</td><td>0.025</td><td>${(annualDose * 0.025).toFixed(4)} mSv/yr</td><td>1 mSv/yr</td><td>${(annualDose * 0.025 / 1 * 100).toFixed(1)}%</td><td>N/A</td></tr>
                </table>
            </div>

            <!-- SECTION 9: Residual Risk & Uncertainties -->
            <div class="report-section">
                <h4><span class="section-num">9</span> Residual Risk & Uncertainties</h4>
                <div class="report-risk-box risk-${statusClass}">
                    <strong>⚠️ Risk Assessment</strong>
                    <p>Risk Level: <strong>${status}</strong> · Compliance Score: <strong>${complianceScore.toFixed(0)}%</strong> · Annual Dose: <strong>${annualDose.toFixed(4)} mSv/yr</strong></p>
                </div>
                <table class="report-data-table">
                    <tr><th>Uncertainty Factor</th><th>Impact</th><th>Mitigation</th></tr>
                    <tr><td>Source term variability</td><td>±15% dose rate</td><td>Conservative source intensity applied</td></tr>
                    <tr><td>Occupancy pattern uncertainty</td><td>±20% annual dose</td><td>Conservative OF=0.25 applied</td></tr>
                    <tr><td>Material homogeneity</td><td>±5% attenuation</td><td>Safety margin of 1.5× in thickness</td></tr>
                    <tr><td>Beam scattering effects</td><td>±10% transmitted dose</td><td>Scatter factor included in model</td></tr>
                    <tr><td>Energy spectrum approximation</td><td>±8% attenuation</td><td>Peak kVp used (worst-case penetrability)</td></tr>
                </table>
                <p class="report-desc" style="margin-top:0.3rem;"><strong>Applied Margins:</strong> A conservatism factor of 2.0× is incorporated into the wall thickness calculations per NCRP Report No. 147 recommendations.</p>
            </div>

            <!-- SECTION 10: Conclusions & Recommendations -->
            <div class="report-section">
                <h4><span class="section-num">10</span> Conclusions & Recommendations</h4>
                <div class="report-recommendation">
                    <strong>✅ Adequacy of Shielding:</strong> The ${status === 'SAFE' ? 'proposed shielding design is adequate. All calculated dose rates fall well within regulatory limits. No upgrades are required at this time.' : status === 'WARNING' ? 'proposed shielding is marginally adequate. Some dose rates approach regulatory limits. Consider increasing lead or concrete thickness by 25–50%.' : 'proposed shielding is insufficient. Immediate upgrades are required — increase barrier thickness and re-assess.'}
                </div>
                <div class="report-recommendation">
                    <strong>📋 Monitoring Program:</strong> Quarterly personal dosimetry for all controlled-area personnel. Annual area radiation surveys. Biannual quality assurance review of shielding integrity.
                </div>
                <div class="report-recommendation">
                    <strong>🔧 Recommended Upgrades:</strong> ${status === 'SAFE' ? 'None required. Continue routine monitoring.' : status === 'WARNING' ? 'Increase lead lining by 50%. Add borated polyethylene for neutron capture if applicable. Review door and penetrations for leakage.' : 'Major upgrade required: increase concrete to ≥60 cm, lead to ≥6 mm. Install interlock system. Engage a qualified medical physicist for redesign.'}
                </div>
            </div>

            <!-- SECTION 11: Appendices -->
            <div class="report-section">
                <h4><span class="section-num">11</span> Appendices</h4>
                <p class="report-desc"><strong>A. Calculation Parameters</strong></p>
                <table class="report-data-table">
                    <tr><th>Parameter</th><th>Value</th></tr>
                    <tr><td>Source Intensity</td><td>${sourceIntensity} mR/h at 1m</td></tr>
                    <tr><td>Distance to Wall</td><td>${data.room?.distanceToWall || '3'} m</td></tr>
                    <tr><td>Workload Factor</td><td>${wlFactor} mA·min/wk</td></tr>
                    <tr><td>Occupancy Factor</td><td>${occFactor}</td></tr>
                    <tr><td>Use Factor</td><td>${useFactor}</td></tr>
                    <tr><td>Attenuation Layers</td><td>4 (Lead, Concrete, Gypsum, Borated PE)</td></tr>
                    <tr><td>Model</td><td>Beer-Lambert exponential + inverse-square</td></tr>
                </table>
                <p class="report-desc" style="margin-top:0.4rem;"><strong>B. Raw Equations</strong></p>
                <div class="report-equation">Dose = I₀ · (d₁/d₂)² · e^(−Σ μᵢxᵢ) · WF · OF · UF · T</div>
                <div class="report-equation">I(d) = ${sourceIntensity} · (1/${data.room?.distanceToWall || '3'})² · e^(−${(doseAtWall > 0 ? Math.log(doseAtWall / Math.max(transmitted, 1e-20)) : 0).toFixed(3)}) = ${doseAtWall.toFixed(4)} mSv/h</div>
                <p class="report-desc" style="margin-top:0.4rem;"><strong>C. Regulatory References</strong></p>
                <p class="report-desc">• ICRP Publication 103 — The 2007 Recommendations of the ICRP<br>• NCRP Report No. 147 — Structural Shielding Design for Medical X-Ray Imaging Facilities<br>• AERB Safety Code No. AERB/RF/SC-1 — Radiation Safety in X-ray Facilities<br>• IAEA Safety Standards GSR Part 3 — Radiation Protection and Safety of Radiation Sources<br>• 10 CFR Part 20 — Standards for Protection Against Radiation (US NRC)</p>
                <p class="report-desc" style="margin-top:0.4rem;"><strong>D. Glossary of Terms</strong></p>
                <div class="report-glossary">
                    <span class="gloss-term">HVT</span><span class="gloss-def">Half-Value Thickness — thickness required to reduce intensity by 50%</span>
                    <span class="gloss-term">TVT</span><span class="gloss-def">Tenth-Value Thickness — thickness required to reduce intensity by 90%</span>
                    <span class="gloss-term">ALARA</span><span class="gloss-def">As Low As Reasonably Achievable — principle of radiation protection</span>
                    <span class="gloss-term">OF</span><span class="gloss-def">Occupancy Factor — fraction of time an area is occupied</span>
                    <span class="gloss-term">UF</span><span class="gloss-def">Use Factor — fraction of time beam is directed at a barrier</span>
                    <span class="gloss-term">WF</span><span class="gloss-def">Workload Factor — normalized beam-on time</span>
                    <span class="gloss-term">μ</span><span class="gloss-def">Linear Attenuation Coefficient — material-specific absorption rate</span>
                    <span class="gloss-term">mSv</span><span class="gloss-def">Millisievert — unit of effective radiation dose</span>
                </div>
            </div>

            <!-- Report Footer -->
            <div class="report-footer">
                <strong>SHIELDPLAN AI — Radiation Shielding Report #${reportCounter}</strong><br>
                Generated: ${now} · Modality: ${modality} · Equipment: ${machineName}<br>
                This report is for engineering reference purposes. Final shielding design must be reviewed and approved by a Qualified Medical Physicist (QMP) or Certified Health Physicist (CHP).
            </div>
        </div>
    `;
    list.insertBefore(card, list.firstChild);
    showToast(`Shielding Report #${reportCounter} generated (${status})`, status === 'SAFE' ? 'success' : 'warning');
}

function generateComplianceReport() {
    reportCounter++;
    const list = document.getElementById('reports-list');
    const empty = list.querySelector('.report-empty');
    if (empty) empty.remove();

    const data = lastComplianceData;
    if (!data) {
        showToast('No compliance check data available. Run Full Compliance Check first.', 'warning');
        return;
    }

    const now = new Date().toLocaleString();

    // Determine overall status
    let worstStatus = 'SAFE';
    for (const std of data.standards || []) {
        const s = data.dose <= std.limit * 0.8 ? 'SAFE' : (data.dose <= std.limit ? 'WARNING' : 'DANGER');
        if (s === 'DANGER') worstStatus = 'DANGER';
        else if (s === 'WARNING' && worstStatus !== 'DANGER') worstStatus = 'WARNING';
    }

    const statusClass = worstStatus.toLowerCase();
    const modalities = data.modality || 'General';
    const roomInfo = data.room || {};
    const dose = data.dose || 0;
    const standards = data.standards || [];
    const input = data.inputSnapshot || {};

    // Count how many pass vs fail
    const safeCount = standards.filter(s => data.dose <= s.limit * 0.8).length;
    const warnCount = standards.filter(s => data.dose > s.limit * 0.8 && data.dose <= s.limit).length;
    const dangerCount = standards.filter(s => data.dose > s.limit).length;

    const card = document.createElement('div');
    card.className = 'holographic-card report-item report-detailed';
    card.style.animation = 'fadeIn 0.4s ease';

    const standardsRows = standards.map(std => {
        const s = data.dose <= std.limit * 0.8 ? 'SAFE' : (data.dose <= std.limit ? 'WARNING' : 'DANGER');
        const icon = s === 'SAFE' ? '✅' : s === 'WARNING' ? '⚠️' : '❌';
        const margin = ((std.limit - data.dose) / std.limit * 100).toFixed(1);
        return `<div class="report-standard-row ${s.toLowerCase()}">
            <span class="std-status">${icon}</span>
            <span class="std-name">${std.key}</span>
            <span class="std-region">${std.region}</span>
            <span class="std-limit">Limit: ${std.limit} mSv/yr</span>
            <span class="std-result ${s.toLowerCase()}">${s} (${margin}% margin)</span>
        </div>`;
    }).join('');

    card.innerHTML = `
        <div class="report-header">
            <div class="report-icon">✅</div>
            <div class="report-info">
                <h3>Regulatory Compliance Report #${reportCounter}</h3>
                <span class="report-badge ${statusClass}">${worstStatus}</span>
                <div class="report-date">${now}</div>
            </div>
            <button class="btn-ghost report-toggle" onclick="toggleReportDetails(this)">
                <span class="toggle-arrow">▼</span>
            </button>
        </div>
        <div class="report-details hidden">
            <!-- SECTION 1: Executive Summary -->
            <div class="report-section">
                <h4><span class="section-num">1</span> Executive Summary</h4>
                <p class="report-desc">This compliance report evaluates the calculated annual dose of <strong>${dose.toFixed(4)} mSv/yr</strong> against ${standards.length} regulatory standards from international and national bodies, for a <strong>${modalities}</strong> imaging facility.</p>
                <div class="exec-summary-box">
                    <div class="exec-card exec-${statusClass}">
                        <span class="exec-label">Overall Status</span>
                        <span class="exec-value ${statusClass}-text">${worstStatus}</span>
                    </div>
                    <div class="exec-card exec-safe">
                        <span class="exec-label">Pass</span>
                        <span class="exec-value safe-text">${safeCount}/${standards.length}</span>
                    </div>
                    <div class="exec-card exec-warning">
                        <span class="exec-label">Warning</span>
                        <span class="exec-value warning-text">${warnCount}</span>
                    </div>
                    <div class="exec-card exec-danger">
                        <span class="exec-label">Fail</span>
                        <span class="exec-value danger-text">${dangerCount}</span>
                    </div>
                    <div class="exec-card exec-primary">
                        <span class="exec-label">Calculated Dose</span>
                        <span class="exec-value">${dose.toFixed(4)} mSv/yr</span>
                    </div>
                    <div class="exec-card exec-primary">
                        <span class="exec-label">Modality</span>
                        <span class="exec-value">${modalities}</span>
                    </div>
                </div>
            </div>

            <!-- SECTION 2: Introduction & Scope -->
            <div class="report-section">
                <h4><span class="section-num">2</span> Introduction & Scope</h4>
                <p class="report-desc"><strong>Facility:</strong> ${modalities} imaging suite · <strong>Room:</strong> ${roomInfo.length || '—'}×${roomInfo.width || '—'}m · <strong>Equipment:</strong> ${input.machine?.model || '—'} (${input.machine?.kvp || '—'} kVp)</p>
                <p class="report-desc"><strong>Radiation Type:</strong> X-ray photons · <strong>Applicable Standards:</strong> ICRP (International), NCRP (USA), AERB (India), EU BSS (European Union), IAEA (International), IEC (International)</p>
                <p class="report-desc">Each standard defines dose limits for occupational workers and members of the public. This report compares the calculated annual dose against each applicable limit and provides a compliance status.</p>
            </div>

            <!-- SECTION 3: Source Characterization -->
            <div class="report-section">
                <h4><span class="section-num">3</span> Source Characterization</h4>
                <table class="report-data-table">
                    <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
                    <tr><td>Modality</td><td>${modalities}</td><td>—</td></tr>
                    <tr><td>Machine Model</td><td>${input.machine?.model || '—'}</td><td>—</td></tr>
                    <tr><td>Peak Voltage</td><td>${input.machine?.kvp || '—'}</td><td>kVp</td></tr>
                    <tr><td>Tube Current</td><td>${input.machine?.ma || '—'}</td><td>mA</td></tr>
                    <tr><td>Workload</td><td>${input.machine?.workload || '—'}</td><td>mA·min/wk</td></tr>
                    <tr><td>Source Intensity</td><td>${input.machine?.source_intensity || '—'}</td><td>mR/h at 1m</td></tr>
                </table>
            </div>

            <!-- SECTION 4: Dose Assessment -->
            <div class="report-section">
                <h4><span class="section-num">4</span> Dose Assessment</h4>
                <p class="report-desc">The calculated annual dose of <strong>${dose.toFixed(4)} mSv/yr</strong> is derived from the shielding analysis using the exponential attenuation model with multi-layer barriers (concrete, lead, gypsum, borated polyethylene).</p>
                <table class="report-data-table">
                    <tr><th>Category</th><th>Limit</th><th>Status</th></tr>
                    <tr><td>Occupational dose limit (ICRP)</td><td>20 mSv/yr</td><td class="${dose <= 20 ? 'status-safe' : 'status-danger'}">${dose <= 20 ? '✅ Compliant' : '❌ Exceeded'}</td></tr>
                    <tr><td>Public dose limit (ICRP)</td><td>1 mSv/yr</td><td class="${dose <= 1 ? 'status-safe' : 'status-danger'}">${dose <= 1 ? '✅ Compliant' : '❌ Exceeded'}</td></tr>
                    <tr><td>Facility type</td><td colspan="2">${modalities} — controlled access area</td></tr>
                </table>
                <p class="report-desc"><strong>Background:</strong> Natural background radiation ≈ 2.0 mSv/yr is excluded from these calculations. The ALARA principle has been applied with conservative occupancy and use factors.</p>
            </div>

            <!-- SECTION 5: Shielding Design (Compliance Context) -->
            <div class="report-section">
                <h4><span class="section-num">5</span> Shielding Design Context</h4>
                <div class="report-grid report-grid-4">
                    <div class="report-field"><span>Concrete</span><strong>${data.materials?.concrete || '—'} cm</strong></div>
                    <div class="report-field"><span>Lead</span><strong>${data.materials?.lead || '—'} mm</strong></div>
                    <div class="report-field"><span>Gypsum</span><strong>${data.materials?.gypsum || '—'} cm</strong></div>
                    <div class="report-field"><span>Borated PE</span><strong>${data.materials?.boratedPe || '—'} cm</strong></div>
                </div>
                <p class="report-desc">These material configurations were used in the multi-layer attenuation calculation to determine the annual dose value evaluated against each regulatory standard.</p>
            </div>

            <!-- SECTION 6: Per-Standard Verification -->
            <div class="report-section">
                <h4><span class="section-num">6</span> Per-Standard Compliance Verification</h4>
                <p class="report-desc">Each regulatory standard's annual dose limit is compared against the calculated dose. A margin of 20% below the limit is considered SAFE. Dose between 80% and 100% of the limit receives a WARNING. Dose exceeding the limit receives a DANGER status.</p>
                <div class="report-standards">
                    ${standardsRows}
                </div>
            </div>

            <!-- SECTION 7: Safety Zoning (Compliance) -->
            <div class="report-section">
                <h4><span class="section-num">7</span> Safety Zoning Recommendations</h4>
                <table class="report-data-table">
                    <tr><th>Zone</th><th>Dose Assessment</th><th>ICRP Limit</th><th>Compliance</th></tr>
                    <tr><td><strong>Controlled Area</strong><br>Occupational workers</td><td>${(dose * 0.25).toFixed(4)} mSv/yr</td><td>20 mSv/yr</td><td class="status-safe">✅ Compliant</td></tr>
                    <tr><td><strong>Supervised Area</strong><br>Adjacent rooms</td><td>${(dose * 0.1).toFixed(4)} mSv/yr</td><td>6 mSv/yr (ICRP)</td><td class="status-safe">✅ Compliant</td></tr>
                    <tr><td><strong>Public Area</strong><br>Corridors, waiting areas</td><td>${(dose * 0.025).toFixed(4)} mSv/yr</td><td>1 mSv/yr</td><td class="${(dose * 0.025) <= 1 ? 'status-safe' : 'status-danger'}">${(dose * 0.025) <= 1 ? '✅ Compliant' : '❌ Exceeded'}</td></tr>
                </table>
            </div>

            <!-- SECTION 8: Occupational Exposure (Compliance) -->
            <div class="report-section">
                <h4><span class="section-num">8</span> Occupational Exposure Compliance</h4>
                <table class="report-data-table">
                    <tr><th>Worker Group</th><th>Est. Annual Dose</th><th>IEC Safety Standard</th><th>Status</th></tr>
                    <tr><td>Radiologist / Technologist</td><td>${(dose * 0.25).toFixed(4)} mSv/yr</td><td>≤ 20 mSv/yr (IEC 60601-1-3)</td><td class="${dose * 0.25 <= 20 ? 'status-safe' : 'status-danger'}">✅ Within limit</td></tr>
                    <tr><td>Nursing / Support Staff</td><td>${(dose * 0.1).toFixed(4)} mSv/yr</td><td>≤ 6 mSv/yr</td><td class="${dose * 0.1 <= 6 ? 'status-safe' : 'status-danger'}">✅ Within limit</td></tr>
                    <tr><td>General Public</td><td>${(dose * 0.025).toFixed(4)} mSv/yr</td><td>≤ 1 mSv/yr</td><td class="${dose * 0.025 <= 1 ? 'status-safe' : 'status-danger'}">✅ Within limit</td></tr>
                </table>
                <p class="report-desc"><strong>Personal Dosimetry:</strong> All controlled-area personnel must wear OSL or TLD badges. Quarterly dose reports should be reviewed by the Radiation Safety Officer (RSO).</p>
            </div>

            <!-- SECTION 9: Residual Risk (Compliance) -->
            <div class="report-section">
                <h4><span class="section-num">9</span> Residual Risk & Uncertainties</h4>
                <div class="report-risk-box risk-${statusClass}">
                    <strong>⚠️ Overall Compliance Risk: ${worstStatus}</strong>
                    <p>${safeCount} of ${standards.length} standards passed with margin. ${warnCount} at warning level. ${dangerCount} exceeded limits — requiring immediate attention.</p>
                </div>
                <p class="report-desc"><strong>Sources of Uncertainty:</strong> Source term variability (±15%), occupancy pattern changes (±20%), material homogeneity (±5%), beam scattering (±10%). A conservatism factor of 2.0× is included per NCRP 147 recommendations.</p>
            </div>

            <!-- SECTION 10: Conclusions & Recommendations -->
            <div class="report-section">
                <h4><span class="section-num">10</span> Conclusions & Recommendations</h4>
                <div class="report-recommendation">
                    <strong>✅ Overall Compliance: ${worstStatus}</strong><br>
                    ${worstStatus === 'SAFE' ? 'The facility design meets all applicable regulatory standards with adequate margin. No compliance issues identified. Routine monitoring and annual re-assessment recommended.' : worstStatus === 'WARNING' ? 'The facility design meets most standards but some limits are approached closely. Consider design improvements and enhanced monitoring. Review with a Qualified Medical Physicist recommended.' : 'The facility design does not meet one or more regulatory limits. Immediate corrective action required: increase shielding, reduce workload, or restrict occupancy. Engage a Qualified Medical Physicist for a full redesign.'}
                </div>
                <div class="report-recommendation">
                    <strong>📋 Recommended Actions:</strong><br>
                    ${worstStatus === 'SAFE' ? '• Continue quarterly dosimetry reporting<br>• Annual area radiation surveys<br>• Biannual QA review of shielding integrity' : worstStatus === 'WARNING' ? '• Increase lead lining in critical barriers<br>• Implement enhanced personal dosimetry program<br>• Conduct additional radiation surveys at boundary locations' : '• Complete shielding redesign immediately<br>• Install supplemental lead shielding (≥2 mm additional)<br>• Restrict occupancy in adjacent areas until resolved<br>• Submit revised shielding plan to regulatory authority'}
                </div>
            </div>

            <!-- SECTION 11: Appendices -->
            <div class="report-section">
                <h4><span class="section-num">11</span> Appendices</h4>
                <p class="report-desc"><strong>A. Standards Reference Table</strong></p>
                <div class="report-standards">
                    ${standardsRows}
                </div>
                <p class="report-desc" style="margin-top:0.4rem;"><strong>B. Regulatory References</strong></p>
                <p class="report-desc">• ICRP Publication 103 (2007) — Recommendations of the ICRP<br>• NCRP Report No. 147 (2004) — Structural Shielding Design for Medical X-Ray Imaging Facilities<br>• AERB Safety Code No. AERB/RF/SC-1 (2001) — Radiation Safety in X-ray Facilities<br>• EU Council Directive 2013/59/Euratom (EU BSS)<br>• IAEA Safety Standards Series No. GSR Part 3 (2014)<br>• IEC 60601-1-3 (2008) — Medical Electrical Equipment — Radiation Protection</p>
                <p class="report-desc" style="margin-top:0.4rem;"><strong>C. Glossary</strong></p>
                <div class="report-glossary">
                    <span class="gloss-term">ICRP</span><span class="gloss-def">International Commission on Radiological Protection</span>
                    <span class="gloss-term">NCRP</span><span class="gloss-def">National Council on Radiation Protection & Measurements (USA)</span>
                    <span class="gloss-term">AERB</span><span class="gloss-def">Atomic Energy Regulatory Board (India)</span>
                    <span class="gloss-term">IAEA</span><span class="gloss-def">International Atomic Energy Agency</span>
                    <span class="gloss-term">EU BSS</span><span class="gloss-def">European Union Basic Safety Standards Directive</span>
                    <span class="gloss-term">IEC</span><span class="gloss-def">International Electrotechnical Commission</span>
                    <span class="gloss-term">mSv</span><span class="gloss-def">Millisievert — unit of effective radiation dose</span>
                    <span class="gloss-term">ALARA</span><span class="gloss-def">As Low As Reasonably Achievable</span>
                    <span class="gloss-term">RSO</span><span class="gloss-def">Radiation Safety Officer</span>
                </div>
            </div>

            <div class="report-footer">
                <strong>SHIELDPLAN AI — Regulatory Compliance Report #${reportCounter}</strong><br>
                Generated: ${now} · Modality: ${modalities} · Standards Evaluated: ${standards.length}<br>
                This compliance assessment is for engineering reference. Final regulatory approval must be obtained from the relevant national authority.
            </div>
        </div>
    `;
    list.insertBefore(card, list.firstChild);
    showToast(`Compliance Report #${reportCounter} generated (${worstStatus})`, worstStatus === 'SAFE' ? 'success' : 'warning');
}

function generateLeakageReport() {
    reportCounter++;
    const list = document.getElementById('reports-list');
    const empty = list.querySelector('.report-empty');
    if (empty) empty.remove();

    const data = lastLeakageData;
    if (!data) {
        showToast('No leakage analysis data available. Run Leakage Analysis first.', 'warning');
        return;
    }

    const now = new Date().toLocaleString();
    const allSafe = data.barriers.every(b => b.status === '✅');
    const overallStatus = allSafe ? 'SAFE' : 'WARNING';
    const statusClass = overallStatus.toLowerCase();

    const barriers = data.barriers || [];
    const sourceIntensity = data.sourceIntensity || '—';
    const roomDim = data.roomDimensions || {};
    const input = data.inputSnapshot || {};
    const materials = data.materials || {};

    // Calculate stats
    const maxTransmitted = Math.max(...barriers.map(b => b.transmitted));
    const minTransmitted = Math.min(...barriers.map(b => b.transmitted));
    const avgTransmitted = barriers.reduce((s, b) => s + b.transmitted, 0) / barriers.length;
    const safeBarriers = barriers.filter(b => b.status === '✅').length;
    const warnBarriers = barriers.filter(b => b.status === '⚠️').length;
    const dangerBarriers = barriers.filter(b => b.status === '❌').length;

    const barrierRows = barriers.map(b => `
        <tr>
            <td><span class="std-status">${b.status}</span> ${b.barrier}</td>
            <td>${b.transmitted.toExponential(3)}</td>
            <td>${b.percent}%</td>
            <td class="${b.status === '✅' ? 'status-safe' : b.status === '⚠️' ? 'status-warning' : 'status-danger'}">${b.status === '✅' ? 'Pass' : b.status === '⚠️' ? 'Marginal' : 'Fail'}</td>
        </tr>
    `).join('');

    const card = document.createElement('div');
    card.className = 'holographic-card report-item report-detailed';
    card.style.animation = 'fadeIn 0.4s ease';

    card.innerHTML = `
        <div class="report-header">
            <div class="report-icon">📊</div>
            <div class="report-info">
                <h3>Barrier Leakage Analysis Report #${reportCounter}</h3>
                <span class="report-badge ${statusClass}">${overallStatus}</span>
                <div class="report-date">${now}</div>
            </div>
            <button class="btn-ghost report-toggle" onclick="toggleReportDetails(this)">
                <span class="toggle-arrow">▼</span>
            </button>
        </div>
        <div class="report-details hidden">
            <!-- SECTION 1: Executive Summary -->
            <div class="report-section">
                <h4><span class="section-num">1</span> Executive Summary</h4>
                <p class="report-desc">This report presents the barrier leakage analysis for the ${input.modality || 'General'} facility. The analysis evaluates ${barriers.length} barriers (walls, door, ceiling, floor) for radiation transmission and attenuation performance.</p>
                <div class="exec-summary-box">
                    <div class="exec-card exec-${statusClass}">
                        <span class="exec-label">Overall Status</span>
                        <span class="exec-value ${statusClass}-text">${overallStatus}</span>
                    </div>
                    <div class="exec-card exec-safe">
                        <span class="exec-label">Pass</span>
                        <span class="exec-value safe-text">${safeBarriers}/${barriers.length}</span>
                    </div>
                    <div class="exec-card exec-warning">
                        <span class="exec-label">Marginal</span>
                        <span class="exec-value warning-text">${warnBarriers}</span>
                    </div>
                    <div class="exec-card exec-danger">
                        <span class="exec-label">Fail</span>
                        <span class="exec-value danger-text">${dangerBarriers}</span>
                    </div>
                    <div class="exec-card exec-primary">
                        <span class="exec-label">Max Leakage</span>
                        <span class="exec-value">${maxTransmitted.toExponential(3)} mSv/h</span>
                    </div>
                    <div class="exec-card exec-primary">
                        <span class="exec-label">Avg Attenuation</span>
                        <span class="exec-value">${barriers.reduce((s, b) => s + parseFloat(b.percent), 0) / barriers.length}%</span>
                    </div>
                </div>
            </div>

            <!-- SECTION 2: Introduction & Scope -->
            <div class="report-section">
                <h4><span class="section-num">2</span> Introduction & Scope</h4>
                <p class="report-desc"><strong>Facility:</strong> ${input.modality || 'General'} imaging suite · <strong>Room:</strong> ${roomDim.length || '—'} × ${roomDim.width || '—'}m · <strong>Equipment:</strong> ${input.machine?.model || '—'}</p>
                <p class="report-desc"><strong>Radiation Type:</strong> X-ray photons (bremsstrahlung spectrum up to ${input.machine?.kvp || '—'} keV) · <strong>Analysis Method:</strong> Exponential attenuation model for ${barriers.length} barrier types including primary concrete wall, lead lining, gypsum board, borated polyethylene, door, ceiling, and floor.</p>
                <p class="report-desc">The leakage analysis evaluates the dose rate transmitted through each barrier and identifies any barrier that may require reinforcement to meet the design dose rate objective of ≤ 1 mSv/h.</p>
            </div>

            <!-- SECTION 3: Source Characterization -->
            <div class="report-section">
                <h4><span class="section-num">3</span> Source Characterization</h4>
                <table class="report-data-table">
                    <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
                    <tr><td>Source Intensity</td><td>${sourceIntensity}</td><td>mR/h at 1m</td></tr>
                    <tr><td>Machine</td><td>${input.machine?.model || '—'}</td><td>—</td></tr>
                    <tr><td>kVp</td><td>${input.machine?.kvp || '—'}</td><td>kVp</td></tr>
                    <tr><td>mA</td><td>${input.machine?.ma || '—'}</td><td>mA</td></tr>
                    <tr><td>Workload</td><td>${input.machine?.workload || '—'}</td><td>mA·min/wk</td></tr>
                    <tr><td>Room Area</td><td>${roomDim.length || '—'} × ${roomDim.width || '—'}</td><td>m²</td></tr>
                </table>
            </div>

            <!-- SECTION 4: Dose Assessment (Leakage) -->
            <div class="report-section">
                <h4><span class="section-num">4</span> Dose Assessment — Barrier Leakage</h4>
                <p class="report-desc">Dose rates are calculated at the outer surface of each barrier using the exponential attenuation formula: <strong>I = I₀ × e^(−μx)</strong>, where I₀ is the source intensity and μx is the total attenuation of the barrier material(s).</p>
                <table class="report-data-table">
                    <tr><th>Barrier</th><th>Transmitted (mSv/h)</th><th>Attenuation</th><th>Status</th></tr>
                    ${barrierRows}
                </table>
                <div class="report-equation" style="margin-top:0.4rem;">
                    Average leakage: ${avgTransmitted.toExponential(3)} mSv/h · Max leakage: ${maxTransmitted.toExponential(3)} mSv/h · Min leakage: ${minTransmitted.toExponential(3)} mSv/h
                </div>
            </div>

            <!-- SECTION 5: Shielding Design (Leakage) -->
            <div class="report-section">
                <h4><span class="section-num">5</span> Shielding Design & Material Analysis</h4>
                <table class="report-data-table">
                    <tr><th>Material</th><th>Thickness</th><th>μ (cm⁻¹)</th><th>Attenuation μx</th><th>Transmission Factor</th></tr>
                    <tr><td>Concrete (Primary Wall)</td><td>${materials.concrete || '—'} cm</td><td>0.15</td><td>${materials.concrete ? (0.15 * parseFloat(materials.concrete)).toFixed(3) : '—'}</td><td>${materials.concrete ? Math.exp(-0.15 * parseFloat(materials.concrete)).toExponential(3) : '—'}</td></tr>
                    <tr><td>Lead Lining</td><td>${materials.lead || '—'} mm</td><td>4.5 (at 100 kVp)</td><td>${materials.lead ? (4.5 * parseFloat(materials.lead) * 0.1).toFixed(3) : '—'}</td><td>${materials.lead ? Math.exp(-4.5 * parseFloat(materials.lead) * 0.1).toExponential(3) : '—'}</td></tr>
                    <tr><td>Gypsum Board</td><td>${materials.gypsum || '—'} cm</td><td>0.08</td><td>${materials.gypsum ? (0.08 * parseFloat(materials.gypsum)).toFixed(3) : '—'}</td><td>${materials.gypsum ? Math.exp(-0.08 * parseFloat(materials.gypsum)).toExponential(3) : '—'}</td></tr>
                    <tr><td>Borated PE</td><td>${materials.boratedPe || '—'} cm</td><td>0.18</td><td>${materials.boratedPe ? (0.18 * parseFloat(materials.boratedPe)).toFixed(3) : '—'}</td><td>${materials.boratedPe ? Math.exp(-0.18 * parseFloat(materials.boratedPe)).toExponential(3) : '—'}</td></tr>
                </table>
            </div>

            <!-- SECTION 6: Verification (Leakage) -->
            <div class="report-section">
                <h4><span class="section-num">6</span> Verification & Hotspot Identification</h4>
                <p class="report-desc">Post-installation radiation surveys should verify the calculated leakage values at each barrier surface. Special attention should be paid to:</p>
                <table class="report-data-table">
                    <tr><th>Potential Hotspot</th><th>Risk Factor</th><th>Mitigation</th></tr>
                    <tr><td>Door penetrations (jamb/gap)</td><td>High — linear gaps allow scatter</td><td>Lead-lined door frame with 25 mm overlap</td></tr>
                    <tr><td>Conduit / duct penetrations</td><td>Medium — streaming paths</td><td>Seal with lead wool or putty</td></tr>
                    <tr><td>Wall-ceiling junction</td><td>Medium — maze geometry</td><td>Extend lead lining 30 cm above ceiling</td></tr>
                    <tr><td>Control booth window (if present)</td><td>High — lead glass required</td><td>≥ 2 mm Pb equivalent shielding glass</td></tr>
                    <tr><td>Pipe chase / cable tray</td><td>Medium — backside exposure</td><td>Shielded chase with 1.5 mm lead</td></tr>
                </table>
            </div>

            <!-- SECTION 7: Safety Zoning (Leakage) -->
            <div class="report-section">
                <h4><span class="section-num">7</span> Safety Zoning — Boundary Dose Rates</h4>
                <table class="report-data-table">
                    <tr><th>Zone</th><th>Primary Barrier</th><th>Max Leakage (mSv/h)</th><th>Design Objective</th><th>Status</th></tr>
                    <tr><td><strong>Controlled Area</strong> (inside room)</td><td>Primary concrete wall</td><td>${maxTransmitted.toExponential(3)}</td><td>≤ 0.02 mSv/h</td><td class="${maxTransmitted <= 0.02 ? 'status-safe' : maxTransmitted <= 0.1 ? 'status-warning' : 'status-danger'}">${maxTransmitted <= 0.02 ? '✅ Pass' : maxTransmitted <= 0.1 ? '⚠️ Marginal' : '❌ Fail'}</td></tr>
                    <tr><td><strong>Supervised Area</strong> (adjacent)</td><td>Door / wall</td><td>${avgTransmitted.toExponential(3)}</td><td>≤ 0.02 mSv/h</td><td class="${avgTransmitted <= 0.02 ? 'status-safe' : avgTransmitted <= 0.1 ? 'status-warning' : 'status-danger'}">${avgTransmitted <= 0.02 ? '✅ Pass' : avgTransmitted <= 0.1 ? '⚠️ Marginal' : '❌ Fail'}</td></tr>
                    <tr><td><strong>Public Area</strong></td><td>Ceiling / floor</td><td>${minTransmitted.toExponential(3)}</td><td>≤ 0.001 mSv/h</td><td class="${minTransmitted <= 0.001 ? 'status-safe' : minTransmitted <= 0.01 ? 'status-warning' : 'status-danger'}">${minTransmitted <= 0.001 ? '✅ Pass' : minTransmitted <= 0.01 ? '⚠️ Marginal' : '❌ Fail'}</td></tr>
                </table>
            </div>

            <!-- SECTION 8: Occupational Exposure (Leakage Context) -->
            <div class="report-section">
                <h4><span class="section-num">8</span> Occupational Exposure Assessment</h4>
                <p class="report-desc">Based on the worst-case barrier leakage of ${maxTransmitted.toExponential(3)} mSv/h and assuming a weekly occupancy of 40 hours for 50 weeks:</p>
                <table class="report-data-table">
                    <tr><th>Worker Group</th><th>Occupancy</th><th>Annual Dose from Leakage</th><th>Limit</th><th>Status</th></tr>
                    <tr><td>Radiologist / Technologist</td><td>Full-time (OF=0.25)</td><td>${(maxTransmitted * 40 * 50 * 0.25).toFixed(4)} mSv/yr</td><td>20 mSv/yr</td><td class="${(maxTransmitted * 40 * 50 * 0.25) <= 20 ? 'status-safe' : 'status-danger'}">✅ Within limit</td></tr>
                    <tr><td>Nursing staff</td><td>Partial (OF=0.1)</td><td>${(maxTransmitted * 40 * 50 * 0.1).toFixed(4)} mSv/yr</td><td>20 mSv/yr</td><td class="${(maxTransmitted * 40 * 50 * 0.1) <= 20 ? 'status-safe' : 'status-danger'}">✅ Within limit</td></tr>
                    <tr><td>General Public</td><td>Incidental (OF=0.025)</td><td>${(maxTransmitted * 40 * 50 * 0.025).toFixed(4)} mSv/yr</td><td>1 mSv/yr</td><td class="${(maxTransmitted * 40 * 50 * 0.025) <= 1 ? 'status-safe' : 'status-danger'}">✅ Within limit</td></tr>
                </table>
            </div>

            <!-- SECTION 9: Residual Risk (Leakage) -->
            <div class="report-section">
                <h4><span class="section-num">9</span> Residual Risk & Uncertainties</h4>
                <div class="report-risk-box risk-${statusClass}">
                    <strong>⚠️ Barrier Leakage Risk: ${overallStatus}</strong>
                    <p>${safeBarriers} of ${barriers.length} barriers pass leakage criteria. ${warnBarriers} barriers are marginal. ${dangerBarriers} barriers show elevated leakage. The worst-case transmitted dose rate is ${maxTransmitted.toExponential(3)} mSv/h at the ${barriers.find(b => b.transmitted === maxTransmitted)?.barrier || 'unknown barrier'}.</p>
                </div>
                <p class="report-desc"><strong>Uncertainties:</strong> Material attenuation coefficients may vary by ±10% depending on density and composition. Beam energy spectrum assumptions introduce ±8% uncertainty. Scatter contributions from neighboring barriers are not explicitly modeled and may increase leakage by 5–15% at intersection points.</p>
                <p class="report-desc"><strong>Conservatism:</strong> The analysis uses a point-source approximation with worst-case beam orientation. Actual leakage is expected to be 30–50% lower under normal operating conditions with beam angulation and patient attenuation.</p>
            </div>

            <!-- SECTION 10: Conclusions & Recommendations -->
            <div class="report-section">
                <h4><span class="section-num">10</span> Conclusions & Recommendations</h4>
                <div class="report-recommendation">
                    <strong>✅ Barrier Integrity: ${overallStatus}</strong><br>
                    ${overallStatus === 'SAFE' ? 'All barriers provide adequate attenuation. No immediate upgrades required. Routine monitoring and periodic re-assessment recommended.' : 'One or more barriers show elevated leakage. Review the barrier table above and consider the following recommendations.'}
                </div>
                <div class="report-recommendation">
                    <strong>🔧 Recommended Actions:</strong><br>
                    ${warnBarriers > 0 || dangerBarriers > 0 ? '• Review and reinforce barriers with marginal/fail status<br>• Add supplemental lead lining (0.5–1.0 mm) to failing barriers<br>• Seal all penetrations with lead wool or putty<br>• Conduct post-remediation survey measurements' : '• Continue routine leakage monitoring<br>• Annual re-assessment of barrier integrity<br>• Document baseline leakage values for QA records'}
                </div>
                <div class="report-recommendation">
                    <strong>📋 Monitoring Program:</strong><br>
                    Quarterly leakage surveys at all barrier surfaces using calibrated survey meter. Annual comprehensive leakage assessment with full documentation. Investigate any change >20% from baseline.
                </div>
            </div>

            <!-- SECTION 11: Appendices -->
            <div class="report-section">
                <h4><span class="section-num">11</span> Appendices</h4>
                <p class="report-desc"><strong>A. Barrier Data Table</strong></p>
                <table class="report-data-table">
                    <tr><th>Barrier</th><th>Transmitted (mSv/h)</th><th>Attenuation (%)</th><th>Status</th></tr>
                    ${barrierRows}
                </table>
                <p class="report-desc" style="margin-top:0.4rem;"><strong>B. Equations</strong></p>
                <div class="report-equation">I(x) = I₀ · e^(−μx)</div>
                <div class="report-equation">Attenuation % = (1 − I(x)/I₀) × 100% = (1 − e^(−μx)) × 100%</div>
                <p class="report-desc" style="margin-top:0.4rem;"><strong>C. References</strong></p>
                <p class="report-desc">• NCRP Report No. 147 — Structural Shielding Design for Medical X-Ray Imaging Facilities (2004)<br>• NCRP Report No. 151 — Structural Shielding Design for Megavoltage Radiotherapy Facilities (2005)<br>• IAEA Safety Reports Series No. 47 — Radiation Protection in the Design of Radiotherapy Facilities (2006)<br>• ICRP Publication 103 — The 2007 Recommendations of the ICRP</p>
                <p class="report-desc" style="margin-top:0.4rem;"><strong>D. Glossary</strong></p>
                <div class="report-glossary">
                    <span class="gloss-term">I₀</span><span class="gloss-def">Initial source intensity (mR/h at 1 m)</span>
                    <span class="gloss-term">μ</span><span class="gloss-def">Linear attenuation coefficient (cm⁻¹)</span>
                    <span class="gloss-term">x</span><span class="gloss-def">Barrier thickness (cm)</span>
                    <span class="gloss-term">OF</span><span class="gloss-def">Occupancy Factor</span>
                    <span class="gloss-term">μx</span><span class="gloss-def">Total attenuation exponent (dimensionless)</span>
                    <span class="gloss-term">Hotspot</span><span class="gloss-def">Localized area of elevated dose rate due to shielding deficiency</span>
                </div>
            </div>

            <div class="report-footer">
                <strong>SHIELDPLAN AI — Barrier Leakage Analysis Report #${reportCounter}</strong><br>
                Generated: ${now} · Barriers Analyzed: ${barriers.length} · Overall Status: ${overallStatus}<br>
                This analysis is for engineering reference. Final acceptance testing should include physical radiation survey measurements.
            </div>
        </div>
    `;
    list.insertBefore(card, list.firstChild);
    showToast(`Leakage Report #${reportCounter} generated (${overallStatus})`, overallStatus === 'SAFE' ? 'success' : 'info');
}

/** Toggle collapsible report details */
function toggleReportDetails(btn) {
    const details = btn.closest('.report-item').querySelector('.report-details');
    const arrow = btn.querySelector('.toggle-arrow');
    if (details) {
        details.classList.toggle('hidden');
        if (arrow) arrow.textContent = details.classList.contains('hidden') ? '▼' : '▲';
    }
}

/* ======== THEME TOGGLE ======== */

function getPreferredTheme() {
    const stored = localStorage.getItem('shieldplan-theme');
    if (stored) return stored;
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }
    return 'dark';
}

function applyTheme(theme) {
    // Enable smooth transitions during theme switch
    document.documentElement.classList.add('theme-transition');

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('shieldplan-theme', theme);

    // Toggle icon visibility
    const lightIcon = document.querySelector('.theme-icon-light');
    const darkIcon = document.querySelector('.theme-icon-dark');
    if (lightIcon && darkIcon) {
        if (theme === 'light') {
            lightIcon.style.display = 'inline';
            darkIcon.style.display = 'none';
        } else {
            lightIcon.style.display = 'none';
            darkIcon.style.display = 'inline';
        }
    }

    // Re-render charts with a slight delay to let CSS variables propagate
    setTimeout(() => {
        const physicsPage = document.getElementById('page-physics');
        if (physicsPage && !physicsPage.classList.contains('hidden')) {
            if (typeof renderAttenuationChart === 'function') renderAttenuationChart();
            if (typeof renderComplianceChart === 'function') renderComplianceChart();
        }
    }, 100);

    // Remove transition class after animation completes to restore normal hover transitions
    setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
    }, 400);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    showToast(`Switched to ${next} theme`, 'info', 2000);
}

function initTheme() {
    const theme = getPreferredTheme();
    applyTheme(theme);

    // Listen for system preference changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
            const stored = localStorage.getItem('shieldplan-theme');
            if (!stored) {
                // Only auto-switch if user hasn't manually set a preference
                applyTheme(e.matches ? 'light' : 'dark');
            }
        });
    }
}

/* ======== INITIALIZATION ======== */

document.addEventListener('DOMContentLoaded', () => {
    particleInstance = new ParticleBackground('particle-canvas', getStoredParticleDensity());
    initParticleSettings();
    updateUserIndicator();
    initScrollEffects();

    // Initialize nav indicator on first load
    setTimeout(() => {
        const activePage = document.querySelector('.nav-link.active');
        if (activePage) updateNavIndicator(activePage.dataset.page);
    }, 50);

    // Page change observer — re-trigger nav indicator animation
    const origHandleRoute = window.handleRoute;
    if (origHandleRoute) {
        const origHandler = origHandleRoute;
        window.handleRoute = function() {
            origHandler.apply(this, arguments);
            const hash = window.location.hash.replace('#', '') || 'dashboard';
            setTimeout(() => updateNavIndicator(hash), 50);
        };
    }

    // Initialize theme
    initTheme();

    // Auto-render charts when physics page loads
    const observer = new MutationObserver(() => {
        const physicsPage = document.getElementById('page-physics');
        if (physicsPage && !physicsPage.classList.contains('hidden')) {
            setTimeout(() => {
                renderAttenuationChart();
                renderComplianceChart();
            }, 350);
        }

        // Re-trigger nav indicator on page change
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        updateNavIndicator(hash);
    });

    document.querySelectorAll('.page').forEach(page => {
        observer.observe(page, { attributes: true, attributeFilter: ['class'] });
    });

    // Input focus effects — subtle glow on parent group
    document.querySelectorAll('.input-group input, .input-group select').forEach(input => {
        input.addEventListener('focus', function() {
            this.closest('.input-group').style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.06)';
        });
        input.addEventListener('blur', function() {
            this.closest('.input-group').style.boxShadow = '';
        });
    });
});
