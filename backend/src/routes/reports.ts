import { Router, Request, Response } from 'express';
import { prisma } from '../index.js';

const router = Router();

// GET /api/reports - List all reports
router.get('/', async (_req: Request, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: { analysisResult: true },
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /api/reports/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: Number(req.params.id) },
      include: { analysisResult: true },
    });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// POST /api/reports - Create a report
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, summary, status, analysisResultId } = req.body;
    const report = await prisma.report.create({
      data: { title, summary, status, analysisResultId: analysisResultId || undefined },
    });
    res.status(201).json(report);
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to create report', message: err.message });
  }
});

// DELETE /api/reports/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.report.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
