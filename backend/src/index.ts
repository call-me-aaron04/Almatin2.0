import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import modalitiesRouter from './routes/modalities.js';
import analysisRouter from './routes/analysis.js';
import reportsRouter from './routes/reports.js';
import materialsRouter from './routes/materials.js';
import searchRouter from './routes/search.js';
import exportRouter from './routes/export.js';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/modalities', modalitiesRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/search', searchRouter);
app.use('/api/export', exportRouter);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  SHIELDPLAN AI API Server Running`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  Docs: http://localhost:${PORT}/api/health`);
  console.log(`========================================`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
