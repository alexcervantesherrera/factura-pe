import { useState, useRef, useEffect, useCallback } from 'react'
import api from '../api'

const GRANEL = ['kg', 'g', 'L']

// ── Cart item ────────────────────────────────────────────────────────────────
function CartItem({ item, onQty, onRemove }) {
  const isGranel = GRANEL.includes(item.unidad)
  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.nombre}</p>
        <p className="text-xs text-gray-500">S/ {item.precio.toFixed(2)} /{item.unidad || 'pz'}</p>
      </div>
      <div className="flex items-center gap-1">
        {isGranel ? (
          <>
            <input
              className="w-20 text-center border border-gray-200 rounded-lg px-1 py-1 text-sm font-semibold"
              type="number" step="0.01" min="0.01"
              value={item.qty}
              onChange={e => { const v = parseFloat(e.target.value); if (v > 0) onQty(item, v) }}
            />
            <span className="text-xs text-gray-500 w-5">{item.unidad}</span>
          </>
        ) : (
          <>
            <button onClick={() => onQty(item, item.qty - 1)}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-lg font-bold flex items-center justify-center">−</button>
            <span className="w-7 text-center text-sm font-semibold">{item.qty}</span>
            <button onClick={() => onQty(item, item.qty + 1)}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-lg font-bold flex items-center justify-center">+</button>
          </>
        )}
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
  const scannerRef = useRef(null)
  const scannedRef = useRef(false)

  useEffect(() => {
    scannedRef.current = false
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      const s = new Html5Qrcode('qr-reader')
      scannerRef.current = s
      s.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (code) => {
          if (scannedRef.current) return
          scannedRef.current = true
          try { await s.stop() } catch {}
          scannerRef.current = null
          onScan(code)
        },
        () => {}
      ).catch(() => {})
    })
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
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

// ── Weight modal (productos a granel) ────────────────────────────────────────
function WeightModal({ producto, onAdd, onClose }) {
  const [qty, setQty] = useState('')
  const unit  = producto.unidad || 'kg'
  const total = (parseFloat(qty) || 0) * producto.precio

  function handleKey(e) { if (e.key === 'Enter' && parseFloat(qty) > 0) onAdd(parseFloat(qty)) }

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">¿Cuánto?</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        {producto.imagenUrl && (
          <img src={producto.imagenUrl} alt="" className="w-16 h-16 rounded-xl object-cover mx-auto" />
        )}
        <div className="text-center">
          <p className="font-semibold text-gray-800">{producto.nombre}</p>
          <p className="text-sm text-gray-500 mt-0.5">S/ {producto.precio.toFixed(2)} por {unit}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            className="input flex-1 text-3xl font-bold text-center"
            type="number" step="0.01" min="0.01"
            placeholder="0.000"
            value={qty}
            onChange={e => setQty(e.target.value)}
            onKeyDown={handleKey}
            autoFocus
          />
          <span className="text-xl font-semibold text-gray-500 w-8">{unit}</span>
        </div>
        {parseFloat(qty) > 0 && (
          <p className="text-center text-2xl font-bold text-green-700">S/ {total.toFixed(2)}</p>
        )}
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-success flex-1 text-base py-3"
            onClick={() => { if (parseFloat(qty) > 0) onAdd(parseFloat(qty)) }}
            disabled={!qty || parseFloat(qty) <= 0}>
            ✓ Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Quick-add modal (producto no encontrado en catálogo) ─────────────────────
function QuickAddModal({ sugerido, onSave, onClose, saving }) {
  const [nombre, setNombre] = useState(sugerido?.nombre || '')
  const [precio, setPrecio] = useState('')
  const [unidad, setUnidad] = useState('pz')
  const precioRef = useRef(null)

  useEffect(() => { precioRef.current?.focus() }, [])

  async function handleSave() {
    if (!nombre.trim() || !precio) return
    await onSave({
      nombre, precio: parseFloat(precio), unidad,
      codigoBarras: sugerido?.codigoBarras, imagenUrl: sugerido?.imagen, categoria: sugerido?.categoria,
    })
  }

  function handleKey(e) { if (e.key === 'Enter') handleSave() }

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-sm p-5 pb-24 space-y-4 max-h-[85vh] overflow-y-auto">
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

        <div>
          <label className="label">Nombre del producto</label>
          <input className="input" value={nombre} onChange={e => setNombre(e.target.value)} onKeyDown={handleKey} />
        </div>

        {/* Unit selector */}
        <div>
          <label className="label">Se vende por</label>
          <div className="grid grid-cols-4 gap-2">
            {[['pz','📦 Pz'],['kg','⚖️ Kg'],['g','🏷️ g'],['L','🥛 L']].map(([v,l]) => (
              <button key={v} onClick={() => setUnidad(v)}
                className={`py-2 rounded-lg text-xs font-medium border transition-colors ${unidad===v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Precio de venta (S/ por {unidad}) *</label>
          <input
            ref={precioRef}
            className="input text-2xl font-bold"
            type="number" step="0.10" min="0"
            placeholder="0.00"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            onKeyDown={handleKey}
          />
          <p className="text-xs text-gray-400 mt-1">Presiona Enter para continuar</p>
        </div>

        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-success flex-1 text-base py-3" onClick={handleSave}
            disabled={saving || !nombre.trim() || !precio}>
            {saving ? '...' : '✓ Guardar y agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Payment modal ────────────────────────────────────────────────────────────
function PayModal({ total, onPay, onClose, loading }) {
  const [tipoComp,       setTipoComp]       = useState('03')
  const [efectivo,       setEfectivo]       = useState(Math.ceil(total).toString())
  const [clientes,       setClientes]       = useState([])
  const [clientQ,        setClientQ]        = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const vuelto = Math.max(0, parseFloat(efectivo || 0) - total)

  useEffect(() => {
    api.get('/clientes').then(r => setClientes(r.data)).catch(() => {})
  }, [])

  const filteredClients = clientQ.trim()
    ? clientes.filter(c =>
        c.nombre.toLowerCase().includes(clientQ.toLowerCase()) ||
        c.numDoc.includes(clientQ)
      ).slice(0, 6)
    : []

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center">
      <div className="bg-white rounded-t-2xl w-full max-w-sm p-5 pb-24 space-y-4 max-h-[85vh] overflow-y-auto">
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
          <label className="label">
            Cliente
            {tipoComp === '01' && <span className="text-red-500 ml-1">*</span>}
          </label>
          {selectedClient ? (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">{selectedClient.nombre}</p>
                <p className="text-xs text-blue-600">
                  {selectedClient.tipoDoc === '6' ? 'RUC' : 'DNI'}: {selectedClient.numDoc}
                </p>
              </div>
              <button onClick={() => { setSelectedClient(null); setClientQ('') }}
                className="text-blue-400 hover:text-blue-600 text-lg">✕</button>
            </div>
          ) : (
            <div className="relative">
              <input className="input"
                placeholder={tipoComp === '01' ? 'Buscar por nombre o RUC...' : 'Consumidor Final (opcional)'}
                value={clientQ}
                onChange={e => setClientQ(e.target.value)} />
              {filteredClients.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-44 overflow-y-auto">
                  {filteredClients.map(c => (
                    <button key={c.id}
                      onClick={() => { setSelectedClient(c); setClientQ('') }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0">
                      <p className="text-sm font-medium">{c.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {c.tipoDoc === '6' ? 'RUC' : 'DNI'}: {c.numDoc}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {!selectedClient && (
            <p className="text-xs text-gray-400 mt-1">
              {tipoComp === '01' ? 'Factura requiere cliente con RUC' : 'Sin cliente = Consumidor Final'}
            </p>
          )}
        </div>

        <div>
          <label className="label">Efectivo recibido</label>
          <input className="input text-xl font-semibold" type="number" step="0.10"
            value={efectivo} onChange={e => setEfectivo(e.target.value)} />
          {vuelto > 0 && <p className="text-sm text-blue-600 mt-1 font-medium">Vuelto: S/ {vuelto.toFixed(2)}</p>}
        </div>

        <button
          className="btn-success w-full text-lg py-3"
          onClick={() => onPay(tipoComp, selectedClient?.id || null)}
          disabled={loading || (tipoComp === '01' && !selectedClient)}>
          {loading ? 'Procesando...' : '✓ Confirmar cobro'}
        </button>
      </div>
    </div>
  )
}

// ── Main Caja ────────────────────────────────────────────────────────────────
export default function Caja() {
  const [cart, setCart]               = useState([])
  const [search, setSearch]           = useState('')
  const [results, setResults]         = useState([])
  const [scanning, setScanning]       = useState(false)
  const [lookingUp, setLookingUp]     = useState(false)
  const [quickAdd, setQuickAdd]       = useState(null)
  const [granelItem, setGranelItem]   = useState(null)  // product pending weight entry
  const [quickSaving, setQuickSaving] = useState(false)
  const [paying, setPaying]           = useState(false)
  const [payLoading, setPayLoading]   = useState(false)
  const [lastVenta, setLastVenta]     = useState(null)
  const [msg, setMsg]                 = useState(null)
  const searchRef = useRef(null)

  const isBarcode = s => /^\d{8,14}$/.test(s.trim())

  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      try {
        if (isBarcode(search)) {
          handleScan(search.trim())
          setSearch('')
        } else {
          const { data } = await api.get('/productos', { params: { q: search } })
          setResults(data)
        }
      } catch { setResults([]) }
    }, 600)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  function addToCart(prod, qty = 1) {
    setCart(c => {
      const idx = c.findIndex(x => x.id === prod.id)
      if (idx >= 0) {
        const next = [...c]
        next[idx] = { ...next[idx], qty: next[idx].qty + qty }
        return next
      }
      return [...c, { ...prod, qty }]
    })
    setSearch(''); setResults([])
    searchRef.current?.focus()
  }

  // Handle adding from search results — granel products need weight entry first
  function handleAddProduct(prod) {
    if (GRANEL.includes(prod.unidad)) {
      setGranelItem(prod)
      setSearch(''); setResults([])
    } else {
      addToCart(prod)
    }
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
        const prod = {
          id: data.producto.id, nombre: data.producto.nombre,
          precio: data.producto.precio, aplicaIgv: data.producto.aplicaIgv,
          unidad: data.producto.unidad || 'pz', imagenUrl: data.producto.imagenUrl,
        }
        if (GRANEL.includes(prod.unidad)) {
          setGranelItem(prod)
        } else {
          addToCart(prod)
        }
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
  async function handleQuickSave({ nombre, precio, unidad, codigoBarras, imagenUrl, categoria }) {
    setQuickSaving(true)
    try {
      const { data } = await api.post('/productos', {
        nombre, precio, unidad: unidad || 'pz',
        codigoBarras: codigoBarras || null,
        imagenUrl: imagenUrl || null, categoria: categoria || null,
        aplicaIgv: true, stock: 0, controlStock: false,
      })
      setQuickAdd(null)
      const prod = {
        id: data.id, nombre: data.nombre,
        precio: data.precio, aplicaIgv: data.aplicaIgv,
        unidad: data.unidad || 'pz',
      }
      // For granel quick-saves, show weight modal immediately
      if (GRANEL.includes(prod.unidad)) {
        setGranelItem(prod)
      } else {
        addToCart(prod)
      }
    } catch {
      setMsg({ type: 'error', text: 'Error al guardar producto' })
      setQuickAdd(null)
    } finally {
      setQuickSaving(false)
    }
  }

  // ── Confirm sale ─────────────────────────────────────────────────────────
  async function confirmPay(tipoComp, clienteId) {
    setPayLoading(true)
    try {
      const { data } = await api.post('/ventas', {
        items: cart.map(x => ({ productoId: x.id, cantidad: x.qty })),
        tipoComprobante: tipoComp,
        clienteId: clienteId || null,
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
            <button key={p.id} onClick={() => handleAddProduct(p)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0 flex justify-between items-center">
              <div>
                <span className="text-sm font-medium">{p.nombre}</span>
                {p.codigoBarras && <span className="text-xs text-gray-400 ml-2">{p.codigoBarras}</span>}
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-green-700">S/ {p.precio?.toFixed(2)}</span>
                <span className="text-xs text-gray-400 ml-1">/{p.unidad || 'pz'}</span>
              </div>
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
      {granelItem && (
        <WeightModal
          producto={granelItem}
          onAdd={qty => { addToCart(granelItem, qty); setGranelItem(null) }}
          onClose={() => setGranelItem(null)}
        />
      )}
      {quickAdd   && <QuickAddModal sugerido={quickAdd} onSave={handleQuickSave} onClose={() => setQuickAdd(null)} saving={quickSaving} />}
      {paying     && <PayModal total={total} onPay={confirmPay} onClose={() => setPaying(false)} loading={payLoading} />}

      {/* Barcode lookup spinner */}
      {lookingUp && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
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
