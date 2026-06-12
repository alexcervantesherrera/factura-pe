import { useState, useEffect } from 'react'
import api from '../api'

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/ventas')
      setVentas(data)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function openDetail(venta) {
    setSelected(venta)
    try {
      const { data } = await api.get(`/ventas/${venta.id}`)
      setDetail(data)
    } catch { setDetail(null) }
  }

  const total = ventas.reduce((s, v) => s + v.total, 0)

  return (
    <div className="p-3 space-y-3">
      {/* Summary */}
      <div className="card bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
        <p className="text-sm opacity-80">Ventas de hoy ({ventas.length})</p>
        <p className="text-3xl font-bold">S/ {total.toFixed(2)}</p>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center text-gray-400 py-8">Cargando...</div>
      ) : ventas.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <div className="text-4xl mb-2">📋</div>
          <p>No hay ventas hoy</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ventas.map(v => (
            <button key={v.id} onClick={() => openDetail(v)}
              className="card w-full text-left hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{v.cliente}</span>
                    {v.comprobante && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {v.comprobante.tipo === '01' ? 'Factura' : 'Boleta'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(v.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    {v.comprobante && ` · ${v.comprobante.serie}-${String(v.comprobante.correlativo).padStart(8,'0')}`}
                  </p>
                </div>
                <p className="font-bold text-green-700">S/ {v.total.toFixed(2)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-5 max-h-[80vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Detalle de venta</h3>
              <button onClick={() => { setSelected(null); setDetail(null) }} className="text-gray-400 text-xl">✕</button>
            </div>

            {detail ? (
              <>
                {detail.comprobante && (
                  <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-blue-800">
                      {detail.comprobante.tipo === '01' ? 'FACTURA' : 'BOLETA'} ELECTRÓNICA
                    </p>
                    <p className="text-blue-600">
                      {detail.comprobante.serie}-{String(detail.comprobante.correlativo).padStart(8,'0')}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">Estado SUNAT: {detail.comprobante.estadoSunat}</p>
                  </div>
                )}

                <div className="space-y-1">
                  {(detail.detalles || []).map(d => (
                    <div key={d.id} className="flex justify-between text-sm py-1 border-b border-gray-100">
                      <span className="flex-1">{d.nombreProducto} × {d.cantidad}</span>
                      <span className="font-medium">S/ {d.total?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 text-sm pt-1">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>S/ {detail.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>IGV</span>
                    <span>S/ {detail.igv?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t pt-1">
                    <span>Total</span>
                    <span className="text-green-700">S/ {detail.total?.toFixed(2)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400 py-8">Cargando detalle...</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
