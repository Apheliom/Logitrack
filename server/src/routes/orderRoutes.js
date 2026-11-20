const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  createOrder,
  updateOrderStatus,
  getOrderByTracking,
  claimOrder,
  getMyOrders,
  getAnalyticsAndAudit,
  submitOrderFeedback,
  getProductCatalogStats
} = require('../controllers/orderController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Endpoint público para el cliente final y catálogo (no requiere JWT)
router.get('/track/:trackingNumber', getOrderByTracking);
router.post('/track/:trackingNumber/feedback', submitOrderFeedback);
router.get('/store/product-stats', getProductCatalogStats);

// Endpoints protegidos
router.get('/my-orders', verifyToken, getMyOrders);
router.get('/analytics/overview', verifyToken, requireRole(['ADMIN']), getAnalyticsAndAudit);
router.patch('/:id/claim', verifyToken, requireRole(['ADMIN', 'DRIVER']), claimOrder);

router.get('/', verifyToken, getAllOrders);
router.post('/', verifyToken, createOrder); // Permitir creación a clientes y admin
router.patch('/:id/status', verifyToken, requireRole(['ADMIN', 'DRIVER']), updateOrderStatus);

module.exports = router;
