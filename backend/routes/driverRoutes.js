import express from 'express';
import {
  updateDriverStatus,
  updateDriverVehicle,
} from '../controllers/driverController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.patch('/status', updateDriverStatus);
router.patch('/vehicle', updateDriverVehicle);

export default router;

