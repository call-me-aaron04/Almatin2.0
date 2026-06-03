/**
 * SHIELDPLAN — Application State
 * Extended with project management, 6-surface configuration (N/S/E/W/Ceiling/Floor),
 * source information, room types, product search, and full workflow tracking.
 */
import type {
  Modality, Manufacturer, Machine, RoomTemplate,
  ShieldingResult, LeakageResult, ComplianceResult, Report,
  MaterialData,
} from './api.js';

export interface WallConfig {
  id: string; // 'north' | 'south' | 'east' | 'west' | 'ceiling' | 'floor'
  label: string;
  material: string;
  thickness: number; // cm
  adjacentArea: string;
  distance: number; // meters from source
  peopleCount: number;
  workingHours: number;
  occupancyFactor: number;
  surfaceType: 'wall' | 'ceiling' | 'floor';
}

export interface OccupancyConfig {
  areaType: string;
  workers: number;
  publicCount: number;
  weeklyHours: number;
  daysPerWeek: number;
  shifts: number;
  occupancyFactor: number;
  classification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SourceInput {
  sourceLocation: string;
  sourceToPatientDist: number;
  beamAngle: number;
  sourceFactor: number;
  safetyIndex: number;
  leakageRadiation: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  extractedData?: string;
}

export type RoomType = 'Examination' | 'Treatment' | 'Control' | 'Storage' | 'Other';

interface AppState {
  // Project
  projectName: string;
  projectNumber: string;
  projectDescription: string;
  createdAt: string;

  // Workflow selections
  selectedModality: Modality | null;
  selectedManufacturer: Manufacturer | null;
  selectedMachine: Machine | null;
  selectedFacility: string | null; // 'New' | 'Existing' | 'Retrofit'
  selectedRoomType: RoomType;
  selectedRoomTemplate: RoomTemplate | null;
  selectedRoomCustom: { length: number; width: number; height: number } | null;

  // Search state
  searchQuery: string;
  searchResults: any[];

  // Adjacent rooms
  adjacentRooms: { name: string; type: string }[];

  // Six-surface configuration (N/S/E/W/Ceiling/Floor)
  walls: WallConfig[];

  // Source information
  sourceInput: SourceInput;

  // Materials library
  materials: MaterialData[];

  // Occupancy
  occupancyConfigs: OccupancyConfig[];

  // Uploaded files
  uploadedFiles: UploadedFile[];

  // Analysis data
  shieldingResult: ShieldingResult | null;
  leakageResult: LeakageResult | null;
  complianceResult: ComplianceResult | null;
  validationErrors: any[];
  recommendations: any[];

  // Reports
  reports: Report[];

  // Settings
  particleDensity: number;
  theme: 'dark' | 'light';

  // Workflow tracking
  currentWorkflowStep: number;
  completedSteps: number[];
}

const defaultWalls: WallConfig[] = [
  { id: 'north', label: 'North Wall', material: 'Concrete', thickness: 30, adjacentArea: 'Corridor', distance: 3.5, peopleCount: 10, workingHours: 40, occupancyFactor: 0.5, surfaceType: 'wall' },
  { id: 'south', label: 'South Wall', material: 'Concrete', thickness: 30, adjacentArea: 'Office', distance: 3.5, peopleCount: 3, workingHours: 40, occupancyFactor: 0.25, surfaceType: 'wall' },
  { id: 'east', label: 'East Wall', material: 'Concrete', thickness: 30, adjacentArea: 'Control Room', distance: 3.0, peopleCount: 2, workingHours: 40, occupancyFactor: 1.0, surfaceType: 'wall' },
  { id: 'west', label: 'West Wall', material: 'Concrete', thickness: 30, adjacentArea: 'Outdoor Area', distance: 3.0, peopleCount: 0, workingHours: 0, occupancyFactor: 0.1, surfaceType: 'wall' },
  { id: 'ceiling', label: 'Ceiling', material: 'Concrete', thickness: 20, adjacentArea: 'Mechanical Room', distance: 3.0, peopleCount: 1, workingHours: 10, occupancyFactor: 0.05, surfaceType: 'ceiling' },
  { id: 'floor', label: 'Floor', material: 'Concrete', thickness: 20, adjacentArea: 'Basement', distance: 3.0, peopleCount: 0, workingHours: 0, occupancyFactor: 0.05, surfaceType: 'floor' },
];

const defaultMaterials: MaterialData[] = [
  { id: 'concrete', name: 'Concrete', density: 2.35, attenuationCoefficient: 0.42, neutronAttenuation: 0.08, hvt: 1.65, tvt: 5.48, costFactor: 1.0 },
  { id: 'lead', name: 'Lead', density: 11.34, attenuationCoefficient: 5.8, neutronAttenuation: 0.03, hvt: 0.12, tvt: 0.4, costFactor: 12.0 },
  { id: 'brick', name: 'Brick', density: 1.9, attenuationCoefficient: 0.28, neutronAttenuation: 0.05, hvt: 2.48, tvt: 8.24, costFactor: 0.6 },
  { id: 'gypsum', name: 'Gypsum', density: 1.2, attenuationCoefficient: 0.18, neutronAttenuation: 0.04, hvt: 3.85, tvt: 12.8, costFactor: 0.4 },
  { id: 'steel', name: 'Steel', density: 7.85, attenuationCoefficient: 3.2, neutronAttenuation: 0.12, hvt: 0.22, tvt: 0.73, costFactor: 8.0 },
  { id: 'borated-pe', name: 'Borated Polyethylene', density: 1.03, attenuationCoefficient: 0.15, neutronAttenuation: 0.35, hvt: 4.62, tvt: 15.35, costFactor: 5.0 },
];

const defaultOccupancyConfigs: OccupancyConfig[] = [
  { areaType: 'Control Room', workers: 2, publicCount: 0, weeklyHours: 40, daysPerWeek: 5, shifts: 2, occupancyFactor: 1.0, classification: 'HIGH' },
  { areaType: 'Office', workers: 3, publicCount: 0, weeklyHours: 40, daysPerWeek: 5, shifts: 1, occupancyFactor: 0.25, classification: 'MEDIUM' },
  { areaType: 'Corridor', workers: 0, publicCount: 10, weeklyHours: 60, daysPerWeek: 6, shifts: 1, occupancyFactor: 0.5, classification: 'MEDIUM' },
  { areaType: 'Public Zone', workers: 0, publicCount: 20, weeklyHours: 50, daysPerWeek: 6, shifts: 1, occupancyFactor: 0.1, classification: 'LOW' },
  { areaType: 'Restricted Area', workers: 1, publicCount: 0, weeklyHours: 10, daysPerWeek: 3, shifts: 1, occupancyFactor: 0.05, classification: 'LOW' },
];

const defaultState: AppState = {
  projectName: '',
  projectNumber: '',
  projectDescription: '',
  createdAt: '',
  selectedModality: null,
  selectedManufacturer: null,
  selectedMachine: null,
  selectedFacility: null,
  selectedRoomType: 'Examination',
  selectedRoomTemplate: null,
  selectedRoomCustom: null,
  searchQuery: '',
  searchResults: [],
  adjacentRooms: [],
  walls: defaultWalls.map(w => ({ ...w })),
  sourceInput: {
    sourceLocation: 'center',
    sourceToPatientDist: 1.0,
    beamAngle: 0,
    sourceFactor: 1.0,
    safetyIndex: 1.0,
    leakageRadiation: 0.001,
  },
  materials: defaultMaterials.map(m => ({ ...m })),
  occupancyConfigs: defaultOccupancyConfigs.map(o => ({ ...o })),
  uploadedFiles: [],
  shieldingResult: null,
  leakageResult: null,
  complianceResult: null,
  validationErrors: [],
  recommendations: [],
  reports: [],
  particleDensity: 60,
  theme: 'dark',
  currentWorkflowStep: 1,
  completedSteps: [],
};

function loadPersisted(): Partial<AppState> {
  try {
    const saved = localStorage.getItem('shieldplan-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        theme: parsed.theme || 'dark',
        particleDensity: parsed.particleDensity ?? 60,
      };
    }
  } catch { /* ignore */ }
  return {};
}

class StateManager {
  private state: AppState;
  private listeners: Array<() => void> = [];

  constructor() {
    this.state = { ...defaultState, ...loadPersisted() };
  }

  get(): AppState {
    return this.state;
  }

  set(partial: Partial<AppState>) {
    this.state = { ...this.state, ...partial };
    this.persist();
    this.notify();
  }

  completeStep(step: number) {
    const completed = [...new Set([...this.state.completedSteps, step])];
    this.set({ completedSteps: completed, currentWorkflowStep: Math.min(step + 1, 5) });
  }

  resetWorkflow() {
    this.set({
      projectName: '',
      projectNumber: '',
      projectDescription: '',
      selectedModality: null,
      selectedManufacturer: null,
      selectedMachine: null,
      selectedFacility: null,
      selectedRoomType: 'Examination',
      selectedRoomTemplate: null,
      selectedRoomCustom: null,
      searchQuery: '',
      searchResults: [],
      adjacentRooms: [],
      walls: defaultWalls.map(w => ({ ...w })),
      sourceInput: { sourceLocation: 'center', sourceToPatientDist: 1.0, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageRadiation: 0.001 },
      occupancyConfigs: defaultOccupancyConfigs.map(o => ({ ...o })),
      uploadedFiles: [],
      shieldingResult: null,
      leakageResult: null,
      complianceResult: null,
      validationErrors: [],
      recommendations: [],
      currentWorkflowStep: 1,
      completedSteps: [],
    });
  }

  resetAnalysis() {
    this.set({
      shieldingResult: null,
      leakageResult: null,
      complianceResult: null,
      validationErrors: [],
      recommendations: [],
    });
  }

  private persist() {
    try {
      localStorage.setItem('shieldplan-state', JSON.stringify({
        theme: this.state.theme,
        particleDensity: this.state.particleDensity,
      }));
    } catch { /* ignore */ }
  }

  onChange(fn: () => void) {
    this.listeners.push(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }
}

export const appState = new StateManager();
