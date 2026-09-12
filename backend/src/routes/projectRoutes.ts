import express from 'express';
import * as project from '../controllers/projectController';
import { authMiddleware, requireRoles } from '../middlerware/authMiddleware';

const router = express.Router();

router.use(authMiddleware);
router.get('/', project.listProjects);
router.post('/', requireRoles('ADMIN', 'PROJECT_MANAGER'), project.createProject);
router.get('/:id', project.getProject);
router.patch('/:id', requireRoles('ADMIN', 'PROJECT_MANAGER'), project.updateProject);
router.delete('/:id', requireRoles('ADMIN', 'PROJECT_MANAGER'), project.deleteProject);

export default router;
