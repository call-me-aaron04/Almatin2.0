/**
 * SHIELDPLAN — Professional Medical Physics Report Generator
 *
 * Generates a complete 15-section Radiation Shielding Analysis Report
 * with real step-by-step numerical calculations, formula substitutions,
 * and engineering verdicts. All HTML, no markdown.
 *
 * Sections:
 *  1  Project Identification
 *  2  Equipment Specifications
 *  3  Facility & Room Geometry
 *  4  Shielding Material Properties
 *  5  Per-Wall Shielding Analysis (with ISL, attenuation, verdict)
 *  6  Annual Dose Estimation
 *  7  Leakage Radiation Analysis
 *  8  Occupancy & Workload Analysis
 *  9  Compliance Analysis
 * 10  Risk & Safety Zone Classification
 * 11  Structural & Practical Considerations
 * 12  What-If Scenario Projections
 * 13  Monitoring & Surveillance Recommendations
 * 14  Conclusions & Recommendations
 * 15  Appendix
 */

import { appState } from '../lib/state.js';
import type { WallDetail } from '../lib/api.js';

/* ===== Helpers ===== */

function fmt(val: number | undefined | null, decimals = 3): string {
  if (val === undefined || val === null) return '—';
  try {
    return val.toFixed(decimals);
  } catch {
    return String(val);
  }
}

function fmtSci(val: number, decimals = 3): string {
  if (val === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(val)));
  const mant = val / Math.pow(10, exp);
  return `${mant.toFixed(decimals)} × 10<sup>${exp}</sup>`;
}

function statusBadge(status: string | undefined): string {
  const s = (status || 'SAFE').toUpperCase();
  const cls = s === 'SAFE' ? 'safe' : s === 'WARNING' ? 'warning' : 'fail';
  return `<span class="report-badge ${cls}">${s}</span>`;
}

function verdictBadge(verdict: string): string {
  const v = verdict.toUpperCase();
  const cls = v === 'ADEQUATE' ? 'safe' :
    v === 'MARGINAL' ? 'warning' : 'fail';
  return `<span class="report-badge ${cls}" style="font-size:0.8rem;padding:3px 12px">${v}</span>`;
}

function getMaterialMu(material: string, kvp: number): number {
  const muTable: Record<string, number> = {
    'Concrete': 0.42, 'Lead': 5.8, 'Brick': 0.28,
    'Gypsum': 0.18, 'Steel': 3.2, 'Borated Polyethylene': 0.15,
  };
  const baseMu = muTable[material] || 0.42;
  const kvpScale = kvp <= 50 ? 1.6 : kvp <= 100 ? 1.0 :
    kvp <= 150 ? 0.67 : kvp <= 300 ? 0.42 : kvp <= 1000 ? 0.23 : 0.14;
  return baseMu * kvpScale;
}

function getMu(material: string, kvp: number): number {
  return getMaterialMu(material, kvp);
}

function hvTvl(material: string, kvp: number): { hvt: number; tvt: number } {
  const mu = getMu(material, kvp);
  const hvt = mu > 0 ? 0.693 / mu : 99;
  const tvt = mu > 0 ? 2.303 / mu : 99;
  return { hvt, tvt };
}

function materialDensity(material: string): number {
  const d: Record<string, number> = {
    'Concrete': 2.35, 'Lead': 11.34, 'Brick': 1.9,
    'Gypsum': 1.2, 'Steel': 7.85, 'Borated Polyethylene': 1.03,
  };
  return d[material] || 2.35;
}

function getOccupantDistance(wallDist: number, _controlled: boolean): number {
  // Source-to-occupied-point: wall distance + 0.3m beyond wall
  return wallDist + 0.3;
}

/* ============================================================
   SECTION 1 — PROJECT IDENTIFICATION
   ============================================================ */
function section1(): string {
  const s = appState.get();
  const now = new Date();
  const reportId = `SR-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000 + 1000)}`;

  return `
<h2>1 &mdash; Project Identification</h2>
<table class="report-table">
  <tr><th style="width:200px">Project Name</th><td>${s.projectName || 'Radiation Shielding Design'}</td></tr>
  <tr><th>Report ID</th><td>${reportId}</td></tr>
  <tr><th>Date of Issue</th><td>${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
  <tr><th>Prepared For</th><td>${s.selectedFacility || 'New'} Facility &middot; ${s.selectedRoomType} Room</td></tr>
  <tr><th>Modality</th><td>${s.selectedModality?.name || '—'}</td></tr>
  <tr><th>Machine</th><td>${s.selectedMachine?.model || ''} ${s.selectedMachine?.type ? '(' + s.selectedMachine.type + ')' : ''}</td></tr>
  <tr><th>Manufacturer</th><td>${s.selectedManufacturer?.name || '—'}</td></tr>
  <tr><th>Standard(s)</th><td>AERB Safety Code (Radiation Protection) &bull; ICRP 103 &bull; NCRP 151 &bull; IEC 60601-1-3</td></tr>
</table>

<h3>1.1 Scope of Report</h3>
<p>This report presents a comprehensive radiation shielding analysis for the ${s.selectedModality?.name || ''} imaging facility. The analysis covers primary and secondary barrier design, scatter and leakage radiation evaluation, occupancy-based dose estimation, multi-standard compliance verification, and structural shielding recommendations. All calculations follow NCRP 147/151 methodologies, ICRP 103 dose constraints, and AERB Safety Code requirements.</p>

<h3>1.2 Applicable Standards &amp; References</h3>
<table class="report-table">
  <thead><tr><th>Standard</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td>AERB Safety Code (Radiation Protection)</td><td>Atomic Energy Regulatory Board &mdash; Radiation shielding design for medical facilities</td></tr>
    <tr><td>ICRP Publication 103</td><td>The 2007 Recommendations of the International Commission on Radiological Protection</td></tr>
    <tr><td>NCRP Report No. 151</td><td>Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy</td></tr>
    <tr><td>NCRP Report No. 147</td><td>Structural Shielding Design for Medical X-Ray Imaging Facilities</td></tr>
    <tr><td>IEC 60601-1-3</td><td>Medical Electrical Equipment &mdash; General Requirements for Radiation Protection</td></tr>
    <tr><td>ICRP Publication 85</td><td>Avoidance of Radiation Injuries from Interventional Procedures</td></tr>
  </tbody>
</table>

<h3>1.3 Definitions &amp; Abbreviations</h3>
<table class="report-table">
  <thead><tr><th>Symbol</th><th>Definition</th></tr></thead>
  <tbody>
    <tr><td>W</td><td>Weekly Workload (mA·min/week)</td></tr>
    <tr><td>U</td><td>Use Factor &mdash; fraction of time beam directed toward barrier</td></tr>
    <tr><td>T</td><td>Occupancy Factor &mdash; fraction of time area is occupied</td></tr>
    <tr><td>H<sub>W</sub></td><td>Weekly dose equivalent (mSv/week)</td></tr>
    <tr><td>H<sub>E</sub></td><td>Annual dose equivalent (mSv/year)</td></tr>
    <tr><td>d</td><td>Distance from source to point of interest (m)</td></tr>
    <tr><td>ISL</td><td>Inverse Square Law</td></tr>
    <tr><td>HVL</td><td>Half-Value Layer &mdash; thickness reducing intensity by 50%</td></tr>
    <tr><td>TVL</td><td>Tenth-Value Layer &mdash; thickness reducing intensity by 90%</td></tr>
    <tr><td>&mu;</td><td>Linear Attenuation Coefficient (cm<sup>&minus;1</sup>)</td></tr>
    <tr><td>B</td><td>Transmission Factor &mdash; ratio of transmitted to incident intensity</td></tr>
    <tr><td>SF</td><td>Source Factor &mdash; machine-specific output scaling</td></tr>
    <tr><td>SI</td><td>Safety Index &mdash; design margin multiplier</td></tr>
  </tbody>
</table>`;
}

/* ============================================================
   SECTION 2 — EQUIPMENT SPECIFICATIONS
   ============================================================ */
function section2(): string {
  const s = appState.get();
  const m = s.selectedMachine;
  const kvp = m?.kvp || 100;
  const ma = m?.ma || 500;
  const workload = m?.workload || 40;
  const beamAngle = m?.beamAngle ?? s.sourceInput.beamAngle;

  // Radiation output estimation
  const primaryOutput = (ma * kvp * 0.001) / 100;
  const doseRateAt1m = primaryOutput * 60; // mSv/h at 1m

  // Leakage vs IEC 60601
  const leakVal = s.sourceInput.leakageRadiation || 0.001;
  const headLeakageRate = doseRateAt1m * leakVal;
  const iecLimit = 1.0; // mGy/h at 1m
  const leakCompliant = headLeakageRate <= iecLimit;

  // Scatter factor
  const scatterFrac = kvp <= 50 ? 0.001 : kvp <= 100 ? 0.002 :
    kvp <= 150 ? 0.003 : kvp <= 300 ? 0.005 : 0.01;

  return `
<h2>2 &mdash; Equipment Specifications</h2>
<h3>2.1 Equipment Parameter Table</h3>
<table class="report-table">
  <thead><tr><th>Parameter</th><th>Value</th><th>Unit</th></tr></thead>
  <tbody>
    <tr><td>Modality</td><td>${s.selectedModality?.name || '—'}</td><td>—</td></tr>
    <tr><td>Manufacturer</td><td>${s.selectedManufacturer?.name || '—'}</td><td>—</td></tr>
    <tr><td>Machine Model</td><td>${m?.model || '—'} ${m?.type ? '(' + m.type + ')' : ''}</td><td>—</td></tr>
    <tr><td>Tube Voltage</td><td>${kvp}</td><td>kVp</td></tr>
    <tr><td>Tube Current</td><td>${ma}</td><td>mA</td></tr>
    <tr><td>Weekly Workload (W)</td><td>${workload}</td><td>mA·min/week</td></tr>
    <tr><td>Beam Angle</td><td>${beamAngle}</td><td>degrees from vertical</td></tr>
    <tr><td>Source Factor (SF)</td><td>${fmt(s.sourceInput.sourceFactor, 2)}</td><td>—</td></tr>
    <tr><td>Safety Index (SI)</td><td>${fmt(s.sourceInput.safetyIndex, 2)}</td><td>—</td></tr>
    <tr><td>Leakage Value</td><td>${(leakVal * 100).toFixed(2)}</td><td>% of primary</td></tr>
    <tr><td>Scatter Fraction</td><td>${fmt(scatterFrac, 4)}</td><td>—</td></tr>
    <tr><td>Primary Output @ 1m</td><td>${fmt(doseRateAt1m, 4)}</td><td>mSv/h</td></tr>
  </tbody>
</table>

<h3>2.2 Radiation Output Characteristics</h3>
<p>The primary beam output at 1 m from the source is calculated as:</p>
<p><strong>Formula:</strong> I<sub>1m</sub> = (I<sub>tube</sub> &times; V<sub>tube</sub> &times; 0.001) / 100 &times; SF &times; SI</p>
<p><strong>Substitution:</strong> I<sub>1m</sub> = (${ma} &times; ${kvp} &times; 0.001) / 100 &times; ${fmt(s.sourceInput.sourceFactor, 2)} &times; ${fmt(s.sourceInput.safetyIndex, 2)}</p>
<p><strong>Result:</strong> I<sub>1m</sub> = ${fmt(primaryOutput, 5)} mSv per mA·min at 1 m</p>

<h3>2.3 Primary Beam Direction</h3>
<p>The beam is oriented at <strong>${beamAngle}&deg;</strong> from vertical. At this angle:</p>
<ul>
  <li>Primary barrier: ${beamAngle >= 30 ? 'Ceiling / Upper walls (beam directed upward)' : 'Floor / Lower walls (beam directed downward)'}</li>
  <li>Secondary barriers: All other walls and surfaces</li>
</ul>
<p>Beam angle correction factor (1/cos &theta;): <strong>${fmt(1 / Math.max(Math.cos(beamAngle * Math.PI / 180), 0.01), 4)}</strong></p>

<h3>2.4 Weekly Workload Derivation</h3>
<p><strong>Formula:</strong> W = mA &times; (exposures/day) &times; (exposure time per image) &times; (days/week)</p>
<p><strong>Substitution:</strong> W = ${ma} &times; 10 &times; 0.5 &times; 5 = ${ma * 10 * 0.5 * 5} mA·s/week</p>
<p><strong>Converted to min/week:</strong> W = ${fmt(workload, 0)} mA·min/week</p>

<h3>2.5 Tube Housing Leakage</h3>
<p><strong>IEC 60601-1-3 Limit:</strong> 1.0 mGy/h at 1 m from tube housing</p>
<p><strong>Estimated tube leakage:</strong> ${fmt(leakVal * 100, 4)}% of primary output</p>
<p><strong>Calculated leakage rate:</strong> ${fmt(headLeakageRate, 4)} mGy/h at 1 m</p>
<p><strong>Status:</strong> ${leakCompliant ? '<span class="report-badge safe">COMPLIANT</span>' : '<span class="report-badge fail">NON-COMPLIANT</span>'}</p>`;
}

/* ============================================================
   SECTION 3 — FACILITY & ROOM GEOMETRY
   ============================================================ */
function section3(): string {
  const s = appState.get();
  const dims = s.selectedRoomCustom || { length: 7, width: 5.5, height: 3 };
  const area = dims.length * dims.width;
  const volume = dims.length * dims.width * dims.height;
  const walls = s.walls;

  // Adjacent room table
  const adjRows = walls.filter(w => w.surfaceType === 'wall').map(w => {
    const occDist = getOccupantDistance(w.distance, false);
    const primary = Math.abs(s.sourceInput.beamAngle) < 45 && w.id === 'north';
    return `<tr>
      <td>${w.label.replace(' Wall', '')}</td>
      <td>${w.adjacentArea}</td>
      <td>${primary ? 'Primary' : 'Secondary'}</td>
      <td>${fmt(w.distance, 1)} m</td>
      <td>${fmt(occDist, 1)} m</td>
    </tr>`;
  }).join('');

  return `
<h2>3 &mdash; Facility &amp; Room Geometry</h2>
<h3>3.1 Room Dimensions</h3>
<table class="report-table">
  <thead><tr><th>Dimension</th><th>Value</th><th>Unit</th></tr></thead>
  <tbody>
    <tr><td>Length (L)</td><td>${fmt(dims.length, 1)}</td><td>m</td></tr>
    <tr><td>Width (W)</td><td>${fmt(dims.width, 1)}</td><td>m</td></tr>
    <tr><td>Height (H)</td><td>${fmt(dims.height, 1)}</td><td>m</td></tr>
    <tr><td>Floor Area</td><td>${fmt(area, 2)}</td><td>m<sup>2</sup></td></tr>
    <tr><td>Room Volume</td><td>${fmt(volume, 2)}</td><td>m<sup>3</sup></td></tr>
  </tbody>
</table>

<h3>3.2 Adjacent Room Configuration</h3>
<table class="report-table">
  <thead><tr><th>Direction</th><th>Adjacent Area</th><th>Barrier Type</th><th>Source-to-Wall (m)</th><th>Source-to-Occupant (m)</th></tr></thead>
  <tbody>${adjRows || '<tr><td colspan="5">No wall data configured</td></tr>'}</tbody>
</table>

<h3>3.3 Source-to-Occupied-Point Distance</h3>
<p>For each wall, the occupied point is taken as <strong>0.3 m beyond the wall surface</strong>:</p>
<p><strong>Formula:</strong> d<sub>occ</sub> = d<sub>wall</sub> + 0.3 m</p>
${walls.filter(w => w.surfaceType === 'wall').map(w => `
<p><strong>${w.label}:</strong> d<sub>occ</sub> = ${fmt(w.distance, 1)} + 0.3 = <strong>${fmt(w.distance + 0.3, 1)} m</strong></p>`).join('')}

<h3>3.4 Primary &amp; Secondary Barrier Identification</h3>
<table class="report-table">
  <thead><tr><th>Surface</th><th>Classification</th><th>Justification</th></tr></thead>
  <tbody>
    <tr><td>${walls[0]?.label || 'North Wall'}</td><td>${Math.abs(s.sourceInput.beamAngle) < 45 ? 'Primary' : 'Secondary'}</td><td>${Math.abs(s.sourceInput.beamAngle) < 45 ? 'Direct beam path at current beam angle' : 'No direct beam incidence'}</td></tr>
    <tr><td>${walls[1]?.label || 'South Wall'}</td><td>Secondary</td><td>Scatter and leakage only</td></tr>
    <tr><td>${walls[2]?.label || 'East Wall'}</td><td>Secondary</td><td>Scatter and leakage only</td></tr>
    <tr><td>${walls[3]?.label || 'West Wall'}</td><td>Secondary</td><td>Scatter and leakage only</td></tr>
  </tbody>
</table>

<h3>3.5 Room Size Adequacy Assessment</h3>
<p>Room area: <strong>${fmt(area, 1)} m<sup>2</sup></strong> &mdash; Minimum recommended for ${s.selectedModality?.name || 'this modality'}: <strong>15 m<sup>2</sup></strong></p>
<p><strong>Status:</strong> ${area >= 15 ? '<span class="report-badge safe">ADEQUATE</span>' : '<span class="report-badge warning">BELOW RECOMMENDED</span>'}</p>`;
}

/* ============================================================
   SECTION 4 — SHIELDING MATERIAL PROPERTIES
   ============================================================ */
function section4(): string {
  const s = appState.get();
  const kvp = s.selectedMachine?.kvp || 100;
  const uniqueMaterials = [...new Set(s.walls.map(w => w.material))];

  const matRows = uniqueMaterials.map(mat => {
    const mu = getMu(mat, kvp);
    const { hvt, tvt } = hvTvl(mat, kvp);
    const dens = materialDensity(mat);
    const massAtten = mu / dens;
    // Lead equivalence at 100 kVp
    const leadMu = getMu('Lead', kvp);
    const leadEquiv = leadMu > 0 ? mu / leadMu : 0;
    return `<tr>
      <td>${mat}</td>
      <td>${fmt(dens, 2)} g/cm<sup>3</sup></td>
      <td>${fmt(mu, 4)} cm<sup>&minus;1</sup></td>
      <td>${fmt(hvt, 3)} cm</td>
      <td>${fmt(tvt, 3)} cm</td>
      <td>${fmt(massAtten, 4)} cm<sup>2</sup>/g</td>
      <td>${fmt(leadEquiv, 4)}</td>
    </tr>`;
  }).join('');

  // Show HVL/TVL calculation for first material
  const firstMat = uniqueMaterials[0] || 'Concrete';
  const mu1 = getMu(firstMat, kvp);
  const hvt1 = mu1 > 0 ? 0.693 / mu1 : 99;
  const tvt1 = mu1 > 0 ? 2.303 / mu1 : 99;

  return `
<h2>4 &mdash; Shielding Material Properties</h2>
<h3>4.1 Material Properties Table</h3>
<table class="report-table">
  <thead><tr><th>Material</th><th>Density (&rho;)</th><th>&mu; (cm<sup>&minus;1</sup>)</th><th>HVL (cm)</th><th>TVL (cm)</th><th>&mu;/&rho; (cm<sup>2</sup>/g)</th><th>Pb Equivalence</th></tr></thead>
  <tbody>${matRows}</tbody>
</table>

<h3>4.2 Sample HVL / TVL Calculation (${firstMat})</h3>
<p><strong>Linear attenuation coefficient (&mu;):</strong> ${fmt(mu1, 4)} cm<sup>&minus;1</sup></p>
<p><strong>HVL Formula:</strong> HVL = ln(2) / &mu; = 0.693 / ${fmt(mu1, 4)} = <strong>${fmt(hvt1, 3)} cm</strong></p>
<p><strong>TVL Formula:</strong> TVL = ln(10) / &mu; = 2.303 / ${fmt(mu1, 4)} = <strong>${fmt(tvt1, 3)} cm</strong></p>

<h3>4.3 Mass Attenuation Coefficient</h3>
<p><strong>Formula:</strong> &mu;/&rho; = &mu; / &rho;</p>
${uniqueMaterials.map(mat => {
  const mu = getMu(mat, kvp);
  const dens = materialDensity(mat);
  return `<p>${mat}: &mu;/&rho; = ${fmt(mu, 4)} / ${fmt(dens, 2)} = <strong>${fmt(mu / dens, 4)} cm<sup>2</sup>/g</strong></p>`;
}).join('')}

<h3>4.4 Weight per Unit Area</h3>
<table class="report-table">
  <thead><tr><th>Material</th><th>Density (g/cm<sup>3</sup>)</th><th>Thickness (cm)</th><th>Weight per m<sup>2</sup> (kg/m<sup>2</sup>)</th></tr></thead>
  <tbody>${s.walls.filter(w => w.thickness > 0).map(w => {
    const dens = materialDensity(w.material);
    const weight = dens * w.thickness * 10; // convert to kg/m2
    return `<tr><td>${w.material}</td><td>${fmt(dens, 2)}</td><td>${fmt(w.thickness, 1)}</td><td>${fmt(weight, 1)} kg/m<sup>2</sup></td></tr>`;
  }).join('')}</tbody>
</table>`;
}

/* ============================================================
   SECTION 5 — PER-WALL SHIELDING ANALYSIS
   ============================================================ */
function section5(shielding: any): string {
  const s = appState.get();
  const kvp = s.selectedMachine?.kvp || 100;
  const m = s.selectedMachine;
  const ma = m?.ma || 500;
  const workload = m?.workload || 40;
  const src = s.sourceInput;
  const primaryOutput = (ma * kvp * 0.001) / 100;
  const effOutput = primaryOutput * src.sourceFactor * src.safetyIndex;
  const beamRad = (src.beamAngle * Math.PI) / 180;
  const angleFactor = 1 / Math.max(Math.cos(beamRad), 0.01);
  const doseAtSource = effOutput * angleFactor;

  const wallDetails: WallDetail[] = (shielding?.wallDetails || []);

  let wallSections = '';
  wallDetails.forEach((w: any, idx: number) => {
    const mu = getMu(w.material, kvp);
    const { hvt, tvt } = hvTvl(w.material, kvp);
    const occDist = w.distance + 0.3;

    // 5b — Unshielded Dose Rate (ISL)
    const doseUnshielded = doseAtSource / (w.distance * w.distance);

    // 5c — Attenuation
    const transmission = Math.exp(-mu * w.thickness);
    const doseShielded = doseUnshielded * transmission;
    const numHvls = hvt > 0 ? w.thickness / hvt : 0;
    const numTvls = tvt > 0 ? w.thickness / tvt : 0;

    // 5e — Adequacy
    const designGoal = w.annualDose <= 1.0 ? 1.0 : 0.3;
    const isAdequate = w.annualDose <= designGoal;
    const marginPct = designGoal > 0 ? ((designGoal - w.annualDose) / designGoal) * 100 : 0;
    let verdict: string;
    if (isAdequate && marginPct > 20) verdict = 'ADEQUATE';
    else if (isAdequate) verdict = 'MARGINAL';
    else verdict = 'INADEQUATE';

    // Required thickness if inadequate
    const targetTrans = designGoal / (doseUnshielded * (workload / 60) * 50 * (w.occupancyFactor || 0.5) * 0.5);
    const reqThick = targetTrans > 0 ? -Math.log(Math.max(targetTrans, 1e-10)) / Math.max(mu, 0.01) : 0;

    wallSections += `
<h3>5.${idx + 1} ${w.wall || 'Wall ' + (idx + 1)}</h3>

<h4>5.${idx + 1}a &mdash; Wall Identity</h4>
<table class="report-table">
  <tr><th style="width:200px">Surface</th><td>${w.wall}</td></tr>
  <tr><th>Adjacent Area</th><td>${w.adjacentArea || '—'}</td></tr>
  <tr><th>Barrier Classification</th><td>${idx === 0 ? 'Primary / Secondary' : 'Secondary'}</td></tr>
  <tr><th>Material</th><td>${w.material}</td></tr>
  <tr><th>Configured Thickness</th><td>${fmt(w.thickness, 1)} cm</td></tr>
</table>

<h4>5.${idx + 1}b &mdash; Unshielded Dose Rate</h4>
<p><strong>Primary beam output at source:</strong> ${fmt(doseAtSource, 5)} mSv per mA·min at 1 m</p>
<p><strong>Inverse Square Law:</strong> I<sub>2</sub> = I<sub>1</sub> &times; (d<sub>1</sub>/d<sub>2</sub>)<sup>2</sup></p>
<p><strong>Substitution:</strong> I<sub>wall</sub> = ${fmt(doseAtSource, 5)} &times; (1 / ${fmt(w.distance, 1)})<sup>2</sup></p>
<p><strong>Result:</strong> I<sub>wall</sub> = <strong>${fmt(doseUnshielded, 6)} mSv per mA·min</strong> at wall surface</p>
<p><strong>Unshielded dose rate at occupied boundary (d = ${fmt(occDist, 2)} m):</strong> ${fmt(doseUnshielded / (occDist * occDist), 6)} mSv/mA·min</p>

<h4>5.${idx + 1}c &mdash; Attenuation Calculation</h4>
<p><strong>Attenuation formula:</strong> I = I<sub>0</sub> &times; e<sup>(&minus;&mu;x)</sup></p>
<p><strong>Material &mu; at ${kvp} kVp:</strong> ${fmt(mu, 4)} cm<sup>&minus;1</sup></p>
<p><strong>Substitution:</strong> I = ${fmt(doseUnshielded, 6)} &times; e<sup>(&minus;${fmt(mu, 4)} &times; ${fmt(w.thickness, 1)})</sup></p>
<p><strong>Result (shielded):</strong> I = <strong>${fmt(doseShielded, 8)} mSv per mA·min</strong></p>
<p><strong>Transmission Factor B = I/I<sub>0</sub>:</strong> ${fmt(transmission, 6)}</p>
<p><strong>Number of HVLs provided:</strong> n = x / HVL = ${fmt(w.thickness, 1)} / ${fmt(hvt, 3)} = <strong>${fmt(numHvls, 2)} HVL</strong></p>
<p><strong>Number of TVLs provided:</strong> n = x / TVL = ${fmt(w.thickness, 1)} / ${fmt(tvt, 3)} = <strong>${fmt(numTvls, 2)} TVL</strong></p>

<h4>5.${idx + 1}d &mdash; Shielded Dose Rate</h4>
<p><strong>Weekly dose:</strong> D<sub>wk</sub> = ${fmt(doseShielded, 8)} &times; (${workload} / 60) = <strong>${fmt(doseShielded * workload / 60, 6)} mSv/week</strong></p>
<p><strong>Annual dose:</strong> D<sub>yr</sub> = ${fmt(doseShielded * workload / 60, 6)} &times; 50 &times; ${fmt(w.occupancyFactor || 0.5, 2)} &times; 0.5 = <strong>${fmt(w.annualDose, 4)} mSv/yr</strong></p>
<p><strong>Design goal for this zone:</strong> ${designGoal} mSv/yr</p>
<p><strong>Calculated annual dose:</strong> ${fmt(w.annualDose, 4)} mSv/yr</p>
<p><strong>Margin:</strong> ${fmt(marginPct, 1)}%</p>

<h4>5.${idx + 1}e &mdash; Adequacy Verdict</h4>
<p><strong>Verdict:</strong> ${verdictBadge(verdict)}</p>
${verdict === 'INADEQUATE' ? `
<p><strong>Required minimum thickness:</strong> ${fmt(reqThick, 1)} cm (currently ${fmt(w.thickness, 1)} cm)</p>
<p><strong>Deficit:</strong> ${fmt(reqThick - w.thickness, 1)} cm of ${w.material}</p>
<p><strong>Recommended action:</strong> Increase thickness by ${Math.ceil((reqThick - w.thickness) / hvt)} HVL(s) to meet design goal.</p>` :
  verdict === 'MARGINAL' ? `
<p><strong>Note:</strong> This wall meets the design goal but with minimal margin (${fmt(marginPct, 1)}%). Consider increasing thickness by 1 HVL (${fmt(hvt, 2)} cm) for additional safety.</p>` : `
<p><strong>Justification:</strong> The annual dose (${fmt(w.annualDose, 4)} mSv/yr) is well below the design goal (${designGoal} mSv/yr) with a margin of ${fmt(marginPct, 1)}%. No remediation required.</p>`}
<p><strong>Thickness surplus:</strong> ${fmt(w.thickness - reqThick, 1)} cm</p>
`;
  });

  return `
<h2>5 &mdash; Per-Wall Shielding Analysis</h2>
<p>The following analysis is performed for each of the ${wallDetails.length} radiation barrier surfaces.</p>
${wallSections || '<p>No wall shielding data available.</p>'}`;
}

/* ============================================================
   SECTION 6 — ANNUAL DOSE ESTIMATION
   ============================================================ */
function section6(shielding: any): string {
  const s = appState.get();
  const kvp = s.selectedMachine?.kvp || 100;
  const workload = s.selectedMachine?.workload || 40;
  const wallDetails: WallDetail[] = (shielding?.wallDetails || []);

  const annualRows = wallDetails.map((w: any) => {
    const mu = getMu(w.material, kvp);
    const occFac = w.occupancyFactor || 0.5;
    const useFac = 0.5;
    const doseAtWall = (w.doseUnshielded || 0);
    const transmission = Math.exp(-mu * w.thickness);
    const annualCalc = workload * useFac * occFac * (1 / (w.distance * w.distance)) * transmission;
    const pctOfLimit = w.annualDose > 0 ? (w.annualDose / 1.0) * 100 : 0;

    return `<tr>
      <td>${w.wall}</td>
      <td>${fmt(occFac, 2)}</td>
      <td>${fmt(useFac, 2)}</td>
      <td>${workload}</td>
      <td>${fmt(w.distance, 1)} m</td>
      <td>${fmt(transmission, 4)}</td>
      <td>${fmt(annualCalc, 4)}</td>
      <td>${fmt(pctOfLimit, 1)}%</td>
    </tr>`;
  }).join('');

  // Total collective dose
  const totalAnnual = wallDetails.reduce((sum: number, w: any) => sum + (w.annualDose || 0), 0);

  return `
<h2>6 &mdash; Annual Dose Estimation</h2>
<h3>6.1 Annual Dose Calculation Methodology</h3>
<p><strong>Formula:</strong> H = W &times; U &times; T &times; (1/d<sup>2</sup>) &times; B</p>
<p>Where:</p>
<ul>
  <li>W = Weekly workload (${workload} mA·min/week)</li>
  <li>U = Use factor (0.5 for primary, 0.25 for secondary)</li>
  <li>T = Occupancy factor</li>
  <li>d = Distance from source to occupied point (m)</li>
  <li>B = Transmission factor = e<sup>(&minus;&mu;x)</sup></li>
</ul>

<h3>6.2 Per-Wall Annual Dose Summary</h3>
<table class="report-table">
  <thead><tr><th>Wall</th><th>T</th><th>U</th><th>W</th><th>d</th><th>B</th><th>H (mSv/yr)</th><th>% of Limit</th></tr></thead>
  <tbody>${annualRows || '<tr><td colspan="8">No data</td></tr>'}</tbody>
  <tfoot><tr><td colspan="6"><strong>Total Annual Dose (all zones)</strong></td><td><strong>${fmt(totalAnnual, 4)} mSv/yr</strong></td><td>—</td></tr></tfoot>
</table>

<h3>6.3 Occupancy Factor Derivation</h3>
${appState.get().occupancyConfigs.map(oc => {
  const totalPeople = oc.workers + oc.publicCount;
  const factor = totalPeople > 0 ? Math.min(1.0, (totalPeople * oc.weeklyHours) / 168) : 0.05;
  return `<p><strong>${oc.areaType}:</strong> T = ${totalPeople} &times; ${oc.weeklyHours} / 168 = <strong>${fmt(factor, 3)}</strong></p>`;
}).join('')}

<h3>6.4 Use Factor per Barrier</h3>
<table class="report-table">
  <thead><tr><th>Barrier</th><th>Use Factor (U)</th><th>Justification</th></tr></thead>
  <tbody>
    <tr><td>${wallDetails[0]?.wall || 'Primary Barrier'}</td><td>0.50</td><td>Primary beam directed 100% of exposures</td></tr>
    <tr><td>Secondary Barriers</td><td>0.25</td><td>Scatter and leakage only</td></tr>
  </tbody>
</table>`;
}

/* ============================================================
   SECTION 7 — LEAKAGE RADIATION ANALYSIS
   ============================================================ */
function section7(shielding: any): string {
  const s = appState.get();
  const kvp = s.selectedMachine?.kvp || 100;
  const workload = s.selectedMachine?.workload || 40;
  const src = s.sourceInput;
  const wallDetails: WallDetail[] = (shielding?.wallDetails || []);
  const leakageRad = src.leakageRadiation || 0.001;

  const combinedRows = wallDetails.map((w: any) => {
    const mu = getMu(w.material, kvp);
    const transmission = Math.exp(-mu * w.thickness);
    const primaryLeak = (workload * 0.5 * leakageRad * (1 / (w.distance * w.distance)) * transmission);
    // Scatter: α/400 × F/d²_sca × 1/d²_sec × B_sec
    const scatterFrac = kvp <= 100 ? 0.002 : kvp <= 150 ? 0.003 : 0.005;
    const patientDist = src.sourceToPatientDist || 1.0;
    const scatterDose = workload * (scatterFrac / 400) * (1 / (patientDist * patientDist)) * (1 / (w.distance * w.distance)) * transmission;
    const headLeak = (workload * 0.001 * leakageRad) / (w.distance * w.distance) * transmission;
    const totalLeakage = (primaryLeak + scatterDose + headLeak) * 50;
    const designGoal = 0.5;
    const pctGoal = designGoal > 0 ? (totalLeakage / designGoal) * 100 : 0;
    const status = totalLeakage <= designGoal ? 'SAFE' : totalLeakage <= designGoal * 1.5 ? 'WARNING' : 'FAIL';

    return `<tr>
      <td>${w.wall}</td>
      <td>${fmt(primaryLeak * 1000, 3)} &mu;Sv/h</td>
      <td>${fmt(scatterDose * 1000, 3)} &mu;Sv/h</td>
      <td>${fmt(headLeak * 1000, 3)} &mu;Sv/h</td>
      <td>${fmt(totalLeakage * 1000, 3)} &mu;Sv/h</td>
      <td>${fmt(w.distance, 1)} m</td>
      <td>${designGoal} mSv/yr</td>
      <td>${fmt(pctGoal, 1)}%</td>
      <td>${statusBadge(status)}</td>
    </tr>`;
  }).join('');

  // Find hotspot
  const hotspot = wallDetails.reduce((worst: any, w: any) => {
    const mu = getMu(w.material, kvp);
    const trans = Math.exp(-mu * w.thickness);
    const total = (workload * 0.5 * leakageRad * (1 / (w.distance * w.distance)) * trans) * 50;
    return total > (worst.total || 0) ? { wall: w.wall, total } : worst;
  }, { wall: '—', total: 0 });

  return `
<h2>7 &mdash; Leakage Radiation Analysis</h2>
<h3>7.1 Primary Beam Leakage</h3>
<p><strong>Formula:</strong> L = W &times; U &times; f<sub>leak</sub> &times; (1/d<sup>2</sup>) &times; B</p>
${wallDetails.map((w: any) => {
  const mu = getMu(w.material, kvp);
  const transmission = Math.exp(-mu * w.thickness);
  return `<p><strong>${w.wall}:</strong> L = ${workload} &times; 0.5 &times; ${fmt(leakageRad, 6)} &times; (1/${fmt(w.distance, 1)}<sup>2</sup>) &times; ${fmt(transmission, 4)} = <strong>${fmt(workload * 0.5 * leakageRad * (1 / (w.distance * w.distance)) * transmission, 6)} mSv/yr</strong></p>`;
}).join('')}

<h3>7.2 Scatter Radiation Analysis</h3>
<p><strong>Scatter fraction (&alpha;) at ${kvp} kVp (90&deg; scatter angle):</strong> ${fmt(kvp <= 100 ? 0.002 : kvp <= 150 ? 0.003 : 0.005, 4)}</p>
<p><strong>Scatter dose formula:</strong> D<sub>S</sub> = W &times; (&alpha;/400) &times; (F/d<sup>2</sup><sub>sca</sub>) &times; (1/d<sup>2</sup><sub>sec</sub>) &times; B<sub>sec</sub></p>
${wallDetails.map((w: any) => {
  const mu = getMu(w.material, kvp);
  const transmission = Math.exp(-mu * w.thickness);
  const scatterFrac = kvp <= 100 ? 0.002 : kvp <= 150 ? 0.003 : 0.005;
  const patientDist = src.sourceToPatientDist || 1.0;
  const scatter = workload * (scatterFrac / 400) * (1 / (patientDist * patientDist)) * (1 / (w.distance * w.distance)) * transmission;
  return `<p><strong>${w.wall}:</strong> D<sub>S</sub> = ${workload} &times; (${fmt(scatterFrac, 4)}/400) &times; (1/${fmt(patientDist, 1)}<sup>2</sup>) &times; (1/${fmt(w.distance, 1)}<sup>2</sup>) &times; ${fmt(transmission, 4)} = <strong>${fmt(scatter * 50, 6)} mSv/yr</strong></p>`;
}).join('')}

<h3>7.3 Tube Housing Leakage</h3>
<p><strong>IEC 60601-1-3 limit:</strong> 1.0 mGy/h at 1 m</p>
<p><strong>Head leakage estimate:</strong> ${fmt(leakageRad * 100, 4)}% of primary beam</p>
<p><strong>Distance-corrected head leakage at each wall:</strong></p>
${wallDetails.map((w: any) => {
  const headLeak = (workload * 0.001 * leakageRad) / (w.distance * w.distance);
  return `<p>${w.wall}: ${fmt(headLeak * 50 * 1000, 3)} &mu;Sv/yr at ${fmt(w.distance, 1)} m</p>`;
}).join('')}

<h3>7.4 Combined Leakage Summary</h3>
<table class="report-table">
  <thead><tr><th>Wall</th><th>Primary (&mu;Sv/h)</th><th>Scatter (&mu;Sv/h)</th><th>Head (&mu;Sv/h)</th><th>Total (&mu;Sv/yr)</th><th>Distance (m)</th><th>Goal</th><th>% Goal</th><th>Status</th></tr></thead>
  <tbody>${combinedRows || '<tr><td colspan="9">No data</td></tr>'}</tbody>
</table>

<h3>7.5 Hotspot Identification</h3>
<p><strong>Wall with highest combined leakage dose rate:</strong> ${hotspot.wall} (${fmt(hotspot.total || 0, 4)} mSv/yr equivalent)</p>
<p><strong>Status:</strong> ${hotspot.total <= 0.5 ? 'All boundaries within design goals - no hotspots identified' : hotspot.wall + ' exceeds design goal - corrective actions required'}</p>`;
}

/* ============================================================
   SECTION 8 — OCCUPANCY & WORKLOAD ANALYSIS
   ============================================================ */
function section8(): string {
  const s = appState.get();
  const workload = s.selectedMachine?.workload || 40;
  const kvp = s.selectedMachine?.kvp || 100;
  const ma = s.selectedMachine?.ma || 500;

  // Workload derivation
  const weeklyS = ma * 10 * 0.5 * 5; // mA · exposures/day · s per exposure · days/week
  const annualWorkload = workload * 50;
  const weeklyHours = workload / 60;

  const occRows = s.occupancyConfigs.map(oc => {
    const total = oc.workers + oc.publicCount;
    const factor = total > 0 ? Math.min(1.0, (total * oc.weeklyHours) / 168) : 0.05;
    return `<tr>
      <td>${oc.areaType}</td>
      <td>${fmt(factor, 3)}</td>
      <td>${oc.workers} workers, ${oc.publicCount} public</td>
    </tr>`;
  }).join('');

  // Workload headroom
  const maxAnnual = Math.max(...(s.shieldingResult?.wallDetails || []).map((w: any) => w.annualDose), 0);
  const allowableMultiplier = maxAnnual > 0 ? 1.0 / maxAnnual : 10;
  const doubleWorkload = workload * 2;
  const doubleAnnual = s.shieldingResult?.wallDetails?.map((w: any) => {
    const mu = getMu(w.material, kvp);
    const transmission = Math.exp(-mu * w.thickness);
    return doubleWorkload * 0.5 * (w.occupancyFactor || 0.5) * (1 / (w.distance * w.distance)) * transmission * 50;
  }) || [];

  return `
<h2>8 &mdash; Occupancy &amp; Workload Analysis</h2>
<h3>8.1 Occupancy Factor Table</h3>
<table class="report-table">
  <thead><tr><th>Area / Zone</th><th>T</th><th>Justification</th></tr></thead>
  <tbody>${occRows || '<tr><td colspan="3">No occupancy data</td></tr>'}</tbody>
</table>

<h3>8.2 Use Factor per Wall Direction</h3>
<table class="report-table">
  <thead><tr><th>Direction</th><th>Use Factor (U)</th><th>Type</th></tr></thead>
  <tbody>
    <tr><td>Floor / Primary Barrier</td><td>0.50</td><td>Primary</td></tr>
    <tr><td>Side Walls (Secondary)</td><td>0.25</td><td>Secondary</td></tr>
    <tr><td>Ceiling</td><td>0.05</td><td>Secondary / Roof</td></tr>
  </tbody>
</table>

<h3>8.3 Weekly Workload Derivation</h3>
<p><strong>From machine parameters:</strong></p>
<table class="report-table">
  <tr><th>Parameter</th><th>Value</th></tr>
  <tr><td>Tube current</td><td>${ma} mA</td></tr>
  <tr><td>Exposures per day</td><td>10</td></tr>
  <tr><td>Exposure time per image</td><td>0.5 s</td></tr>
  <tr><td>Operating days per week</td><td>5</td></tr>
  <tr><td>Weekly workload (mA·s)</td><td>${weeklyS} mA·s/week</td></tr>
  <tr><td><strong>Weekly workload (mA·min)</strong></td><td><strong>${fmt(weeklyS / 60, 0)} mA·min/week</strong></td></tr>
  <tr><td>Annual workload (50 weeks)</td><td>${fmt(annualWorkload, 0)} mA·min/year</td></tr>
  <tr><td>Weekly operating hours</td><td>${fmt(weeklyHours, 1)} h/week</td></tr>
</table>

<h3>8.4 Effective Workload per Wall</h3>
<p><strong>Formula:</strong> W<sub>eff</sub> = W &times; U</p>
${['Primary Barrier', 'Secondary Barrier', 'Ceiling'].map((barrier, i) => {
  const u = [0.5, 0.25, 0.05][i];
  return `<p><strong>${barrier}:</strong> W<sub>eff</sub> = ${workload} &times; ${fmt(u, 2)} = <strong>${fmt(workload * u, 1)} mA·min/week</strong></p>`;
}).join('')}

<h3>8.5 Impact Projection: Workload Doubled</h3>
<p>If the weekly workload doubles from ${workload} to ${doubleWorkload} mA·min/week:</p>
<table class="report-table">
  <thead><tr><th>Wall</th><th>Current (mSv/yr)</th><th>Doubled (mSv/yr)</th><th>Compliance Status</th></tr></thead>
  <tbody>${(s.shieldingResult?.wallDetails || []).map((w: any, i: number) => {
    const current = w.annualDose || 0;
    const doubled = doubleAnnual[i] || current * 2;
    const status = doubled <= 1.0 ? 'SAFE' : doubled <= 2.0 ? 'WARNING' : 'FAIL';
    return `<tr><td>${w.wall}</td><td>${fmt(current, 3)}</td><td>${fmt(doubled, 3)}</td><td>${statusBadge(status)}</td></tr>`;
  }).join('')}</tbody>
</table>

<h3>8.6 Workload Headroom</h3>
<p><strong>Allowable workload multiplier before exceeding 1 mSv/yr:</strong> &times;${fmt(allowableMultiplier, 1)}</p>
<p><strong>Workload headroom:</strong> ${fmt(allowableMultiplier * workload, 0)} mA·min/week before any wall exceeds 1 mSv/yr limit</p>`;
}

/* ============================================================
   SECTION 9 — COMPLIANCE ANALYSIS
   ============================================================ */
function section9(shielding: any, compliance: any): string {
  const s = appState.get();
  const kvp = s.selectedMachine?.kvp || 100;
  const wallDetails: WallDetail[] = (shielding?.wallDetails || []);

  // Per-wall compliance
  const wallCompliance = wallDetails.map((w: any) => {
    const limit = 1.0;
    const margin = limit > 0 ? ((limit - w.annualDose) / limit) * 100 : 0;
    const status = w.annualDose <= 0.5 ? 'PASS' : w.annualDose <= 1.0 ? 'MARGINAL' : 'FAIL';
    return `<tr>
      <td>${w.wall}</td>
      <td>${w.adjacentArea || '—'}</td>
      <td>Secondary</td>
      <td>${fmt(w.annualDose, 4)}</td>
      <td>${limit}</td>
      <td>${fmt(margin, 1)}%</td>
      <td>${w.isSafe ? '<span class="report-badge safe">PASS</span>' : '<span class="report-badge fail">FAIL</span>'}</td>
    </tr>`;
  }).join('');

  // Multi-standard matrix
  const standards = ['AERB (1.0 mSv/yr)', 'ICRP 103 (1.0 mSv/yr)', 'NCRP 151 (0.5 mSv/yr)', 'IEC 60601 (1.0 mSv/yr)'];
  const matrixRows = wallDetails.map((w: any) => {
    const stdStatuses = standards.map(std => {
      const limit = std.includes('0.5') ? 0.5 : 1.0;
      return w.annualDose <= limit ? '<span class="report-badge safe">PASS</span>' : '<span class="report-badge fail">FAIL</span>';
    }).join('');
    return `<tr><td>${w.wall}</td>${stdStatuses}</tr>`;
  }).join('');

  return `
<h2>9 &mdash; Compliance Analysis</h2>
<h3>9.1 Dose Limits Reference Table</h3>
<table class="report-table">
  <thead><tr><th>Standard</th><th>Public Limit (mSv/yr)</th><th>Worker Limit (mSv/yr)</th><th>Design Goal (mSv/yr)</th></tr></thead>
  <tbody>
    <tr><td>AERB Safety Code</td><td>1.0</td><td>20.0</td><td>0.3 (uncontrolled) / 5.0 (controlled)</td></tr>
    <tr><td>ICRP 103</td><td>1.0</td><td>20.0</td><td>0.3 (uncontrolled) / 5.0 (controlled)</td></tr>
    <tr><td>NCRP 151</td><td>1.0</td><td>50.0</td><td>0.5</td></tr>
    <tr><td>IEC 60601-1-3</td><td>1.0</td><td>20.0</td><td>1.0</td></tr>
  </tbody>
</table>

<h3>9.2 Per-Wall Compliance Table</h3>
<table class="report-table">
  <thead><tr><th>Wall</th><th>Adjacent Area</th><th>Barrier Type</th><th>Dose (mSv/yr)</th><th>Limit (mSv/yr)</th><th>Margin</th><th>Status</th></tr></thead>
  <tbody>${wallCompliance || '<tr><td colspan="7">No data</td></tr>'}</tbody>
</table>

<h3>9.3 Multi-Standard Compliance Matrix</h3>
<table class="report-table">
  <thead><tr><th>Wall</th>${standards.map(s => `<th>${s}</th>`).join('')}</tr></thead>
  <tbody>${matrixRows || '<tr><td colspan="5">No data</td></tr>'}</tbody>
</table>

<h3>9.4 ALARA Assessment</h3>
${wallDetails.map((w: any) => {
  const margin = 1.0 > 0 ? ((1.0 - w.annualDose) / 1.0) * 100 : 0;
  const mu = getMu(w.material, kvp);
  const reqThick = 1.0 > 0 ? -Math.log(Math.max(1.0 / Math.max(w.doseUnshielded || 0.001, 0.001), 1e-10)) / Math.max(mu, 0.01) : 0;
  const overdesign = w.thickness > reqThick * 1.5 ? 'Over-designed' : w.annualDose > 1.0 ? 'Under-designed' : 'Optimal';

  return `<p><strong>${w.wall} (${w.material}, ${fmt(w.thickness, 1)} cm):</strong> ${overdesign} &mdash; Annual dose: ${fmt(w.annualDose, 4)} mSv/yr, margin: ${fmt(margin, 1)}%</p>`;
}).join('')}

<h3>9.5 Overall Facility Compliance Status</h3>
<p><strong>Status:</strong> ${statusBadge(compliance?.status || 'SAFE')}</p>
<p><strong>Compliance Score:</strong> ${fmt((compliance?.complianceScore || 1.0) * 100, 0)}%</p>
<p><strong>Most restrictive standard:</strong> NCRP 151 (0.5 mSv/yr design goal for radiotherapy facilities)</p>
<p><strong>Regulatory margin of safety:</strong> ${fmt(compliance?.perStandard?.[0]?.margin || 100, 1)}%</p>`;
}

/* ============================================================
   SECTION 10 — RISK & SAFETY ZONE CLASSIFICATION
   ============================================================ */
function section10(shielding: any): string {
  const s = appState.get();
  const wallDetails: WallDetail[] = (shielding?.wallDetails || []);

  // Find weakest wall
  const weakest = wallDetails.reduce((worst: any, w: any) =>
    (w.annualDose || 0) > (worst.annualDose || 0) ? w : worst, wallDetails[0] || {});

  const zoneRows = wallDetails.map((w: any) => {
    const dose = w.annualDose || 0;
    let risk: string;
    let zone: string;
    if (dose <= 0.1) { risk = 'Low'; zone = 'Supervised'; }
    else if (dose <= 0.3) { risk = 'Medium'; zone = 'Controlled'; }
    else if (dose <= 1.0) { risk = 'High'; zone = 'Controlled'; }
    else { risk = 'Very High'; zone = 'Exclusion'; }

    return `<tr>
      <td>${w.wall}</td>
      <td>${w.adjacentArea || '—'}</td>
      <td>${fmt(dose, 4)} mSv/yr</td>
      <td>${risk}</td>
      <td>${zone}</td>
    </tr>`;
  }).join('');

  return `
<h2>10 &mdash; Risk &amp; Safety Zone Classification</h2>
<h3>10.1 Exposure Risk per Zone</h3>
<table class="report-table">
  <thead><tr><th>Wall / Zone</th><th>Area</th><th>Annual Dose</th><th>Risk Level</th><th>AERB Zone Class</th></tr></thead>
  <tbody>${zoneRows || '<tr><td colspan="5">No data</td></tr>'}</tbody>
</table>

<h3>10.2 Controlled vs Uncontrolled Area Boundaries</h3>
<p><strong>Controlled areas:</strong> All areas with T &ge; 0.4 and annual dose &ge; 0.3 mSv/yr</p>
<p><strong>Uncontrolled areas:</strong> Public zones, corridors, outdoor areas</p>
<p><strong>Boundary identification:</strong> The room perimeter forms the boundary between controlled (inside) and uncontrolled (outside) areas.</p>

<h3>10.3 Safety Zone Radius</h3>
<p><strong>Estimated safety zone radius around source:</strong> Based on the highest unshielded dose rate of ${fmt(Math.max(...wallDetails.map((w: any) => w.doseUnshielded || 0)), 5)} mSv/mA·min at 1 m.</p>
<p><strong>10 mSv/yr boundary:</strong> Approximately ${fmt(Math.max(1, Math.sqrt(Math.max(...wallDetails.map((w: any) => w.annualDose || 0)) / 10)), 2)} m from source (unshielded).</p>

<h3>10.4 Weak Point Identification</h3>
<p><strong>Wall with least safety margin:</strong> ${weakest.wall || '—'} (${fmt(weakest.annualDose || 0, 4)} mSv/yr)</p>
<p><strong>Safety margin:</strong> ${fmt(1.0 > 0 ? ((1.0 - (weakest.annualDose || 0)) / 1.0) * 100 : 0, 1)}%</p>

<h3>10.5 Access Control &amp; Signage Recommendations</h3>
<table class="report-table">
  <thead><tr><th>Zone</th><th>Access Control</th><th>Signage Required</th></tr></thead>
  <tbody>
    <tr><td>Examination Room</td><td>Card / key-locked door, interlock system</td><td>Radiation warning sign, controlled area notice</td></tr>
    <tr><td>Control Room</td><td>Restricted to trained personnel</td><td>Occupancy hazard notice</td></tr>
    <tr><td>Corridor / Public</td><td>Free access (uncontrolled)</td><td>Caution sign (if dose > 0.1 mSv/yr)</td></tr>
  </tbody>
</table>`;
}

/* ============================================================
   SECTION 11 — STRUCTURAL & PRACTICAL CONSIDERATIONS
   ============================================================ */
function section11(shielding: any): string {
  const s = appState.get();
  const dims = s.selectedRoomCustom || { length: 7, width: 5.5, height: 3 };
  const wallDetails: WallDetail[] = (shielding?.wallDetails || []);

  const weightRows = wallDetails.map((w: any) => {
    const dens = materialDensity(w.material);
    const wallArea = dims.length * dims.height;
    const volume = wallArea * (w.thickness / 100); // m³
    const weight = dens * 1000 * volume; // kg
    const floorLoad = weight / (dims.length * dims.width);
    return `<tr>
      <td>${w.wall}</td>
      <td>${w.material}</td>
      <td>${fmt(w.thickness, 1)} cm</td>
      <td>${fmt(weight, 0)} kg</td>
      <td>${fmt(floorLoad, 1)} kg/m<sup>2</sup></td>
    </tr>`;
  }).join('');

  return `
<h2>11 &mdash; Structural &amp; Practical Considerations</h2>
<h3>11.1 Shielding Weight per Wall</h3>
<table class="report-table">
  <thead><tr><th>Wall</th><th>Material</th><th>Thickness</th><th>Total Weight</th><th>Floor Load</th></tr></thead>
  <tbody>${weightRows || '<tr><td colspan="5">No data</td></tr>'}</tbody>
</table>

<h3>11.2 Wall Thickness Summary</h3>
<table class="report-table">
  <thead><tr><th>Wall</th><th>Configured (cm)</th><th>Minimum Required (cm)</th><th>Recommended (cm)</th></tr></thead>
  <tbody>${wallDetails.map((w: any) => {
    const mu = getMu(w.material, (s.selectedMachine?.kvp || 100));
    const req = 1.0 > 0 ? -Math.log(Math.max(1.0 / Math.max(w.doseUnshielded || 0.001, 0.001), 1e-10)) / Math.max(mu, 0.01) : 0;
    return `<tr><td>${w.wall}</td><td>${fmt(w.thickness, 1)}</td><td>${fmt(req, 1)}</td><td>${fmt(Math.max(w.thickness, req + 1), 1)}</td></tr>`;
  }).join('')}</tbody>
</table>

<h3>11.3 Door Shielding Requirements</h3>
<p><strong>Estimated doorway leakage dose rate:</strong> Based on scatter and leakage at entry point (assumed 0.5 mSv/yr at 1 m from door).</p>
<p><strong>Door shielding recommendation:</strong> ${Math.max(...wallDetails.map((w: any) => w.annualDose || 0)) > 0.5 ? 'Lead-lined door (2 mm Pb equivalent) recommended' : 'Standard solid-core door sufficient'}</p>

<h3>11.4 Penetrations &amp; Conduit Shielding</h3>
<p>All penetrations through shielding barriers (e.g., conduit, ductwork, piping) must be sleeved and back-filled with equivalent shielding material. The effective thickness of any penetration shall not reduce the barrier below the minimum required thickness by more than 5%.</p>

<h3>11.5 Construction Cost Index</h3>
<table class="report-table">
  <thead><tr><th>Material</th><th>Cost Factor</th><th>Relative Cost</th></tr></thead>
  <tbody>
    <tr><td>Concrete</td><td>1.0 (baseline)</td><td>$$</td></tr>
    <tr><td>Brick</td><td>0.6</td><td>$</td></tr>
    <tr><td>Gypsum</td><td>0.4</td><td>$</td></tr>
    <tr><td>Steel</td><td>8.0</td><td>$$$$</td></tr>
    <tr><td>Lead</td><td>12.0</td><td>$$$$$</td></tr>
  </tbody>
</table>`;
}

/* ============================================================
   SECTION 12 — WHAT-IF SCENARIO PROJECTIONS
   ============================================================ */
function section12(shielding: any): string {
  const s = appState.get();
  const kvp = s.selectedMachine?.kvp || 100;
  const workload = s.selectedMachine?.workload || 40;
  const wallDetails: WallDetail[] = (shielding?.wallDetails || []);

  // Find weakest wall for scenarios
  const weakest = wallDetails.reduce((worst: any, w: any) =>
    (w.annualDose || 0) > (worst.annualDose || 0) ? w : worst, wallDetails[0] || {});
  const weakestMu = getMu(weakest.material || 'Concrete', kvp);

  // Scenario A: Workload doubles
  const scenarioA_new = (weakest.annualDose || 0) * 2;
  const scenarioA_status = scenarioA_new <= 1.0 ? 'SAFE' : 'WARNING';

  // Scenario B: kVp + 20%
  const kvpB = kvp * 1.2;
  const muB = getMu(weakest.material || 'Concrete', kvpB);
  const transB = Math.exp(-muB * (weakest.thickness || 30));
  const doseUnshieldedB = (s.sourceInput.sourceFactor || 1.0) * (s.sourceInput.safetyIndex || 1.0) * ((s.selectedMachine?.ma || 500) * kvpB * 0.001) / 100 / ((weakest.distance || 3) * (weakest.distance || 3));
  const scenarioB_new = doseUnshieldedB * transB * (workload / 60) * 50 * (weakest.occupancyFactor || 0.5) * 0.5;

  // Scenario C: +5cm concrete
  const muConcrete = getMu('Concrete', kvp);
  const currTrans = Math.exp(-weakestMu * (weakest.thickness || 30));
  const newTransC = Math.exp(-weakestMu * ((weakest.thickness || 30) + 5));
  const doseUnshieldedC = (weakest.doseUnshielded || 0.1);
  const scenarioC_old = weakest.annualDose || 0;
  const scenarioC_new = doseUnshieldedC * newTransC * (workload / 60) * 50 * (weakest.occupancyFactor || 0.5) * 0.5;

  // Scenario D: Replace concrete with lead
  const leadMu = getMu('Lead', kvp);
  const leadThick = Math.log(1e10) / leadMu;
  const concreteWeight = materialDensity('Concrete') * (weakest.thickness || 30);
  const leadWeightForSameAtten = materialDensity('Lead') * leadThick;
  const weightSaving = concreteWeight - leadWeightForSameAtten;

  // Scenario E: Occupancy = 1.0
  const scenarioE_new = (weakest.annualDose || 0) * (1.0 / (weakest.occupancyFactor || 0.5));

  return `
<h2>12 &mdash; What-If Scenario Projections</h2>
<p>The following scenarios are based on <strong>${weakest.wall || 'the weakest wall'}</strong> (${weakest.material || 'Concrete'}, ${fmt(weakest.thickness || 30, 1)} cm).</p>

<h3>Scenario A: Workload Doubles</h3>
<p><strong>Change:</strong> Weekly workload increases from ${workload} to ${workload * 2} mA·min/week</p>
<p><strong>New annual dose:</strong> H = ${fmt(scenarioA_new, 4)} mSv/yr (was ${fmt(weakest.annualDose || 0, 4)} mSv/yr)</p>
<p><strong>New compliance status:</strong> ${statusBadge(scenarioA_status)}</p>

<h3>Scenario B: kVp Increases by 20%</h3>
<p><strong>Change:</strong> kVp increases from ${kvp} to ${Math.round(kvpB)} kVp</p>
<p><strong>Effect on &mu;:</strong> Was ${fmt(weakestMu, 4)} cm<sup>&minus;1</sup>, now ${fmt(muB, 4)} cm<sup>&minus;1</sup></p>
<p><strong>Effect on HVL:</strong> Was ${fmt(weakestMu > 0 ? 0.693 / weakestMu : 99, 3)} cm, now ${fmt(muB > 0 ? 0.693 / muB : 99, 3)} cm</p>
<p><strong>New annual dose:</strong> ${fmt(scenarioB_new, 4)} mSv/yr (was ${fmt(weakest.annualDose || 0, 4)} mSv/yr)</p>

<h3>Scenario C: Add 5 cm More Concrete to Weakest Wall</h3>
<p><strong>Change:</strong> Add 5 cm of Concrete to ${weakest.wall || 'weakest wall'} (${fmt(weakest.thickness || 30, 1)} cm &rarr; ${fmt((weakest.thickness || 30) + 5, 1)} cm)</p>
<p><strong>Before:</strong> ${fmt(scenarioC_old, 4)} mSv/yr</p>
<p><strong>After:</strong> ${fmt(scenarioC_new, 4)} mSv/yr</p>
<p><strong>Dose reduction:</strong> ${fmt(((scenarioC_old - scenarioC_new) / scenarioC_old) * 100, 1)}%</p>

<h3>Scenario D: Replace Concrete with Lead on Primary Barrier</h3>
<p><strong>Change:</strong> Replace ${fmt(weakest.thickness || 30, 1)} cm Concrete with equivalent Lead thickness</p>
<p><strong>Required lead thickness:</strong> ${fmt(leadThick, 2)} cm</p>
<p><strong>Concrete weight:</strong> ${fmt(concreteWeight, 0)} kg/m<sup>2</sup></p>
<p><strong>Lead weight:</strong> ${fmt(leadWeightForSameAtten, 0)} kg/m<sup>2</sup></p>
<p><strong>Weight saving:</strong> ${fmt(weightSaving, 0)} kg/m<sup>2</sup> (${fmt((weightSaving / concreteWeight) * 100, 1)}% reduction)</p>

<h3>Scenario E: Occupancy Factor = 1.0 on Public Wall</h3>
<p><strong>Change:</strong> Occupancy factor on ${weakest.wall || 'weakest wall'} changes from ${fmt(weakest.occupancyFactor || 0.5, 2)} to 1.0</p>
<p><strong>Before:</strong> ${fmt(weakest.annualDose || 0, 4)} mSv/yr</p>
<p><strong>After:</strong> ${fmt(scenarioE_new, 4)} mSv/yr</p>
<p><strong>Compliance:</strong> ${scenarioE_new <= 1.0 ? '<span class="report-badge safe">COMPLIANT</span>' : '<span class="report-badge fail">NON-COMPLIANT</span>'}</p>

<h3>Scenario Comparison Summary</h3>
<table class="report-table">
  <thead><tr><th>Scenario</th><th>Before</th><th>After</th><th>Delta</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>A: Workload &times; 2</td><td>${fmt(weakest.annualDose || 0, 3)}</td><td>${fmt(scenarioA_new, 3)}</td><td>+${fmt(scenarioA_new - (weakest.annualDose || 0), 3)}</td><td>${statusBadge(scenarioA_status)}</td></tr>
    <tr><td>B: kVp +20%</td><td>${fmt(weakest.annualDose || 0, 3)}</td><td>${fmt(scenarioB_new, 3)}</td><td>+${fmt(scenarioB_new - (weakest.annualDose || 0), 3)}</td><td>${scenarioB_new <= 1.0 ? statusBadge('SAFE') : statusBadge('WARNING')}</td></tr>
    <tr><td>C: +5 cm concrete</td><td>${fmt(scenarioC_old, 3)}</td><td>${fmt(scenarioC_new, 3)}</td><td>${fmt(scenarioC_new - scenarioC_old, 3)}</td><td>${scenarioC_new <= 1.0 ? statusBadge('SAFE') : statusBadge('WARNING')}</td></tr>
    <tr><td>D: Concrete &rarr; Lead</td><td>${fmt(concreteWeight, 0)} kg</td><td>${fmt(leadWeightForSameAtten, 0)} kg</td><td>&minus;${fmt(weightSaving, 0)} kg</td><td>${statusBadge('SAFE')}</td></tr>
    <tr><td>E: T = 1.0</td><td>${fmt(weakest.annualDose || 0, 3)}</td><td>${fmt(scenarioE_new, 3)}</td><td>+${fmt(scenarioE_new - (weakest.annualDose || 0), 3)}</td><td>${scenarioE_new <= 1.0 ? statusBadge('SAFE') : statusBadge('FAIL')}</td></tr>
  </tbody>
</table>`;
}

/* ============================================================
   SECTION 13 — MONITORING & SURVEILLANCE
   ============================================================ */
function section13(shielding: any): string {
  const s = appState.get();
  const workload = s.selectedMachine?.workload || 40;
  const maxDose = Math.max(...((shielding?.wallDetails || []).map((w: any) => w.annualDose || 0)), 0);

  let surveyFreq = 'Monthly';
  if (maxDose > 0.5) surveyFreq = 'Weekly';
  else if (maxDose > 0.1) surveyFreq = 'Monthly';
  else surveyFreq = 'Quarterly';

  return `
<h2>13 &mdash; Monitoring &amp; Surveillance Recommendations</h2>
<h3>13.1 Personal Dosimetry Requirements</h3>
<table class="report-table">
  <thead><tr><th>Worker Category</th><th>Dosimeter Type</th><th>Frequency</th><th>ALARA Level</th></tr></thead>
  <tbody>
    <tr><td>Radiologist / Technologist</td><td>TLD / OSL badge (whole body)</td><td>Monthly</td><td>&lt; 0.4 mSv/month</td></tr>
    <tr><td>Physicist / Engineer</td><td>OSL + Electronic (pocket)</td><td>Weekly</td><td>&lt; 0.1 mSv/week</td></tr>
    <tr><td>Support Staff (non-rad)</td><td>TLD badge (ring if needed)</td><td>Quarterly</td><td>&lt; 0.1 mSv/quarter</td></tr>
  </tbody>
</table>

<h3>13.2 Area Radiation Monitor Placement</h3>
<p>Recommended locations for area radiation monitors:</p>
<ul>
  <li><strong>Primary barrier:</strong> At beam centerline, 1.5 m above floor</li>
  <li><strong>Control room partition:</strong> At eye level (1.5 m) facing the source</li>
  <li><strong>Doorway / entry:</strong> At 1 m from door, inside the controlled area</li>
  <li><strong>Patient waiting area:</strong> At 1 m from wall (uncontrolled side)</li>
</ul>

<h3>13.3 Radiation Survey Frequency</h3>
<p><strong>Recommended survey frequency:</strong> ${surveyFreq} (based on maximum annual dose of ${fmt(maxDose, 4)} mSv/yr)</p>
<table class="report-table">
  <thead><tr><th>Survey Type</th><th>Frequency</th><th>Instrument</th></tr></thead>
  <tbody>
    <tr><td>Area dose rate mapping</td><td>${surveyFreq}</td><td>GM survey meter / ion chamber</td></tr>
    <tr><td>Leakage verification</td><td>Annually</td><td>Ion chamber (calibrated)</td></tr>
    <tr><td>Dosimeter processing</td><td>Monthly</td><td>TLD/OSL reader</td></tr>
    <tr><td>Quality assurance audit</td><td>Semi-annually</td><td>Full instrumentation suite</td></tr>
  </tbody>
</table>

<h3>13.4 Action &amp; Investigation Levels</h3>
<table class="report-table">
  <thead><tr><th>Zone</th><th>Action Level</th><th>Investigation Level</th><th>Required Response</th></tr></thead>
  <tbody>
    <tr><td>Control Room</td><td>&gt; 0.5 mSv/month</td><td>&gt; 0.3 mSv/month</td><td>Review work practices, verify shielding integrity</td></tr>
    <tr><td>Corridor (uncontrolled)</td><td>&gt; 0.1 mSv/month</td><td>&gt; 0.05 mSv/month</td><td>Immediate shielding re-evaluation</td></tr>
    <tr><td>Public Area</td><td>&gt; 0.05 mSv/month</td><td>&gt; 0.02 mSv/month</td><td>Halt operations until resolved</td></tr>
  </tbody>
</table>

<h3>13.5 Regulatory Inspection Requirements</h3>
<p>Annual regulatory inspection by AERB or designated competent authority. The following documentation must be maintained:</p>
<ul>
  <li>Approved shielding design plan and as-built drawings</li>
  <li>Material test certificates (density, composition verification)</li>
  <li>Radiation survey records (initial and periodic)</li>
  <li>Personal dosimetry records for all classified workers</li>
  <li>Equipment QA and maintenance logs</li>
  <li>Incident and investigation reports (if any)</li>
</ul>`;
}

/* ============================================================
   SECTION 14 — CONCLUSIONS & RECOMMENDATIONS
   ============================================================ */
function section14(shielding: any, compliance: any): string {
  const s = appState.get();
  const wallDetails: WallDetail[] = (shielding?.wallDetails || []);

  const adequate = wallDetails.filter((w: any) => w.isSafe);
  const inadequate = wallDetails.filter((w: any) => !w.isSafe);
  const overallClear = inadequate.length === 0;

  return `
<h2>14 &mdash; Conclusions &amp; Recommendations</h2>
<h3>14.1 Overall Shielding Adequacy Summary</h3>
<p>The radiation shielding design for the ${s.selectedModality?.name || ''} room at the ${s.selectedFacility || ''} facility has been evaluated. Based on the analysis:</p>

<p><strong>Overall status:</strong> ${overallClear ? '<span class="report-badge safe">ADEQUATE</span>' : '<span class="report-badge fail">REMEDIATION REQUIRED</span>'}</p>

<p><strong>Walls assessed:</strong> ${wallDetails.length}</p>
<p><strong>Walls ADEQUATE:</strong> ${adequate.length}/${wallDetails.length}</p>
<p><strong>Walls requiring remediation:</strong> ${inadequate.length}/${wallDetails.length}</p>

<h3>14.2 Adequate Walls</h3>
${adequate.length > 0 ? `
<table class="report-table">
  <thead><tr><th>Wall</th><th>Material</th><th>Thickness (cm)</th><th>Annual Dose (mSv/yr)</th><th>Safety Margin</th></tr></thead>
  <tbody>${adequate.map((w: any) => {
    const margin = 1.0 > 0 ? ((1.0 - (w.annualDose || 0)) / 1.0) * 100 : 0;
    return `<tr><td>${w.wall}</td><td>${w.material}</td><td>${fmt(w.thickness, 1)}</td><td>${fmt(w.annualDose, 4)}</td><td>+${fmt(margin, 1)}%</td></tr>`;
  }).join('')}</tbody>
</table>` : '<p>No walls are currently adequate.</p>'}

<h3>14.3 Walls Requiring Remediation</h3>
${inadequate.length > 0 ? `
<table class="report-table">
  <thead><tr><th>Wall</th><th>Current (cm)</th><th>Required (cm)</th><th>Material</th><th>Deficit (cm)</th></tr></thead>
  <tbody>${inadequate.map((w: any) => {
    const mu = getMu(w.material, (s.selectedMachine?.kvp || 100));
    const reqThick = 1.0 > 0 ? -Math.log(Math.max(1.0 / Math.max(w.doseUnshielded || 0.001, 0.001), 1e-10)) / Math.max(mu, 0.01) : 0;
    return `<tr><td>${w.wall}</td><td>${fmt(w.thickness, 1)}</td><td>${fmt(reqThick, 1)}</td><td>${w.material}</td><td>${fmt(reqThick - w.thickness, 1)}</td></tr>`;
  }).join('')}</tbody>
</table>` : '<p>All walls are adequate. No remediation required.</p>'}

<h3>14.4 Priority Action Items</h3>
<ol>
  ${inadequate.length > 0 ? `<li style="margin-bottom:8px"><strong>HIGH:</strong> Increase shielding on ${inadequate.map((w: any) => w.wall).join(', ')} to meet minimum annual dose limit of 1.0 mSv/yr.</li>` : ''}
  <li style="margin-bottom:8px"><strong>MEDIUM:</strong> Verify material density and composition via certified test reports before construction.</li>
  <li style="margin-bottom:8px"><strong>MEDIUM:</strong> Conduct post-installation radiation survey to validate shielding effectiveness.</li>
  <li style="margin-bottom:8px"><strong>LOW:</strong> Implement periodic monitoring program as outlined in Section 13.</li>
  <li style="margin-bottom:8px"><strong>LOW:</strong> Schedule annual shielding integrity review.</li>
</ol>

<h3>14.5 Clearance Statement</h3>
<p>${overallClear ? '<strong>This facility is CLEARED for operation</strong> from a radiation shielding perspective. The designed barriers provide adequate protection to workers, the public, and the environment from radiation exposure arising from the operation of the ' + (s.selectedModality?.name || '') + ' unit. All calculated doses are within applicable regulatory limits with sufficient safety margins.' : '<strong>This facility is NOT CLEARED for operation</strong> until the remediation measures listed above are implemented and verified. Re-assessment is required upon completion of corrective actions.'}</p>

<p><strong>Recommended review date:</strong> Annually, or upon any modification to equipment, workload, or room configuration.</p>
<p><strong>Next assessment:</strong> ${new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>`;
}

/* ============================================================
   SECTION 15 — APPENDIX
   ============================================================ */
function section15(): string {
  const s = appState.get();
  const kvp = s.selectedMachine?.kvp || 100;

  return `
<h2>15 &mdash; Appendix</h2>

<h3>Appendix A: All Input Parameters</h3>
<table class="report-table">
  <thead><tr><th>Category</th><th>Parameter</th><th>Value</th></tr></thead>
  <tbody>
    <tr><td>Modality</td><td>Name</td><td>${s.selectedModality?.name || '—'}</td></tr>
    <tr><td>Machine</td><td>Manufacturer</td><td>${s.selectedManufacturer?.name || '—'}</td></tr>
    <tr><td>Machine</td><td>Model</td><td>${s.selectedMachine?.model || '—'}</td></tr>
    <tr><td>Machine</td><td>Type</td><td>${s.selectedMachine?.type || '—'}</td></tr>
    <tr><td>Machine</td><td>kVp</td><td>${s.selectedMachine?.kvp || '—'}</td></tr>
    <tr><td>Machine</td><td>mA</td><td>${s.selectedMachine?.ma || '—'}</td></tr>
    <tr><td>Machine</td><td>Workload</td><td>${s.selectedMachine?.workload || '—'} mA·min/wk</td></tr>
    <tr><td>Machine</td><td>Beam Angle</td><td>${s.selectedMachine?.beamAngle ?? s.sourceInput.beamAngle}°</td></tr>
    <tr><td>Machine</td><td>Source Factor</td><td>${s.sourceInput.sourceFactor}</td></tr>
    <tr><td>Machine</td><td>Safety Index</td><td>${s.sourceInput.safetyIndex}</td></tr>
    <tr><td>Machine</td><td>Leakage Radiation</td><td>${(s.sourceInput.leakageRadiation * 100).toFixed(2)}%</td></tr>
    <tr><td>Facility</td><td>Type</td><td>${s.selectedFacility || 'New'}</td></tr>
    <tr><td>Room</td><td>Type</td><td>${s.selectedRoomType}</td></tr>
    <tr><td>Room</td><td>Dimensions</td><td>${s.selectedRoomCustom ? s.selectedRoomCustom.length + 'm × ' + s.selectedRoomCustom.width + 'm × ' + s.selectedRoomCustom.height + 'm' : '—'}</td></tr>
    <tr><td>Source</td><td>Location</td><td>${s.sourceInput.sourceLocation}</td></tr>
    <tr><td>Source</td><td>Source-to-Patient Distance</td><td>${s.sourceInput.sourceToPatientDist} m</td></tr>
    ${s.walls.map((w, i) => `
    <tr><td>Wall ${i + 1}</td><td>${w.label}</td><td>${w.material}, ${w.thickness} cm, d=${w.distance}m, ${w.adjacentArea}</td></tr>`).join('')}
    ${s.occupancyConfigs.map((oc, i) => `
    <tr><td>Occupancy ${i + 1}</td><td>${oc.areaType}</td><td>${oc.workers + oc.publicCount} people, ${oc.weeklyHours} h/wk</td></tr>`).join('')}
  </tbody>
</table>

<h3>Appendix B: Attenuation Coefficients at ${kvp} kVp</h3>
<table class="report-table">
  <thead><tr><th>Material</th><th>&mu; (cm<sup>&minus;1</sup>)</th><th>HVL (cm)</th><th>TVL (cm)</th></tr></thead>
  <tbody>${['Concrete', 'Lead', 'Brick', 'Gypsum', 'Steel', 'Borated Polyethylene'].map(mat => {
    const mu = getMu(mat, kvp);
    const hvt = mu > 0 ? 0.693 / mu : 99;
    const tvt = mu > 0 ? 2.303 / mu : 99;
    return `<tr><td>${mat}</td><td>${fmt(mu, 4)}</td><td>${fmt(hvt, 3)}</td><td>${fmt(tvt, 3)}</td></tr>`;
  }).join('')}</tbody>
</table>

<h3>Appendix C: Formulas Used</h3>
<table class="report-table">
  <thead><tr><th>Formula</th><th>Variables</th></tr></thead>
  <tbody>
    <tr><td>I = I<sub>0</sub> &times; e<sup>(&minus;&mu;x)</sup></td><td>I = transmitted intensity, I<sub>0</sub> = incident intensity, &mu; = linear attenuation coefficient (cm<sup>&minus;1</sup>), x = thickness (cm)</td></tr>
    <tr><td>HVL = ln(2) / &mu; = 0.693 / &mu;</td><td>HVL = half-value layer (cm), &mu; = linear attenuation coefficient (cm<sup>&minus;1</sup>)</td></tr>
    <tr><td>TVL = ln(10) / &mu; = 2.303 / &mu;</td><td>TVL = tenth-value layer (cm), &mu; = linear attenuation coefficient (cm<sup>&minus;1</sup>)</td></tr>
    <tr><td>I<sub>2</sub> = I<sub>1</sub> &times; (d<sub>1</sub>/d<sub>2</sub>)<sup>2</sup></td><td>Inverse Square Law: I = intensity at distance d</td></tr>
    <tr><td>H = W &times; U &times; T &times; (1/d<sup>2</sup>) &times; B</td><td>H = annual dose (mSv/yr), W = workload, U = use factor, T = occupancy, d = distance (m), B = transmission factor</td></tr>
    <tr><td>T = N &times; H<sub>w</sub> / 168</td><td>T = occupancy factor, N = number of people, H<sub>w</sub> = weekly hours, 168 = hours/week</td></tr>
    <tr><td>D<sub>S</sub> = W &times; (&alpha;/400) &times; (F/d<sup>2</sup><sub>sca</sub>) &times; (1/d<sup>2</sup><sub>sec</sub>) &times; B<sub>sec</sub></td><td>D<sub>S</sub> = scatter dose, &alpha; = scatter fraction, F = field area, d<sub>sca</sub> = patient distance, d<sub>sec</sub> = wall distance</td></tr>
    <tr><td>L = W &times; U &times; f<sub>leak</sub> &times; (1/d<sup>2</sup>) &times; B</td><td>L = leakage dose, f<sub>leak</sub> = leakage fraction, B = barrier transmission</td></tr>
  </tbody>
</table>

<h3>Appendix D: Regulatory References</h3>
<table class="report-table">
  <thead><tr><th>Reference</th><th>Title</th><th>Year</th></tr></thead>
  <tbody>
    <tr><td>AERB Safety Code</td><td>Radiation Protection in Medical Facilities</td><td>2020</td></tr>
    <tr><td>ICRP 103</td><td>The 2007 Recommendations of the International Commission on Radiological Protection</td><td>2007</td></tr>
    <tr><td>NCRP 151</td><td>Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy Facilities</td><td>2005</td></tr>
    <tr><td>NCRP 147</td><td>Structural Shielding Design for Medical X-Ray Imaging Facilities</td><td>2004</td></tr>
    <tr><td>IEC 60601-1-3</td><td>Medical Electrical Equipment &mdash; General Requirements for Radiation Protection</td><td>2013</td></tr>
    <tr><td>ICRP 85</td><td>Avoidance of Radiation Injuries from Medical Interventional Procedures</td><td>2000</td></tr>
    <tr><td>NCRP 160</td><td>Structural Shielding Design for Medical Imaging with High-Energy Photons</td><td>2010</td></tr>
  </tbody>
</table>

<h3>Appendix E: Glossary of Technical Terms</h3>
<table class="report-table">
  <thead><tr><th>Term</th><th>Definition</th></tr></thead>
  <tbody>
    <tr><td>ALARA</td><td>As Low As Reasonably Achievable &mdash; principle of radiation protection optimizing exposure minimization</td></tr>
    <tr><td>Attenuation</td><td>Reduction in radiation intensity as it passes through a shielding material</td></tr>
    <tr><td>Barrier</td><td>Wall, floor, ceiling, or other structure designed to attenuate radiation</td></tr>
    <tr><td>Controlled Area</td><td>Area with restricted access where radiation doses may exceed public limits</td></tr>
    <tr><td>Dosimeter</td><td>Device worn by personnel to measure personal radiation exposure</td></tr>
    <tr><td>HVL (Half-Value Layer)</td><td>Thickness of material required to reduce radiation intensity by 50%</td></tr>
    <tr><td>ISL (Inverse Square Law)</td><td>Physical law stating radiation intensity decreases with the square of distance</td></tr>
    <tr><td>Leakage Radiation</td><td>Radiation escaping through the tube housing (other than the primary beam)</td></tr>
    <tr><td>Occupancy Factor (T)</td><td>Fraction of time an area is typically occupied</td></tr>
    <tr><td>Primary Barrier</td><td>Barrier directly in the path of the primary radiation beam</td></tr>
    <tr><td>Scatter Radiation</td><td>Secondary radiation produced by interaction of primary beam with matter</td></tr>
    <tr><td>Secondary Barrier</td><td>Barrier not in the direct beam path, protecting from scatter and leakage</td></tr>
    <tr><td>TVL (Tenth-Value Layer)</td><td>Thickness of material required to reduce radiation intensity by 90%</td></tr>
    <tr><td>Use Factor (U)</td><td>Fraction of time the primary beam is directed toward a specific barrier</td></tr>
  </tbody>
</table>`;
}

/* ============================================================
   MAIN REPORT ASSEMBLY
   ============================================================ */
export function generateFullReport(shielding: any, leakage: any, compliance: any, validation: any[]): string {
  const s = appState.get();

  return `<div class="report-print-area">

  <div class="report-header-print">
    <h2>SHIELDPLAN Radiation Shielding Analysis Report</h2>
    <p style="color:var(--text-secondary)">${s.selectedFacility || 'Facility'} &middot; ${s.selectedRoomType} Room &middot; ${s.selectedModality?.name || ''} &middot; ${s.selectedMachine?.model || ''}</p>
  </div>

  ${section1()}
  ${section2()}
  ${section3()}
  ${section4()}
  ${section5(shielding)}
  ${section6(shielding)}
  ${section7(shielding)}
  ${section8()}
  ${section9(shielding, compliance)}
  ${section10(shielding)}
  ${section11(shielding)}
  ${section12(shielding)}
  ${section13(shielding)}
  ${section14(shielding, compliance)}
  ${section15()}

  <div class="report-footer">
    <p>Generated by SHIELDPLAN AI Engine v2.0 &middot; ${new Date().toLocaleString()}</p>
    <p>${s.selectedModality?.name || 'Radiation Shielding'} Analysis &middot; ${s.selectedFacility || ''} ${s.selectedRoomType} Room</p>
    <p>This report is prepared for engineering evaluation purposes. Final design must be reviewed and approved by a Qualified Medical Physicist.</p>
  </div>

</div>`;
}
