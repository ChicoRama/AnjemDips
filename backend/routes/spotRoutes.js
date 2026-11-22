import express from 'express';
import { getAllSpots } from '../controllers/spotController.js';

const router = express.Router();

router.get('/', getAllSpots);

export default router;

