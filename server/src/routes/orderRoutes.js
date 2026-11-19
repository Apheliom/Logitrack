const express = require('express');
const router = express.Router();
const { getAllOrders, createOrder, updateOrderStatus, getOrderByTracking } = require('../controllers/orderController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Endpoint público para el cliente final (no requiere JWT)
router.get('/track/:trackingNumber', getOrderByTracking);

// Endpoints protegidos
router.get('/', verifyToken, getAllOrders);
router.post('/', verifyToken, requireRole(['ADMIN']), createOrder);
router.patch('/:id/status', verifyToken, requireRole(['ADMIN', 'DRIVER']), updateOrderStatus);

module.exports = router;
