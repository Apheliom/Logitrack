const db = require('../config/db');

const getAllDrivers = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT d.id, d.user_id, d.vehicle_type, d.license_plate, d.current_lat, d.current_lng,
              d.is_available, d.status, d.last_ping,
              u.full_name, u.email, u.phone
       FROM drivers d
       INNER JOIN users u ON d.user_id = u.id
       ORDER BY d.is_available DESC, u.full_name ASC`
    );

    return res.status(200).json({
      success: true,
      drivers: result.rows
    });
  } catch (err) {
    console.error('[DriverController.getAllDrivers Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de repartidores.',
      error: err.message
    });
  }
};

const updateDriverLocation = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Coordenadas latitud y longitud son requeridas.'
      });
    }

    const result = await db.query(
      `UPDATE drivers
       SET current_lat = $1,
           current_lng = $2,
           last_ping = NOW(),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, current_lat, current_lng, last_ping, status, vehicle_type`,
      [lat, lng, driverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repartidor no encontrado.'
      });
    }

    const updatedDriver = result.rows[0];

    // Emitir telemetría vía Socket.io para que el mapa del despachador y el cliente se actualicen en vivo
    if (req.app.get('io')) {
      req.app.get('io').emit('telemetry:driver_location', {
        driver_id: updatedDriver.id,
        lat: Number(updatedDriver.current_lat),
        lng: Number(updatedDriver.current_lng),
        last_ping: updatedDriver.last_ping,
        status: updatedDriver.status
      });
    }

    return res.status(200).json({
      success: true,
      driver: updatedDriver
    });
  } catch (err) {
    console.error('[DriverController.updateDriverLocation Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar las coordenadas GPS.',
      error: err.message
    });
  }
};

const updateDriverStatus = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status, is_available } = req.body;

    const result = await db.query(
      `UPDATE drivers
       SET status = COALESCE($1, status),
           is_available = COALESCE($2, is_available),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status || null, is_available !== undefined ? is_available : null, driverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repartidor no encontrado.'
      });
    }

    return res.status(200).json({
      success: true,
      driver: result.rows[0]
    });
  } catch (err) {
    console.error('[DriverController.updateDriverStatus Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del repartidor.',
      error: err.message
    });
  }
};

const getDriversAdminOverview = async (req, res) => {
  try {
    const driversResult = await db.query(
      `SELECT d.id, d.user_id, d.vehicle_type, d.license_plate, d.current_lat, d.current_lng,
              d.is_available, d.status, d.last_ping,
              u.full_name, u.email, u.phone,
              COALESCE(COUNT(CASE WHEN o.status IN ('PENDING', 'ASSIGNED', 'IN_TRANSIT') THEN 1 END), 0)::integer AS active_orders_count,
              COALESCE(COUNT(CASE WHEN o.status = 'DELIVERED' THEN 1 END), 0)::integer AS delivered_orders_count,
              COALESCE(COUNT(o.id), 0)::integer AS total_orders_count,
              COALESCE(ROUND(AVG(o.client_rating)::numeric, 1), 0.0) AS avg_rating,
              COALESCE(COUNT(o.client_rating), 0)::integer AS total_reviews_count
       FROM drivers d
       INNER JOIN users u ON d.user_id = u.id
       LEFT JOIN orders o ON o.driver_id = d.id
       GROUP BY d.id, u.id
       ORDER BY d.is_available DESC, u.full_name ASC`
    );

    const reviewsResult = await db.query(
      `SELECT o.id, o.tracking_number, o.driver_id, o.client_rating, o.client_feedback,
              o.recipient_name, o.created_at, o.updated_at,
              u.full_name AS driver_name
       FROM orders o
       INNER JOIN drivers d ON o.driver_id = d.id
       INNER JOIN users u ON d.user_id = u.id
       WHERE o.client_rating IS NOT NULL OR (o.client_feedback IS NOT NULL AND o.client_feedback <> '')
       ORDER BY o.updated_at DESC
       LIMIT 50`
    );

    return res.status(200).json({
      success: true,
      drivers: driversResult.rows,
      reviews: reviewsResult.rows
    });
  } catch (err) {
    console.error('[DriverController.getDriversAdminOverview Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar métricas de conductores.',
      error: err.message
    });
  }
};

const updateDriverAdminProfile = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { full_name, phone, vehicle_type, license_plate, status, is_available } = req.body;

    const driverCheck = await db.query(`SELECT id, user_id FROM drivers WHERE id = $1`, [driverId]);
    if (driverCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Conductor no encontrado.' });
    }
    const userId = driverCheck.rows[0].user_id;

    if (full_name !== undefined || phone !== undefined) {
      await db.query(
        `UPDATE users
         SET full_name = COALESCE($1, full_name),
             phone = COALESCE($2, phone),
             updated_at = NOW()
         WHERE id = $3`,
        [full_name || null, phone || null, userId]
      );
    }

    const updatedDriver = await db.query(
      `UPDATE drivers
       SET vehicle_type = COALESCE($1, vehicle_type),
           license_plate = COALESCE($2, license_plate),
           status = COALESCE($3, status),
           is_available = COALESCE($4, is_available),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [vehicle_type || null, license_plate || null, status || null, is_available !== undefined ? is_available : null, driverId]
    );

    return res.status(200).json({
      success: true,
      message: 'Perfil de conductor actualizado con éxito.',
      driver: updatedDriver.rows[0]
    });
  } catch (err) {
    console.error('[DriverController.updateDriverAdminProfile Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil de conductor.',
      error: err.message
    });
  }
};

module.exports = {
  getAllDrivers,
  updateDriverLocation,
  updateDriverStatus,
  getDriversAdminOverview,
  updateDriverAdminProfile
};
