import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';

const router = Router();

// GET /api/search/machines/:id - Get single machine by primary key
router.get('/machines/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid machine ID' });
    }
    const machine = await prisma.machine.findUnique({
      where: { id },
      include: {
        manufacturer: {
          include: { modality: true },
        },
      },
    });
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.json(machine);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch machine' });
  }
});

// GET /api/search/machines?q=searchTerm&modalityId=1
router.get('/machines', async (req: Request, res: Response) => {
  try {
    const { q, modalityId } = req.query;
    
    if (!q || String(q).length < 2) {
      return res.json([]);
    }

    const query = String(q);

    const where: any = {
      OR: [
        { model: { contains: query } },
        { manufacturer: { name: { contains: query } } },
        { type: { contains: query } },
      ],
    };

    if (modalityId) {
      where.manufacturer = {
        ...(where.manufacturer || {}),
        modalityId: Number(modalityId),
      };
    }

    const machines = await prisma.machine.findMany({
      where,
      include: {
        manufacturer: {
          include: { modality: true },
        },
      },
      take: 20,
      orderBy: { model: 'asc' },
    });

    res.json(machines);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/search/products - Combined search across modalities, manufacturers, machines
router.get('/products', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || String(q).length < 2) {
      return res.json({ modalities: [], manufacturers: [], machines: [] });
    }

    const query = String(q);

    const [modalities, manufacturers, machines] = await Promise.all([
      prisma.modality.findMany({
        where: { OR: [{ name: { contains: query } }, { description: { contains: query } }] },
        take: 5,
      }),
      prisma.manufacturer.findMany({
        where: { name: { contains: query } },
        include: { modality: true },
        take: 10,
      }),
      prisma.machine.findMany({
        where: {
          OR: [
            { model: { contains: query } },
            { type: { contains: query } },
          ],
        },
        include: {
          manufacturer: { include: { modality: true } },
        },
        take: 10,
      }),
    ]);

    res.json({ modalities, manufacturers, machines });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
