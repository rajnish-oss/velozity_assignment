import express from 'express';
import * as project from '../controllers/projectController';
import { authMiddleware } from '../middlerware/authMiddleware';

const router = express.Router();

router.use(authMiddleware);
router.get('/', project.listProjects);
router.post('/', project.createProject);
router.get('/:id', project.getProject);
router.patch('/:id', project.updateProject);
router.delete('/:id', project.deleteProject);

export default router;
