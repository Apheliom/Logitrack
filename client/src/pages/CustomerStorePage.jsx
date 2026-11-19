import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
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
  Sparkles
} from 'lucide-react';

// Catálogo de productos simulados con iconografía limpia SVG (CERO EMOJIS)
const PRODUCTS = [
  {
    id: 'prod-01',
    name: 'Teclado y Mouse Inalámbrico Pro',
    category: 'Tecnología',
    price: 45.00,
    desc: 'Conectividad Bluetooth dual, teclas silenciosas y batería recargable.',
    badge: 'Más Vendido'
  },
  {
    id: 'prod-02',
    name: 'Botiquín de Primeros Auxilios Completo',
    category: 'Salud',
    price: 28.50,
    desc: 'Estuche rígido con 45 insumos esenciales según normativa laboral.',
    badge: 'Esencial'
  },
  {
    id: 'prod-03',
    name: 'Pack Café de Especialidad 500g',
    category: 'Gourmet',
    price: 18.00,
    desc: 'Tostión media artesanal con notas achocolatadas y empaque al vacío.',
    badge: 'Popular'
  },
  {
    id: 'prod-04',
    name: 'Auriculares con Cancelación Activa',
    category: 'Audio',
    price: 68.00,
    desc: 'Audio de alta fidelidad, micrófono HD para llamadas y 30h de batería.',
    badge: 'Oferta'
  },
  {
    id: 'prod-05',
    name: 'Kit de Herramientas de Precisión 24 en 1',
    category: 'Ferretería',
    price: 32.00,
    desc: 'Puntas imantadas de acero S2 para reparación de electrónica y hogar.',
    badge: 'Recomendado'
  },
  {
    id: 'prod-06',
    name: 'Termo de Acero Inoxidable 1L',
    category: 'Accesorios',
    price: 24.00,
    desc: 'Doble pared térmica con retención de temperatura fría 24h y caliente 12h.',
    badge: 'Eco'
  }
];

export const CustomerStorePage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Formulario de despacho del cliente
  const [customerData, setCustomerData] = useState({
    client_name: '',
    client_phone: '',
    delivery_address: 'Calle 72 # 11-45, Zona Financiera',
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
      // Resumen de productos ordenados para las notas de entrega
      const summaryItems = Object.entries(cart).map(([id, qty]) => {
        const prod = PRODUCTS.find((p) => p.id === id);
        return `${qty}x ${prod?.name || id}`;
      }).join(', ');

      const payload = {
        client_name: customerData.client_name,
        client_phone: customerData.client_phone,
        delivery_address: customerData.delivery_address,
        dest_lat: parseFloat(customerData.dest_lat),
        dest_lng: parseFloat(customerData.dest_lng),
        priority: customerData.priority,
        delivery_notes: `Pedido Express Tienda: ${summaryItems} (Total: $${totalPrice.toFixed(2)})`
      };

      const res = await api.post('/orders', payload);

      if (res.success && res.order) {
        // Redirigir de inmediato al rastreo en vivo de la orden creada
        navigate(`/track/${res.order.tracking_number}`);
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

      {/* Hero Store Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Tienda de Clientes · Despacho Express en 30 Minutos</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Catálogo Online & Entregas Inteligentes
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            Selecciona tus productos, confirma tu ubicación de entrega y monitorea en tiempo real el desplazamiento del repartidor en el mapa.
          </p>
        </div>

        {/* Floating Cart Button in Header */}
        <div className="mt-5 sm:mt-0 sm:absolute sm:top-10 sm:right-10">
          <button
            onClick={() => setCheckoutOpen(true)}
            className="flex items-center gap-2.5 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-sm shadow-sm transition"
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
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map((product) => {
          const qty = cart[product.id] || 0;

          return (
            <div
              key={product.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                    {product.category}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                    {product.badge}
                  </span>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Package className="w-6 h-6" strokeWidth={1.75} />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{product.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.desc}</p>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Precio Unitario</span>
                  <span className="text-xl font-bold text-slate-900 tabular-nums">
                    ${product.price.toFixed(2)}
                  </span>
                </div>

                {qty === 0 ? (
                  <button
                    onClick={() => addToCart(product.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition"
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
          );
        })}
      </div>

      {/* Checkout Modal / Drawer */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">Finalizar Compra</h2>
                <p className="text-xs text-slate-500">Ingresa tus datos para generar la orden y el seguimiento</p>
              </div>
              <button
                onClick={() => setCheckoutOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1"
              >
                Cerrar
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePlaceOrder} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              {/* Order Items Summary */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-semibold text-slate-700 flex justify-between">
                  <span>Productos en tu orden ({totalItems}):</span>
                  <span className="font-bold text-slate-900">${totalPrice.toFixed(2)} USD</span>
                </div>
                <div className="text-[11px] text-slate-500 max-h-24 overflow-y-auto space-y-1">
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

              {/* Customer Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tu Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ana Morales"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                    placeholder="+57 310 000 0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={customerData.client_phone}
                    onChange={(e) => setCustomerData({ ...customerData, client_phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dirección de Entrega *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={customerData.delivery_address}
                  onChange={(e) => setCustomerData({ ...customerData, delivery_address: e.target.value })}
                />
              </div>

              {/* Presets Rápidos */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Ubicaciones de entrega frecuentes:
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
                  Modalidad de Entrega
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={customerData.priority}
                  onChange={(e) => setCustomerData({ ...customerData, priority: e.target.value })}
                >
                  <option value="NORMAL">Estándar (Despacho del día)</option>
                  <option value="URGENT">Urgente Express (Prioridad Máxima)</option>
                </select>
              </div>

              {/* Footer CTA */}
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
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
                >
                  <span>{loading ? 'Confirmando Pedido...' : 'Confirmar y Rastrear'}</span>
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
