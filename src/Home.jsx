import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Notifications from './Notifications'

function Home({ user, onLogout, onCreate, onOpenAuction }) {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')

  useEffect(() => {
    loadAuctions()
  }, [filter])

  const loadAuctions = async () => {
    let query = supabase.from('auctions').select('*').order('created_at', { ascending: false })
    
    if (filter === 'active') {
      query = query.eq('status', 'active')
    } else if (filter === 'ended') {
      query = query.eq('status', 'ended')
    }
    // Se filter === 'all', não filtra por status
    
    const { data } = await query
    if (data) setAuctions(data)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>LANCE 🔨 JÁ</h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Notifications user={user} />
            <span>Olá!</span>
            <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid white', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Sair</button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
        <button onClick={onCreate} style={{ width: '100%', padding: '20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '30px' }}>+ CRIAR NOVO LEILÃO</button>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setFilter('active')} style={{ padding: '10px 20px', background: filter === 'active' ? '#667eea' : 'white', color: filter === 'active' ? 'white' : '#333', border: '2px solid #667eea', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>🔥 Ativos</button>
          <button onClick={() => setFilter('ended')} style={{ padding: '10px 20px', background: filter === 'ended' ? '#667eea' : 'white', color: filter === 'ended' ? 'white' : '#333', border: '2px solid #667eea', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>🏁 Encerrados</button>
          <button onClick={() => setFilter('all')} style={{ padding: '10px 20px', background: filter === 'all' ? '#667eea' : 'white', color: filter === 'all' ? 'white' : '#333', border: '2px solid #667eea', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>📋 Todos</button>
        </div>

        <h2>{filter === 'active' ? '🔥 Leilões Ativos' : filter === 'ended' ? '🏁 Leilões Encerrados' : '📋 Todos os Leilões'}</h2>
        {loading ? <div>Carregando...</div> : auctions.length === 0 ? <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '15px' }}><h3>Nenhum leilão encontrado</h3></div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>{auctions.map(a => <div key={a.id} onClick={() => onOpenAuction(a.id)} style={{ background: 'white', borderRadius: '15px', padding: '20px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', position: 'relative' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)' }}>
          {a.status === 'ended' && (
            <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#f44336', color: 'white', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>🏁 ENCERRADO</div>
          )}
          {a.images && a.images.length > 0 ? (
            <div style={{ width: '100%', height: '180px', borderRadius: '10px', marginBottom: '15px', overflow: 'hidden' }}>
              <img src={a.images[0]} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: '100%', height: '180px', background: '#f0f0f0', borderRadius: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>📦</div>
          )}
          <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{a.title}</h3>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#999' }}>📍 {a.city}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid #f0f0f0' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#999' }}>Lance atual</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea' }}>R$ {a.current_price.toFixed(2)}</div>
            </div>
          </div>
        </div>)}</div>}
      </div>
    </div>
  )
}

export default Home
