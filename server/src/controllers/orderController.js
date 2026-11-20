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
    const { status, driver_id, unassigned, limit = 50 } = req.query;
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

    if (unassigned === 'true') {
      queryText += ` AND o.assigned_driver_id IS NULL AND o.status IN ('PENDING', 'ASSIGNED')`;
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
      assigned_driver_id,
      total_amount = 0.00,
      order_items = []
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
         (tracking_number, client_name, client_phone, delivery_address, dest_lat, dest_lng, priority, status, assigned_driver_id, delivery_notes, total_amount, order_items)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
          delivery_notes || null,
          Number(total_amount) || 0.00,
          JSON.stringify(order_items || [])
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
              o.signature_data, o.assigned_driver_id,
              o.client_confirmed_received, o.client_recipient_relationship,
              o.client_rating, o.client_feedback, o.client_feedback_at,
              d.id AS driver_id,
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

const claimOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener el ID de conductor del usuario autenticado
    let driverId = req.user.driver_id;
    if (!driverId) {
      const driverRes = await db.query('SELECT id FROM drivers WHERE user_id = $1', [req.user.id]);
      if (driverRes.rows.length > 0) {
        driverId = driverRes.rows[0].id;
      } else {
        return res.status(403).json({
          success: false,
          message: 'No se encontró un perfil de repartidor activo para esta cuenta.'
        });
      }
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const checkRes = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
      if (checkRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Orden no encontrada.' });
      }

      const order = checkRes.rows[0];
      if (order.assigned_driver_id && order.status !== 'PENDING') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Esta orden ya fue tomada por otro repartidor.'
        });
      }

      const updateRes = await client.query(
        `UPDATE orders
         SET assigned_driver_id = $1,
             status = 'ASSIGNED',
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [driverId, id]
      );

      const updated = updateRes.rows[0];

      await client.query(
        `INSERT INTO order_status_logs (order_id, previous_status, new_status, changed_by, notes)
         VALUES ($1, $2, 'ASSIGNED', $3, 'Orden reclamada voluntariamente por repartidor desde terminal móvil.')`,
        [id, order.status, req.user.id]
      );

      await client.query('COMMIT');

      if (req.app.get('io')) {
        req.app.get('io').emit('order:updated', updated);
      }

      return res.status(200).json({
        success: true,
        message: 'Orden tomada y asignada exitosamente a tu ruta.',
        order: updated
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[OrderController.claimOrder Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al tomar la orden.',
      error: err.message
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const userPhone = req.user.phone || '';
    const userName = req.user.full_name || '';

    // Buscar pedidos que coincidan con el cliente o pedidos recientes
    const result = await db.query(
      `SELECT o.*, 
              u.full_name AS driver_name,
              u.phone AS driver_phone,
              d.vehicle_type,
              d.license_plate,
              d.current_lat AS driver_lat,
              d.current_lng AS driver_lng
       FROM orders o
       LEFT JOIN drivers d ON o.assigned_driver_id = d.id
       LEFT JOIN users u ON d.user_id = u.id
       WHERE o.client_phone = $1 OR o.client_name ILIKE $2 OR o.created_at >= NOW() - INTERVAL '7 days'
       ORDER BY o.created_at DESC
       LIMIT 30`,
      [userPhone, `%${userName}%`]
    );

    return res.status(200).json({
      success: true,
      orders: result.rows
    });
  } catch (err) {
    console.error('[OrderController.getMyOrders Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al recuperar tus compras.',
      error: err.message
    });
  }
};

const getAnalyticsAndAudit = async (req, res) => {
  try {
    // 1. Métricas de órdenes y Satisfacción del Cliente (100% dinámicas de PostgreSQL)
    const ordersRes = await db.query(`
      SELECT 
        COUNT(*)::int AS total_orders,
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END)::int AS delivered_count,
        COUNT(CASE WHEN status = 'IN_TRANSIT' THEN 1 END)::int AS transit_count,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END)::int AS pending_count,
        COALESCE(ROUND(AVG(client_rating), 1), 0.0)::float AS avg_rating,
        COUNT(CASE WHEN client_confirmed_received = true THEN 1 END)::int AS confirmed_by_client_count,
        COALESCE(SUM(total_amount), 0.0)::float AS total_revenue,
        COALESCE(ROUND(AVG(CASE WHEN delivered_at IS NOT NULL THEN EXTRACT(EPOCH FROM (delivered_at - created_at))/60 END), 1), 0.0)::float AS avg_delivery_time_minutes
      FROM orders
    `);

    // 2. Bitácora de Auditoría real
    const auditRes = await db.query(`
      SELECT l.id, l.order_id, l.previous_status, l.new_status, l.notes, l.created_at,
             o.tracking_number, o.client_name, o.client_rating, o.client_confirmed_received,
             u.full_name AS user_name, u.role AS user_role
      FROM order_status_logs l
      LEFT JOIN orders o ON l.order_id = o.id
      LEFT JOIN users u ON l.changed_by = u.id
      ORDER BY l.created_at DESC
      LIMIT 40
    `);

    // 3. Ranking de Productos Más Vendidos (calculado desde order_items en orders)
    let topProducts = [];
    try {
      const productsRes = await db.query(`
        SELECT 
          item->>'name' AS name,
          COALESCE(item->>'category', 'General') AS category,
          SUM(COALESCE((item->>'quantity')::int, 1))::int AS units,
          ROUND(SUM(COALESCE((item->>'price')::numeric * COALESCE((item->>'quantity')::int, 1), 0.00)), 2)::float AS revenue
        FROM orders o,
        jsonb_array_elements(CASE WHEN jsonb_typeof(o.order_items) = 'array' THEN o.order_items ELSE '[]'::jsonb END) AS item
        GROUP BY item->>'name', item->>'category'
        ORDER BY units DESC, revenue DESC
        LIMIT 10
      `);
      topProducts = productsRes.rows;
    } catch (pe) {
      topProducts = [];
    }

    const stats = ordersRes.rows[0];
    const totalOrders = stats.total_orders || 0;
    const deliveredCount = stats.delivered_count || 0;
    const onTimeRatePercentage = totalOrders > 0
      ? Number(((deliveredCount / totalOrders) * 100).toFixed(1))
      : 0.0;

    return res.status(200).json({
      success: true,
      metrics: {
        totalOrders,
        deliveredCount,
        transitCount: stats.transit_count || 0,
        pendingCount: stats.pending_count || 0,
        totalRevenue: stats.total_revenue || 0.0,
        avgDeliveryTimeMinutes: stats.avg_delivery_time_minutes || 0.0,
        onTimeRatePercentage,
        avgRating: stats.avg_rating || 0.0,
        confirmedByClientCount: stats.confirmed_by_client_count || 0
      },
      topProducts,
      auditLogs: auditRes.rows
    });
  } catch (err) {
    console.error('[OrderController.getAnalyticsAndAudit Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar analítica y auditoría.',
      error: err.message
    });
  }
};

// Confirmación de entrega por parte del cliente, calificación y comentario
const submitOrderFeedback = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { confirmed_by_client, relationship, rating, feedback } = req.body;

    const parsedRating = rating ? parseInt(rating, 10) : null;
    if (parsedRating && (parsedRating < 1 || parsedRating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'La calificación debe ser un valor entero entre 1 y 5.'
      });
    }

    const result = await db.query(
      `UPDATE orders
       SET client_confirmed_received = $1,
           client_recipient_relationship = $2,
           client_rating = $3,
           client_feedback = $4,
           client_feedback_at = NOW(),
           updated_at = NOW()
       WHERE tracking_number = $5
       RETURNING id, tracking_number, status, client_confirmed_received, client_recipient_relationship, client_rating, client_feedback, client_feedback_at`,
      [
        confirmed_by_client !== undefined ? Boolean(confirmed_by_client) : true,
        relationship || 'SELF',
        parsedRating,
        feedback ? feedback.trim() : null,
        trackingNumber.trim()
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró la orden especificada.'
      });
    }

    const updatedOrder = result.rows[0];

    // Transmitir vía Socket.io para actualización instantánea
    if (req.app.get('io')) {
      req.app.get('io').to(`tracking_${updatedOrder.tracking_number}`).emit('tracking:order_update', updatedOrder);
      req.app.get('io').emit('order:feedback_submitted', updatedOrder);
    }

    return res.status(200).json({
      success: true,
      message: 'Retroalimentación y confirmación registrada exitosamente.',
      order: updatedOrder
    });
  } catch (err) {
    console.error('[OrderController.submitOrderFeedback Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar la confirmación del cliente.',
      error: err.message
    });
  }
};

module.exports = {
  getAllOrders,
  createOrder,
  updateOrderStatus,
  getOrderByTracking,
  claimOrder,
  getMyOrders,
  getAnalyticsAndAudit,
  submitOrderFeedback
};
