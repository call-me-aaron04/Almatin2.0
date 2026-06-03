import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';
import {
  calculateShielding,
  calculateLeakage,
  calculateCompliance,
  calculateOccupancy,
  getMaterialsList,
  validateRoomMeasurements,
  generateRecommendations,
  ShieldingInput,
  LeakageInput,
  OccupancyInput,
} from '../services/physics.js';

const router = Router();

// POST /api/analysis/shielding
router.post('/shielding', async (req: Request, res: Response) => {
  try {
    const input = req.body as ShieldingInput;
    
    // Validate room measurements
    const dims = input.roomLength && input.roomWidth && input.roomHeight;
    const validationErrors = dims ? validateRoomMeasurements(input.roomLength, input.roomWidth, input.roomHeight) : [];
    
    const result = calculateShielding(input);
    
    // Generate recommendations
    const recs = generateRecommendations(result.wallDetails, result.isSafe ? 'SAFE' : 'WARNING');

    const saved = await prisma.analysisResult.create({
      data: {
        type: 'shielding',
        label: `Shielding Analysis - ${input.modality}`,
        inputData: JSON.stringify(input),
        resultData: JSON.stringify(result),
        status: result.isSafe ? 'SAFE' : 'WARNING',
      },
    });

    res.json({
      id: saved.id,
      result,
      validation: validationErrors,
      recommendations: recs,
    });
  } catch (err: any) {
    res.status(400).json({ error: 'Shielding analysis failed', message: err.message });
  }
});

// POST /api/analysis/leakage
router.post('/leakage', async (req: Request, res: Response) => {
  try {
    const input = req.body as LeakageInput;
    const result = calculateLeakage(input);

    const saved = await prisma.analysisResult.create({
      data: {
        type: 'leakage',
        label: `Leakage Analysis - ${input.modality}`,
        inputData: JSON.stringify(input),
        resultData: JSON.stringify(result),
        status: result.isSafe ? 'SAFE' : 'WARNING',
      },
    });

    res.json({ id: saved.id, result });
  } catch (err: any) {
    res.status(400).json({ error: 'Leakage analysis failed', message: err.message });
  }
});

// POST /api/analysis/compliance
router.post('/compliance', async (req: Request, res: Response) => {
  try {
    const { modality, doseAtWall, annualDose, wallResults } = req.body;

    const modalityRecord = await prisma.modality.findFirst({
      where: { name: modality },
      include: { standards: true },
    });

    const limits = (modalityRecord?.standards || []).map((s) => ({ key: s.key, limit: s.limit }));
    if (limits.length === 0) {
      limits.push({ key: 'General', limit: 1.0 });
    }

    const result = calculateCompliance({ doseAtWall, annualDose, wallResults, limits });

    const saved = await prisma.analysisResult.create({
      data: {
        type: 'compliance',
        label: `Compliance Check - ${modality}`,
        inputData: JSON.stringify({ modality, doseAtWall, annualDose }),
        resultData: JSON.stringify(result),
        status: result.status,
        modalityId: modalityRecord?.id,
      },
    });

    res.json({ id: saved.id, result });
  } catch (err: any) {
    res.status(400).json({ error: 'Compliance check failed', message: err.message });
  }
});

// POST /api/analysis/occupancy
router.post('/occupancy', async (req: Request, res: Response) => {
  try {
    const inputs = req.body as OccupancyInput[];
    const results = calculateOccupancy(inputs);
    res.json(results);
  } catch (err: any) {
    res.status(400).json({ error: 'Occupancy analysis failed', message: err.message });
  }
});

export default router;
