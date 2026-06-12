import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Login     from './pages/Login'
import Register  from './pages/Register'
import Caja      from './pages/Caja'
import Productos from './pages/Productos'
import Ventas    from './pages/Ventas'
import Layout    from './components/Layout'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index           element={<Navigate to="/caja" replace />} />
            <Route path="caja"     element={<Caja />} />
            <Route path="productos" element={<Productos />} />
            <Route path="ventas"   element={<Ventas />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
