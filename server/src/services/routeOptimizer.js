/**
 * Motor de Optimización de Rutas (2-opt TSP Heuristic & Haversine Distance)
 * Diseñado para resolver el Problema del Repartidor (TSP) en logística de última milla.
 */

// Fórmula de Haversine para calcular distancia en kilómetros entre dos coordenadas
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calcular la longitud total de una ruta ordenada
function calculateTotalRouteDistance(route, startPoint) {
  let total = 0;
  let current = startPoint;

  for (let i = 0; i < route.length; i++) {
    total += calculateHaversineDistance(
      Number(current.lat),
      Number(current.lng),
      Number(route[i].dest_lat),
      Number(route[i].dest_lng)
    );
    current = {
      lat: route[i].dest_lat,
      lng: route[i].dest_lng
    };
  }
  return total;
}

// Algoritmo Heurístico 2-opt para optimización de ruta
function optimizeStopsWith2Opt(stops, startPoint, maxIterations = 50) {
  if (stops.length <= 2) {
    return {
      optimizedStops: stops,
      totalDistanceKm: calculateTotalRouteDistance(stops, startPoint)
    };
  }

  // 1. Paso inicial: Vecino más cercano (Nearest Neighbor)
  const unvisited = [...stops];
  const initialRoute = [];
  let currentPoint = startPoint;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateHaversineDistance(
        Number(currentPoint.lat),
        Number(currentPoint.lng),
        Number(unvisited[i].dest_lat),
        Number(unvisited[i].dest_lng)
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    const nextStop = unvisited.splice(nearestIdx, 1)[0];
    initialRoute.push(nextStop);
    currentPoint = { lat: nextStop.dest_lat, lng: nextStop.dest_lng };
  }

  // 2. Refinamiento mediante 2-opt swapping
  let bestRoute = [...initialRoute];
  let bestDistance = calculateTotalRouteDistance(bestRoute, startPoint);
  let improved = true;
  let iteration = 0;

  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;

    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let k = i + 1; k < bestRoute.length; k++) {
        // Invertir segmento entre i y k
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, k + 1).reverse(),
          ...bestRoute.slice(k + 1)
        ];

        const newDistance = calculateTotalRouteDistance(newRoute, startPoint);

        if (newDistance < bestDistance - 0.001) {
          bestDistance = newDistance;
          bestRoute = newRoute;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return {
    optimizedStops: bestRoute,
    totalDistanceKm: Number(bestDistance.toFixed(2))
  };
}

module.exports = {
  calculateHaversineDistance,
  optimizeStopsWith2Opt
};
