import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ----- Modalities (13 total) -----
  const modalities = await Promise.all([
    // Existing 8 modalities
    prisma.modality.create({ data: { name: 'XR', description: 'X-Ray Radiography', icon: '🔦' } }),
    prisma.modality.create({ data: { name: 'Cath Lab', description: 'Cardiac Catheterization Lab', icon: '❤️' } }),
    prisma.modality.create({ data: { name: 'CT', description: 'Computed Tomography', icon: '🔄' } }),
    prisma.modality.create({ data: { name: 'PET-CT', description: 'Positron Emission Tomography - CT', icon: '🔬' } }),
    prisma.modality.create({ data: { name: 'Cyclotron', description: 'Cyclotron Facility', icon: '⚛️' } }),
    prisma.modality.create({ data: { name: 'LINAC', description: 'Linear Accelerator', icon: '🎯' } }),
    prisma.modality.create({ data: { name: 'Gamma Room', description: 'Gamma Irradiation Room', icon: '☢️' } }),
    prisma.modality.create({ data: { name: 'Neutron Facility', description: 'Neutron Radiation Facility', icon: '🧪' } }),
    // New modalities
    prisma.modality.create({ data: { name: 'Mammography', description: 'Mammography / Breast Imaging', icon: '🎗️' } }),
    prisma.modality.create({ data: { name: 'Fluoroscopy', description: 'Fluoroscopy / R&F Radiography', icon: '📹' } }),
    prisma.modality.create({ data: { name: 'Nuclear Medicine', description: 'Nuclear Medicine / SPECT Imaging', icon: '💊' } }),
    prisma.modality.create({ data: { name: 'HDR Brachytherapy', description: 'High-Dose-Rate Brachytherapy', icon: '🎯' } }),
    prisma.modality.create({ data: { name: 'Orthovoltage', description: 'Orthovoltage / Superficial Therapy', icon: '⚡' } }),
  ]);

  const modMap = Object.fromEntries(modalities.map((m) => [m.name, m.id]));

  // ----- Manufacturers & Machines (full data) -----
  const manufacturerData: {
    name: string; country?: string;
    modality: string;
    machines: {
      model: string; type?: string;
      kvp?: number; ma?: number; workload?: number;
      beamAngle?: number; sourceFactor?: number;
      safetyIndex?: number; leakageValue?: number;
    }[];
  }[] = [
    /* ===== XR (X-Ray Radiography) ===== */
    { modality: 'XR', name: 'Siemens Healthineers', country: 'Germany', machines: [
      { model: 'Multix Impact', type: 'Digital', kvp: 150, ma: 800, workload: 40, beamAngle: 45, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Ysio Max', type: 'Digital', kvp: 150, ma: 1000, workload: 50, beamAngle: 40, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Mobiltt Plus', type: 'Mobile', kvp: 125, ma: 400, workload: 25, beamAngle: 30, sourceFactor: 0.9, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'XR', name: 'GE Healthcare', country: 'USA', machines: [
      { model: 'Definium 6560', type: 'Digital', kvp: 150, ma: 900, workload: 45, beamAngle: 45, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'AMX 700', type: 'Mobile', kvp: 125, ma: 400, workload: 20, beamAngle: 30, sourceFactor: 0.9, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'Discovery XR656', type: 'Digital', kvp: 150, ma: 1000, workload: 50, beamAngle: 40, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'XR', name: 'Philips Healthcare', country: 'Netherlands', machines: [
      { model: 'DigitalDiagnost C90', type: 'Digital', kvp: 150, ma: 800, workload: 40, beamAngle: 45, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'DigitalDiagnost Eleva', type: 'Digital', kvp: 150, ma: 900, workload: 45, beamAngle: 42, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'MobileDiagnost wDR', type: 'Mobile', kvp: 125, ma: 320, workload: 18, beamAngle: 35, sourceFactor: 0.85, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'XR', name: 'Canon Medical', country: 'Japan', machines: [
      { model: 'RadPRO', type: 'Digital', kvp: 150, ma: 800, workload: 35, beamAngle: 45, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Ultimax-i', type: 'Multi-purpose', kvp: 150, ma: 850, workload: 40, beamAngle: 45, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'MRAD A40S', type: 'Mobile', kvp: 125, ma: 350, workload: 22, beamAngle: 30, sourceFactor: 0.9, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'XR', name: 'Fujifilm Healthcare', country: 'Japan', machines: [
      { model: 'FDR D-EVO II', type: 'Digital', kvp: 150, ma: 750, workload: 38, beamAngle: 40, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'FDR Go PLUS', type: 'Mobile', kvp: 125, ma: 400, workload: 20, beamAngle: 30, sourceFactor: 0.9, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'XR', name: 'Shimadzu', country: 'Japan', machines: [
      { model: 'RADspeed Pro', type: 'Digital', kvp: 150, ma: 800, workload: 35, beamAngle: 45, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'MobileDaRt Evolution', type: 'Mobile', kvp: 125, ma: 350, workload: 20, beamAngle: 30, sourceFactor: 0.9, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'XR', name: 'Carestream Health', country: 'USA', machines: [
      { model: 'DRX-Revolution', type: 'Digital', kvp: 150, ma: 800, workload: 35, beamAngle: 40, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'DRX-Transformer', type: 'Mobile', kvp: 125, ma: 400, workload: 18, beamAngle: 30, sourceFactor: 0.85, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},

    /* ===== Cath Lab ===== */
    { modality: 'Cath Lab', name: 'Siemens Healthineers', country: 'Germany', machines: [
      { model: 'Artis Q.zen', type: 'Biplane', kvp: 125, ma: 1000, workload: 60, beamAngle: 30, sourceFactor: 1.2, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Artis Icono', type: 'Floor-mounted', kvp: 125, ma: 1000, workload: 55, beamAngle: 25, sourceFactor: 1.1, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Artis One', type: 'Ceiling-mounted', kvp: 125, ma: 800, workload: 45, beamAngle: 25, sourceFactor: 1.1, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'Cath Lab', name: 'GE Healthcare', country: 'USA', machines: [
      { model: 'Innova IGS 520', type: 'Single-plane', kvp: 125, ma: 1000, workload: 50, beamAngle: 30, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Innova IGS 540', type: 'Biplane', kvp: 125, ma: 1000, workload: 65, beamAngle: 30, sourceFactor: 1.1, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'Cath Lab', name: 'Philips Healthcare', country: 'Netherlands', machines: [
      { model: 'Azurion 7', type: 'Single-plane', kvp: 125, ma: 1000, workload: 55, beamAngle: 30, sourceFactor: 1.1, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Azurion 7 Biplane', type: 'Biplane', kvp: 125, ma: 1000, workload: 70, beamAngle: 30, sourceFactor: 1.2, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'AlluraClarity', type: 'Single-plane', kvp: 125, ma: 900, workload: 50, beamAngle: 25, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'Cath Lab', name: 'Canon Medical', country: 'Japan', machines: [
      { model: 'Alphenix Sky', type: 'Ceiling-mounted', kvp: 125, ma: 1000, workload: 50, beamAngle: 25, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Alphenix Core', type: 'Biplane', kvp: 125, ma: 1000, workload: 60, beamAngle: 30, sourceFactor: 1.1, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'Cath Lab', name: 'Shimadzu', country: 'Japan', machines: [
      { model: 'Trinias B12', type: 'Single-plane', kvp: 125, ma: 800, workload: 40, beamAngle: 25, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Trinias C12', type: 'Biplane', kvp: 125, ma: 900, workload: 55, beamAngle: 30, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},

    /* ===== CT (Computed Tomography) ===== */
    { modality: 'CT', name: 'Siemens Healthineers', country: 'Germany', machines: [
      { model: 'SOMATOM Force', type: 'Dual-source', kvp: 150, ma: 1300, workload: 70, beamAngle: 0, sourceFactor: 1.5, safetyIndex: 1.2, leakageValue: 0.002 },
      { model: 'SOMATOM Drive', type: 'Single-source', kvp: 140, ma: 700, workload: 60, beamAngle: 0, sourceFactor: 1.3, safetyIndex: 1.1, leakageValue: 0.002 },
      { model: 'SOMATOM X.cite', type: 'Single-source', kvp: 140, ma: 650, workload: 55, beamAngle: 0, sourceFactor: 1.2, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'SOMATOM go.Top', type: 'Single-source', kvp: 130, ma: 500, workload: 45, beamAngle: 0, sourceFactor: 1.1, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'CT', name: 'GE Healthcare', country: 'USA', machines: [
      { model: 'Revolution CT', type: '256-slice', kvp: 140, ma: 740, workload: 65, beamAngle: 0, sourceFactor: 1.4, safetyIndex: 1.1, leakageValue: 0.002 },
      { model: 'Revolution Maxima', type: '128-slice', kvp: 140, ma: 620, workload: 55, beamAngle: 0, sourceFactor: 1.3, safetyIndex: 1.1, leakageValue: 0.002 },
      { model: 'Revolution EVO', type: '128-slice', kvp: 140, ma: 580, workload: 50, beamAngle: 0, sourceFactor: 1.2, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'CT', name: 'Canon Medical', country: 'Japan', machines: [
      { model: 'Aquilion ONE', type: '320-slice', kvp: 135, ma: 600, workload: 60, beamAngle: 0, sourceFactor: 1.2, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Aquilion Prime', type: '160-slice', kvp: 135, ma: 550, workload: 50, beamAngle: 0, sourceFactor: 1.1, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Aquilion Lightning', type: '80-slice', kvp: 130, ma: 450, workload: 40, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'CT', name: 'Philips Healthcare', country: 'Netherlands', machines: [
      { model: 'IQon Spectral CT', type: 'Spectral', kvp: 140, ma: 700, workload: 60, beamAngle: 0, sourceFactor: 1.3, safetyIndex: 1.1, leakageValue: 0.002 },
      { model: 'Incisive CT', type: '64-slice', kvp: 140, ma: 650, workload: 50, beamAngle: 0, sourceFactor: 1.2, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Spectral CT 7500', type: 'Spectral', kvp: 140, ma: 720, workload: 65, beamAngle: 0, sourceFactor: 1.4, safetyIndex: 1.1, leakageValue: 0.002 },
    ]},
    { modality: 'CT', name: 'United Imaging', country: 'China', machines: [
      { model: 'uCT 960+', type: '640-slice', kvp: 140, ma: 600, workload: 65, beamAngle: 0, sourceFactor: 1.4, safetyIndex: 1.1, leakageValue: 0.002 },
      { model: 'uCT 780', type: '256-slice', kvp: 140, ma: 500, workload: 55, beamAngle: 0, sourceFactor: 1.2, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'CT', name: 'NeuroLogica (Samsung)', country: 'South Korea', machines: [
      { model: 'OmniTom Elite', type: 'Mobile', kvp: 140, ma: 350, workload: 30, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'BodyTom Pro', type: 'Portable', kvp: 140, ma: 300, workload: 25, beamAngle: 0, sourceFactor: 0.9, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},

    /* ===== PET-CT ===== */
    { modality: 'PET-CT', name: 'Siemens Healthineers', country: 'Germany', machines: [
      { model: 'Biograph Vision', type: 'PET/CT', kvp: 140, ma: 500, workload: 30, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'Biograph Horizon', type: 'PET/CT', kvp: 140, ma: 440, workload: 25, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'Biograph mCT', type: 'PET/CT', kvp: 130, ma: 400, workload: 28, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'PET-CT', name: 'GE Healthcare', country: 'USA', machines: [
      { model: 'Discovery MI', type: 'PET/CT', kvp: 140, ma: 440, workload: 25, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'Discovery 690', type: 'PET/CT', kvp: 140, ma: 440, workload: 22, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'PET-CT', name: 'Philips Healthcare', country: 'Netherlands', machines: [
      { model: 'Vereos Digital', type: 'PET/CT', kvp: 140, ma: 450, workload: 28, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'Gemini TF', type: 'PET/CT', kvp: 140, ma: 400, workload: 24, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'PET-CT', name: 'Canon Medical', country: 'Japan', machines: [
      { model: 'Celesteion', type: 'PET/CT', kvp: 135, ma: 400, workload: 25, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'PET-CT', name: 'United Imaging', country: 'China', machines: [
      { model: 'uMI 780', type: 'PET/CT', kvp: 140, ma: 400, workload: 28, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'uMI Panorama', type: 'PET/CT', kvp: 140, ma: 440, workload: 30, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},

    /* ===== Cyclotron ===== */
    { modality: 'Cyclotron', name: 'IBA', country: 'Belgium', machines: [
      { model: 'Cyclone 18/9', type: 'Fixed-energy', workload: 40, beamAngle: 0, sourceFactor: 2.0, safetyIndex: 1.5, leakageValue: 0.005 },
      { model: 'Cyclone Kiube', type: 'Fixed-energy', workload: 45, beamAngle: 0, sourceFactor: 2.2, safetyIndex: 1.6, leakageValue: 0.005 },
      { model: 'Cyclone 30', type: 'Variable-energy', workload: 50, beamAngle: 0, sourceFactor: 2.5, safetyIndex: 1.5, leakageValue: 0.008 },
    ]},
    { modality: 'Cyclotron', name: 'GE Healthcare', country: 'USA', machines: [
      { model: 'PETtrace 880', type: 'Variable-energy', workload: 35, beamAngle: 0, sourceFactor: 1.8, safetyIndex: 1.4, leakageValue: 0.005 },
    ]},
    { modality: 'Cyclotron', name: 'Best Medical', country: 'Canada', machines: [
      { model: 'Cyclotron TR24', type: 'Fixed-energy', workload: 35, beamAngle: 0, sourceFactor: 1.7, safetyIndex: 1.4, leakageValue: 0.005 },
      { model: 'Cyclotron TR19', type: 'Fixed-energy', workload: 30, beamAngle: 0, sourceFactor: 1.5, safetyIndex: 1.3, leakageValue: 0.004 },
    ]},

    /* ===== LINAC (Linear Accelerator) ===== */
    { modality: 'LINAC', name: 'Varian Medical Systems', country: 'USA', machines: [
      { model: 'TrueBeam', type: 'STx', kvp: 6, workload: 80, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'VitalBeam', type: 'FF/FFF', kvp: 6, workload: 75, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Edge', type: 'SRS', kvp: 6, workload: 70, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Halcyon', type: 'O-ring', kvp: 6, workload: 85, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'TrueBeam 2.7', type: 'STx FFF', kvp: 10, workload: 85, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'LINAC', name: 'Elekta', country: 'Sweden', machines: [
      { model: 'Elekta Unity', type: 'MR-linac', kvp: 7, workload: 70, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Elekta Versa HD', type: 'FFF', kvp: 10, workload: 75, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Elekta Synergy', type: 'Conventional', kvp: 6, workload: 65, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Elekta Infinity', type: 'Agility', kvp: 6, workload: 70, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'LINAC', name: 'Accuray', country: 'USA', machines: [
      { model: 'CyberKnife S7', type: 'Robotic SRS', kvp: 6, workload: 60, beamAngle: 0, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Tomotherapy Radixact', type: 'Helical', kvp: 6, workload: 75, beamAngle: 0, sourceFactor: 1.2, safetyIndex: 1.1, leakageValue: 0.001 },
    ]},
    { modality: 'LINAC', name: 'RefleXion Medical', country: 'USA', machines: [
      { model: 'RefleXion X1', type: 'Biology-guided', kvp: 6, workload: 65, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},

    /* ===== Gamma Room ===== */
    { modality: 'Gamma Room', name: 'Elekta', country: 'Sweden', machines: [
      { model: 'Leksell Gamma Knife', type: 'Icon', workload: 30, beamAngle: 0, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.003 },
    ]},
    { modality: 'Gamma Room', name: 'GammaStar', country: 'China', machines: [
      { model: 'GammaStar GS-100', type: 'Co-60', workload: 25, beamAngle: 0, sourceFactor: 0.7, safetyIndex: 1.0, leakageValue: 0.003 },
      { model: 'GammaStar GS-200', type: 'Co-60', workload: 30, beamAngle: 0, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.003 },
    ]},
    { modality: 'Gamma Room', name: 'Nordion', country: 'Canada', machines: [
      { model: 'Theratron Equinox', type: 'Co-60', workload: 25, beamAngle: 0, sourceFactor: 0.7, safetyIndex: 1.0, leakageValue: 0.003 },
    ]},

    /* ===== Neutron Facility ===== */
    { modality: 'Neutron Facility', name: 'Thermo Fisher', country: 'USA', machines: [
      { model: 'MP 320', type: 'DT Neutron Generator', workload: 20, beamAngle: 0, sourceFactor: 3.0, safetyIndex: 2.0, leakageValue: 0.01 },
    ]},
    { modality: 'Neutron Facility', name: 'EADS Sodern', country: 'France', machines: [
      { model: 'GENIE 16', type: 'DD Neutron Generator', workload: 15, beamAngle: 0, sourceFactor: 2.5, safetyIndex: 2.0, leakageValue: 0.008 },
    ]},
    { modality: 'Neutron Facility', name: 'Phoenix', country: 'USA', machines: [
      { model: 'Phoenix DT Generator', type: 'High-output DT', workload: 25, beamAngle: 0, sourceFactor: 3.5, safetyIndex: 2.5, leakageValue: 0.012 },
    ]},

    /* ===== Mammography ===== */
    { modality: 'Mammography', name: 'Siemens Healthineers', country: 'Germany', machines: [
      { model: 'Mammomat Fusion', type: 'Full-field digital', kvp: 35, ma: 100, workload: 15, beamAngle: 0, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.0015 },
      { model: 'Mammomat Revelation', type: 'Full-field digital', kvp: 35, ma: 120, workload: 18, beamAngle: 0, sourceFactor: 0.85, safetyIndex: 1.0, leakageValue: 0.0015 },
    ]},
    { modality: 'Mammography', name: 'GE Healthcare', country: 'USA', machines: [
      { model: 'Senographe Pristina', type: 'Digital', kvp: 35, ma: 100, workload: 15, beamAngle: 0, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.0015 },
      { model: 'Senographe Essential', type: 'Digital', kvp: 35, ma: 100, workload: 14, beamAngle: 0, sourceFactor: 0.75, safetyIndex: 1.0, leakageValue: 0.0015 },
    ]},
    { modality: 'Mammography', name: 'Hologic', country: 'USA', machines: [
      { model: '3Dimensions', type: 'Digital Tomosynthesis', kvp: 35, ma: 120, workload: 20, beamAngle: 0, sourceFactor: 0.85, safetyIndex: 1.0, leakageValue: 0.0015 },
      { model: 'Selenia Dimensions', type: 'Digital Tomosynthesis', kvp: 35, ma: 110, workload: 18, beamAngle: 0, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.0015 },
    ]},
    { modality: 'Mammography', name: 'Fujifilm Healthcare', country: 'Japan', machines: [
      { model: 'Amulet Innovality', type: 'Digital', kvp: 35, ma: 100, workload: 15, beamAngle: 0, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.0015 },
      { model: 'Amulet Sophinity', type: 'Digital Tomosynthesis', kvp: 35, ma: 110, workload: 17, beamAngle: 0, sourceFactor: 0.85, safetyIndex: 1.0, leakageValue: 0.0015 },
    ]},
    { modality: 'Mammography', name: 'IMS Giotto', country: 'Italy', machines: [
      { model: 'Giotto Image 3D', type: 'Digital Tomosynthesis', kvp: 35, ma: 100, workload: 16, beamAngle: 0, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.0015 },
    ]},

    /* ===== Fluoroscopy (R&F) ===== */
    { modality: 'Fluoroscopy', name: 'Siemens Healthineers', country: 'Germany', machines: [
      { model: 'Luminos dRF Max', type: 'Digital R/F', kvp: 125, ma: 800, workload: 30, beamAngle: 30, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Luminos Lotus', type: 'Mobile C-arm', kvp: 110, ma: 200, workload: 15, beamAngle: 25, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'Cios Alpha', type: 'Mobile C-arm', kvp: 110, ma: 250, workload: 18, beamAngle: 25, sourceFactor: 0.85, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'Fluoroscopy', name: 'GE Healthcare', country: 'USA', machines: [
      { model: 'Precision 180', type: 'R/F System', kvp: 125, ma: 800, workload: 28, beamAngle: 30, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'OEC 9900 Elite', type: 'Mobile C-arm', kvp: 110, ma: 200, workload: 20, beamAngle: 25, sourceFactor: 0.85, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'Fluoroscopy', name: 'Philips Healthcare', country: 'Netherlands', machines: [
      { model: 'BV Vectra', type: 'Mobile C-arm', kvp: 110, ma: 200, workload: 15, beamAngle: 25, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'Veradius Unity', type: 'Mobile C-arm', kvp: 110, ma: 250, workload: 20, beamAngle: 30, sourceFactor: 0.85, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'Fluoroscopy', name: 'Shimadzu', country: 'Japan', machines: [
      { model: 'RADspeed D2F', type: 'Digital R/F', kvp: 125, ma: 800, workload: 25, beamAngle: 30, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},

    /* ===== Nuclear Medicine (SPECT) ===== */
    { modality: 'Nuclear Medicine', name: 'Siemens Healthineers', country: 'Germany', machines: [
      { model: 'Symbia Intevo', type: 'SPECT/CT', kvp: 130, ma: 350, workload: 20, beamAngle: 0, sourceFactor: 0.6, safetyIndex: 1.0, leakageValue: 0.003 },
      { model: 'Symbia Pro.spect', type: 'SPECT/CT', kvp: 130, ma: 300, workload: 18, beamAngle: 0, sourceFactor: 0.5, safetyIndex: 1.0, leakageValue: 0.003 },
    ]},
    { modality: 'Nuclear Medicine', name: 'GE Healthcare', country: 'USA', machines: [
      { model: 'NM/CT 870 CZT', type: 'SPECT/CT', kvp: 140, ma: 360, workload: 22, beamAngle: 0, sourceFactor: 0.6, safetyIndex: 1.0, leakageValue: 0.003 },
      { model: 'Discovery NM/CT 670', type: 'SPECT/CT', kvp: 130, ma: 330, workload: 20, beamAngle: 0, sourceFactor: 0.5, safetyIndex: 1.0, leakageValue: 0.003 },
    ]},
    { modality: 'Nuclear Medicine', name: 'Spectrum Dynamics', country: 'Israel', machines: [
      { model: 'VERITON-CT', type: 'D-SPECT/CT', kvp: 130, ma: 300, workload: 18, beamAngle: 0, sourceFactor: 0.5, safetyIndex: 1.0, leakageValue: 0.003 },
    ]},
    { modality: 'Nuclear Medicine', name: 'Digirad', country: 'USA', machines: [
      { model: 'Cardius 3', type: 'Cardiac SPECT', kvp: 130, ma: 280, workload: 15, beamAngle: 0, sourceFactor: 0.4, safetyIndex: 1.0, leakageValue: 0.003 },
    ]},

    /* ===== HDR Brachytherapy ===== */
    { modality: 'HDR Brachytherapy', name: 'Elekta', country: 'Sweden', machines: [
      { model: 'Flexitron', type: 'Ir-192 HDR', workload: 10, beamAngle: 0, sourceFactor: 0.5, safetyIndex: 1.2, leakageValue: 0.005 },
    ]},
    { modality: 'HDR Brachytherapy', name: 'Varian Medical Systems', country: 'USA', machines: [
      { model: 'GammaMedplus iX', type: 'Ir-192 HDR', workload: 12, beamAngle: 0, sourceFactor: 0.55, safetyIndex: 1.2, leakageValue: 0.005 },
    ]},
    { modality: 'HDR Brachytherapy', name: 'BEBIG Medical', country: 'Germany', machines: [
      { model: 'MultiSource', type: 'Co-60 HDR', workload: 8, beamAngle: 0, sourceFactor: 0.45, safetyIndex: 1.2, leakageValue: 0.005 },
    ]},
    { modality: 'HDR Brachytherapy', name: 'Eckert & Ziegler', country: 'Germany', machines: [
      { model: 'BEBIG EcoSource', type: 'Co-60 HDR', workload: 8, beamAngle: 0, sourceFactor: 0.4, safetyIndex: 1.2, leakageValue: 0.005 },
    ]},

    /* ===== Orthovoltage Therapy ===== */
    { modality: 'Orthovoltage', name: 'Xstrahl', country: 'USA', machines: [
      { model: 'Xstrahl 300', type: 'Orthovoltage', kvp: 300, ma: 20, workload: 15, beamAngle: 0, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'Xstrahl 200', type: 'Superficial', kvp: 200, ma: 15, workload: 12, beamAngle: 0, sourceFactor: 0.7, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'Orthovoltage', name: 'Sensus Healthcare', country: 'USA', machines: [
      { model: 'SRT-100', type: 'Superficial', kvp: 100, ma: 10, workload: 10, beamAngle: 0, sourceFactor: 0.6, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'Orthovoltage', name: 'Precision X-Ray', country: 'USA', machines: [
      { model: 'X-RAD 320', type: 'Orthovoltage', kvp: 320, ma: 20, workload: 18, beamAngle: 0, sourceFactor: 0.85, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'X-RAD 225', type: 'Orthovoltage', kvp: 225, ma: 15, workload: 14, beamAngle: 0, sourceFactor: 0.75, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'Orthovoltage', name: 'Kimtron Medical', country: 'India', machines: [
      { model: 'Orthovoltage 250', type: 'Orthovoltage', kvp: 250, ma: 15, workload: 12, beamAngle: 0, sourceFactor: 0.7, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},

    /* ===== NEW COMPANIES — Wave 2 ===== */

    /* --- XR --- */
    { modality: 'XR', name: 'Agfa HealthCare', country: 'Belgium', machines: [
      { model: 'DR 800', type: 'Digital', kvp: 150, ma: 750, workload: 35, beamAngle: 40, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'DR 600', type: 'Digital', kvp: 150, ma: 700, workload: 30, beamAngle: 40, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'CR 30-X', type: 'Computed Radiography', kvp: 150, ma: 650, workload: 28, beamAngle: 35, sourceFactor: 0.95, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'XR', name: 'Konica Minolta', country: 'Japan', machines: [
      { model: 'AeroDR HD', type: 'Digital', kvp: 150, ma: 800, workload: 36, beamAngle: 40, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'REGiUS 190', type: 'Computed Radiography', kvp: 150, ma: 700, workload: 32, beamAngle: 38, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'AeroDR Dry', type: 'Portable', kvp: 125, ma: 380, workload: 20, beamAngle: 30, sourceFactor: 0.85, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},
    { modality: 'XR', name: 'Del Medical', country: 'USA', machines: [
      { model: 'FlexMaster DR', type: 'Digital', kvp: 150, ma: 800, workload: 34, beamAngle: 40, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Del R/F System', type: 'R/F', kvp: 150, ma: 750, workload: 30, beamAngle: 40, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},

    /* --- CT --- */
    { modality: 'CT', name: 'Hitachi Healthcare', country: 'Japan', machines: [
      { model: 'Supria', type: '64-slice', kvp: 130, ma: 400, workload: 40, beamAngle: 0, sourceFactor: 1.1, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Scenaria View', type: '128-slice', kvp: 135, ma: 550, workload: 50, beamAngle: 0, sourceFactor: 1.2, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Supria Elite', type: '80-slice', kvp: 130, ma: 420, workload: 42, beamAngle: 0, sourceFactor: 1.1, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'CT', name: 'Neusoft Medical', country: 'China', machines: [
      { model: 'NeuViz 128', type: '128-slice', kvp: 140, ma: 450, workload: 45, beamAngle: 0, sourceFactor: 1.1, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'NeuViz 64', type: '64-slice', kvp: 130, ma: 350, workload: 35, beamAngle: 0, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'NeuViz Ace', type: '16-slice', kvp: 130, ma: 280, workload: 25, beamAngle: 0, sourceFactor: 0.9, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},

    /* --- Cath Lab --- */
    { modality: 'Cath Lab', name: 'Hitachi Healthcare', country: 'Japan', machines: [
      { model: 'Alair Vario', type: 'Single-plane', kvp: 125, ma: 900, workload: 45, beamAngle: 25, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Alair Biplane', type: 'Biplane', kvp: 125, ma: 1000, workload: 60, beamAngle: 30, sourceFactor: 1.1, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},

    /* --- PET-CT --- */
    { modality: 'PET-CT', name: 'Cubresa', country: 'Canada', machines: [
      { model: 'NuPET', type: 'Brain PET', kvp: 130, ma: 300, workload: 18, beamAngle: 0, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.003 },
    ]},

    /* --- Cyclotron --- */
    { modality: 'Cyclotron', name: 'ACSI', country: 'Canada', machines: [
      { model: 'TR-24', type: 'Fixed-energy', workload: 38, beamAngle: 0, sourceFactor: 1.8, safetyIndex: 1.4, leakageValue: 0.005 },
      { model: 'TR-19', type: 'Fixed-energy', workload: 32, beamAngle: 0, sourceFactor: 1.6, safetyIndex: 1.3, leakageValue: 0.004 },
    ]},

    /* --- LINAC --- */
    { modality: 'LINAC', name: 'Hitachi Healthcare', country: 'Japan', machines: [
      { model: 'ProBeat', type: 'Proton Therapy', kvp: 235, workload: 90, beamAngle: 0, sourceFactor: 1.5, safetyIndex: 1.3, leakageValue: 0.002 },
      { model: 'ProBeat Compact', type: 'Proton Single Room', kvp: 235, workload: 80, beamAngle: 0, sourceFactor: 1.4, safetyIndex: 1.2, leakageValue: 0.002 },
    ]},
    { modality: 'LINAC', name: 'Mevion Medical Systems', country: 'USA', machines: [
      { model: 'MEVION S250i', type: 'Proton Synchrocyclotron', kvp: 250, workload: 75, beamAngle: 0, sourceFactor: 1.3, safetyIndex: 1.2, leakageValue: 0.002 },
      { model: 'MEVION S250 Proton', type: 'Proton', kvp: 250, workload: 70, beamAngle: 0, sourceFactor: 1.2, safetyIndex: 1.1, leakageValue: 0.002 },
    ]},
    { modality: 'LINAC', name: 'IBA Proton Therapy', country: 'Belgium', machines: [
      { model: 'Proteus ONE', type: 'Proton Single Room', kvp: 230, workload: 85, beamAngle: 0, sourceFactor: 1.5, safetyIndex: 1.3, leakageValue: 0.002 },
      { model: 'Proteus PLUS', type: 'Proton Multi-room', kvp: 230, workload: 100, beamAngle: 0, sourceFactor: 1.6, safetyIndex: 1.4, leakageValue: 0.002 },
    ]},

    /* --- Gamma Room --- */
    { modality: 'Gamma Room', name: 'Best Medical', country: 'Canada', machines: [
      { model: 'GammaRad Plus', type: 'Co-60', workload: 28, beamAngle: 0, sourceFactor: 0.75, safetyIndex: 1.0, leakageValue: 0.003 },
    ]},

    /* --- Neutron Facility --- */
    { modality: 'Neutron Facility', name: 'Adelphi Technology', country: 'USA', machines: [
      { model: 'DD-110', type: 'DD Neutron Generator', workload: 12, beamAngle: 0, sourceFactor: 2.0, safetyIndex: 1.8, leakageValue: 0.006 },
      { model: 'NC-100', type: 'DT Neutron Generator', workload: 18, beamAngle: 0, sourceFactor: 3.0, safetyIndex: 2.2, leakageValue: 0.01 },
    ]},

    /* --- Mammography --- */
    { modality: 'Mammography', name: 'Planmed', country: 'Finland', machines: [
      { model: 'Planmed Clarity', type: 'Digital', kvp: 35, ma: 100, workload: 14, beamAngle: 0, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.0015 },
      { model: 'Planmed Nuance', type: 'Digital Tomosynthesis', kvp: 35, ma: 110, workload: 16, beamAngle: 0, sourceFactor: 0.85, safetyIndex: 1.0, leakageValue: 0.0015 },
    ]},
    { modality: 'Mammography', name: 'Metaltronica', country: 'Italy', machines: [
      { model: 'METALTRON FLAT', type: 'Digital', kvp: 35, ma: 95, workload: 14, beamAngle: 0, sourceFactor: 0.75, safetyIndex: 1.0, leakageValue: 0.0015 },
      { model: 'METALTRON TOMO', type: 'Digital Tomosynthesis', kvp: 35, ma: 110, workload: 17, beamAngle: 0, sourceFactor: 0.85, safetyIndex: 1.0, leakageValue: 0.0015 },
    ]},

    /* --- Fluoroscopy --- */
    { modality: 'Fluoroscopy', name: 'Hitachi Healthcare', country: 'Japan', machines: [
      { model: 'Radix 4D', type: 'Digital R/F', kvp: 125, ma: 750, workload: 26, beamAngle: 30, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
      { model: 'Exavision 505', type: 'Digital R/F', kvp: 125, ma: 800, workload: 28, beamAngle: 30, sourceFactor: 1.0, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
    { modality: 'Fluoroscopy', name: 'Ziehm Imaging', country: 'Germany', machines: [
      { model: 'Ziehm Vision RFD', type: 'Mobile C-arm', kvp: 110, ma: 220, workload: 18, beamAngle: 25, sourceFactor: 0.85, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'Ziehm Solo', type: 'Mobile C-arm', kvp: 110, ma: 180, workload: 14, beamAngle: 25, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'Ziehm Cios', type: 'Mobile C-arm', kvp: 110, ma: 200, workload: 16, beamAngle: 25, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.002 },
    ]},

    /* --- Nuclear Medicine --- */
    { modality: 'Nuclear Medicine', name: 'Mediso Medical Imaging', country: 'Hungary', machines: [
      { model: 'AnyScan Trio', type: 'SPECT/CT', kvp: 130, ma: 320, workload: 20, beamAngle: 0, sourceFactor: 0.55, safetyIndex: 1.0, leakageValue: 0.003 },
      { model: 'AnyScan S', type: 'SPECT', kvp: 130, ma: 280, workload: 16, beamAngle: 0, sourceFactor: 0.45, safetyIndex: 1.0, leakageValue: 0.003 },
      { model: 'NanoPET/CT', type: 'Preclinical PET/CT', kvp: 50, ma: 150, workload: 10, beamAngle: 0, sourceFactor: 0.3, safetyIndex: 1.0, leakageValue: 0.005 },
    ]},

    /* --- HDR Brachytherapy --- */
    { modality: 'HDR Brachytherapy', name: 'Isoray Medical', country: 'USA', machines: [
      { model: 'Isoray HDR Unit', type: 'Cs-131 HDR', workload: 6, beamAngle: 0, sourceFactor: 0.3, safetyIndex: 1.2, leakageValue: 0.005 },
    ]},

    /* --- Orthovoltage --- */
    { modality: 'Orthovoltage', name: 'Gulmay Medical', country: 'UK', machines: [
      { model: 'D3225', type: 'Orthovoltage', kvp: 300, ma: 20, workload: 16, beamAngle: 0, sourceFactor: 0.8, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'D3150', type: 'Superficial', kvp: 150, ma: 20, workload: 12, beamAngle: 0, sourceFactor: 0.7, safetyIndex: 1.0, leakageValue: 0.002 },
      { model: 'CP80', type: 'Contact Therapy', kvp: 80, ma: 10, workload: 8, beamAngle: 0, sourceFactor: 0.5, safetyIndex: 1.0, leakageValue: 0.001 },
    ]},
  ];

  for (const mf of manufacturerData) {
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: mf.name,
        country: mf.country,
        modalityId: modMap[mf.modality],
        machines: {
          create: mf.machines.map((m) => ({
            model: m.model,
            type: m.type,
            kvp: m.kvp ?? null,
            ma: m.ma ?? null,
            workload: m.workload ?? null,
            beamAngle: m.beamAngle ?? null,
            sourceFactor: m.sourceFactor ?? null,
            safetyIndex: m.safetyIndex ?? null,
            leakageValue: m.leakageValue ?? null,
          })),
        },
      },
      include: { machines: true },
    });
    console.log(`  ✅ ${mf.modality}: ${manufacturer.name} (${mf.machines.length} machines)`);
  }

  // ----- Room Templates (expanded) -----
  const roomTemplates = [
    // XR
    { modality: 'XR', name: 'Standard X-Ray Room', length: 5.0, width: 4.0, height: 3.0, description: 'Standard diagnostic X-ray room' },
    { modality: 'XR', name: 'Large X-Ray Suite', length: 6.5, width: 5.0, height: 3.2, description: 'Larger suite for trauma/bucky room' },
    { modality: 'XR', name: 'Mobile X-Ray Bay', length: 4.0, width: 3.5, height: 2.8, description: 'Compact bay for mobile X-ray unit' },
    // CT
    { modality: 'CT', name: 'Standard CT Room', length: 7.0, width: 5.5, height: 3.0, description: 'Standard CT scanner room' },
    { modality: 'CT', name: 'Large CT Suite', length: 8.0, width: 6.0, height: 3.2, description: 'Large CT suite with control area' },
    { modality: 'CT', name: 'Mobile CT Bay', length: 5.5, width: 4.5, height: 3.0, description: 'Bay for mobile CT unit' },
    // Cath Lab
    { modality: 'Cath Lab', name: 'Standard Cath Lab', length: 6.5, width: 5.5, height: 3.0, description: 'Standard catheterization lab' },
    { modality: 'Cath Lab', name: 'Large Biplane Lab', length: 8.0, width: 6.5, height: 3.2, description: 'Large lab for biplane systems' },
    { modality: 'Cath Lab', name: 'Hybrid OR', length: 8.5, width: 7.0, height: 3.5, description: 'Hybrid operating room with imaging' },
    // LINAC
    { modality: 'LINAC', name: 'Standard Linac Bunker', length: 8.0, width: 7.0, height: 3.5, description: 'Standard linear accelerator bunker' },
    { modality: 'LINAC', name: 'Large Linac Vault', length: 9.0, width: 8.0, height: 4.0, description: 'Large vault with maze entry' },
    { modality: 'LINAC', name: 'MR-Linac Suite', length: 9.5, width: 8.0, height: 3.8, description: 'MR-linac bunker with ancillary room' },
    { modality: 'LINAC', name: 'CyberKnife Suite', length: 8.5, width: 7.5, height: 3.5, description: 'Robotic radiosurgery suite' },
    // PET-CT
    { modality: 'PET-CT', name: 'Standard PET-CT Room', length: 7.0, width: 5.5, height: 3.0, description: 'Standard PET-CT imaging room' },
    { modality: 'PET-CT', name: 'Large PET-CT Suite', length: 8.0, width: 6.0, height: 3.2, description: 'Large PET-CT with hot lab adjacent' },
    { modality: 'PET-CT', name: 'PET-CT with Hot Lab', length: 9.0, width: 6.5, height: 3.2, description: 'PET-CT room with integrated radiopharmacy' },
    // Cyclotron
    { modality: 'Cyclotron', name: 'Cyclotron Vault', length: 10.0, width: 8.0, height: 4.5, description: 'Cyclotron concrete vault' },
    { modality: 'Cyclotron', name: 'Cyclotron with Chemistry Lab', length: 12.0, width: 9.0, height: 4.5, description: 'Cyclotron vault with radiochemistry lab' },
    // Gamma Room
    { modality: 'Gamma Room', name: 'Standard Gamma Room', length: 6.0, width: 5.0, height: 3.0, description: 'Gamma knife/irradiation room' },
    { modality: 'Gamma Room', name: 'Gamma Knife Suite', length: 7.0, width: 6.0, height: 3.2, description: 'Gamma knife suite with control area' },
    // Neutron Facility
    { modality: 'Neutron Facility', name: 'Neutron Vault', length: 10.0, width: 8.0, height: 4.0, description: 'Neutron generator vault' },
    { modality: 'Neutron Facility', name: 'Small Neutron Cell', length: 7.0, width: 6.0, height: 3.5, description: 'Compact neutron irradiation cell' },
    // Mammography
    { modality: 'Mammography', name: 'Standard Mammography Room', length: 4.5, width: 3.5, height: 2.8, description: 'Standard mammography screening room' },
    { modality: 'Mammography', name: 'Mammography Suite', length: 5.5, width: 4.0, height: 3.0, description: 'Mammography room with dressing area' },
    { modality: 'Mammography', name: 'Tomosynthesis Suite', length: 5.0, width: 4.0, height: 3.0, description: 'Room for digital breast tomosynthesis' },
    // Fluoroscopy
    { modality: 'Fluoroscopy', name: 'Standard R/F Room', length: 5.5, width: 4.5, height: 3.0, description: 'Standard fluoroscopy/R&F room' },
    { modality: 'Fluoroscopy', name: 'GI Suite', length: 6.0, width: 4.5, height: 3.0, description: 'GI fluoroscopy suite with table' },
    { modality: 'Fluoroscopy', name: 'Mobile C-Arm Bay', length: 5.0, width: 4.0, height: 2.8, description: 'Bay for mobile C-arm in OR setting' },
    // Nuclear Medicine
    { modality: 'Nuclear Medicine', name: 'Standard NM Room', length: 6.0, width: 5.0, height: 3.0, description: 'Standard nuclear medicine imaging room' },
    { modality: 'Nuclear Medicine', name: 'Gamma Camera Room', length: 6.5, width: 5.0, height: 3.0, description: 'Room for dual-head gamma camera' },
    { modality: 'Nuclear Medicine', name: 'SPECT-CT Suite', length: 7.0, width: 5.5, height: 3.0, description: 'SPECT-CT imaging suite' },
    { modality: 'Nuclear Medicine', name: 'Radioiodine Therapy Room', length: 5.0, width: 4.0, height: 3.0, description: 'Isolation room for I-131 therapy' },
    // HDR Brachytherapy
    { modality: 'HDR Brachytherapy', name: 'HDR Treatment Room', length: 5.0, width: 4.5, height: 3.0, description: 'HDR brachytherapy treatment room' },
    { modality: 'HDR Brachytherapy', name: 'HDR Suite with Control', length: 6.0, width: 5.0, height: 3.2, description: 'HDR room with integrated control area' },
    // Orthovoltage
    { modality: 'Orthovoltage', name: 'Orthovoltage Treatment Room', length: 5.0, width: 4.0, height: 3.0, description: 'Orthovoltage/superficial therapy room' },
    { modality: 'Orthovoltage', name: 'X-Ray Therapy Suite', length: 6.0, width: 5.0, height: 3.0, description: 'X-ray therapy suite with shielding' },
  ];

  for (const rt of roomTemplates) {
    await prisma.roomTemplate.create({
      data: { name: rt.name, length: rt.length, width: rt.width, height: rt.height, description: rt.description, modalityId: modMap[rt.modality] },
    });
  }
  console.log(`  ✅ ${roomTemplates.length} room templates seeded`);

  // ----- Standards (expanded) -----
  const standards = [
    // XR
    { modality: 'XR', key: 'NCRP 147', region: 'USA', limit: 1.0, description: 'NCRP Report No. 147 - Structural Shielding Design for Medical X-Ray Imaging Facilities' },
    { modality: 'XR', key: 'IEC 60601-1-3', region: 'International', limit: 1.0, description: 'General requirements for radiation protection in medical equipment' },
    { modality: 'XR', key: 'IAEA BSS GSR Part 3', region: 'International', limit: 1.0, description: 'IAEA Basic Safety Standards for Radiation Protection' },
    { modality: 'XR', key: 'AERB Safety Code', region: 'India', limit: 1.0, description: 'AERB Radiation Protection in Medical Facilities' },
    // CT
    { modality: 'CT', key: 'NCRP 147', region: 'USA', limit: 1.0, description: 'Structural Shielding Design for Medical X-Ray Imaging Facilities' },
    { modality: 'CT', key: 'AAPM TG 204', region: 'USA', limit: 1.0, description: 'Radiation dose metrics and shielding for CT' },
    { modality: 'CT', key: 'EU 16262 EN', region: 'Europe', limit: 1.0, description: 'European standards for CT equipment radiation protection' },
    { modality: 'CT', key: 'AERB Safety Code', region: 'India', limit: 1.0, description: 'AERB guidelines for CT shielding design' },
    // Cath Lab
    { modality: 'Cath Lab', key: 'NCRP 147', region: 'USA', limit: 1.0, description: 'Structural Shielding Design for Medical X-Ray Imaging Facilities' },
    { modality: 'Cath Lab', key: 'ICRP 85', region: 'International', limit: 0.5, description: 'Avoidance of radiation injuries from interventional procedures' },
    { modality: 'Cath Lab', key: 'FDA Modernization Act', region: 'USA', limit: 1.0, description: 'FDA radiation safety requirements for fluoroscopic systems' },
    { modality: 'Cath Lab', key: 'AERB Safety Code', region: 'India', limit: 1.0, description: 'AERB radiation protection in interventional radiology' },
    // LINAC
    { modality: 'LINAC', key: 'NCRP 151', region: 'USA', limit: 0.5, description: 'Structural Shielding Design and Evaluation for Megavoltage X- and Gamma-Ray Radiotherapy' },
    { modality: 'LINAC', key: 'IAEA SRS 47', region: 'International', limit: 0.5, description: 'Radiation Protection in the Design of Radiotherapy Facilities' },
    { modality: 'LINAC', key: 'IEC 60601-2-1', region: 'International', limit: 0.5, description: 'Particular requirements for electron accelerators in radiotherapy' },
    { modality: 'LINAC', key: 'NRC 10 CFR Part 35', region: 'USA', limit: 0.5, description: 'NRC regulations for medical use of radiation in radiotherapy' },
    { modality: 'LINAC', key: 'AERB Safety Code', region: 'India', limit: 0.5, description: 'AERB radiation protection in radiotherapy facilities' },
    // PET-CT
    { modality: 'PET-CT', key: 'NCRP 160', region: 'USA', limit: 1.0, description: 'Structural Shielding Design for Medical Imaging with High-Energy Photons' },
    { modality: 'PET-CT', key: 'IAEA SRS 58', region: 'International', limit: 0.5, description: 'Radiation Protection in Nuclear Medicine Facilities' },
    { modality: 'PET-CT', key: 'AERB Safety Code', region: 'India', limit: 1.0, description: 'AERB guidelines for PET-CT facility shielding' },
    // Cyclotron
    { modality: 'Cyclotron', key: 'NCRP 144', region: 'USA', limit: 0.5, description: 'Radiation Protection for Particle Accelerator Facilities' },
    { modality: 'Cyclotron', key: 'IAEA SRS 89', region: 'International', limit: 0.5, description: 'Cyclotron Produced Radionuclides - Facility Design and Shielding' },
    { modality: 'Cyclotron', key: 'AERB Safety Code', region: 'India', limit: 0.5, description: 'AERB guidelines for cyclotron facility shielding' },
    // Gamma Room
    { modality: 'Gamma Room', key: 'NCRP 151', region: 'USA', limit: 0.5, description: 'Structural Shielding Design and Evaluation for Gamma-Ray Radiotherapy' },
    { modality: 'Gamma Room', key: 'IAEA SRS 47', region: 'International', limit: 0.5, description: 'Radiation Protection in the Design of Radiotherapy Facilities' },
    { modality: 'Gamma Room', key: 'AERB Safety Code', region: 'India', limit: 0.5, description: 'AERB guidelines for gamma irradiation facility' },
    // Neutron Facility
    { modality: 'Neutron Facility', key: 'NCRP 144', region: 'USA', limit: 0.5, description: 'Radiation Protection for Neutron Generator Facilities' },
    { modality: 'Neutron Facility', key: 'IAEA SRS 47', region: 'International', limit: 0.5, description: 'Radiation protection guidelines for neutron generators' },
    // Mammography
    { modality: 'Mammography', key: 'NCRP 147', region: 'USA', limit: 1.0, description: 'Structural Shielding Design for Mammography Facilities' },
    { modality: 'Mammography', key: 'IEC 60601-2-28', region: 'International', limit: 1.0, description: 'Particular requirements for mammographic X-ray equipment' },
    { modality: 'Mammography', key: 'MQSG Standards', region: 'USA', limit: 1.0, description: 'Mammography Quality Standards Act requirements' },
    { modality: 'Mammography', key: 'AERB Safety Code', region: 'India', limit: 1.0, description: 'AERB guidelines for mammography facility' },
    // Fluoroscopy
    { modality: 'Fluoroscopy', key: 'NCRP 147', region: 'USA', limit: 1.0, description: 'Structural Shielding Design for Fluoroscopy Facilities' },
    { modality: 'Fluoroscopy', key: 'IEC 60601-1-3', region: 'International', limit: 1.0, description: 'Radiation protection in fluoroscopic X-ray systems' },
    { modality: 'Fluoroscopy', key: 'AERB Safety Code', region: 'India', limit: 1.0, description: 'AERB guidelines for fluoroscopy shielding' },
    // Nuclear Medicine
    { modality: 'Nuclear Medicine', key: 'NCRP 160', region: 'USA', limit: 1.0, description: 'Structural Shielding Design for Nuclear Medicine Facilities' },
    { modality: 'Nuclear Medicine', key: 'IAEA SRS 58', region: 'International', limit: 1.0, description: 'Radiation Protection in Nuclear Medicine - Facility Design' },
    { modality: 'Nuclear Medicine', key: 'AERB Safety Code', region: 'India', limit: 1.0, description: 'AERB guidelines for nuclear medicine facility' },
    { modality: 'Nuclear Medicine', key: 'NRC 10 CFR Part 35', region: 'USA', limit: 1.0, description: 'NRC regulations for medical use of byproduct material' },
    // HDR Brachytherapy
    { modality: 'HDR Brachytherapy', key: 'NCRP 151', region: 'USA', limit: 0.5, description: 'Structural Shielding Design for Brachytherapy Facilities' },
    { modality: 'HDR Brachytherapy', key: 'IAEA SRS 51', region: 'International', limit: 0.5, description: 'Radiation Protection in Brachytherapy Facilities' },
    { modality: 'HDR Brachytherapy', key: 'AERB Safety Code', region: 'India', limit: 0.5, description: 'AERB guidelines for brachytherapy facility' },
    // Orthovoltage
    { modality: 'Orthovoltage', key: 'NCRP 147', region: 'USA', limit: 1.0, description: 'Structural Shielding Design for Orthovoltage Therapy' },
    { modality: 'Orthovoltage', key: 'IEC 60601-1-3', region: 'International', limit: 1.0, description: 'Radiation protection in therapy X-ray equipment' },
    { modality: 'Orthovoltage', key: 'AERB Safety Code', region: 'India', limit: 1.0, description: 'AERB guidelines for orthovoltage therapy facility' },
  ];

  for (const st of standards) {
    await prisma.standard.create({
      data: { key: st.key, region: st.region, limit: st.limit, description: st.description, modalityId: modMap[st.modality] },
    });
  }
  console.log(`  ✅ ${standards.length} standards seeded`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
