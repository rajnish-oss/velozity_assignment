import express from 'express';
import { listActivities } from '../controllers/activityController';
import { authMiddleware } from '../middlerware/authMiddleware';

const router = express.Router();
router.get('/', authMiddleware, listActivities);
export default router;
