import express from 'express';
import * as task from '../controllers/taskController';
import { authMiddleware } from '../middlerware/authMiddleware';

const router = express.Router();

router.use(authMiddleware);
router.get('/', task.listTasks);
router.post('/', task.createTask);
router.get('/:id', task.getTask);
router.patch('/:id', task.updateTaskStatus);
router.delete('/:id', task.deleteTask);

export default router;
