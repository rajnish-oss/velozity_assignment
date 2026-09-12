import express from 'express';
import { listUsers } from '../controllers/userController';
import { authMiddleware } from '../middlerware/authMiddleware';

const router = express.Router();
router.get('/', authMiddleware, listUsers);

export default router;
