import express from 'express';
import { register, login, getMe, deleteMe } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.delete('/me', authMiddleware, deleteMe);

export default router;

