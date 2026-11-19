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

module.exports = {
  getAllDrivers,
  updateDriverLocation,
  updateDriverStatus
};
