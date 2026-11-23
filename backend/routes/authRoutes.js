import express from 'express';
import { register, login, getMe, deleteMe } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import loginRateLimit from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', loginRateLimit, login);
router.get('/me', authMiddleware, getMe);
router.delete('/me', authMiddleware, deleteMe);

export default router;