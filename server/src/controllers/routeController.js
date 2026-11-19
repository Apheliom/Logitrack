const db = require('../config/db');
const { optimizeStopsWith2Opt } = require('../services/routeOptimizer');
const gpsSimulator = require('../services/gpsSimulator');

const optimizeRouteForDriver = async (req, res) => {
  try {
    const { driver_id, order_ids } = req.body;

    if (!driver_id) {
      return res.status(400).json({
        success: false,
        message: 'El ID del repartidor (driver_id) es obligatorio.'
      });
    }

    // 1. Obtener ubicación actual del repartidor
    const driverRes = await db.query(
      'SELECT id, current_lat, current_lng, vehicle_type FROM drivers WHERE id = $1',
      [driver_id]
    );

    if (driverRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Repartidor no encontrado.' });
    }

    const driver = driverRes.rows[0];
    const startPoint = {
      lat: driver.current_lat || 10.0305,
      lng: driver.current_lng || -69.2635
    };

    // 2. Obtener órdenes a optimizar (toma las asignadas al conductor O las órdenes libres pendientes)
    let ordersQuery = 'SELECT id, tracking_number, client_name, delivery_address, dest_lat, dest_lng, priority, status FROM orders WHERE 1=1';
    let params = [];

    if (order_ids && Array.isArray(order_ids) && order_ids.length > 0) {
      params = [order_ids];
      ordersQuery += ' AND id = ANY($1)';
    } else {
      params = [driver_id];
      ordersQuery += " AND (assigned_driver_id = $1 OR assigned_driver_id IS NULL) AND status IN ('PENDING', 'ASSIGNED', 'IN_TRANSIT')";
    }

    const ordersRes = await db.query(ordersQuery, params);
    if (ordersRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay órdenes elegibles para generar una ruta optimizada.'
      });
    }

    // 3. Ejecutar algoritmo 2-opt
    const optimizationResult = optimizeStopsWith2Opt(ordersRes.rows, startPoint);

    // 4. Construir GeoJSON para visualización en el mapa del cliente
    const coordinates = [
      [Number(startPoint.lng), Number(startPoint.lat)],
      ...optimizationResult.optimizedStops.map(stop => [Number(stop.dest_lng), Number(stop.dest_lat)])
    ];

    const routeGeoJSON = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates
      },
      properties: {
        totalDistanceKm: optimizationResult.totalDistanceKm,
        stopsCount: optimizationResult.optimizedStops.length
      }
    };

    // Estimación de tiempo basada en velocidad media urbana de 25 km/h
    const estimatedMinutes = Math.round((optimizationResult.totalDistanceKm / 25) * 60) + (optimizationResult.optimizedStops.length * 5);

    // 5. Guardar en base de datos
    const savedRoute = await db.query(
      `INSERT INTO delivery_routes 
       (driver_id, route_name, ordered_order_ids, route_geojson, total_distance_km, estimated_duration_min, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
       RETURNING *`,
      [
        driver_id,
        `Ruta Optimizada - ${new Date().toLocaleDateString()}`,
        JSON.stringify(optimizationResult.optimizedStops.map(o => o.id)),
        JSON.stringify(routeGeoJSON),
        optimizationResult.totalDistanceKm,
        estimatedMinutes
      ]
    );

    // Actualizar estado de las órdenes a IN_TRANSIT
    const orderedIds = optimizationResult.optimizedStops.map(o => o.id);
    await db.query(
      `UPDATE orders 
       SET status = 'IN_TRANSIT', assigned_driver_id = $1, updated_at = NOW()
       WHERE id = ANY($2)`,
      [driver_id, orderedIds]
    );

    // Notificar por WebSockets
    if (req.app.get('io')) {
      req.app.get('io').emit('route:generated', {
        route: savedRoute.rows[0],
        stops: optimizationResult.optimizedStops
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Ruta optimizada calculada exitosamente mediante algoritmo 2-opt.',
      route: savedRoute.rows[0],
      stops: optimizationResult.optimizedStops,
      summary: {
        totalDistanceKm: optimizationResult.totalDistanceKm,
        estimatedDurationMinutes: estimatedMinutes,
        stopsCount: optimizationResult.optimizedStops.length
      }
    });
  } catch (err) {
    console.error('[RouteController.optimizeRouteForDriver Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al calcular la ruta optimizada.',
      error: err.message
    });
  }
};

const getActiveRoutes = async (req, res) => {
  try {
    const { driver_id } = req.query;
    let query = `
      SELECT r.*, u.full_name AS driver_name, d.vehicle_type, d.license_plate
      FROM delivery_routes r
      JOIN drivers d ON r.driver_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE r.status = 'ACTIVE'
    `;
    const params = [];

    if (driver_id) {
      params.push(driver_id);
      query += ` AND r.driver_id = $1`;
    }

    query += ' ORDER BY r.created_at DESC LIMIT 10';

    const result = await db.query(query, params);

    // Si aún no se ha guardado una ruta en BD, generar una ruta inicial visible con las órdenes existentes
    if (result.rows.length === 0) {
      const ordersRes = await db.query('SELECT dest_lat, dest_lng FROM orders ORDER BY created_at ASC LIMIT 6');
      if (ordersRes.rows.length > 0) {
        const depot = [10.0305, -69.2635];
        const coordinates = [
          [depot[1], depot[0]],
          ...ordersRes.rows.map(o => [Number(o.dest_lng), Number(o.dest_lat)])
        ];
        return res.status(200).json({
          success: true,
          routes: [{
            id: 'default-initial-route',
            route_name: 'Ruta Troncal de Distribución',
            total_distance_km: 12.4,
            estimated_duration_min: 32,
            route_geojson: {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates
              }
            }
          }]
        });
      }
    }

    return res.status(200).json({
      success: true,
      routes: result.rows
    });
  } catch (err) {
    console.error('[RouteController.getActiveRoutes Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las rutas activas.',
      error: err.message
    });
  }
};

const toggleSimulator = (req, res) => {
  const { action = 'toggle', intervalMs = 3000 } = req.body;
  const currentStatus = gpsSimulator.getStatus();

  if (action === 'start' || (action === 'toggle' && !currentStatus.isRunning)) {
    const result = gpsSimulator.start(intervalMs);
    return res.status(200).json({
      success: true,
      message: 'Simulador GPS activado con éxito.',
      simulator: gpsSimulator.getStatus()
    });
  } else {
    const result = gpsSimulator.stop();
    return res.status(200).json({
      success: true,
      message: 'Simulador GPS detenido.',
      simulator: gpsSimulator.getStatus()
    });
  }
};

const getSimulatorStatus = (req, res) => {
  return res.status(200).json({
    success: true,
    simulator: gpsSimulator.getStatus()
  });
};

module.exports = {
  optimizeRouteForDriver,
  getActiveRoutes,
  toggleSimulator,
  getSimulatorStatus
};
