import { Router, Request, Response } from 'express';
import { getMaterialsList } from '../services/physics.js';

const router = Router();

// GET /api/materials - List all shielding materials
router.get('/', (_req: Request, res: Response) => {
  try {
    const materials = getMaterialsList();
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

export default router;
