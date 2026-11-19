import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle,
  Truck,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  ArrowRight,
  Package,
  Sparkles,
  Crosshair,
  Clock
} from 'lucide-react';

// Catálogo de productos con fotografías reales de alta calidad (CERO EMOJIS)
const PRODUCTS = [
  {
    id: 'prod-01',
    name: 'Teclado Mecánico Inalámbrico Pro',
    category: 'Tecnología',
    price: 49.00,
    desc: 'Switches silenciosos, conexión Bluetooth dual y batería de larga duración.',
    badge: 'Más Vendido',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'prod-02',
    name: 'Botiquín de Primeros Auxilios Estuche Rígido',
    category: 'Salud & Cuidado',
    price: 28.50,
    desc: '45 insumos médicos esenciales de respuesta rápida en estuche impermeable.',
    badge: 'Esencial',
    image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'prod-03',
    name: 'Café de Origen Tostado Artesanal 500g',
    category: 'Gourmet',
    price: 18.00,
    desc: 'Granos arábica seleccionados con tueste medio y notas de caramelo.',
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'prod-04',
    name: 'Auriculares Inalámbricos Noise Cancelling',
    category: 'Audio',
    price: 68.00,
    desc: 'Cancelación activa de ruido ambiental, micrófono de alta definición y 30h de autonomía.',
    badge: 'Oferta',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'prod-05',
    name: 'Kit de Herramientas de Precisión 24 en 1',
    category: 'Ferretería',
    price: 32.00,
    desc: 'Puntas imantadas de aleación S2 para electrónica, telefonía y mantenimiento.',
    badge: 'Recomendado',
    image: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: 'prod-06',
    name: 'Termo Térmico de Acero Inoxidable 1L',
    category: 'Accesorios',
    price: 24.00,
    desc: 'Aislamiento al vacío que conserva bebidas frías 24h y calientes 12h sin condensación.',
    badge: 'Eco',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=500&q=80'
  }
];

export const CustomerStorePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);
  const [error, setError] = useState(null);

  // Formulario del cliente con auto-completado si está autenticado
  const [customerData, setCustomerData] = useState({
    client_name: user?.full_name || '',
    client_phone: user?.phone || '+57 312 456 7890',
    delivery_address: 'Calle 72 # 11-45, Centro Financiero',
    dest_lat: '4.6580',
    dest_lng: '-74.0590',
    priority: 'NORMAL'
  });

  const addToCart = (productId) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: current - 1 };
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const prod = PRODUCTS.find((p) => p.id === id);
    return sum + (prod ? prod.price * qty : 0);
  }, 0);

  // Geolocation API para obtener coordenadas reales del dispositivo
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no admite geolocalización.');
      return;
    }
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCustomerData((prev) => ({
          ...prev,
          dest_lat: latitude.toFixed(6),
          dest_lng: longitude.toFixed(6),
          delivery_address: `Ubicación GPS Actual (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
        }));
        setLocatingGps(false);
      },
      (err) => {
        console.warn('GPS Error:', err.message);
        alert('No se pudo acceder al GPS. Usando ubicación predeterminada.');
        setLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const setPresetAddress = (address, lat, lng) => {
    setCustomerData((prev) => ({
      ...prev,
      delivery_address: address,
      dest_lat: lat.toString(),
      dest_lng: lng.toString()
    }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (totalItems === 0) {
      alert('Agrega al menos un producto a tu carrito de compras.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const summaryItems = Object.entries(cart).map(([id, qty]) => {
        const prod = PRODUCTS.find((p) => p.id === id);
        return `${qty}x ${prod?.name || id}`;
      }).join(', ');

      const payload = {
        client_name: customerData.client_name || 'Cliente Registrado',
        client_phone: customerData.client_phone,
        delivery_address: customerData.delivery_address,
        dest_lat: parseFloat(customerData.dest_lat),
        dest_lng: parseFloat(customerData.dest_lng),
        priority: customerData.priority,
        delivery_notes: `Pedido Express Tienda: ${summaryItems} (Total: $${totalPrice.toFixed(2)})`
      };

      const res = await api.post('/orders', payload);

      if (res.success && res.order) {
        // Redirige al cliente a su listado de compras o a la pantalla de tracking
        if (user && user.role === 'CLIENT') {
          navigate('/client/my-orders');
        } else {
          navigate(`/track/${res.order.tracking_number}`);
        }
      } else {
        throw new Error(res.message || 'Error al procesar el pedido.');
      }
    } catch (err) {
      setError(err.message || 'Error al enviar pedido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Header Store Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Tienda Express · Entrega Despachada en Minutos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Catálogo Oficial de Productos
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Ordena en línea con tu ubicación GPS y sigue en vivo a tu repartidor en el mapa.
          </p>
        </div>

        <button
          onClick={() => setCheckoutOpen(true)}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-sm transition self-start md:self-auto"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Ver Carrito ({totalItems})</span>
          {totalPrice > 0 && (
            <span className="bg-blue-800 px-2 py-0.5 rounded-lg text-xs font-mono font-bold">
              ${totalPrice.toFixed(2)}
            </span>
          )}
        </button>
      </div>

      {/* Products Grid with Real Photos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map((product) => {
          const qty = cart[product.id] || 0;

          return (
            <div
              key={product.id}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all group"
            >
              <div>
                {/* Product Image */}
                <div className="h-48 w-full overflow-hidden bg-slate-100 relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-700 border border-slate-200/80">
                    {product.category}
                  </div>
                  <div className="absolute top-3 right-3 bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                    {product.badge}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-slate-900 text-base leading-snug">{product.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{product.desc}</p>
                </div>
              </div>

              {/* Price & Add to Cart */}
              <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                <div className="pt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Precio</span>
                  <span className="text-xl font-bold text-slate-900 tabular-nums">
                    ${product.price.toFixed(2)}
                  </span>
                </div>

                <div className="pt-3">
                  {qty === 0 ? (
                    <button
                      onClick={() => addToCart(product.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl p-1">
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-700 hover:text-rose-600 transition shadow-2xs"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-slate-900 w-5 text-center tabular-nums">
                        {qty}
                      </span>
                      <button
                        onClick={() => addToCart(product.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Confirmar Pedido</h2>
                <p className="text-xs text-slate-500">Completa tu dirección con GPS para el despacho</p>
              </div>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              {/* Items Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex justify-between">
                  <span>Productos ({totalItems}):</span>
                  <span className="text-sm font-mono text-blue-600">${totalPrice.toFixed(2)} USD</span>
                </div>
                <div className="text-[11px] text-slate-500 max-h-20 overflow-y-auto space-y-1">
                  {Object.entries(cart).map(([id, qty]) => {
                    const prod = PRODUCTS.find((p) => p.id === id);
                    return (
                      <div key={id} className="flex justify-between">
                        <span>{qty}x {prod?.name}</span>
                        <span>${((prod?.price || 0) * qty).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tu Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ana Gómez"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    value={customerData.client_name}
                    onChange={(e) => setCustomerData({ ...customerData, client_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono Celular *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+57 312 000 0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    value={customerData.client_phone}
                    onChange={(e) => setCustomerData({ ...customerData, client_phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Delivery Address + GPS Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Dirección de Entrega *
                  </label>
                  {/* Botón Detectar mi GPS */}
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={locatingGps}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/80 transition"
                  >
                    <Crosshair className={`w-3.5 h-3.5 ${locatingGps ? 'animate-spin' : ''}`} />
                    <span>{locatingGps ? 'Obteniendo GPS...' : 'Usar mi ubicación GPS'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  value={customerData.delivery_address}
                  onChange={(e) => setCustomerData({ ...customerData, delivery_address: e.target.value })}
                />
              </div>

              {/* Presets */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Puntos de entrega rápidos:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPresetAddress('Calle 72 # 11-45, Centro Financiero', 4.6580, -74.0590)}
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition"
                  >
                    Calle 72
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetAddress('Carrera 15 # 93-60, Parque 93', 4.6750, -74.0550)}
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition"
                  >
                    Parque 93
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetAddress('Carrera 7 # 60-20, Chapinero', 4.6460, -74.0630)}
                    className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition"
                  >
                    Chapinero
                  </button>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prioridad del Despacho
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  value={customerData.priority}
                  onChange={(e) => setCustomerData({ ...customerData, priority: e.target.value })}
                >
                  <option value="NORMAL">Estándar (Despacho en ruta)</option>
                  <option value="URGENT">Urgente Express (Prioridad Máxima)</option>
                </select>
              </div>

              {/* Submit CTA */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Seguir Comprando
                </button>
                <button
                  type="submit"
                  disabled={loading || totalItems === 0}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  <span>{loading ? 'Confirmando...' : 'Confirmar Pedido y Rastrear'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
