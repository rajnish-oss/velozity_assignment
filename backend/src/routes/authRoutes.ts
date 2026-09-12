import express from "express";
import * as auth from '../controllers/authController';
import { authMiddleware } from "../middlerware/authMiddleware";
const router = express.Router();

router.post('/login', auth.signin);
router.post('/refresh', auth.refresh);
router.post('/logout', auth.logout);

router.get('/me',authMiddleware,auth.currentUser)

export default router
