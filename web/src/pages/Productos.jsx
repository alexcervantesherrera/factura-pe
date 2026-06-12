import { useState, useEffect, useRef } from 'react'
import api from '../api'

const UNITS = [['pz','📦 Pieza'],['kg','⚖️ Kilo'],['g','🏷️ Gramo'],['L','🥛 Litro']]

const empty = {
  codigoBarras: '', nombre: '', categoria: '',
  imagenUrl: '', precio: '', aplicaIgv: true, stock: 0, controlStock: false, unidad: 'pz',
}

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [search, setSearch]       = useState('')
  const [editing, setEditing]     = useState(null)  // null | {} | {id,...}
  const [form, setForm]           = useState(empty)
  const [loading, setLoading]     = useState(false)
  const [barcodeSearching, setBarcodeSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const photoRef = useRef(null)

  async function load(q = '') {
    const { data } = await api.get('/productos', { params: q ? { q } : {} })
    setProductos(data)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search])

  function openNew()   { setEditing({}); setForm(empty) }
  function openEdit(p) {
    setEditing(p)
    setForm({
      codigoBarras: p.codigoBarras || '', nombre: p.nombre,
      categoria: p.categoria || '', imagenUrl: p.imagenUrl || '',
      precio: p.precio, aplicaIgv: p.aplicaIgv,
      stock: p.stock, controlStock: p.controlStock, unidad: p.unidad || 'pz',
    })
  }
  function close() { setEditing(null) }

  function set(k) {
    return e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  }

  // ── Compress photo to ≤300px JPEG base64 ───────────────────────────────────
  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const MAX = 300
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        setForm(f => ({ ...f, imagenUrl: canvas.toDataURL('image/jpeg', 0.78) }))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  async function lookupBarcode() {
    if (!form.codigoBarras) return
    setBarcodeSearching(true)
    try {
      const { data } = await api.get(`/productos/barcode/${form.codigoBarras}`)
      if (data.found && data.sugerido) {
        const s = data.sugerido
        setForm(f => ({ ...f, nombre: s.nombre || f.nombre, imagenUrl: s.imagen || f.imagenUrl, categoria: s.categoria || f.categoria }))
      }
    } catch {}
    setBarcodeSearching(false)
  }

  async function save() {
    setLoading(true)
    try {
      const body = { ...form, precio: parseFloat(form.precio), stock: parseInt(form.stock) || 0, unidad: form.unidad || 'pz' }
      if (editing.id) await api.put(`/productos/${editing.id}`, body)
      else            await api.post('/productos', body)
      close()
      load(search)
    } catch (err) {
      alert(err.response?.data || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  async function importarDefaults() {
    setImporting(true)
    try {
      const { data } = await api.post('/productos/importar-defaults')
      setImportMsg({ type: 'ok', text: data.mensaje })
      if (data.importados > 0) load(search)
    } catch {
      setImportMsg({ type: 'err', text: 'Error al importar catálogo' })
    } finally {
      setImporting(false)
      setTimeout(() => setImportMsg(null), 4000)
    }
  }

  async function deactivate(id) {
    if (!confirm('¿Desactivar este producto?')) return
    await api.delete(`/productos/${id}`)
    load(search)
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <input className="input flex-1" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn-primary whitespace-nowrap" onClick={openNew}>+ Nuevo</button>
      </div>

      {/* Import catalog button */}
      <button
        onClick={importarDefaults}
        disabled={importing}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 text-sm font-medium transition-colors">
        {importing
          ? <><span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" /> Importando...</>
          : <> 📦 Importar catálogo base (~130 productos peruanos)</>}
      </button>

      {/* Import result toast */}
      {importMsg && (
        <div className={`rounded-xl px-4 py-2 text-sm font-medium text-center ${importMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {importMsg.text}
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {productos.map(p => (
          <div key={p.id} className="card flex items-center gap-3">
            {p.imagenUrl
              ? <img src={p.imagenUrl} alt={p.nombre} className="w-12 h-12 rounded-lg object-cover" />
              : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">📦</div>
            }
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{p.nombre}</p>
              <p className="text-xs text-gray-500">{p.codigoBarras || 'Sin código'} {p.categoria ? `· ${p.categoria}` : ''}</p>
              {p.controlStock && <p className="text-xs text-blue-500">Stock: {p.stock}</p>}
            </div>
            <div className="text-right">
              <p className="font-bold text-green-700">S/ {parseFloat(p.precio).toFixed(2)}</p>
              <p className="text-xs text-gray-400">/{p.unidad || 'pz'} {p.aplicaIgv ? '· IGV' : '· Exon.'}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => openEdit(p)} className="text-xs text-blue-600 hover:underline">Editar</button>
              <button onClick={() => deactivate(p.id)} className="text-xs text-red-400 hover:underline">Quitar</button>
            </div>
          </div>
        ))}
        {productos.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <div className="text-4xl mb-2">📦</div>
            <p>No hay productos. ¡Agrega el primero!</p>
          </div>
        )}
      </div>

      {/* Modal — z-[100] so it sits above bottom nav (z-[90]) */}
      {editing !== null && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-5 pb-24 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{editing.id ? 'Editar producto' : 'Nuevo producto'}</h3>
              <button onClick={close} className="text-gray-400 text-xl">✕</button>
            </div>

            {/* Barcode */}
            <div>
              <label className="label">Código de barras</label>
              <div className="flex gap-2">
                <input className="input flex-1" value={form.codigoBarras} onChange={set('codigoBarras')} placeholder="EAN-13, EAN-8..." />
                <button onClick={lookupBarcode} disabled={barcodeSearching || !form.codigoBarras}
                  className="btn-ghost px-3 text-sm whitespace-nowrap">
                  {barcodeSearching ? '...' : '🔍 Buscar'}
                </button>
              </div>
            </div>

            {/* Photo */}
            <div>
              <label className="label">Foto del producto</label>
              <div className="flex items-center gap-3">
                {form.imagenUrl ? (
                  <div className="relative">
                    <img src={form.imagenUrl} alt="preview" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                    <button
                      onClick={() => setForm(f => ({ ...f, imagenUrl: '' }))}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-3xl border border-dashed border-gray-300">
                    📷
                  </div>
                )}
                <div className="flex flex-col gap-1 flex-1">
                  <button
                    type="button"
                    onClick={() => photoRef.current?.click()}
                    className="btn-ghost text-sm py-2">
                    📷 Tomar foto / Galería
                  </button>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <input
                    className="input text-xs"
                    placeholder="o pega una URL de imagen"
                    value={form.imagenUrl?.startsWith('data:') ? '' : form.imagenUrl}
                    onChange={set('imagenUrl')}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Nombre *</label>
              <input className="input" value={form.nombre} onChange={set('nombre')} required />
            </div>

            {/* Unit selector */}
            <div>
              <label className="label">Se vende por</label>
              <div className="grid grid-cols-4 gap-2">
                {UNITS.map(([v,l]) => (
                  <button key={v} type="button" onClick={() => setForm(f => ({ ...f, unidad: v }))}
                    className={`py-2 rounded-lg text-xs font-medium border transition-colors ${form.unidad===v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Precio (S/ por {form.unidad}) *</label>
                <input className="input" type="number" step="0.01" min="0" value={form.precio} onChange={set('precio')} required />
              </div>
              <div>
                <label className="label">Categoría</label>
                <input className="input" value={form.categoria} onChange={set('categoria')} />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.aplicaIgv} onChange={set('aplicaIgv')} className="w-4 h-4" />
                <span className="text-sm">Aplica IGV (18%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.controlStock} onChange={set('controlStock')} className="w-4 h-4" />
                <span className="text-sm">Control stock</span>
              </label>
            </div>

            {form.controlStock && (
              <div>
                <label className="label">Stock inicial</label>
                <input className="input" type="number" min="0" value={form.stock} onChange={set('stock')} />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button className="btn-ghost flex-1" onClick={close}>Cancelar</button>
              <button className="btn-primary flex-1" onClick={save} disabled={loading || !form.nombre || !form.precio}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
