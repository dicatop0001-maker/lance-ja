import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Home from './Home'
import NovoLeilao from './NovoLeilao'
import DetalhesLeilao from './DetalhesLeilao'
import MeusLeiloes from './MeusLeiloes'
import VendedorPerfil from './VendedorPerfil'

function PrivateRoute({ children }) {
    const [session, setSession] = useState(undefined)

  useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session)
        })
  }, [])

  if (session === undefined) return null
    return session ? children : <Navigate to="/" replace />
}

function App() {
    return (
          <Router>
                <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>PrivateRoute>} />
                                <Route path="/novo" element={<PrivateRoute><NovoLeilao /></PrivateRoute>PrivateRoute>} />
                                        <Route path="/leilao/:id" element={<PrivateRoute><DetalhesLeilao /></PrivateRoute>PrivateRoute>} />
                                                <Route path="/meus-leiloes" element={<PrivateRoute><MeusLeiloes /></PrivateRoute>PrivateRoute>} />
                                                        <Route path="/vendedor/:sellerId" element={<VendedorPerfil />} />
                                                        <Route path="*" element={<Navigate to="/" replace />} />
                                                </Route>Routes>
                                        </Route>Router>
                                  )
                                  }
                                
                                export default App</Router>
