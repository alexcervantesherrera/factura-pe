import { useState, useRef, useEffect, useCallback } from 'react'
import api from '../api'

// ── Cart item ────────────────────────────────────────────────────────────────
function CartItem({ item, onQty, onRemove }) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.nombre}</p>
        <p className="text-xs text-gray-500">S/ {item.precio.toFixed(2)} c/u</p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onQty(item, item.qty - 1)}
          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-lg font-bold flex items-center justify-center">−</button>
        <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
        <button onClick={() => onQty(item, item.qty + 1)}
          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-lg font-bold flex items-center justify-center">+</button>
      </div>
      <div className="text-right w-16">
        <p className="text-sm font-semibold">S/ {(item.precio * item.qty).toFixed(2)}</p>
        <button onClick={() => onRemove(item)} className="text-xs text-red-400 hover:text-red-600">quitar</button>
      </div>
    </div>
  )
}

// ── Scanner modal ────────────────────────────────────────────────────────────
function ScannerModal({ onScan, onClose }) {
  useEffect(() => {
    let scanner = null
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      scanner = new Html5Qrcode('qr-reader')
      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        code => { scanner.stop(); onScan(code) },
        () => {}
      ).catch(() => {})
    })
    return () => { if (scanner) scanner.stop().catch(() => {}) }
  }, [onScan])

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Escanear código de barras</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div id="qr-reader" className="w-full"></div>
        <p className="text-center text-xs text-gray-500 p-3">Apunta la cámara al código de barras</p>
      </div>
    </div>
  )
}

// ── Quick-add modal (shown when product not in catalog) ──────────────────────
function QuickAddModal({ sugerido, onSave, onClose, saving }) {
  const [nombre,  setNombre]  = useState(sugerido?.nombre  || '')
  const [precio,  setPrecio]  = useState('')
  const precioRef = useRef(null)

  useEffect(() => { precioRef.current?.focus() }, [])

  async function handleSave() {
    if (!nombre.trim() || !precio) return
    await onSave({ nombre, precio: parseFloat(precio), codigoBarras: sugerido?.codigoBarras, imagenUrl: sugerido?.imagen, categoria: sugerido?.categoria })
  }

  function handleKey(e) { if (e.key === 'Enter') handleSave() }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-sm p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {sugerido?.imagen && (
            <img src={sugerido.imagen} alt="" className="w-14 h-14 rounded-xl object-cover" />
          )}
          <div className="flex-1">
            <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
              {sugerido?.nombre ? '✓ Producto identificado' : 'Producto nuevo'}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {sugerido?.codigoBarras || 'Sin código'}{sugerido?.categoria ? ` · ${sugerido.categoria}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 text-xl mt-0.5">✕</button>
        </div>

        {/* Name */}
        <div>
          <label className="label">Nombre del producto</label>
          <input className="input" value={nombre} onChange={e => setNombre(e.target.value)} onKeyDown={handleKey} />
        </div>

        {/* Price — the only required field */}
        <div>
          <label className="label">Precio de venta (S/) *</label>
          <input
            ref={precioRef}
            className="input text-2xl font-bold"
            type="number" step="0.10" min="0"
            placeholder="0.00"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            onKeyDown={handleKey}
          />
          <p className="text-xs text-gray-400 mt-1">Presiona Enter para agregar al carrito</p>
        </div>

        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-success flex-1 text-base py-3" onClick={handleSave}
            disabled={saving || !nombre.trim() || !precio}>
            {saving ? '...' : '✓ Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Payment modal ────────────────────────────────────────────────────────────
function PayModal({ total, onPay, onClose, loading }) {
  const [tipoComp, setTipoComp] = useState('03')
  const [efectivo, setEfectivo] = useState(Math.ceil(total).toString())
  const vuelto = Math.max(0, parseFloat(efectivo || 0) - total)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Cobrar venta</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">Total a cobrar</p>
          <p className="text-4xl font-bold text-green-700">S/ {total.toFixed(2)}</p>
        </div>
        <div>
          <label className="label">Comprobante</label>
          <div className="grid grid-cols-2 gap-2">
            {[['03','📄 Boleta'],['01','🧾 Factura']].map(([v,l]) => (
              <button key={v} onClick={() => setTipoComp(v)}
                className={`py-2 rounded-lg text-sm font-medium border ${tipoComp===v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Efectivo recibido</label>
          <input className="input text-xl font-semibold" type="number" step="0.10"
            value={efectivo} onChange={e => setEfectivo(e.target.value)} />
          {vuelto > 0 && <p className="text-sm text-blue-600 mt-1 font-medium">Vuelto: S/ {vuelto.toFixed(2)}</p>}
        </div>
        <button className="btn-success w-full text-lg py-3" onClick={() => onPay(tipoComp)} disabled={loading}>
          {loading ? 'Procesando...' : '✓ Confirmar cobro'}
        </button>
      </div>
    </div>
  )
}

// ── Main Caja ────────────────────────────────────────────────────────────────
export default function Caja() {
  const [cart, setCart]           = useState([])
  const [search, setSearch]       = useState('')
  const [results, setResults]     = useState([])
  const [scanning, setScanning]   = useState(false)
  const [lookingUp, setLookingUp] = useState(false)  // spinner while barcode API resolves
  const [quickAdd, setQuickAdd]   = useState(null)   // { nombre?, codigoBarras?, imagen?, categoria? }
  const [quickSaving, setQuickSaving] = useState(false)
  const [paying, setPaying]       = useState(false)
  const [payLoading, setPayLoading] = useState(false)
  const [lastVenta, setLastVenta] = useState(null)
  const [msg, setMsg]             = useState(null)
  const searchRef = useRef(null)

  // Debounced product search
  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/productos', { params: { q: search } })
        setResults(data)
      } catch { setResults([]) }
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  function addToCart(prod) {
    setCart(c => {
      const idx = c.findIndex(x => x.id === prod.id)
      if (idx >= 0) {
        const next = [...c]; next[idx] = { ...next[idx], qty: next[idx].qty + 1 }; return next
      }
      return [...c, { ...prod, qty: 1 }]
    })
    setSearch(''); setResults([])
    searchRef.current?.focus()
  }

  function setQty(item, qty) {
    if (qty <= 0) return removeFromCart(item)
    setCart(c => c.map(x => x.id === item.id ? { ...x, qty } : x))
  }

  function removeFromCart(item) { setCart(c => c.filter(x => x.id !== item.id)) }

  // ── Barcode scanned ──────────────────────────────────────────────────────
  const handleScan = useCallback(async (code) => {
    setScanning(false)
    setLookingUp(true)
    try {
      const { data } = await api.get(`/productos/barcode/${code}`)

      if (data.found && data.source === 'local') {
        addToCart({ id: data.producto.id, nombre: data.producto.nombre, precio: data.producto.precio, aplicaIgv: data.producto.aplicaIgv })
        return
      }
      setQuickAdd(
        data.found && data.sugerido
          ? { nombre: data.sugerido.nombre, codigoBarras: code, imagen: data.sugerido.imagen, categoria: data.sugerido.categoria }
          : { codigoBarras: code }
      )
    } catch {
      setQuickAdd({ codigoBarras: code })
    } finally {
      setLookingUp(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Quick-save product and add to cart ───────────────────────────────────
  async function handleQuickSave({ nombre, precio, codigoBarras, imagenUrl, categoria }) {
    setQuickSaving(true)
    try {
      const { data } = await api.post('/productos', {
        nombre, precio, codigoBarras: codigoBarras || null,
        imagenUrl: imagenUrl || null, categoria: categoria || null,
        aplicaIgv: true, stock: 0, controlStock: false,
      })
      setQuickAdd(null)
      addToCart({ id: data.id, nombre: data.nombre, precio: data.precio, aplicaIgv: data.aplicaIgv })
    } catch {
      setMsg({ type: 'error', text: 'Error al guardar producto' })
      setQuickAdd(null)
    } finally {
      setQuickSaving(false)
    }
  }

  // ── Confirm sale ─────────────────────────────────────────────────────────
  async function confirmPay(tipoComp) {
    setPayLoading(true)
    try {
      const { data } = await api.post('/ventas', {
        items: cart.map(x => ({ productoId: x.id, cantidad: x.qty })),
        tipoComprobante: tipoComp,
      })
      setLastVenta(data); setCart([]); setPaying(false)
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data || 'Error al procesar venta' })
      setPaying(false)
    } finally {
      setPayLoading(false)
    }
  }

  const total = cart.reduce((s, x) => s + x.precio * x.qty, 0)
  const igv   = cart.reduce((s, x) => s + (x.aplicaIgv !== false ? x.precio * x.qty * 0.18 / 1.18 : 0), 0)

  return (
    <div className="flex flex-col h-[calc(100vh-128px)]">

      {/* Search + scanner button */}
      <div className="bg-white border-b px-3 py-2 flex gap-2">
        <input ref={searchRef} className="input flex-1"
          placeholder="Buscar por nombre o código de barras..."
          value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" />
        <button onClick={() => setScanning(true)} className="btn-ghost px-3 text-xl" title="Escanear">
          📷
        </button>
      </div>

      {/* Search results dropdown */}
      {results.length > 0 && (
        <div className="bg-white border-b shadow-sm max-h-48 overflow-y-auto">
          {results.map(p => (
            <button key={p.id} onClick={() => addToCart(p)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0 flex justify-between items-center">
              <div>
                <span className="text-sm font-medium">{p.nombre}</span>
                {p.codigoBarras && <span className="text-xs text-gray-400 ml-2">{p.codigoBarras}</span>}
              </div>
              <span className="text-sm font-semibold text-green-700">S/ {p.precio?.toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Success banner */}
      {lastVenta && (
        <div className="bg-green-50 border border-green-200 mx-3 mt-3 rounded-xl p-3 flex items-start gap-2">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <p className="font-semibold text-green-800">Venta registrada</p>
            <p className="text-sm text-green-700">
              {lastVenta.comprobante.tipo === '01' ? 'Factura' : 'Boleta'}{' '}
              {lastVenta.comprobante.serie}-{String(lastVenta.comprobante.correlativo).padStart(8,'0')} — S/ {lastVenta.total?.toFixed(2)}
            </p>
          </div>
          <button onClick={() => setLastVenta(null)} className="text-green-600 text-xl">✕</button>
        </div>
      )}

      {/* Toast */}
      {msg && (
        <div className={`mx-3 mt-3 rounded-xl p-3 flex items-center gap-2 border ${
          msg.type==='error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
          <span className="flex-1 text-sm">{msg.text}</span>
          <button onClick={() => setMsg(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Cart */}
      <div className="flex-1 overflow-y-auto px-3 pt-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <span className="text-4xl mb-2">📷</span>
            <p className="text-sm font-medium">Escanea un código de barras</p>
            <p className="text-xs mt-1">o busca por nombre arriba</p>
          </div>
        ) : (
          cart.map(item => <CartItem key={item.id} item={item} onQty={setQty} onRemove={removeFromCart} />)
        )}
      </div>

      {/* Totals + pay */}
      {cart.length > 0 && (
        <div className="bg-white border-t px-4 py-3 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>IGV incluido</span><span>S/ {igv.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span><span className="text-green-700">S/ {total.toFixed(2)}</span>
          </div>
          <button className="btn-success w-full text-lg py-3" onClick={() => setPaying(true)}>
            💳 Cobrar S/ {total.toFixed(2)}
          </button>
        </div>
      )}

      {scanning   && <ScannerModal onScan={handleScan} onClose={() => setScanning(false)} />}
      {quickAdd   && <QuickAddModal sugerido={quickAdd} onSave={handleQuickSave} onClose={() => setQuickAdd(null)} saving={quickSaving} />}
      {paying     && <PayModal total={total} onPay={confirmPay} onClose={() => setPaying(false)} loading={payLoading} />}

      {/* Barcode lookup spinner */}
      {lookingUp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-xl">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="font-medium text-gray-700">Buscando producto...</p>
            <p className="text-xs text-gray-400">Consultando catálogo y Open Food Facts</p>
          </div>
        </div>
      )}
    </div>
  )
}
