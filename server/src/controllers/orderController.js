const db = require('../config/db');

// Generador de número de tracking único
const generateTrackingNumber = () => {
  const prefix = 'TRK';
  const year = new Date().getFullYear();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${randomPart}`;
};

const getAllOrders = async (req, res) => {
  try {
    const { status, driver_id, limit = 50 } = req.query;
    let queryText = `
      SELECT o.*, 
             u.full_name AS driver_name,
             u.phone AS driver_phone,
             d.vehicle_type,
             d.license_plate,
             d.current_lat AS driver_lat,
             d.current_lng AS driver_lng
      FROM orders o
      LEFT JOIN drivers d ON o.assigned_driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      queryText += ` AND o.status = $${params.length}`;
    }

    if (driver_id) {
      params.push(driver_id);
      queryText += ` AND o.assigned_driver_id = $${params.length}`;
    }

    queryText += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit, 10));

    const result = await db.query(queryText, params);
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      orders: result.rows
    });
  } catch (err) {
    console.error('[OrderController.getAllOrders Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al listar las órdenes de entrega.',
      error: err.message
    });
  }
};

const createOrder = async (req, res) => {
  try {
    const {
      client_name,
      client_phone,
      delivery_address,
      dest_lat,
      dest_lng,
      priority = 'NORMAL',
      delivery_notes,
      assigned_driver_id
    } = req.body;

    if (!client_name || !delivery_address || dest_lat === undefined || dest_lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de cliente, dirección de entrega y coordenadas (lat, lng) son obligatorias.'
      });
    }

    const trackingNumber = generateTrackingNumber();
    const initialStatus = assigned_driver_id ? 'ASSIGNED' : 'PENDING';

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO orders 
         (tracking_number, client_name, client_phone, delivery_address, dest_lat, dest_lng, priority, status, assigned_driver_id, delivery_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          trackingNumber,
          client_name,
          client_phone || null,
          delivery_address,
          dest_lat,
          dest_lng,
          priority,
          initialStatus,
          assigned_driver_id || null,
          delivery_notes || null
        ]
      );

      const newOrder = result.rows[0];

      // Registrar auditoría de creación
      await client.query(
        `INSERT INTO order_status_logs (order_id, previous_status, new_status, changed_by, notes)
         VALUES ($1, NULL, $2, $3, $4)`,
        [newOrder.id, initialStatus, req.user ? req.user.id : null, 'Orden creada en el sistema.']
      );

      await client.query('COMMIT');

      // Notificar vía Socket.io si la instancia global está disponible
      if (req.app.get('io')) {
        req.app.get('io').emit('order:created', newOrder);
      }

      return res.status(201).json({
        success: true,
        message: 'Orden creada exitosamente.',
        order: newOrder
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[OrderController.createOrder Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar la orden de entrega.',
      error: err.message
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, signature_data, delivery_notes, assigned_driver_id } = req.body;

    const validStatuses = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Opciones válidas: ${validStatuses.join(', ')}`
      });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener estado anterior
      const currentOrderResult = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
      if (currentOrderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Orden no encontrada.' });
      }

      const currentOrder = currentOrderResult.rows[0];
      const previousStatus = currentOrder.status;
      const newStatus = status || previousStatus;

      let deliveredAt = currentOrder.delivered_at;
      if (newStatus === 'DELIVERED' && !deliveredAt) {
        deliveredAt = new Date();
      }

      const updateResult = await client.query(
        `UPDATE orders
         SET status = $1,
             signature_data = COALESCE($2, signature_data),
             delivery_notes = COALESCE($3, delivery_notes),
             assigned_driver_id = COALESCE($4, assigned_driver_id),
             delivered_at = $5,
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [
          newStatus,
          signature_data || null,
          delivery_notes || null,
          assigned_driver_id || currentOrder.assigned_driver_id,
          deliveredAt,
          id
        ]
      );

      const updatedOrder = updateResult.rows[0];

      // Registrar auditoría si hubo cambio de estado
      if (previousStatus !== newStatus) {
        await client.query(
          `INSERT INTO order_status_logs (order_id, previous_status, new_status, changed_by, notes)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, previousStatus, newStatus, req.user ? req.user.id : null, delivery_notes || `Cambio de estado a ${newStatus}`]
        );
      }

      await client.query('COMMIT');

      // Notificar vía Socket.io
      if (req.app.get('io')) {
        req.app.get('io').emit('order:updated', updatedOrder);
        req.app.get('io').to(`tracking_${updatedOrder.tracking_number}`).emit('tracking:order_update', updatedOrder);
      }

      return res.status(200).json({
        success: true,
        message: 'Estado de la orden actualizado exitosamente.',
        order: updatedOrder
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[OrderController.updateOrderStatus Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado de la orden.',
      error: err.message
    });
  }
};

const getOrderByTracking = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const result = await db.query(
      `SELECT o.id, o.tracking_number, o.client_name, o.delivery_address,
              o.dest_lat, o.dest_lng, o.priority, o.status, o.created_at, o.delivered_at,
              u.full_name AS driver_name,
              u.phone AS driver_phone,
              d.vehicle_type,
              d.license_plate,
              d.current_lat AS driver_lat,
              d.current_lng AS driver_lng,
              d.last_ping AS driver_last_ping
       FROM orders o
       LEFT JOIN drivers d ON o.assigned_driver_id = d.id
       LEFT JOIN users u ON d.user_id = u.id
       WHERE o.tracking_number = $1`,
      [trackingNumber.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró ningún paquete asociado a este código de rastreo.'
      });
    }

    const order = result.rows[0];

    // Obtener historial de auditoría
    const logsResult = await db.query(
      `SELECT previous_status, new_status, notes, created_at
       FROM order_status_logs
       WHERE order_id = $1
       ORDER BY created_at ASC`,
      [order.id]
    );

    return res.status(200).json({
      success: true,
      order,
      history: logsResult.rows
    });
  } catch (err) {
    console.error('[OrderController.getOrderByTracking Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar la orden de entrega.',
      error: err.message
    });
  }
};

module.exports = {
  getAllOrders,
  createOrder,
  updateOrderStatus,
  getOrderByTracking
};
