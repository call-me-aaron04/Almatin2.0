/* ==========================================================
   SHIELDPLAN AI — API Client
   Handles all communication with the FastAPI backend
   ========================================================== */

const API_BASE = 'http://localhost:8000/api';

/**
 * Generic fetch wrapper with JWT auth and error handling.
 */
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('shieldplan_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || `API Error: ${response.status}`);
        }

        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            // Backend offline — return local mock data for demo
            console.warn('API offline, using local data:', endpoint);
            return null;
        }
        throw error;
    }
}

/**
 * Store auth token and user info.
 */
function setAuth(token, user) {
    localStorage.setItem('shieldplan_token', token);
    localStorage.setItem('shieldplan_user', JSON.stringify(user));
    updateUserIndicator();
}

/**
 * Clear auth data.
 */
function clearAuth() {
    localStorage.removeItem('shieldplan_token');
    localStorage.removeItem('shieldplan_user');
    updateUserIndicator();
}

/**
 * Check if user is authenticated.
 */
function isAuthenticated() {
    return !!localStorage.getItem('shieldplan_token');
}

/**
 * Get stored user data.
 */
function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem('shieldplan_user'));
    } catch {
        return null;
    }
}

/**
 * Update the user indicator in the navbar.
 */
function updateUserIndicator() {
    const indicator = document.getElementById('user-indicator');
    const authBtn = document.getElementById('auth-btn');
    const user = getStoredUser();

    if (user) {
        indicator.textContent = user.full_name || user.email;
        authBtn.textContent = 'Sign Out';
        authBtn.onclick = () => {
            clearAuth();
            window.location.hash = 'login';
            showToast('Signed out successfully', 'info');
        };
    } else {
        indicator.textContent = 'Guest';
        authBtn.textContent = 'Sign In';
        authBtn.onclick = () => { window.location.hash = 'login'; };
    }
}

/* ======== AUTH API ======== */

async function apiSignup(data) {
    const result = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (result) {
        setAuth(result.access_token, result.user);
    }
    return result;
}

async function apiLogin(data) {
    const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (result) {
        setAuth(result.access_token, result.user);
    }
    return result;
}

async function apiGetMe() {
    return await apiRequest('/auth/me');
}

/* ======== MODALITY API ======== */

async function apiGetModalities() {
    const result = await apiRequest('/modalities/');
    if (result) return result;

    // Fallback default modalities
    return [
        { id: 1, name: 'XR', description: 'X-Ray Radiography' },
        { id: 2, name: 'Cath Lab', description: 'Cardiac Catheterization Lab' },
        { id: 3, name: 'CT', description: 'Computed Tomography' },
        { id: 4, name: 'PET-CT', description: 'Positron Emission Tomography - CT' },
        { id: 5, name: 'Cyclotron', description: 'Cyclotron Facility' },
        { id: 6, name: 'LINAC', description: 'Linear Accelerator' },
        { id: 7, name: 'Gamma Room', description: 'Gamma Irradiation Room' },
        { id: 8, name: 'Neutron Facility', description: 'Neutron Generator Facility' },
    ];
}

async function apiGetCompanies(modality) {
    const result = await apiRequest(`/companies/${encodeURIComponent(modality)}`);
    if (result) return result;

    // Fallback data
    const companies = {
        'Cath Lab': ['Siemens', 'Philips', 'GE', 'Canon', 'Shimadzu'],
        'CT': ['Siemens', 'GE', 'Philips', 'Canon'],
        'XR': ['Siemens', 'GE', 'Philips', 'Canon'],
        'PET-CT': ['Siemens', 'GE', 'Philips'],
        'LINAC': ['Varian', 'Elekta', 'Siemens'],
        'Cyclotron': ['GE', 'Siemens', 'IBA'],
        'Gamma Room': ['Elekta', 'Varian'],
        'Neutron Facility': ['Thermo Fisher', 'Phoenix'],
    };
    return (companies[modality] || []).map((name, i) => ({
        id: i + 1,
        modality_id: 1,
        company_name: name,
    }));
}

async function apiGetMachines(company, modality) {
    const result = await apiRequest(`/machines/${encodeURIComponent(company)}/${encodeURIComponent(modality)}`);
    if (result) return result;

    // Fallback data
    const machines = {
        Siemens: {
            'Cath Lab': [
                { model_name: 'Artis Zee', kvp: 125, ma: 1000, workload: 500, source_intensity: 150, scatter_factor: 0.001 },
                { model_name: 'Artis Q', kvp: 125, ma: 1000, workload: 500, source_intensity: 140, scatter_factor: 0.0009 },
                { model_name: 'Artis Pheno', kvp: 125, ma: 1000, workload: 500, source_intensity: 130, scatter_factor: 0.0008 },
            ],
            'CT': [
                { model_name: 'SOMATOM Force', kvp: 150, ma: 1300, workload: 1000, source_intensity: 350, scatter_factor: 0.002 },
                { model_name: 'SOMATOM Drive', kvp: 140, ma: 1000, workload: 800, source_intensity: 280, scatter_factor: 0.0015 },
            ],
        },
        GE: {
            'CT': [
                { model_name: 'Revolution EVO', kvp: 140, ma: 1200, workload: 900, source_intensity: 320, scatter_factor: 0.0018 },
                { model_name: 'Revolution Maxima', kvp: 140, ma: 1000, workload: 800, source_intensity: 280, scatter_factor: 0.0015 },
                { model_name: 'Optima CT660', kvp: 140, ma: 800, workload: 700, source_intensity: 240, scatter_factor: 0.0012 },
            ],
        },
    };

    const companyMachines = (machines[company] && machines[company][modality]) || [
        { model_name: `${company} ${modality} Standard`, kvp: 120, ma: 800, workload: 500, source_intensity: 100, scatter_factor: 0.001 },
    ];

    return companyMachines.map((m, i) => ({
        id: i + 1,
        company_id: 1,
        modality_id: 1,
        ...m,
    }));
}

async function apiGetMachine(id) {
    return await apiRequest(`/machines/${id}`);
}

/* ======== SHIELDING API ======== */

async function apiCalculateShielding(data) {
    const result = await apiRequest('/shielding/calculate-shielding', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (result) return result;

    // Client-side fallback calculation
    const doseAtWall = data.source_intensity * Math.pow(data.source_distance / data.wall_distance, 2);
    const transmitted = doseAtWall * Math.exp(-(data.mu || 0.15) * (data.wall_thickness || 30));
    const annualDose = transmitted * (data.workload_factor || 0.5) * (data.occupancy_factor || 0.25) * (data.use_factor || 0.25) * 40 * 50;

    const status = annualDose <= 20 ? 'SAFE' : annualDose <= 50 ? 'WARNING' : 'DANGER';

    return {
        dose_at_wall_mSv_h: doseAtWall,
        transmitted_dose_mSv_h: transmitted,
        annual_dose_mSv_year: annualDose,
        compliance: {
            status,
            calculated_dose_mSv_year: annualDose,
            limit_dose_mSv_year: 20,
            compliance_score: status === 'SAFE' ? 1.0 : status === 'WARNING' ? 0.5 : 0.0,
        },
    };
}

async function apiCalculateLeakage(data) {
    return await apiRequest('/shielding/calculate-leakage', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

async function apiValidateCompliance(data) {
    return await apiRequest('/shielding/validate-compliance', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

async function apiRecommendShielding(data) {
    return await apiRequest('/shielding/recommend-shielding', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/* ======== MATERIALS API ======== */

async function apiGetMaterials(search) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const result = await apiRequest(`/materials/${query}`);
    if (result) return result;

    // Fallback mock materials
    return [
        { id: 1, material_name: 'Concrete', density: 2.35, attenuation_coefficient: 0.15, hvt: 4.6, tvt: 15.4, cost_factor: 1.0 },
        { id: 2, material_name: 'Lead', density: 11.34, attenuation_coefficient: 4.5, hvt: 0.15, tvt: 0.51, cost_factor: 15.0 },
        { id: 3, material_name: 'Steel', density: 7.85, attenuation_coefficient: 1.5, hvt: 0.46, tvt: 1.54, cost_factor: 8.0 },
        { id: 4, material_name: 'Gypsum', density: 1.2, attenuation_coefficient: 0.08, hvt: 8.7, tvt: 28.8, cost_factor: 0.6 },
        { id: 5, material_name: 'Brick', density: 1.8, attenuation_coefficient: 0.12, hvt: 5.8, tvt: 19.2, cost_factor: 0.8 },
        { id: 6, material_name: 'Borated PE', density: 1.05, attenuation_coefficient: 0.18, hvt: 3.85, tvt: 12.8, cost_factor: 5.0 },
        { id: 7, material_name: 'Glass', density: 2.5, attenuation_coefficient: 0.2, hvt: 3.5, tvt: 11.5, cost_factor: 3.0 },
    ];
}

async function apiGetMaterial(id) {
    return await apiRequest(`/materials/${id}`);
}

/* ======== REGULATORY STANDARDS API ======== */

async function apiGetStandards(filters = {}) {
    const params = new URLSearchParams();
    if (filters.standard_name) params.set('standard_name', filters.standard_name);
    if (filters.person_type) params.set('person_type', filters.person_type);
    if (filters.modality) params.set('modality', filters.modality);
    const query = params.toString() ? `?${params.toString()}` : '';
    const result = await apiRequest(`/standards/${query}`);
    if (result) return result;

    // Fallback — concise standard limits
    return [
        { standard_name: 'ICRP', person_type: 'worker', modality: null, dose_limit_mSv_year: 20, region: 'International' },
        { standard_name: 'ICRP', person_type: 'public', modality: null, dose_limit_mSv_year: 1, region: 'International' },
        { standard_name: 'NCRP', person_type: 'worker', modality: null, dose_limit_mSv_year: 50, region: 'USA' },
        { standard_name: 'NCRP', person_type: 'public', modality: null, dose_limit_mSv_year: 1, region: 'USA' },
        { standard_name: 'AERB', person_type: 'worker', modality: null, dose_limit_mSv_year: 20, region: 'India' },
        { standard_name: 'AERB', person_type: 'public', modality: null, dose_limit_mSv_year: 1, region: 'India' },
        { standard_name: 'IEC', person_type: 'patient', modality: 'CT', dose_limit_mSv_year: 20, region: 'International' },
        { standard_name: 'EU BSS', person_type: 'worker', modality: null, dose_limit_mSv_year: 20, region: 'EU' },
        { standard_name: 'EU BSS', person_type: 'public', modality: null, dose_limit_mSv_year: 1, region: 'EU' },
        { standard_name: 'IAEA', person_type: 'worker', modality: null, dose_limit_mSv_year: 20, region: 'International' },
        { standard_name: 'IAEA', person_type: 'public', modality: null, dose_limit_mSv_year: 1, region: 'International' },
    ];
}

/* ======== ROOM TEMPLATES API ======== */

async function apiGetRoomTemplates(modality, typicalOnly = false) {
    const params = new URLSearchParams();
    if (modality) params.set('modality', modality);
    if (typicalOnly) params.set('typical_only', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';
    const result = await apiRequest(`/room-templates/${query}`);
    if (result) return result;

    // Fallback room templates
    const templates = {
        'XR': [{ template_name: 'Standard X-Ray Room', room_length_m: 5.0, room_width_m: 4.0, room_height_m: 3.0, is_typical: 1 }],
        'Cath Lab': [{ template_name: 'Standard Cath Lab', room_length_m: 6.0, room_width_m: 5.0, room_height_m: 3.0, is_typical: 1 }],
        'CT': [{ template_name: 'Standard CT Suite', room_length_m: 7.0, room_width_m: 5.0, room_height_m: 3.0, is_typical: 1 }],
        'PET-CT': [{ template_name: 'Standard PET-CT Suite', room_length_m: 7.0, room_width_m: 5.0, room_height_m: 3.0, is_typical: 1 }],
        'LINAC': [{ template_name: 'Standard LINAC Bunker', room_length_m: 8.0, room_width_m: 6.0, room_height_m: 3.5, is_typical: 1 }],
        'Cyclotron': [{ template_name: 'Standard Cyclotron Vault', room_length_m: 10.0, room_width_m: 8.0, room_height_m: 4.0, is_typical: 1 }],
        'Gamma Room': [{ template_name: 'Gamma Knife Suite', room_length_m: 6.0, room_width_m: 5.0, room_height_m: 3.0, is_typical: 1 }],
        'Neutron Facility': [{ template_name: 'Standard Neutron Bunker', room_length_m: 12.0, room_width_m: 8.0, room_height_m: 4.0, is_typical: 1 }],
        'Mammography': [{ template_name: 'Standard Mammo Room', room_length_m: 4.5, room_width_m: 3.5, room_height_m: 2.7, is_typical: 1 }],
        'Fluoroscopy': [{ template_name: 'Standard Fluoro Room', room_length_m: 5.0, room_width_m: 4.0, room_height_m: 2.8, is_typical: 1 }],
    };
    return (templates[modality] || []).map((t, i) => ({ id: i + 1, modality: modality, ...t }));
}

/* ======== DETECTORS API ======== */

async function apiGetDetectors(filters = {}) {
    const params = new URLSearchParams();
    if (filters.detector_type) params.set('detector_type', filters.detector_type);
    if (filters.modality) params.set('modality', filters.modality);
    if (filters.manufacturer) params.set('manufacturer', filters.manufacturer);
    const query = params.toString() ? `?${params.toString()}` : '';
    const result = await apiRequest(`/detectors/${query}`);
    if (result) return result;

    // Fallback
    return [
        { detector_name: 'Flat Panel (Standard)', detector_type: 'Flat Panel', modality: null, manufacturer: 'Generic', sensitivity: 1.0 },
        { detector_name: 'CT Detector Array', detector_type: 'CT Detector', modality: 'CT', manufacturer: 'Generic', sensitivity: 1.2 },
        { detector_name: 'PET SiPM Array', detector_type: 'PET Detector', modality: 'PET-CT', manufacturer: 'Generic', sensitivity: 1.3 },
    ];
}

/* ======== EXTRACTION API ======== */

async function apiExtractFile(storedAs, fileType) {
    const result = await apiRequest('/files/extract', {
        method: 'POST',
        body: JSON.stringify({ stored_as: storedAs, file_type: fileType }),
    });
    if (result) return result;

    // Fallback — simulate extraction from filename
    const modelMatch = storedAs.replace(/\.\w+$/, '').replace(/[_-]/g, ' ');
    return {
        status: 'success',
        extraction: {
            machine_model: modelMatch,
            kvp: 125,
            ma: 1000,
            workload: 500,
            source_intensity: 150,
            scatter_factor: 0.001,
            confidence: 0.65,
            errors: [],
        },
    };
}

/* ======== FILE API ======== */

async function apiUploadFile(file) {
    const token = localStorage.getItem('shieldplan_token');
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE}/files/upload`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        return await response.json();
    } catch (error) {
        console.warn('Upload API offline:', error);
        return { filename: file.name, stored_as: 'demo', size_bytes: file.size, file_type: file.name.split('.').pop(), message: 'Demo mode — file not actually uploaded' };
    }
}

/* ======== REPORT API ======== */

async function apiGenerateReport(projectId, reportType = 'engineering') {
    return await apiRequest(`/reports/generate?project_id=${projectId}&report_type=${reportType}`, {
        method: 'POST',
    });
}

async function apiListReports(projectId) {
    return await apiRequest(`/reports/project/${projectId}`);
}
