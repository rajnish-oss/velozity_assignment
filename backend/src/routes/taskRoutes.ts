import express from 'express';
import * as task from '../controllers/taskController';
import { authMiddleware, requireRoles } from '../middlerware/authMiddleware';

const router = express.Router();

router.use(authMiddleware);
router.get('/', task.listTasks);
router.post('/', requireRoles('ADMIN', 'PROJECT_MANAGER'), task.createTask);
router.get('/:id', task.getTask);
router.patch('/:id', task.updateTaskStatus);
router.delete('/:id', requireRoles('ADMIN', 'PROJECT_MANAGER'), task.deleteTask);

export default router;
