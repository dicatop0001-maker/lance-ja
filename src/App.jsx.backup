import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Home from './Home'
import NovoLeilao from './NovoLeilao'
import DetalhesLeilao from './DetalhesLeilao'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState('home')
  const [selectedAuctionId, setSelectedAuctionId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const openAuction = (auctionId) => {
    setSelectedAuctionId(auctionId)
    setScreen('detalhes')
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', fontSize: '24px' }}>Carregando...</div>
  if (!user) return <Login />
  if (screen === 'novo') return <NovoLeilao user={user} onBack={() => setScreen('home')} onSuccess={() => setScreen('home')} />
  if (screen === 'detalhes') return <DetalhesLeilao auctionId={selectedAuctionId} user={user} onBack={() => setScreen('home')} />
  return <Home user={user} onLogout={async () => { await supabase.auth.signOut(); setUser(null) }} onCreate={() => setScreen('novo')} onOpenAuction={openAuction} />
}

export default App
