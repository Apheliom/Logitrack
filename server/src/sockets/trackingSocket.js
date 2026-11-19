module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Nuevo cliente conectado: ${socket.id}`);

    // Suscribirse al tracking de una orden específica (para clientes en tiempo real)
    socket.on('subscribe:order_tracking', (trackingNumber) => {
      const room = `tracking_${trackingNumber}`;
      socket.join(room);
      console.log(`[Socket.io] Cliente ${socket.id} suscrito a sala de orden: ${room}`);
    });

    socket.on('unsubscribe:order_tracking', (trackingNumber) => {
      const room = `tracking_${trackingNumber}`;
      socket.leave(room);
      console.log(`[Socket.io] Cliente ${socket.id} desuscrito de sala de orden: ${room}`);
    });

    // Emisión directa de GPS desde el móvil del repartidor
    socket.on('driver:send_gps', (data) => {
      // data: { driver_id, lat, lng, timestamp }
      io.emit('telemetry:driver_location', {
        ...data,
        received_at: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Cliente desconectado: ${socket.id}`);
    });
  });
};
