import express from 'express';
import { dashboardMetrics } from '../controllers/dashboardController';
import { authMiddleware } from '../middlerware/authMiddleware';

const router = express.Router();
router.get('/metrics', authMiddleware, dashboardMetrics);
export default router;
