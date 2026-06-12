import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'

export default function Register() {
  const [form, setForm] = useState({
    ruc: '', razonSocial: '', direccion: '',
    solUsuario: '', solPassword: '',
    nombreAdmin: '', email: '', password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      login(data.token, { nombre: data.nombre, rol: data.rol, razonSocial: data.razonSocial })
      navigate('/caja')
    } catch (err) {
      setError(err.response?.data || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-1">🛍️</div>
          <h1 className="text-xl font-bold text-gray-800">Registrar empresa en vendemas</h1>
          <p className="text-gray-500 text-sm">Empieza gratis — sin tarjeta de crédito</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}

          <div className="border-b pb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Datos de la empresa</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">RUC *</label>
                <input className="input" value={form.ruc} onChange={set('ruc')} maxLength={11} pattern="\d{11}" required />
              </div>
              <div>
                <label className="label">Razón Social *</label>
                <input className="input" value={form.razonSocial} onChange={set('razonSocial')} required />
              </div>
            </div>
            <div className="mt-3">
              <label className="label">Dirección</label>
              <input className="input" value={form.direccion} onChange={set('direccion')} />
            </div>
          </div>

          <div className="border-b pb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Clave SOL <span className="text-gray-400 font-normal">(opcional, para emisión a SUNAT)</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Usuario SOL</label>
                <input className="input" value={form.solUsuario} onChange={set('solUsuario')} />
              </div>
              <div>
                <label className="label">Clave SOL</label>
                <input className="input" type="password" value={form.solPassword} onChange={set('solPassword')} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Cuenta de administrador</p>
            <div className="space-y-3">
              <div>
                <label className="label">Nombre *</label>
                <input className="input" value={form.nombreAdmin} onChange={set('nombreAdmin')} required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" value={form.email} onChange={set('email')} required />
              </div>
              <div>
                <label className="label">Contraseña *</label>
                <input className="input" type="password" value={form.password} onChange={set('password')} minLength={6} required />
              </div>
            </div>
          </div>

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Registrando...' : 'Crear cuenta gratis'}
          </button>

          <p className="text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Ingresar</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
