const express = require('express');
const router = express.Router();
const {
  optimizeRouteForDriver,
  getActiveRoutes,
  toggleSimulator,
  getSimulatorStatus
} = require('../controllers/routeController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/optimize', verifyToken, requireRole(['ADMIN']), optimizeRouteForDriver);
router.get('/active', verifyToken, getActiveRoutes);
router.post('/simulator/toggle', verifyToken, requireRole(['ADMIN']), toggleSimulator);
router.get('/simulator/status', verifyToken, requireRole(['ADMIN']), getSimulatorStatus);

module.exports = router;
