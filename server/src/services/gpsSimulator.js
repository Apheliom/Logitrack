const db = require('../config/db');

class GPSSimulator {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.io = null;

    // Repartidores simulados con rutas circulares alrededor del centro operativo
    this.simulatedDrivers = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Carlos Mendoza (Moto 01)',
        currentStep: 0,
        waypoints: [
          { lat: 4.6534, lng: -74.0836 },
          { lat: 4.6560, lng: -74.0750 },
          { lat: 4.6580, lng: -74.0590 },
          { lat: 4.6650, lng: -74.0580 },
          { lat: 4.6710, lng: -74.0560 },
          { lat: 4.6680, lng: -74.0670 },
          { lat: 4.6600, lng: -74.0780 }
        ]
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'Laura Gomez (Van 02)',
        currentStep: 0,
        waypoints: [
          { lat: 4.6480, lng: -74.0620 },
          { lat: 4.6460, lng: -74.0630 },
          { lat: 4.6410, lng: -74.0710 },
          { lat: 4.6450, lng: -74.0800 },
          { lat: 4.6520, lng: -74.0850 },
          { lat: 4.6500, lng: -74.0700 }
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
