import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      login(data.token, { nombre: data.nombre, rol: data.rol, razonSocial: data.razonSocial })
      navigate('/caja')
    } catch (err) {
      setError(err.response?.status === 401 ? 'Email o contraseña incorrectos' : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🛍️</div>
          <h1 className="text-2xl font-bold text-gray-800">vendemas</h1>
          <p className="text-gray-500 text-sm">POS + Facturación electrónica gratis</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="font-semibold text-gray-700">Iniciar sesión</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input className="input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p className="text-center text-sm text-gray-500">
            ¿Sin cuenta?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Registrar empresa
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
