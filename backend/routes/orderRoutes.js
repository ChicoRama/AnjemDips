import express from 'express';
import {
  createOrder,
  getOrders,
  acceptOrder,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/orderController.js';
import {
  getOrderOffers,
  createOrderOffer,
  acceptOrderOffer,
  rejectOrderOffer,
} from '../controllers/offerController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getOrders);
router.patch('/:id/accept', acceptOrder);
router.patch('/:id/status', updateOrderStatus);
router.delete('/:id', deleteOrder);

// Negosiasi & Tawaran Harga
router.get('/:id/offers', getOrderOffers);
router.post('/:id/offers', createOrderOffer);
router.patch('/:id/offers/:offerId/accept', acceptOrderOffer);
router.patch('/:id/offers/:offerId/reject', rejectOrderOffer);

export default router;


