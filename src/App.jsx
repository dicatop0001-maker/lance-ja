import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
  }, [])
  if (session === undefined) return null
  if (!session) return React.createElement(Navigate, { to: '/', replace: true })
  return children
}

function App() {
  return React.createElement(Router, null,
    React.createElement(Routes, null,
      React.createElement(Route, { path: '/', element: React.createElement(Login) }),
      React.createElement(Route, { path: '/home', element: React.createElement(PrivateRoute, null, React.createElement(Home)) }),
      React.createElement(Route, { path: '/novo', element: React.createElement(PrivateRoute, null, React.createElement(NovoLeilao)) }),
      React.createElement(Route, { path: '/leilao/:id', element: React.createElement(PrivateRoute, null, React.createElement(DetalhesLeilao)) }),
      React.createElement(Route, { path: '/meus-leiloes', element: React.createElement(PrivateRoute, null, React.createElement(MeusLeiloes)) }),
      React.createElement(Route, { path: '/vendedor/:sellerId', element: React.createElement(PrivateRoute, null, React.createElement(VendedorPerfil)) }),
      React.createElement(Route, { path: '*', element: React.createElement(Navigate, { to: '/', replace: true }) })
    )
  )
}

export default App
