import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';

const router = Router();

// GET /api/modalities - List all modalities
router.get('/', async (_req: Request, res: Response) => {
  try {
    const modalities = await prisma.modality.findMany({ orderBy: { id: 'asc' } });
    res.json(modalities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch modalities' });
  }
});

// GET /api/modalities/:id - Get single modality
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const modality = await prisma.modality.findUnique({ where: { id: Number(req.params.id) } });
    if (!modality) return res.status(404).json({ error: 'Modality not found' });
    res.json(modality);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch modality' });
  }
});

// GET /api/modalities/:id/manufacturers
router.get('/:id/manufacturers', async (req: Request, res: Response) => {
  try {
    const manufacturers = await prisma.manufacturer.findMany({
      where: { modalityId: Number(req.params.id) },
      include: { machines: true },
      orderBy: { name: 'asc' },
    });
    res.json(manufacturers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch manufacturers' });
  }
});

// GET /api/modalities/:id/room-templates
router.get('/:id/room-templates', async (req: Request, res: Response) => {
  try {
    const templates = await prisma.roomTemplate.findMany({
      where: { modalityId: Number(req.params.id) },
      orderBy: { name: 'asc' },
    });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch room templates' });
  }
});

// GET /api/modalities/:id/standards
router.get('/:id/standards', async (req: Request, res: Response) => {
  try {
    const standards = await prisma.standard.findMany({
      where: { modalityId: Number(req.params.id) },
      orderBy: { key: 'asc' },
    });
    res.json(standards);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch standards' });
  }
});

export default router;
