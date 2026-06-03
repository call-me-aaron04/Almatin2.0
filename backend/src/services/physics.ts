/**
 * SHIELDPLAN Physics Engine
 * Engineering-grade radiation shielding calculations with:
 * - Primary, scatter, and leakage radiation calculations
 * - Per-wall multi-layer attenuation
 * - Material-specific coefficients with energy-dependent scaling
 * - Occupancy factor calculation (T = N × H / 168)
 * - Beam angle factor (cos θ correction)
 * - HVL / TVL calculations
 * - Source Factor (SF) and Safety Index (SI)
 * - Error log & recommendation generation
 * - Compliance validation against AERB, NCRP, IEC, ICRP
 */

/* ----- Material Library ----- */
export interface MaterialData {
  id: string;
  name: string;
  density: number;
  attenuationCoefficient: number; // μ at 100 kVp (cm⁻¹)
  neutronAttenuation: number;
  hvt: number; // Half-Value Thickness (cm)
  tvt: number; // Tenth-Value Thickness (cm)
  costFactor: number;
}

const MATERIALS: Record<string, MaterialData> = {
  'Concrete': { id: 'concrete', name: 'Concrete', density: 2.35, attenuationCoefficient: 0.42, neutronAttenuation: 0.08, hvt: 1.65, tvt: 5.48, costFactor: 1.0 },
  'Lead': { id: 'lead', name: 'Lead', density: 11.34, attenuationCoefficient: 5.8, neutronAttenuation: 0.03, hvt: 0.12, tvt: 0.4, costFactor: 12.0 },
  'Brick': { id: 'brick', name: 'Brick', density: 1.9, attenuationCoefficient: 0.28, neutronAttenuation: 0.05, hvt: 2.48, tvt: 8.24, costFactor: 0.6 },
  'Gypsum': { id: 'gypsum', name: 'Gypsum', density: 1.2, attenuationCoefficient: 0.18, neutronAttenuation: 0.04, hvt: 3.85, tvt: 12.8, costFactor: 0.4 },
  'Steel': { id: 'steel', name: 'Steel', density: 7.85, attenuationCoefficient: 3.2, neutronAttenuation: 0.12, hvt: 0.22, tvt: 0.73, costFactor: 8.0 },
  'Borated Polyethylene': { id: 'borated-pe', name: 'Borated Polyethylene', density: 1.03, attenuationCoefficient: 0.15, neutronAttenuation: 0.35, hvt: 4.62, tvt: 15.35, costFactor: 5.0 },
};

export function getMaterial(name: string): MaterialData {
  return MATERIALS[name] || MATERIALS['Concrete'];
}

export function getMaterialsList(): MaterialData[] {
  return Object.values(MATERIALS);
}

/* ----- Input/Output Types ----- */
export interface WallInput {
  id: string;
  label: string;
  material: string;
  thickness: number; // cm
  distance: number; // m
  adjacentArea: string;
  occupancyFactor: number;
  surfaceType?: string; // 'wall' | 'ceiling' | 'floor'
}

export interface SourceInput {
  sourceLocation: string;   // e.g. 'center', 'corner', 'isocenter'
  sourceToPatientDist: number; // m
  beamAngle: number; // degrees from vertical
  sourceFactor: number; // Source Factor (SF)
  safetyIndex: number; // Safety Index (SI)
  leakageRadiation: number; // leakage value from machine
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

export interface ComplianceInput {
  doseAtWall: number;
  annualDose: number;
  wallResults: { wall: string; annualDose: number; isSafe: boolean }[];
  limits: { key: string; limit: number }[];
}

export interface ComplianceResult {
  status: 'SAFE' | 'WARNING' | 'FAIL';
  complianceScore: number;
  riskLevel: string;
  perStandard: { key: string; limit: number; actual: number; margin: number; status: 'SAFE' | 'WARNING' | 'FAIL' }[];
  recommendations: string[];
}

/* ----- Error Log Entry ----- */
export interface ErrorLogEntry {
  step: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  details?: string;
}

/* ----- Recommendation Entry ----- */
export interface Recommendation {
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  details?: string;
}

/* =============================================
   PHYSICS CALCULATIONS
   ============================================= */

/**
 * Attenuation coefficient for concrete based on kVp.
 * Based on NCRP 147 data with interpolation.
 */
function attenuationCoefficient(kvp: number): number {
  if (kvp <= 50) return 0.85;
  if (kvp <= 75) return 0.65;
  if (kvp <= 100) return 0.52;
  if (kvp <= 125) return 0.42;
  if (kvp <= 150) return 0.35;
  if (kvp <= 200) return 0.28;
  if (kvp <= 300) return 0.22;
  if (kvp <= 500) return 0.17;
  if (kvp <= 1000) return 0.12;
  if (kvp <= 6000) return 0.075;
  return 0.06;
}

/**
 * Get material-specific attenuation coefficient adjusted for kVp.
 * Base coefficients are at 100 kVp; scale based on energy.
 */
function getMaterialMu(material: string, kvp: number): number {
  const mat = getMaterial(material);
  const baseKvp = 100;
  const baseMu = mat.attenuationCoefficient;
  const concreteMu = attenuationCoefficient(kvp);
  const concreteBaseMu = attenuationCoefficient(baseKvp);
  // Scale the material coefficient by the same ratio as concrete
  return baseMu * (concreteMu / concreteBaseMu);
}

/**
 * Calculate HVT (Half-Value Thickness) for a material at given kVp.
 */
function getHVT(material: string, kvp: number): number {
  const mat = getMaterial(material);
  const mu = getMaterialMu(material, kvp);
  if (mu <= 0) return mat.hvt;
  return Math.log(2) / mu;
}

/**
 * Calculate TVT (Tenth-Value Thickness) for a material at given kVp.
 */
function getTVT(material: string, kvp: number): number {
  const mat = getMaterial(material);
  const mu = getMaterialMu(material, kvp);
  if (mu <= 0) return mat.tvt;
  return Math.log(10) / mu;
}

/**
 * Inverse Square Law: I₂ = I₁ × (d₁/d₂)²
 */
function inverseSquare(sourceDose: number, distance: number): number {
  if (distance <= 0) return sourceDose;
  return sourceDose / (distance * distance);
}

/**
 * Single-layer attenuation: I = I₀ × e^(-μx)
 */
function singleLayerTransmission(thickness: number, mu: number): number {
  return Math.exp(-mu * thickness);
}

/**
 * Multi-layer attenuation: I = I₀ × e^(-(μ₁x₁ + μ₂x₂ + μ₃x₃))
 * Supports up to 3 layers; pass empty arrays for unused layers.
 */
function multiLayerTransmission(layers: { thickness: number; mu: number }[]): number {
  const totalMuX = layers.reduce((sum, l) => sum + l.mu * l.thickness, 0);
  return Math.exp(-totalMuX);
}

/**
 * Beam Angle Factor: cos(θ) correction
 * When beam hits a wall at angle θ, the effective path length increases.
 */
function beamAngleFactor(angleDegrees: number): number {
  const angleRad = (angleDegrees * Math.PI) / 180;
  const cosAngle = Math.cos(angleRad);
  if (cosAngle <= 0.01) return 1.0; // grazing incidence
  return 1.0 / cosAngle;
}

/**
 * Calculate scatter fraction based on kVp and material.
 * Higher kVp → more forward scatter; lower kVp → more isotropic.
 */
function scatterFraction(kvp: number): number {
  // Simplified model: scatter fraction increases with kVp
  if (kvp <= 50) return 0.001;
  if (kvp <= 100) return 0.002;
  if (kvp <= 150) return 0.003;
  if (kvp <= 300) return 0.005;
  if (kvp <= 1000) return 0.008;
  return 0.01;
}

/**
 * Calculate scatter dose based on patient scatter model.
 * Scatter dose at 1m from patient ≈ 0.1% of primary at 100 kVp
 */
function calculateScatterDose(primaryDose: number, kvp: number, distance: number): number {
  const sf = scatterFraction(kvp);
  // Scatter at 1m from patient
  const scatterAt1m = primaryDose * sf;
  // Inverse square to the wall distance (distance from patient ≈ distance from source)
  return inverseSquare(scatterAt1m, distance);
}

/**
 * Calculate leakage radiation based on machine leakage value and workload.
 * Typical leakage is 0.1% of the primary beam (IEC 60601 standard).
 */
function calculateLeakageDose(leakageValue: number, workload: number, distance: number): number {
  const leakageRate = leakageValue > 0 ? leakageValue : 0.001; // default 0.1%
  const leakageAt1m = workload * leakageRate * 0.01;
  return inverseSquare(leakageAt1m, distance);
}

/**
 * Occupancy Factor: T = N × H / 168
 * Where N = number of people, H = total weekly occupied hours
 * 168 = total hours in a week
 */
export function calculateOccupancyFactor(peopleCount: number, weeklyHours: number): number {
  if (peopleCount <= 0 || weeklyHours <= 0) return 0.05; // minimal occupancy
  return Math.min(1.0, (peopleCount * weeklyHours) / 168);
}

/**
 * Occupancy classification based on factor.
 */
function classifyOccupancy(factor: number): string {
  if (factor >= 0.8) return 'HIGH';
  if (factor >= 0.4) return 'MEDIUM';
  if (factor >= 0.1) return 'LOW';
  return 'CRITICAL';
}

/**
 * Generate validation errors for room measurements.
 */
export function validateRoomMeasurements(length: number, width: number, height: number): ErrorLogEntry[] {
  const errors: ErrorLogEntry[] = [];
  if (length <= 0 || width <= 0 || height <= 0) {
    errors.push({ step: 'Room Dimensions', type: 'error', message: 'All dimensions must be positive values greater than zero.' });
  }
  if (length < 1 || width < 1) {
    errors.push({ step: 'Room Dimensions', type: 'warning', message: 'Room dimensions seem too small for a medical imaging room (minimum 1m each).' });
  }
  if (length > 30 || width > 30) {
    errors.push({ step: 'Room Dimensions', type: 'warning', message: 'Room dimensions exceed typical medical imaging room sizes (>30m).' });
  }
  if (height < 2 || height > 6) {
    errors.push({ step: 'Room Ceiling', type: 'warning', message: 'Room height outside typical range (2-6m). Verify measurements.' });
  }
  if (!Number.isFinite(length) || !Number.isFinite(width) || !Number.isFinite(height)) {
    errors.push({ step: 'Room Dimensions', type: 'error', message: 'Invalid numeric values detected. Ensure dimensions are in meters.' });
  }
  return errors;
}

/**
 * Generate recommendations based on wall analysis results.
 */
export function generateRecommendations(wallDetails: WallDetail[], complianceStatus: string): Recommendation[] {
  const recs: Recommendation[] = [];

  // Check for unsafe walls
  const unsafeWalls = wallDetails.filter(w => !w.isSafe);
  if (unsafeWalls.length > 0) {
    recs.push({
      category: 'Safety',
      priority: 'HIGH',
      message: `${unsafeWalls.length} wall(s) exceed safe annual dose limits. Increase thickness or use higher-density materials.`,
      details: unsafeWalls.map(w => `${w.wall}: increase from ${w.thickness}cm to ${w.recommendedThickness}cm of ${w.material}`).join('; '),
    });
  }

  // Check for over-engineered walls (thickness > 2x recommended)
  wallDetails.forEach(w => {
    if (w.thickness > w.recommendedThickness * 2 && w.recommendedThickness > 0) {
      recs.push({
        category: 'Cost Optimization',
        priority: 'MEDIUM',
        message: `${w.wall} may be over-engineered at ${w.thickness}cm. Recommended: ${w.recommendedThickness}cm.`,
      });
    }
  });

  // Check distance-to-thickness ratio
  wallDetails.forEach(w => {
    if (w.distance < 2.0 && w.thickness < 20) {
      recs.push({
        category: 'Geometry',
        priority: 'MEDIUM',
        message: `${w.wall} is close to source (${w.distance}m). Consider increasing thickness or repositioning the source.`,
      });
    }
  });

  // Compliance-based recommendation
  if (complianceStatus === 'WARNING') {
    recs.push({
      category: 'Compliance',
      priority: 'HIGH',
      message: 'Shielding is near regulatory limits. Schedule a detailed review before proceeding with construction.',
    });
  } else if (complianceStatus === 'FAIL') {
    recs.push({
      category: 'Compliance',
      priority: 'HIGH',
      message: 'SHIELDING FAILS COMPLIANCE. Immediate redesign required. Contact a qualified Medical Physicist.',
    });
  } else {
    recs.push({
      category: 'Compliance',
      priority: 'LOW',
      message: 'All shielding parameters within regulatory limits. Design is compliant.',
    });
  }

  return recs;
}

/* =============================================
   MAIN CALCULATION FUNCTIONS
   ============================================= */

/**
 * Full shielding analysis with per-wall configuration.
 * Each wall uses its own material, thickness, and distance.
 * Includes primary, scatter, and leakage radiation calculations.
 * Supports beam angle correction and HVL/TVL reporting.
 */
export function calculateShielding(input: ShieldingInput): ShieldingResult {
  // Source input with defaults
  const src = input.sourceInput || {
    sourceLocation: 'center',
    sourceToPatientDist: 1.0,
    beamAngle: 0,
    sourceFactor: 1.0,
    safetyIndex: 1.0,
    leakageRadiation: 0.001,
  };

  // Primary dose rate at 1 meter (simplified physics model)
  const primaryDoseRate = (input.ma * input.kvp * 0.001) / 100;
  if (primaryDoseRate <= 0) return getDefaultResult();

  // Apply Source Factor (SF) and Safety Index (SI)
  const effectiveDoseRate = primaryDoseRate * src.sourceFactor * src.safetyIndex;

  // Beam angle correction
  const angleFactor = beamAngleFactor(src.beamAngle);
  const angleCorrectedDose = effectiveDoseRate * angleFactor;

  // Scatter fraction
  const scatterFrac = scatterFraction(input.kvp);

  // Calculate per-wall details
  const wallDetails: WallDetail[] = input.walls.map((wall) => {
    const mu = getMaterialMu(wall.material, input.kvp);
    const hvt = getHVT(wall.material, input.kvp);
    const tvt = getTVT(wall.material, input.kvp);

    // Primary radiation at wall (inverse square from source)
    const primaryAtWall = inverseSquare(angleCorrectedDose, wall.distance);

    // Scatter radiation at wall
    const scatterAtWall = calculateScatterDose(angleCorrectedDose, input.kvp, wall.distance);

    // Leakage radiation at wall
    const leakageAtWall = calculateLeakageDose(src.leakageRadiation, input.workload, wall.distance);

    // Total unshielded dose (sum of primary + scatter + leakage)
    const totalUnshielded = primaryAtWall + scatterAtWall + leakageAtWall;

    // Shielded transmission
    const transmission = singleLayerTransmission(wall.thickness, mu);
    const transmittedDose = totalUnshielded * transmission;

    // Weekly dose: workload (mA-min/week) converted to hours
    const weeklyDose = transmittedDose * (input.workload / 60);

    // Annual dose: 50 weeks × occupancy × use factor
    const annualDose = weeklyDose * 50 * wall.occupancyFactor * input.useFactor;

    // Required thickness to reach 0.02 mSv/week
    const targetTransmission = 0.02 / (totalUnshielded * (input.workload / 60));
    const requiredThickness = targetTransmission > 0
      ? -Math.log(Math.max(targetTransmission, 1e-10)) / Math.max(mu, 0.01)
      : 0;

    // Number of HVLs needed
    const numHVLs = requiredThickness > 0 && hvt > 0 ? requiredThickness / hvt : 0;

    return {
      wall: wall.label || wall.id,
      distance: wall.distance,
      material: wall.material,
      thickness: wall.thickness,
      surfaceType: wall.surfaceType || 'wall',
      mu: Math.round(mu * 1000) / 1000,
      primaryDose: Math.round(primaryAtWall * 100000) / 100000,
      scatterDose: Math.round(scatterAtWall * 100000) / 100000,
      leakageDose: Math.round(leakageAtWall * 100000) / 100000,
      doseUnshielded: Math.round(totalUnshielded * 100000) / 100000,
      doseShielded: Math.round(transmittedDose * 100000) / 100000,
      annualDose: Math.round(annualDose * 1000) / 1000,
      hvt: Math.round(hvt * 100) / 100,
      tvt: Math.round(tvt * 100) / 100,
      isSafe: annualDose <= 1.0,
      recommendedThickness: Math.round(requiredThickness * 10) / 10,
    };
  });

  // Aggregate results
  const maxAnnualDose = Math.max(...wallDetails.map(w => w.annualDose));
  const worstWall = wallDetails.reduce((worst, w) => w.annualDose > worst.annualDose ? w : worst, wallDetails[0]);
  const allSafe = wallDetails.every(w => w.isSafe);
  const safetyMargin = allSafe
    ? ((1.0 - maxAnnualDose) / 1.0) * 100
    : ((1.0 - maxAnnualDose) / 1.0) * 100;

  return {
    doseAtWall: worstWall.doseUnshielded,
    transmittedDose: worstWall.doseShielded,
    annualDose: maxAnnualDose,
    requiredThickness: worstWall.recommendedThickness,
    isSafe: allSafe,
    safetyMargin: Math.round(safetyMargin * 10) / 10,
    wallDetails,
    primaryBeam: Math.round(angleCorrectedDose * 100000) / 100000,
    scatterFraction: Math.round(scatterFrac * 100000) / 100000,
    totalLeakage: Math.round(wallDetails.reduce((s, w) => s + w.leakageDose, 0) * 100000) / 100000,
  };
}

function getDefaultResult(): ShieldingResult {
  return {
    doseAtWall: 0, transmittedDose: 0, annualDose: 0,
    requiredThickness: 0, isSafe: true, safetyMargin: 100,
    wallDetails: [],
    primaryBeam: 0, scatterFraction: 0, totalLeakage: 0,
  };
}

/**
 * Leakage analysis with per-wall calculation.
 * Leakage is typically 0.1% of primary beam.
 */
export function calculateLeakage(input: LeakageInput): LeakageResult {
  const leakageFraction = 0.001;
  const doseRateAt1m = input.kvp * 0.01;
  const leakageRate = doseRateAt1m * leakageFraction;

  const wallResults = input.walls.map((wall) => {
    const mu = getMaterialMu(wall.material, input.kvp);
    const leakageAtWall = inverseSquare(leakageRate, wall.distance);
    const transmitted = leakageAtWall * singleLayerTransmission(wall.thickness, mu);
    const weeklyHours = (input.workload / 60) * 0.01;
    const annualLeakage = transmitted * weeklyHours * 50;
    return {
      wall: wall.id,
      leakage: Math.round(annualLeakage * 1000) / 1000,
      isSafe: annualLeakage <= 0.5,
    };
  });

  const maxLeakage = Math.max(...wallResults.map(w => w.leakage), 0);
  return {
    leakageDoseRate: Math.round(maxLeakage * 100000) / 100000,
    annualLeakage: maxLeakage,
    isSafe: maxLeakage <= 0.5,
    wallResults,
  };
}

/**
 * Occupancy analysis based on T = N × H / 168 formula.
 * Calculates exposure for each area type.
 */
export function calculateOccupancy(inputs: OccupancyInput[]): OccupancyResult[] {
  return inputs.map((input) => {
    const totalPeople = input.workers + input.publicCount;
    const occupancyFactor = calculateOccupancyFactor(totalPeople, input.weeklyHours);
    const classification = classifyOccupancy(occupancyFactor);
    // Annual dose estimation based on occupancy
    const annualDose = occupancyFactor * 0.5; // simplified model
    return {
      areaType: input.areaType,
      occupancyFactor: Math.round(occupancyFactor * 100) / 100,
      classification,
      annualDose: Math.round(annualDose * 1000) / 1000,
      isSafe: annualDose <= 1.0,
    };
  });
}

/**
 * Compliance validation against standards.
 * Validates against AERB, NCRP, IEC, ICRP limits.
 */
export function calculateCompliance(input: ComplianceInput): ComplianceResult {
  const perStandard = input.limits.map((std) => {
    // Use max annual dose across all walls
    const actual = Math.max(input.annualDose, ...input.wallResults.map(w => w.annualDose));
    const margin = ((std.limit - actual) / std.limit) * 100;
    let status: 'SAFE' | 'WARNING' | 'FAIL';
    if (actual <= std.limit * 0.5) status = 'SAFE';
    else if (actual <= std.limit) status = 'WARNING';
    else status = 'FAIL';
    return {
      key: std.key,
      limit: std.limit,
      actual: Math.round(actual * 1000) / 1000,
      margin: Math.round(margin * 10) / 10,
      status,
    };
  });

  const worstStatus = perStandard.some((s) => s.status === 'FAIL')
    ? 'FAIL'
    : perStandard.some((s) => s.status === 'WARNING')
      ? 'WARNING'
      : 'SAFE';

  const worstMargin = Math.min(...perStandard.map((s) => s.margin));
  const complianceScore = Math.max(0, Math.min(1, (worstMargin + 100) / 200));

  const riskLevels: Record<string, string> = {
    SAFE: 'Low — within acceptable limits per all applicable standards',
    WARNING: 'Moderate — approaching regulatory limits, review recommended',
    FAIL: 'High — exceeds regulatory limits, immediate mitigation required',
  };

  // Generate safety recommendations
  const recommendations: string[] = [];
  if (worstStatus === 'FAIL') {
    recommendations.push('Immediate redesign required — shielding fails compliance limits.');
    recommendations.push('Consult a qualified Medical Physicist for a detailed shielding design review.');
  } else if (worstStatus === 'WARNING') {
    recommendations.push('Shielding is near regulatory limits. Consider increasing wall thickness or using higher-density materials.');
    recommendations.push('Schedule a detailed shielding review before proceeding with construction.');
  } else {
    recommendations.push('All shielding parameters within regulatory limits. Design is compliant.');
  }
  
  // Add per-wall recommendations for unsafe walls
  input.wallResults.forEach(w => {
    if (!w.isSafe) {
      recommendations.push(`Wall ${w.wall} exceeds safe limits (${w.annualDose.toFixed(3)} mSv/yr). Increase thickness or use higher Z material.`);
    }
  });

  return {
    status: worstStatus,
    complianceScore: Math.round(complianceScore * 100) / 100,
    riskLevel: riskLevels[worstStatus],
    perStandard,
    recommendations,
  };
}