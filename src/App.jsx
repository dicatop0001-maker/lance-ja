import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './Login'
import Home from './Home'
import NovoLeilao from './NovoLeilao'
import NovoAnuncio from './NovoAnuncio'
import DetalhesLeilao from './DetalhesLeilao'
import MeusLeiloes from './MeusLeiloes'
import VendedorPerfil from './VendedorPerfil'
import Vitrine from './Vitrine'

function LoadingScreen() {
  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  },
    React.createElement('div', {
      style: {
        width: '48px',
        height: '48px',
        border: '5px solid rgba(255,255,255,0.3)',
        borderTop: '5px solid white',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }
    }),
    React.createElement('style', null, '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }'),
    React.createElement('p', {
      style: { color: 'white', marginTop: '20px', fontSize: '16px', fontWeight: 'bold' }
    }, 'Carregando...')
  )
}

function PrivateRoute({ children }) {
  const [session, setSession] = useState(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
  }, [])
  if (session === undefined) return React.createElement(LoadingScreen)
  if (!session) return React.createElement(Navigate, { to: '/', replace: true })
  return children
}

function App() {
  return React.createElement(Router, null,
    React.createElement(Routes, null,
      React.createElement(Route, { path: '/', element: React.createElement(Login) }),
      React.createElement(Route, { path: '/vitrine', element: React.createElement(Vitrine) }),
      React.createElement(Route, { path: '/home', element: React.createElement(PrivateRoute, null, React.createElement(Home)) }),
      React.createElement(Route, { path: '/novo', element: React.createElement(PrivateRoute, null, React.createElement(NovoLeilao)) }),
    React.createElement(Route, { path: '/anuncio', element: React.createElement(PrivateRoute, null, React.createElement(NovoAnuncio)) }),
      React.createElement(Route, { path: '/leilao/:id', element: React.createElement(PrivateRoute, null, React.createElement(DetalhesLeilao)) }),
      React.createElement(Route, { path: '/meus-leiloes', element: React.createElement(PrivateRoute, null, React.createElement(MeusLeiloes)) }),
      React.createElement(Route, { path: '/vendedor/:sellerId', element: React.createElement(PrivateRoute, null, React.createElement(VendedorPerfil)) }),
      React.createElement(Route, { path: '*', element: React.createElement(Navigate, { to: '/', replace: true }) })
    )
  )
}

export default App
