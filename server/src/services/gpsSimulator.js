const db = require('../config/db');

class GPSSimulator {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.io = null;

    // Repartidores simulados — Rutas de distribución en Cabudare Centro y Barquisimeto Este (Estado Lara)
    // Almacén Central de Despacho: Cabudare Centro  lat: 10.0305, lng: -69.2635
    this.simulatedDrivers = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Carlos Mendoza (Moto 01)',
        currentStep: 0,
        waypoints: [
          // Almacén Central — Cabudare Centro
          { lat: 10.0305, lng: -69.2635 },
          // Av. La Mata c/ Calle 9
          { lat: 10.0320, lng: -69.2660 },
          // Sector La Mata (punto intermedio)
          { lat: 10.0338, lng: -69.2672 },
          // Farmacia San Rafael — Av. La Mata c/ Calle 9
          { lat: 10.0350, lng: -69.2680 },
          // Punto intermedio hacia La Mora
          { lat: 10.0375, lng: -69.2700 },
          // Bodegón El Centro — Av. Intercomunal
          { lat: 10.0420, lng: -69.2740 },
          // Regreso al almacén vía Urb. Valle Hondo
          { lat: 10.0380, lng: -69.2700 },
          { lat: 10.0340, lng: -69.2660 }
        ]
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'Laura Gomez (Van 02)',
        currentStep: 0,
        waypoints: [
          // Almacén Central — Cabudare Centro
          { lat: 10.0305, lng: -69.2635 },
          // Urb. Valle Hondo intermedio
          { lat: 10.0370, lng: -69.2730 },
          // Centro Médico Valle Hondo — Calle 3
          { lat: 10.0460, lng: -69.2810 },
          // Punto intermedio hacia Barquisimeto
          { lat: 10.0520, lng: -69.2880 },
          // Comercial Los Cardones — Av. Los Leones
          { lat: 10.0620, lng: -69.2980 },
          // Regreso al almacén
          { lat: 10.0500, lng: -69.2850 },
          { lat: 10.0380, lng: -69.2730 }
        ]
      }
    ];
  }

  setSocketInstance(ioInstance) {
    this.io = ioInstance;
  }

  start(intervalMs = 3000) {
    if (this.isRunning) return { status: 'already_running' };

    this.isRunning = true;
    console.log('[GPS Simulator] Servicio de simulación GPS iniciado.');

    this.intervalId = setInterval(async () => {
      for (const driver of this.simulatedDrivers) {
        // Avanzar al siguiente paso del waypoint con interpolación suave
        driver.currentStep = (driver.currentStep + 1) % driver.waypoints.length;
        const targetPoint = driver.waypoints[driver.currentStep];

        // Añadir una pequeña variación estocástica (jitter) para simular tráfico real
        const jitterLat = (Math.random() - 0.5) * 0.0004;
        const jitterLng = (Math.random() - 0.5) * 0.0004;
        const simulatedLat = Number((targetPoint.lat + jitterLat).toFixed(7));
        const simulatedLng = Number((targetPoint.lng + jitterLng).toFixed(7));

        try {
          // 1. Actualizar DB
          await db.query(
            `UPDATE drivers
             SET current_lat = $1, current_lng = $2, last_ping = NOW(), status = 'ON_DELIVERY'
             WHERE id = $3`,
            [simulatedLat, simulatedLng, driver.id]
          );

          // 2. Transmitir evento a clientes conectados mediante WebSockets
          if (this.io) {
            this.io.emit('telemetry:driver_location', {
              driver_id: driver.id,
              driver_name: driver.name,
              lat: simulatedLat,
              lng: simulatedLng,
              last_ping: new Date().toISOString(),
              status: 'ON_DELIVERY'
            });
          }
        } catch (err) {
          console.error(`[GPS Simulator] Error al actualizar posición del conductor ${driver.id}:`, err.message);
        }
      }
    }, intervalMs);

    return { status: 'started', intervalMs };
  }

  stop() {
    if (!this.isRunning) return { status: 'not_running' };

    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    console.log('[GPS Simulator] Servicio de simulación GPS detenido.');

    return { status: 'stopped' };
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeDriversCount: this.simulatedDrivers.length
    };
  }
}

const gpsSimulatorInstance = new GPSSimulator();
module.exports = gpsSimulatorInstance;
