/** Typed API client for SHIELDPLAN backend */

const BASE = '/api';

interface ApiError {
  error: string;
  message?: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.message || err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/* ----- Types ----- */
export interface Modality {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface Manufacturer {
  id: number;
  name: string;
  country: string | null;
  modalityId: number;
  machines: Machine[];
}

export interface Machine {
  id: number;
  model: string;
  type: string | null;
  kvp: number | null;
  ma: number | null;
  workload: number | null;
  beamAngle: number | null;
  sourceFactor: number | null;
  safetyIndex: number | null;
  leakageValue: number | null;
  sourceIntensity: number | null;
  manufacturerId: number;
}

export interface RoomTemplate {
  id: number;
  name: string;
  length: number;
  width: number;
  height: number;
  description: string | null;
  modalityId: number;
}

export interface Standard {
  id: number;
  key: string;
  region: string;
  limit: number;
  description: string | null;
  modalityId: number;
}

export interface WallInput {
  id: string;
  label: string;
  material: string;
  thickness: number;
  distance: number;
  adjacentArea: string;
  occupancyFactor: number;
  surfaceType?: string;
}

export interface SourceInput {
  sourceLocation: string;
  sourceToPatientDist: number;
  beamAngle: number;
  sourceFactor: number;
  safetyIndex: number;
  leakageRadiation: number;
}

export interface ShieldingInput {
  modality: string;
  kvp: number;
  ma: number;
  workload: number;
  roomLength: number;
  roomWidth: number;
  roomHeight: number;
  walls: WallInput[];
  useFactor: number;
  sourceInput?: SourceInput;
}

export interface WallDetail {
  wall: string;
  distance: number;
  material: string;
  thickness: number;
  surfaceType: string;
  mu: number;
  primaryDose: number;
  scatterDose: number;
  leakageDose: number;
  doseUnshielded: number;
  doseShielded: number;
  annualDose: number;
  hvt: number;
  tvt: number;
  isSafe: boolean;
  recommendedThickness: number;
}

export interface ShieldingResult {
  doseAtWall: number;
  transmittedDose: number;
  annualDose: number;
  requiredThickness: number;
  isSafe: boolean;
  safetyMargin: number;
  wallDetails: WallDetail[];
  primaryBeam: number;
  scatterFraction: number;
  totalLeakage: number;
}

export interface LeakageInput {
  modality: string;
  kvp: number;
  workload: number;
  roomLength: number;
  roomWidth: number;
  walls: { id: string; material: string; thickness: number; distance: number }[];
}

export interface LeakageResult {
  leakageDoseRate: number;
  annualLeakage: number;
  isSafe: boolean;
  wallResults: { wall: string; leakage: number; isSafe: boolean }[];
}

export interface ComplianceResult {
  status: 'SAFE' | 'WARNING' | 'FAIL';
  complianceScore: number;
  riskLevel: string;
  perStandard: { key: string; limit: number; actual: number; margin: number; status: string }[];
  recommendations: string[];
}

export interface AnalysisResult {
  id: number;
  type: string;
  label: string | null;
  inputData: string;
  resultData: string;
  status: string;
  createdAt: string;
}

export interface Report {
  id: number;
  title: string;
  summary: string | null;
  status: string;
  reportData: string | null;
  recommendations: string | null;
  errorLogs: string | null;
  modalityName: string | null;
  roomType: string | null;
  facilityType: string | null;
  machineModel: string | null;
  analysisResultId: number | null;
  analysisResult: AnalysisResult | null;
  createdAt: string;
}

export interface MaterialData {
  id: string;
  name: string;
  density: number;
  attenuationCoefficient: number;
  neutronAttenuation: number;
  hvt: number;
  tvt: number;
  costFactor: number;
}

export interface OccupancyInput {
  areaType: string;
  workers: number;
  publicCount: number;
  weeklyHours: number;
  daysPerWeek: number;
  shifts: number;
}

export interface OccupancyResult {
  areaType: string;
  occupancyFactor: number;
  classification: string;
  annualDose: number;
  isSafe: boolean;
}

export interface ValidationError {
  step: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface Recommendation {
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  details?: string;
}

/* ----- Modality API ----- */
export async function getModalities(): Promise<Modality[]> {
  const fallback: Modality[] = [
    { id: 1, name: 'XR', description: 'X-Ray Radiography', icon: '🔦' },
    { id: 2, name: 'Cath Lab', description: 'Cardiac Catheterization Lab', icon: '❤️' },
    { id: 3, name: 'CT', description: 'Computed Tomography', icon: '🔄' },
    { id: 4, name: 'PET-CT', description: 'Positron Emission Tomography - CT', icon: '🔬' },
    { id: 5, name: 'Cyclotron', description: 'Cyclotron Facility', icon: '⚛️' },
    { id: 6, name: 'LINAC', description: 'Linear Accelerator', icon: '🎯' },
    { id: 7, name: 'Gamma Room', description: 'Gamma Irradiation Room', icon: '☢️' },
    { id: 8, name: 'Neutron Facility', description: 'Neutron Radiation Facility', icon: '🧪' },
  ];
  try {
    return await apiFetch<Modality[]>('/modalities/');
  } catch {
    console.warn('API unavailable, using fallback modality data');
    return fallback;
  }
}

export async function getManufacturers(modalityId: number): Promise<Manufacturer[]> {
  return apiFetch(`/modalities/${modalityId}/manufacturers`);
}

export async function getRoomTemplates(modalityId: number): Promise<RoomTemplate[]> {
  return apiFetch(`/modalities/${modalityId}/room-templates`);
}

export async function getStandards(modalityId: number): Promise<Standard[]> {
  return apiFetch(`/modalities/${modalityId}/standards`);
}

/* ----- Search API ----- */
export async function getMachineById(id: number): Promise<Machine | null> {
  try {
    return await apiFetch<Machine>(`/search/machines/${id}`);
  } catch {
    return null;
  }
}

export async function searchMachines(query: string, modalityId?: number): Promise<Machine[]> {
  const params = new URLSearchParams({ q: query });
  if (modalityId) params.set('modalityId', String(modalityId));
  try {
    return await apiFetch(`/search/machines?${params}`);
  } catch {
    return [];
  }
}

export async function searchProducts(query: string): Promise<{
  modalities: Modality[];
  manufacturers: Manufacturer[];
  machines: Machine[];
}> {
  const params = new URLSearchParams({ q: query });
  try {
    return await apiFetch(`/search/products?${params}`);
  } catch {
    return { modalities: [], manufacturers: [], machines: [] };
  }
}

/* ----- Materials API ----- */
export async function getMaterials(): Promise<MaterialData[]> {
  const fallback: MaterialData[] = [
    { id: 'concrete', name: 'Concrete', density: 2.35, attenuationCoefficient: 0.42, neutronAttenuation: 0.08, hvt: 1.65, tvt: 5.48, costFactor: 1.0 },
    { id: 'lead', name: 'Lead', density: 11.34, attenuationCoefficient: 5.8, neutronAttenuation: 0.03, hvt: 0.12, tvt: 0.4, costFactor: 12.0 },
    { id: 'brick', name: 'Brick', density: 1.9, attenuationCoefficient: 0.28, neutronAttenuation: 0.05, hvt: 2.48, tvt: 8.24, costFactor: 0.6 },
    { id: 'gypsum', name: 'Gypsum', density: 1.2, attenuationCoefficient: 0.18, neutronAttenuation: 0.04, hvt: 3.85, tvt: 12.8, costFactor: 0.4 },
    { id: 'steel', name: 'Steel', density: 7.85, attenuationCoefficient: 3.2, neutronAttenuation: 0.12, hvt: 0.22, tvt: 0.73, costFactor: 8.0 },
    { id: 'borated-pe', name: 'Borated Polyethylene', density: 1.03, attenuationCoefficient: 0.15, neutronAttenuation: 0.35, hvt: 4.62, tvt: 15.35, costFactor: 5.0 },
  ];
  try {
    return await apiFetch<MaterialData[]>('/materials/');
  } catch {
    return fallback;
  }
}

/* ----- Analysis API ----- */
export async function runShieldingAnalysis(input: ShieldingInput): Promise<{
  id: number;
  result: ShieldingResult;
  validation?: ValidationError[];
  recommendations?: Recommendation[];
}> {
  return apiFetch('/analysis/shielding', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function runLeakageAnalysis(input: LeakageInput): Promise<{ id: number; result: LeakageResult }> {
  return apiFetch('/analysis/leakage', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function runComplianceCheck(input: {
  modality: string;
  doseAtWall: number;
  annualDose: number;
  wallResults: { wall: string; annualDose: number; isSafe: boolean }[];
}): Promise<{ id: number; result: ComplianceResult }> {
  return apiFetch('/analysis/compliance', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function runOccupancyAnalysis(input: OccupancyInput[]): Promise<OccupancyResult[]> {
  return apiFetch('/analysis/occupancy', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/* ----- File Upload API ----- */
export async function uploadFile(file: File): Promise<{ id: string; name: string; size: number; extractedData?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE}/files/upload`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function getUploadedFiles(): Promise<{ id: string; name: string; type: string; size: number; uploadedAt: string }[]> {
  return apiFetch('/files/');
}

export async function deleteFile(id: string): Promise<void> {
  await apiFetch(`/files/${id}`, { method: 'DELETE' });
}

/* ----- Reports API ----- */
export async function getReports(): Promise<Report[]> {
  try {
    return await apiFetch('/reports/');
  } catch {
    return [];
  }
}

export async function createReport(data: {
  title: string;
  summary?: string;
  status: string;
  reportData?: string;
  recommendations?: string;
  errorLogs?: string;
  modalityName?: string;
  roomType?: string;
  facilityType?: string;
  machineModel?: string;
  analysisResultId?: number;
}): Promise<Report> {
  return apiFetch('/reports/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteReport(id: number): Promise<void> {
  await apiFetch(`/reports/${id}`, { method: 'DELETE' });
}

/* ----- Export API ----- */
export async function exportReportJson(id: number): Promise<Report> {
  return apiFetch(`/export/report/${id}/json`);
}

export async function exportReportText(id: number): Promise<string> {
  const res = await fetch(`${BASE}/export/report/${id}/text`);
  if (!res.ok) throw new Error('Export failed');
  return res.text();
}

export function getExportTextUrl(id: number): string {
  return `${BASE}/export/report/${id}/text`;
}

export function getExportMarkdownUrl(id: number): string {
  return `${BASE}/export/report/${id}/markdown`;
}
