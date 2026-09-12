import express from 'express';
import * as notification from '../controllers/notificationController';
import { authMiddleware } from '../middlerware/authMiddleware';

const router = express.Router();
router.use(authMiddleware);
router.get('/', notification.listNotifications);
router.patch('/read', notification.markNotificationsRead);
export default router;
