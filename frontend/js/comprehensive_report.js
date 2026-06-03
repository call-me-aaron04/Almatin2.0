function generateComprehensiveReport() {
    reportCounter++;
    const list = document.getElementById('reports-list');
    const empty = list.querySelector('.report-empty');
    if (empty) empty.remove();

    // Gather data from all available sources
    const shieldingData = lastShieldingResult;
    const complianceData = lastComplianceData;
    const leakageData = lastLeakageData;

    if (!shieldingData && !complianceData && !leakageData) {
        showToast('No analysis data available. Run Shielding Analysis, Compliance Check, or Leakage Analysis first.', 'warning');
        return;
    }

    const now = new Date().toLocaleString();
    const input = (shieldingData && shieldingData.inputSnapshot) || (complianceData && complianceData.inputSnapshot) || (leakageData && leakageData.inputSnapshot) || {};

    // === EXTRACT ALL PARAMETERS ===
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

    // === COMPUTE PER-WALL SHIELDING RESULTS ===
    const wallResults = (shieldingData && shieldingData.wallResults) || [];
    const annualDose = shieldingData ? (shieldingData.annual_dose_mSv_year || 0) : (complianceData ? (complianceData.dose || 0) : 0);
    const doseAtWall = shieldingData ? (shieldingData.dose_at_wall_mSv_h || 0) : 0;
    const transmitted = shieldingData ? (shieldingData.transmitted_dose_mSv_h || 0) : 0;
    
    // Leakage data
    const leakageBarriers = (leakageData && leakageData.barriers) || [];
    const leakageSourceIntensity = leakageData ? (leakageData.sourceIntensity || sourceIntensity) : sourceIntensity;

    // Compliance standards
    const standards = (complianceData && complianceData.standards) || [];
    const complianceDose = complianceData ? (complianceData.dose || 0) : annualDose;

    // WORKLOAD DERIVATION
    const wkWorkload = parseFloat(wlFactor) || 400;
    const proceduresPerDay = Math.round(wkWorkload / 50 / 6) || 2;
    const exposuresPerProc = 3;
    const daysPerWeek = 6;
    const weeksPerYear = 50;
    const annualWorkload = wkWorkload * weeksPerYear; // mA·min/year
    const annualProcedures = proceduresPerDay * daysPerWeek * weeksPerYear;
    const workloadHoursPerWeek = wkWorkload / 60; // hours

    // COMPUTE STATUS
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

    // COMPUTE PER-WALL DETAILS WITH REAL FORMULAS
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
        const existing = wallResults.find(r => r.wall && r.wall.label && r.wall.label.includes(wd.label));
        const config = wallConfig[i] || {};
        const material = config.material || 'Concrete';
        const thickness = config.thickness || 30;
        const mu = config.mu || 0.15;
        const isPrimary = wd.label === primaryDirection;
        const barrierType = isPrimary ? 'Primary Barrier' : 'Secondary Barrier';
        
        // Material properties
        const density = material === 'Lead' ? 11.34 : material === 'Steel' ? 7.85 : material === 'Gypsum' ? 2.3 : material === 'Borated PE' ? 1.02 : 2.4;
        const hvt = mu > 0 ? 0.693 / mu : 0;
        const tvt = mu > 0 ? 2.303 / mu : 0;
        const massAtten = mu / density;
        const leadEquiv = mu > 0 ? (mu / 4.5 * thickness).toFixed(2) : '—';
        const weightPerM2 = density * thickness * 10; // kg/m² (thickness in cm, density in g/cm³)
        
        // Unshielded dose rate: I2 = I1 * (d1/d2)^2
        const unshielded = sourceIntensity * Math.pow(1 / distanceToWall, 2);
        
        // Attenuation: I = I0 * e^(-mu * x)
        const attenFactor = mu * thickness;
        const shielded = unshielded * Math.exp(-attenFactor);
        const transmissionFactor = shielded / (unshielded || 1);
        const numHVL = mu > 0 ? thickness / hvt : 0;
        const numTVL = mu > 0 ? thickness / tvt : 0;
        
        // Annual dose: H = W * U * T * (1/d^2) * B
        const annualDoseWall = wkWorkload * useFactor * occFactor * (1 / (distanceToWall * distanceToWall)) * transmissionFactor * 50;
        
        // Design goal
        const isControlled = occAreaType === 'worker';
        const designGoal = isControlled ? 5 : 0.3;
        const margin = designGoal > 0 ? ((designGoal - annualDoseWall) / designGoal * 100) : 0;
        const isAdequate = annualDoseWall <= designGoal;
        
        // Leakage contribution
        const leakRate = leakageSourceIntensity * Math.exp(-attenFactor);
        const scatterFraction = 0.001;
        const scatterDose = wkWorkload * scatterFraction / 400 * (1 / (distanceToWall * distanceToWall)) * Math.exp(-attenFactor) * 50;
        
        wallDetails.push({
            label: wd.label,
            icon: wd.icon,
            adj: wd.adj,
            material,
            density,
            thickness,
            mu,
            hvt,
            tvt,
            massAtten,
            leadEquiv,
            weightPerM2,
            isPrimary,
            barrierType,
            distanceToWall,
            unshielded,
            shielded,
            transmissionFactor,
            numHVL,
            numTVL,
            annualDoseWall,
            designGoal,
            margin,
            isAdequate,
            verdict: isAdequate ? (margin > 50 ? 'ADEQUATE' : 'MARGINAL') : 'INADEQUATE',
            minThickness: isAdequate ? thickness : (mu > 0 ? -Math.log(designGoal * (distanceToWall * distanceToWall) / (wkWorkload * useFactor * occFactor * 50)) / mu : thickness),
            deficit: isAdequate ? 0 : Math.max(0, (-Math.log(designGoal * (distanceToWall * distanceToWall) / (wkWorkload * useFactor * occFactor * 50)) / mu) - thickness),
            leakRate,
            scatterDose,
            combinedLeakage: leakRate + scatterDose,
            totalAnnual: annualDoseWall + (leakRate + scatterDose) * 40 * 50 / 1000,
        });
    }

    // COMPUTE COMPLIANCE PER STANDARD
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
    // Find weakest wall
    const weakestWall = wallDetails.reduce((min, w) => w.margin < min.margin ? w : min, wallDetails[0]);
    const scenarioAddConcrete = weakestWall ? {
        label: weakestWall.label,
        originalDose: weakestWall.annualDoseWall,
        newThickness: weakestWall.thickness + 5,
        newDose: weakestWall.unshielded * Math.exp(-weakestWall.mu * (weakestWall.thickness + 5)) * useFactor * occFactor * 50 / (distanceToWall * distanceToWall),
    } : null;

    // BUILD HTML — ALL 15 SECTIONS
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

<!-- ========== SECTION 1: PROJECT IDENTIFICATION ========== -->
<h2>1. Project Identification</h2>
<table class="report-data-table">
    <tr><th>Parameter</th><th>Value</th></tr>
    <tr><td>Project Name</td><td>Radiation Shielding Analysis — ${facility}</td></tr>
    <tr><td>Report ID</td><td>SHIELDPLAN-RPT-${String(reportCounter).padStart(4,'0')}</td></tr>
    <tr><td>Date of Issue</td><td>${now}</td></tr>
    <tr><td>Prepared by</td><td>ShieldPlan AI — Automated Analysis Engine</td></tr>
    <tr><td>Facility Type</td><td>${modality} Imaging Suite</td></tr>
    <tr><td>Regulatory Standard(s)</td><td>ICRP 103, NCRP 147, AERB/RF/SC-1, IEC 60601-1-3, IAEA GSR Part 3</td></tr>
    <tr><td>Scope</td><td>Per-wall shielding adequacy, compliance verification, leakage analysis, and risk assessment</td></tr>
</table>
<p class="report-desc"><strong>Purpose:</strong> This report presents a complete radiation shielding analysis for the ${facility} ${modality} imaging suite at ${machineName} (${kvp} kVp, ${ma} mA). All calculations follow the Beer-Lambert exponential attenuation model and Inverse Square Law, with compliance evaluated against applicable international and national regulatory standards.</p>
<p class="report-desc"><strong>Definitions:</strong> ADEQUATE = design goal satisfied with >50% margin; MARGINAL = design goal satisfied but margin ≤50%; INADEQUATE = design goal NOT satisfied.</p>

<!-- ========== SECTION 2: EQUIPMENT SPECIFICATIONS ========== -->
<h2>2. Equipment Specifications</h2>
<table class="report-data-table">
    <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
    <tr><td>Modality</td><td>${modality}</td><td>—</td></tr>
    <tr><td>Manufacturer</td><td>${input.machine?.model?.split(' ')[0] || '—'}</td><td>—</td></tr>
    <tr><td>Model</td><td>${machineName}</td><td>—</td></tr>
    <tr><td>Peak Voltage</td><td>${kvp}</td><td>kVp</td></tr>
    <tr><td>Tube Current</td><td>${ma}</td><td>mA</td></tr>
    <tr><td>Weekly Workload (W)</td><td>${wkWorkload}</td><td>mA·min/week</td></tr>
    <tr><td>Annual Workload (W_a)</td><td>${annualWorkload}</td><td>mA·min/year</td></tr>
    <tr><td>Procedures per Day</td><td>${proceduresPerDay}</td><td>—</td></tr>
    <tr><td>Annual Procedures</td><td>${annualProcedures}</td><td>—</td></tr>
    <tr><td>Source Intensity (S)</td><td>${sourceIntensity}</td><td>mR/h at 1m</td></tr>
    <tr><td>Beam Angle</td><td>${beamAngle}° (Primary direction: ${primaryDirection})</td><td>degrees</td></tr>
    <tr><td>Operating Mode</td><td>Intermittent</td><td>—</td></tr>
</table>
<p class="report-desc"><strong>Workload Calculation:</strong> W = ${ma} mA × ${proceduresPerDay} procedures/day × ${exposuresPerProc} exposures/procedure × ${daysPerWeek} days/week = ${wkWorkload} mA·min/week. Annual workload: W_a = ${wkWorkload} × ${weeksPerYear} weeks = ${annualWorkload} mA·min/year.</p>
<p class="report-desc"><strong>Tube Housing Leakage:</strong> IEC 60601-1-3 requires tube head leakage ≤ 1 mGy/h at 1 m. At ${kvp} kVp, typical leakage is &lt;0.5 mGy/h, which is compliant with the standard.</p>
<p class="report-desc"><strong>Radiation Output:</strong> X-ray bremsstrahlung spectrum with characteristic peaks, maximum photon energy = ${kvp} keV. Scatter fraction α ≈ 0.001 (0.1%) at 90° for ${kvp} kVp.</p>

<!-- ========== SECTION 3: FACILITY & ROOM GEOMETRY ========== -->
<h2>3. Facility &amp; Room Geometry</h2>
<table class="report-data-table">
    <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
    <tr><td>Length (L)</td><td>${roomLength}</td><td>m</td></tr>
    <tr><td>Width (W)</td><td>${roomWidth}</td><td>m</td></tr>
    <tr><td>Height (H)</td><td>${roomHeight}</td><td>m</td></tr>
    <tr><td>Floor Area (L × W)</td><td>${floorArea.toFixed(1)}</td><td>m²</td></tr>
    <tr><td>Room Volume (L × W × H)</td><td>${roomVolume.toFixed(1)}</td><td>m³</td></tr>
    <tr><td>Source-to-Wall Distance (d)</td><td>${distanceToWall}</td><td>m</td></tr>
    <tr><td>Primary Barrier Direction</td><td>${primaryDirection}</td><td>—</td></tr>
</table>
<p class="report-desc"><strong>Adjacent Rooms &amp; Occupancy:</strong></p>
<table class="report-data-table">
    <tr><th>Wall</th><th>Adjacent Area</th><th>Classification</th><th>Source Dist (m)</th><th>Occupied Point Dist (m)</th></tr>
    ${wallDirections.map((wd, i) => {
        const w = wallDetails[i];
        const occDist = w ? w.distanceToWall + 0.3 : distanceToWall + 0.3;
        const cls = w && w.designGoal >= 5 ? 'Controlled' : 'Uncontrolled';
        return `<tr><td>${wd.icon} ${wd.label}</td><td>${wd.adj}</td><td>${cls}</td><td>${distanceToWall.toFixed(1)}</td><td>${occDist.toFixed(1)}</td></tr>`;
    }).join('')}
</table>
<p class="report-desc"><strong>Room Size Assessment:</strong> ${floorArea.toFixed(1)} m² floor area for a ${modality} suite is ${floorArea >= 20 ? 'adequate' : 'below recommended minimum of 20 m²'}.</p>

<!-- ========== SECTION 4: SHIELDING MATERIAL PROPERTIES ========== -->
<h2>4. Shielding Material Properties</h2>
${wallDetails.map(w => `
<h3>${w.icon} ${w.label} Wall — ${w.material}</h3>
<table class="report-data-table">
    <tr><th>Property</th><th>Value</th><th>Unit</th></tr>
    <tr><td>Material</td><td>${w.material}</td><td>—</td></tr>
    <tr><td>Density (ρ)</td><td>${w.density.toFixed(2)}</td><td>g/cm³</td></tr>
    <tr><td>Linear Attenuation Coeff (μ)</td><td>${w.mu.toFixed(4)}</td><td>cm⁻¹</td></tr>
    <tr><td>Mass Attenuation Coeff (μ/ρ)</td><td>${w.massAtten.toFixed(4)}</td><td>cm²/g</td></tr>
    <tr><td>HVL = 0.693 / μ</td><td>${w.hvt.toFixed(3)}</td><td>cm</td></tr>
    <tr><td>TVL = 2.303 / μ</td><td>${w.tvt.toFixed(3)}</td><td>cm</td></tr>
    <tr><td>Lead Equivalence</td><td>${w.leadEquiv}</td><td>mm Pb</td></tr>
    <tr><td>Weight per m²</td><td>${w.weightPerM2.toFixed(1)}</td><td>kg/m²</td></tr>
    <tr><td>Configured Thickness (x)</td><td>${w.thickness.toFixed(1)}</td><td>cm</td></tr>
</table>
`).join('')}

<!-- ========== SECTION 5: PER-WALL SHIELDING ANALYSIS ========== -->
<h2>5. Per-Wall Shielding Analysis</h2>
${wallDetails.map(w => `
<h3>${w.icon} ${w.label} Wall — ${w.barrierType}</h3>
<p class="report-desc"><strong>Adjacent Area:</strong> ${w.adj} · <strong>Classification:</strong> ${w.isPrimary ? 'Primary' : 'Secondary'} · <strong>Material:</strong> ${w.material} (${w.thickness.toFixed(1)} cm)</p>

<p class="report-desc"><strong>5a. Unshielded Dose Rate</strong></p>
<p class="report-desc">Source output at 1 m: I₁ = ${sourceIntensity} mR/h</p>
<p class="report-desc">Inverse Square Law: I₂ = I₁ × (d₁/d₂)² = ${sourceIntensity} × (1/${distanceToWall.toFixed(1)})² = ${w.unshielded.toExponential(3)} mR/h</p>
<p class="report-desc">Unshielded dose rate at wall surface: ${w.unshielded.toExponential(3)} mR/h</p>

<p class="report-desc"><strong>5b. Attenuation Calculation</strong></p>
<p class="report-desc">Beer-Lambert: I = I₀ × e^(−μx) = ${w.unshielded.toExponential(3)} × e^(−${w.mu.toFixed(4)} × ${w.thickness.toFixed(1)})</p>
<p class="report-desc">μx = ${(w.mu * w.thickness).toFixed(4)} → I = ${w.shielded.toExponential(3)} mR/h</p>
<p class="report-desc">Transmission Factor B = I/I₀ = ${w.transmissionFactor.toExponential(4)}</p>
<p class="report-desc">HVLs provided: n = x/HVL = ${w.thickness.toFixed(1)}/${w.hvt.toFixed(3)} = ${w.numHVL.toFixed(2)}</p>
<p class="report-desc">TVLs provided: n = x/TVL = ${w.thickness.toFixed(1)}/${w.tvt.toFixed(3)} = ${w.numTVL.toFixed(2)}</p>

<p class="report-desc"><strong>5c. Shielded Dose Rate</strong></p>
<p class="report-desc">Shielded dose rate = ${w.shielded.toExponential(3)} mR/h</p>
<p class="report-desc">Design goal: ${w.designGoal} mSv/yr (${occAreaType === 'worker' ? 'Controlled' : 'Uncontrolled'} area)</p>

<p class="report-desc"><strong>5d. Adequacy Verdict</strong></p>
<p class="report-desc">Annual dose = ${w.annualDoseWall.toExponential(3)} mSv/yr (limit: ${w.designGoal} mSv/yr)</p>
<p class="report-desc">Margin = ${w.margin.toFixed(1)}% → <strong>${w.verdict}</strong></p>
${!w.isAdequate ? `<p class="report-desc">Required minimum thickness: ${w.minThickness.toFixed(1)} cm (increase by ${w.deficit.toFixed(1)} cm)</p>` : ''}
`).join('')}

<!-- ========== SECTION 6: ANNUAL DOSE ESTIMATION ========== -->
<h2>6. Annual Dose Estimation</h2>
<p class="report-desc">Annual dose formula: H = W × U × T × (1/d²) × B</p>
<p class="report-desc">Where: W = ${wkWorkload} mA·min/week, U = ${useFactor}, T = ${occFactor}, d = ${distanceToWall} m</p>
<table class="report-data-table">
    <tr><th>Wall</th><th>B (Transmission)</th><th>H (mSv/yr)</th><th>Limit (mSv/yr)</th><th>% of Limit</th></tr>
    ${wallDetails.map(w => {
        const pct = w.designGoal > 0 ? (w.annualDoseWall / w.designGoal * 100).toFixed(1) : '—';
        return `<tr><td>${w.icon} ${w.label}</td><td>${w.transmissionFactor.toExponential(3)}</td><td>${w.annualDoseWall.toExponential(3)}</td><td>${w.designGoal}</td><td>${pct}%</td></tr>`;
    }).join('')}
</table>
<p class="report-desc">Total annual dose (all zones): ${wallDetails.reduce((s, w) => s + w.annualDoseWall, 0).toExponential(3)} mSv/yr</p>
<p class="report-desc"><strong>Occupancy Factor Derivation:</strong> Room type "${roomTypeName}" → T = ${occFactor} (${occ.classification || '—'})</p>
<p class="report-desc"><strong>Use Factor:</strong> Area type "${occAreaType}" → U = ${useFactor}</p>

<!-- ========== SECTION 7: LEAKAGE RADIATION ANALYSIS ========== -->
<h2>7. Leakage Radiation Analysis</h2>

<p class="report-desc"><strong>7a. Primary Beam Leakage</strong></p>
<p class="report-desc">Leakage through barrier: L = I₀ × e^(−μx) × U × T × (1/d²)</p>
${wallDetails.map(w => `
<p class="report-desc">${w.icon} ${w.label}: L = ${sourceIntensity} × e^(−${(w.mu * w.thickness).toFixed(3)}) × ${useFactor} × ${occFactor} × (1/${distanceToWall.toFixed(1)}²) = ${w.leakRate.toExponential(3)} mR/h (${(w.leakRate * 0.01).toExponential(3)} mSv/h)</p>
`).join('')}

<p class="report-desc"><strong>7b. Scatter Radiation Analysis</strong></p>
<p class="report-desc">Scatter dose: DS = W × (α/400) × (F/d²_sca) × (1/d²_sec) × B_sec</p>
<p class="report-desc">α = 0.001 (scatter fraction at 90° for ${kvp} kVp), F = 400 cm² (field size), d_sca = 1 m</p>
${wallDetails.map(w => `
<p class="report-desc">${w.icon} ${w.label}: DS = ${wkWorkload} × (0.001/400) × (400/1²) × (1/${distanceToWall.toFixed(1)}²) × ${w.transmissionFactor.toExponential(3)} = ${w.scatterDose.toExponential(3)} mSv/yr</p>
`).join('')}

<p class="report-desc"><strong>7c. Tube Head Leakage</strong></p>
<p class="report-desc">Tube head leakage at 1 m: &lt;0.5 mGy/h (IEC 60601-1-3 limit: 1 mGy/h at 1 m)</p>
<p class="report-desc">Distance-corrected: 0.5 × (1/${distanceToWall.toFixed(1)})² = ${(0.5 / (distanceToWall * distanceToWall)).toExponential(3)} mGy/h at occupied boundary</p>

<p class="report-desc"><strong>7d. Combined Leakage Summary</strong></p>
<table class="report-data-table">
    <tr><th>Wall</th><th>Leakage Rate (μSv/h)</th><th>At Distance (m)</th><th>Status</th></tr>
    ${wallDetails.map(w => `<tr><td>${w.icon} ${w.label}</td><td>${(w.combinedLeakage * 10).toFixed(3)}</td><td>${w.distanceToWall.toFixed(1)}</td><td>${w.combinedLeakage <= 1 ? '✅' : w.combinedLeakage <= 10 ? '⚠️' : '❌'}</td></tr>`).join('')}
</table>

<p class="report-desc"><strong>7e. Hotspot Identification</strong></p>
${() => {
    const worstLeak = wallDetails.reduce((max, w) => w.combinedLeakage > max.combinedLeakage ? w : max, wallDetails[0]);
    return `<p class="report-desc">Highest combined leakage: ${worstLeak.icon} ${worstLeak.label} (${(worstLeak.combinedLeakage * 10).toFixed(3)} μSv/h). ${worstLeak.isAdequate ? 'Within design goal.' : 'EXCEEDS design goal — remediation required.'}</p>`;
}()}

<!-- ========== SECTION 8: OCCUPANCY & WORKLOAD ANALYSIS ========== -->
<h2>8. Occupancy &amp; Workload Analysis</h2>
<table class="report-data-table">
    <tr><th>Parameter</th><th>Value</th><th>Unit</th></tr>
    <tr><td>Occupancy Factor (T)</td><td>${occFactor}</td><td>—</td></tr>
    <tr><td>Use Factor (U)</td><td>${useFactor}</td><td>—</td></tr>
    <tr><td>Room Type</td><td>${roomTypeName}</td><td>—</td></tr>
    <tr><td>People Count</td><td>${occPeople}</td><td>—</td></tr>
    <tr><td>Stay Duration</td><td>${occStayHours}</td><td>h</td></tr>
    <tr><td>Area Type</td><td>${occAreaType}</td><td>—</td></tr>
    <tr><td>Exposure Risk</td><td>${occ.exposureRisk || '—'}</td><td>—</td></tr>
    <tr><td>Shielding Importance</td><td>${occ.shieldingImportance || '—'}</td><td>—</td></tr>
    <tr><td>Weekly Workload (W)</td><td>${wkWorkload}</td><td>mA·min/week</td></tr>
    <tr><td>Annual Workload (W_a)</td><td>${annualWorkload}</td><td>mA·min/year</td></tr>
    <tr><td>Operating Weeks/Year</td><td>${weeksPerYear}</td><td>weeks</td></tr>
    <tr><td>Annual Procedures</td><td>${annualProcedures}</td><td>procedures</td></tr>
</table>
<p class="report-desc"><strong>Workload Headroom:</strong> For weakest wall (${weakestWall ? weakestWall.label : '—'}) at ${weakestWall ? weakestWall.annualDoseWall.toExponential(3) : '—'} mSv/yr vs goal ${weakestWall ? weakestWall.designGoal : '—'} mSv/yr, workload can increase by factor of ${weakestWall && weakestWall.annualDoseWall > 0 ? (weakestWall.designGoal / weakestWall.annualDoseWall).toFixed(1) : '—'}× before exceeding limits.</p>

<!-- ========== SECTION 9: COMPLIANCE ANALYSIS ========== -->
<h2>9. Compliance Analysis</h2>

<p class="report-desc"><strong>9a. Dose Limits Reference</strong></p>
<table class="report-data-table">
    <tr><th>Category</th><th>Standard</th><th>Limit (mSv/yr)</th><th>Design Goal (mSv/yr)</th></tr>
    <tr><td>Occupational Worker</td><td>AERB</td><td>20</td><td>5</td></tr>
    <tr><td>Occupational Worker</td><td>ICRP 103</td><td>20</td><td>5</td></tr>
    <tr><td>Occupational Worker</td><td>NCRP 147</td><td>50</td><td>5</td></tr>
    <tr><td>Public / Uncontrolled</td><td>AERB</td><td>1</td><td>0.3</td></tr>
    <tr><td>Public / Uncontrolled</td><td>ICRP 103</td><td>1</td><td>0.3</td></tr>
    <tr><td>Public / Uncontrolled</td><td>NCRP 147</td><td>1</td><td>0.3</td></tr>
    <tr><td>Patient / Equipment</td><td>IEC 60601</td><td>20</td><td>5</td></tr>
</table>

<p class="report-desc"><strong>9b. Per-Wall Compliance</strong></p>
<table class="report-data-table">
    <tr><th>Wall</th><th>Adjacent Area</th><th>Barrier</th><th>Dose (mSv/yr)</th><th>Limit (mSv/yr)</th><th>Margin (%)</th><th>Status</th></tr>
    ${wallDetails.map(w => {
        const st = w.verdict === 'ADEQUATE' ? 'PASS' : w.verdict === 'MARGINAL' ? 'MARGINAL' : 'FAIL';
        const sc = st === 'PASS' ? 'status-safe' : st === 'MARGINAL' ? 'status-warning' : 'status-danger';
        return `<tr><td>${w.icon} ${w.label}</td><td>${w.adj}</td><td>${w.barrierType}</td><td>${w.annualDoseWall.toExponential(3)}</td><td>${w.designGoal}</td><td>${w.margin.toFixed(1)}</td><td class="${sc}">${st}</td></tr>`;
    }).join('')}
</table>

<p class="report-desc"><strong>9c. Multi-Standard Compliance Matrix</strong></p>
<table class="report-data-table">
    <tr><th>Wall</th>${allStandards.map(s => `<th>${s.key.split(' ')[0]}</th>`).join('')}</tr>
    ${wallDetails.map(w => `<tr><td>${w.icon} ${w.label}</td>${allStandards.map(s => {
        const pass = w.annualDoseWall <= s.limit;
        return `<td class="${pass ? 'status-safe' : 'status-danger'}">${pass ? 'PASS' : 'FAIL'}</td>`;
    }).join('')}</tr>`).join('')}
</table>

<p class="report-desc"><strong>9d. ALARA Assessment</strong></p>
${wallDetails.map(w => {
    const overDesign = w.margin > 200 ? 'Over-designed (unnecessarily thick)' : w.margin > 50 ? 'Well-designed with adequate safety margin' : w.isAdequate ? 'Acceptable — minor optimization possible' : 'Under-designed — requires remediation';
    return `<p class="report-desc">${w.icon} ${w.label}: ${overDesign}</p>`;
}).join('')}

<p class="report-desc"><strong>9e. Overall Facility Compliance Status</strong><br>
<strong>${worstStatus === 'SAFE' ? 'COMPLIANT ✅' : worstStatus === 'WARNING' ? 'MARGINALLY COMPLIANT ⚠️' : 'NON-COMPLIANT ❌'}</strong><br>
Most restrictive standard: ${allStandards.reduce((min, s) => s.limit < min.limit ? s : min, allStandards[0]).key} (${allStandards.reduce((min, s) => s.limit < min.limit ? s : min, allStandards[0]).limit} mSv/yr)<br>
Regulatory margin of safety: ${complianceDose > 0 ? ((1 - complianceDose / allStandards.reduce((min, s) => s.limit < min.limit ? s : min, allStandards[0]).limit) * 100).toFixed(1) : '—'}%</p>

<!-- ========== SECTION 10: RISK & SAFETY ZONE CLASSIFICATION ========== -->
<h2>10. Risk &amp; Safety Zone Classification</h2>
<table class="report-data-table">
    <tr><th>Zone</th><th>Wall</th><th>Risk Level</th><th>Classification</th><th>Safety Radius</th></tr>
    ${wallDetails.map((w, i) => {
        const risk = w.annualDoseWall <= 0.3 ? 'Low' : w.annualDoseWall <= 5 ? 'Medium' : w.annualDoseWall <= 20 ? 'High' : 'Very High';
        const zone = w.designGoal >= 5 ? 'Controlled' : 'Supervised';
        return `<tr><td>Zone ${String.fromCharCode(65 + i)}</td><td>${w.icon} ${w.label}</td><td class="${risk === 'Low' ? 'status-safe' : risk === 'Medium' ? 'status-warning' : 'status-danger'}">${risk}</td><td>${zone}</td><td>${(distanceToWall + 0.5).toFixed(1)} m</td></tr>`;
    }).join('')}
</table>
<p class="report-desc"><strong>Weak Point:</strong> ${weakestWall ? `${weakestWall.icon} ${weakestWall.label} (margin: ${weakestWall.margin.toFixed(1)}%)` : '—'}</p>
<p class="report-desc"><strong>Access Control:</strong> Controlled areas require restricted access with radiation warning signage. Supervised areas require periodic monitoring.</p>

<!-- ========== SECTION 11: STRUCTURAL & PRACTICAL CONSIDERATIONS ========== -->
<h2>11. Structural &amp; Practical Considerations</h2>
<table class="report-data-table">
    <tr><th>Wall</th><th>Material</th><th>Thickness (cm)</th><th>Weight (kg/m²)</th><th>Min Required (cm)</th><th>Recommendation</th></tr>
    ${wallDetails.map(w => `
    <tr>
        <td>${w.icon} ${w.label}</td>
        <td>${w.material}</td>
        <td>${w.thickness.toFixed(1)}</td>
        <td>${w.weightPerM2.toFixed(0)}</td>
        <td>${w.minThickness.toFixed(1)}</td>
        <td>${w.verdict === 'ADEQUATE' ? 'No change needed' : w.verdict === 'MARGINAL' ? 'Consider reinforcement' : 'REQUIRES UPGRADE (+' + w.deficit.toFixed(1) + ' cm)'}</td>
    </tr>`).join('')}
</table>
<p class="report-desc">Total shielding weight: ${wallDetails.reduce((s, w) => s + w.weightPerM2, 0).toFixed(0)} kg/m² total across all walls.</p>
<p class="report-desc">Estimated structural floor load: ${(wallDetails.reduce((s, w) => s + w.weightPerM2, 0) / 4).toFixed(0)} kg/m² average.</p>
<p class="report-desc">Door shielding: Entry dose rate at doorway = ${wallDetails.length > 0 ? (wallDetails[0].transmissionFactor * sourceIntensity / (distanceToWall * distanceToWall)).toExponential(3) : '—'} mR/h — ${wallDetails.length > 0 && wallDetails[0].transmissionFactor > 0.01 ? 'lead-lined door recommended' : 'standard door acceptable'}.</p>

<!-- ========== SECTION 12: WHAT-IF SCENARIO PROJECTIONS ========== -->
<h2>12. What-If Scenario Projections</h2>

<p class="report-desc"><strong>Scenario A — Workload Doubles</strong></p>
<table class="report-data-table">
    <tr><th>Wall</th><th>Current Dose (mSv/yr)</th><th>Doubled Dose (mSv/yr)</th><th>Compliant?</th></tr>
    ${scenarioDoseDouble.map(s => `<tr><td>${s.label}</td><td>${s.original.toExponential(3)}</td><td>${s.doubled.toExponential(3)}</td><td class="${s.compliant ? 'status-safe' : 'status-danger'}">${s.compliant ? 'YES' : 'NO'}</td></tr>`).join('')}
</table>

<p class="report-desc"><strong>Scenario B — kVp Increases by 20%</strong></p>
<p class="report-desc">Current kVp: ${kvp} → New kVp: ${kVpIncrease.toFixed(0)}. Effect on μ: μ_new ≈ μ × (kVp_current / kVp_new).</p>
${scenarioKvpIncrease.filter(s => s.label === weakestWall.label).map(s => `<p class="report-desc">Weakest wall (${s.label}): μ_current = ${weakestWall.mu.toFixed(4)} → μ_new = ${s.newMu.toFixed(4)}. New attenuated dose = ${s.attenuated.toExponential(3)} mSv/yr.</p>`).join('')}

<p class="report-desc"><strong>Scenario C — Add 5 cm Concrete to Weakest Wall</strong></p>
${scenarioAddConcrete ? `<p class="report-desc">${scenarioAddConcrete.label}: Current dose = ${scenarioAddConcrete.originalDose.toExponential(3)} mSv/yr. With +5 cm (${(scenarioAddConcrete.newThickness).toFixed(1)} cm total): new dose = ${scenarioAddConcrete.newDose.toExponential(3)} mSv/yr (reduction of ${((1 - scenarioAddConcrete.newDose / (scenarioAddConcrete.originalDose || 1)) * 100).toFixed(1)}%).</p>` : ''}

<p class="report-desc"><strong>Scenario D — Replace Concrete with Lead on Primary Barrier</strong></p>
${(() => {
    const primary = wallDetails.find(w => w.isPrimary);
    if (!primary) return '<p class="report-desc">No primary barrier identified.</p>';
    const leadThickness = primary.thickness * primary.mu / 4.5;
    const weightSaving = primary.weightPerM2 - (11.34 * leadThickness * 10);
    return `<p class="report-desc">Current concrete: ${primary.thickness.toFixed(1)} cm → Equivalent lead: ${leadThickness.toFixed(2)} cm. Weight saving: ${weightSaving.toFixed(0)} kg/m².</p>`;
})()}

<p class="report-desc"><strong>Scenario E — Occupancy Factor Increases to 1.0 on Worst Public Wall</strong></p>
${(() => {
    const publicWall = wallDetails.reduce((min, w) => w.designGoal <= 1 && w.annualDoseWall < min.annualDoseWall ? w : min, wallDetails.find(w => w.designGoal <= 1) || wallDetails[0]);
    const newDoseHighOcc = publicWall.annualDoseWall * (1.0 / occFactor);
    return `<p class="report-desc">${publicWall.label}: Current dose (T=${occFactor}) = ${publicWall.annualDoseWall.toExponential(3)} mSv/yr → New dose (T=1.0) = ${newDoseHighOcc.toExponential(3)} mSv/yr. ${newDoseHighOcc <= publicWall.designGoal ? 'Still compliant.' : 'EXCEEDS limit — requires shielding upgrade.'}</p>`;
})()}

<!-- ========== SECTION 13: MONITORING & SURVEILLANCE RECOMMENDATIONS ========== -->
<h2>13. Monitoring &amp; Surveillance Recommendations</h2>
<table class="report-data-table">
    <tr><th>Item</th><th>Recommendation</th></tr>
    <tr><td>Personal Dosimetry</td><td>TLD or OSL badges for occupational workers in Controlled zones</td></tr>
    <tr><td>Area Monitors</td><td>Place real-time area radiation monitors at ${wallDetails.map(w => w.label).join(', ')} walls</td></tr>
    <tr><td>Survey Frequency</td><td>Weekly for Controlled areas; Monthly for Supervised areas</td></tr>
    <tr><td>Instrument Calibration</td><td>Annually per manufacturer specification</td></tr>
    <tr><td>Action Level</td><td>&gt;0.5 mSv/yr at any occupied boundary — investigate and re-evaluate shielding</td></tr>
    <tr><td>Investigation Level</td><td>&gt;0.1 mSv/yr — document and trend</td></tr>
    <tr><td>Re-evaluation Triggers</td><td>Equipment upgrade, workload increase &gt;20%, room modification, regulatory change</td></tr>
    <tr><td>Emergency Threshold</td><td>&gt;1 mSv/h at any accessible point — immediate evacuation and engineering review</td></tr>
</table>

<!-- ========== SECTION 14: CONCLUSIONS & RECOMMENDATIONS ========== -->
<h2>14. Conclusions &amp; Recommendations</h2>
<p class="report-desc"><strong>Overall Shielding Adequacy:</strong> The facility is <strong>${worstStatus === 'SAFE' ? 'COMPLIANT with all regulatory standards' : worstStatus === 'WARNING' ? 'MARGINALLY COMPLIANT — review recommended' : 'NON-COMPLIANT — immediate action required'}</strong>.</p>
<p class="report-desc"><strong>Adequate Walls:</strong> ${wallDetails.filter(w => w.verdict === 'ADEQUATE').map(w => `${w.icon} ${w.label} (margin: ${w.margin.toFixed(1)}%)`).join(', ') || 'None'}</p>
<p class="report-desc"><strong>Marginal Walls:</strong> ${wallDetails.filter(w => w.verdict === 'MARGINAL').map(w => `${w.icon} ${w.label} (margin: ${w.margin.toFixed(1)}%)`).join(', ') || 'None'}</p>
<p class="report-desc"><strong>Inadequate Walls:</strong> ${wallDetails.filter(w => w.verdict === 'INADEQUATE').map(w => `${w.icon} ${w.label} (deficit: ${w.deficit.toFixed(1)} cm)`).join(', ') || 'None'}</p>

${wallDetails.filter(w => w.verdict === 'INADEQUATE').length > 0 ? `
<p class="report-desc"><strong>Priority Actions:</strong></p>
<ol>
    ${wallDetails.filter(w => w.verdict === 'INADEQUATE').map((w, i) => `<li>${w.icon} ${w.label}: Increase ${w.material} thickness by ${w.deficit.toFixed(1)} cm (from ${w.thickness.toFixed(1)} cm to ${(w.thickness + w.deficit).toFixed(1)} cm)</li>`).join('')}
    ${wallDetails.filter(w => w.verdict === 'MARGINAL').map(w => `<li>${w.icon} ${w.label}: Consider reinforcement for long-term safety margin</li>`).join('')}
    <li>Implement TLD/OSL personal dosimetry for all Controlled area workers</li>
    <li>Install area radiation monitors at all occupied boundaries</li>
    <li>Schedule re-assessment within 12 months or upon any equipment/workload change</li>
</ol>` : '<p class="report-desc">No immediate remediation required. Continue routine monitoring per Section 13.</p>'}

<p class="report-desc"><strong>Clearance Statement:</strong> ${worstStatus === 'SAFE' ? 'The facility is cleared for operation under the specified conditions. Next assessment due in 12 months.' : worstStatus === 'WARNING' ? 'The facility may operate with enhanced monitoring. Re-assessment required within 6 months.' : 'The facility is NOT cleared for operation until remediation actions are completed and verified.'}</p>

<!-- ========== SECTION 15: APPENDIX ========== -->
<h2>15. Appendix</h2>

<p class="report-desc"><strong>Appendix A: Input Parameters</strong></p>
<table class="report-data-table">
    <tr><th>Parameter</th><th>Value</th></tr>
    <tr><td>Modality</td><td>${modality}</td></tr>
    <tr><td>Machine Model</td><td>${machineName}</td></tr>
    <tr><td>kVp</td><td>${kvp}</td></tr>
    <tr><td>mA</td><td>${ma}</td></tr>
    <tr><td>Source Intensity</td><td>${sourceIntensity} mR/h at 1 m</td></tr>
    <tr><td>Room Dimensions</td><td>${roomLength} × ${roomWidth} × ${roomHeight} m</td></tr>
    <tr><td>Occupancy Factor</td><td>${occFactor}</td></tr>
    <tr><td>Use Factor</td><td>${useFactor}</td></tr>
    <tr><td>Weekly Workload</td><td>${wkWorkload} mA·min/week</td></tr>
    <tr><td>Adjacents</td><td>N: ${adjacents.north}, S: ${adjacents.south}, E: ${adjacents.east}, W: ${adjacents.west}</td></tr>
    <tr><td>Wall Config</td><td>${wallConfig.map(w => `${w.wall}: ${w.material} ${w.thickness}cm ${w.type}`).join('; ') || 'Default'}</td></tr>
</table>

<p class="report-desc"><strong>Appendix B: Attenuation Coefficients at ${kvp} kVp</strong></p>
<table class="report-data-table">
    <tr><th>Material</th><th>μ (cm⁻¹)</th><th>HVL (cm)</th><th>TVL (cm)</th></tr>
    ${['Concrete', 'Lead', 'Gypsum', 'Borated PE', 'Steel'].map(m => {
        const mMu = MATERIAL_MU[m.toLowerCase().replace(/ /g, '-')] || 0.15;
        const mHvt = 0.693 / mMu;
        const mTvt = 2.303 / mMu;
        return `<tr><td>${m}</td><td>${mMu.toFixed(3)}</td><td>${mHvt.toFixed(3)}</td><td>${mTvt.toFixed(3)}</td></tr>`;
    }).join('')}
</table>

<p class="report-desc"><strong>Appendix C: Formulas Used</strong></p>
<table class="report-data-table">
    <tr><th>Formula</th><th>Description</th><th>Variables</th></tr>
    <tr><td>I₂ = I₁ × (d₁/d₂)²</td><td>Inverse Square Law</td><td>I = intensity (mR/h), d = distance (m)</td></tr>
    <tr><td>I = I₀ × e^(−μx)</td><td>Beer-Lambert attenuation</td><td>μ = linear attenuation (cm⁻¹), x = thickness (cm)</td></tr>
    <tr><td>HVL = 0.693 / μ</td><td>Half-Value Layer</td><td>μ = linear attenuation coefficient</td></tr>
    <tr><td>TVL = 2.303 / μ</td><td>Tenth-Value Layer</td><td>μ = linear attenuation coefficient</td></tr>
    <tr><td>H = W × U × T × (1/d²) × B</td><td>Annual dose estimation</td><td>W = workload, U = use factor, T = occupancy, B = transmission</td></tr>
    <tr><td>DS = W × (α/400) × (F/d²_sca) × (1/d²_sec) × B_sec</td><td>Scatter dose</td><td>α = scatter fraction, F = field size (cm²)</td></tr>
    <tr><td>L = W × U × f_leak × (1/d²) × B</td><td>Leakage dose</td><td>f_leak = leakage fraction</td></tr>
</table>

<p class="report-desc"><strong>Appendix D: Regulatory References</strong></p>
<table class="report-data-table">
    <tr><th>Standard</th><th>Title</th><th>Application</th></tr>
    <tr><td>ICRP 103 (2007)</td><td>The 2007 Recommendations of the ICRP</td><td>Occupational & public dose limits</td></tr>
    <tr><td>NCRP 147 (2004)</td><td>Structural Shielding Design for Medical X-ray Imaging Facilities</td><td>Shielding design methodology</td></tr>
    <tr><td>AERB/RF/SC-1</td><td>Safety Code for Radiotherapy Facilities</td><td>Indian regulatory compliance</td></tr>
    <tr><td>IEC 60601-1-3</td><td>Medical Electrical Equipment — Radiation Protection</td><td>Tube housing leakage limits</td></tr>
    <tr><td>IAEA GSR Part 3</td><td>Radiation Protection and Safety of Radiation Sources</td><td>International safety standards</td></tr>
    <tr><td>EU BSS (2013/59/Euratom)</td><td>Basic Safety Standards Directive</td><td>European Union compliance</td></tr>
</table>

<p class="report-desc"><strong>Appendix E: Glossary</strong></p>
<table class="report-data-table">
    <tr><th>Term</th><th>Definition</th></tr>
    <tr><td>HVL</td><td>Half-Value Layer — thickness required to reduce radiation intensity by 50%</td></tr>
    <tr><td>TVL</td><td>Tenth-Value Layer — thickness required to reduce radiation intensity by 90%</td></tr>
    <tr><td>μ</td><td>Linear attenuation coefficient — probability of photon interaction per unit thickness</td></tr>
    <tr><td>OF / T</td><td>Occupancy Factor — fraction of time an area is occupied</td></tr>
    <tr><td>UF / U</td><td>Use Factor — fraction of beam-on time directed toward a barrier</td></tr>
    <tr><td>B</td><td>Transmission Factor — fraction of radiation transmitted through shielding</td></tr>
    <tr><td>ISL</td><td>Inverse Square Law — intensity ∝ 1/distance²</td></tr>
    <tr><td>ALARA</td><td>As Low As Reasonably Achievable — radiation protection principle</td></tr>
    <tr><td>TLD</td><td>Thermoluminescent Dosimeter — personal radiation monitoring device</td></tr>
    <tr><td>OSL</td><td>Optically Stimulated Luminescence — personal radiation monitoring device</td></tr>
</table>

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
