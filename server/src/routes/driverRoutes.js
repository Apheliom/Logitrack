const express = require('express');
const router = express.Router();
const {
  getAllDrivers,
  updateDriverLocation,
  updateDriverStatus,
  getDriversAdminOverview,
  updateDriverAdminProfile
} = require('../controllers/driverController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, getAllDrivers);
router.get('/admin/overview', verifyToken, requireRole(['ADMIN']), getDriversAdminOverview);
router.put('/:driverId/profile', verifyToken, requireRole(['ADMIN']), updateDriverAdminProfile);
router.post('/:driverId/location', verifyToken, requireRole(['ADMIN', 'DRIVER']), updateDriverLocation);
router.patch('/:driverId/status', verifyToken, requireRole(['ADMIN', 'DRIVER']), updateDriverStatus);

module.exports = router;
