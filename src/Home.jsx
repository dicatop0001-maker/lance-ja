import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
function Home({ user, onLogout, onCreate }) {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { loadAuctions() }, [])
  const loadAuctions = async () => {
    const { data } = await supabase.from('auctions').select('*').eq('status', 'active')
    if (data) setAuctions(data)
    setLoading(false)
  }
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>LANCE 🔨 JÁ</h1>
          <div style={{ display: 'flex', gap: '15px' }}>
            <span>Olá!</span>
            <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid white', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Sair</button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
        <button onClick={onCreate} style={{ width: '100%', padding: '20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '30px' }}>+ CRIAR NOVO LEILÃO</button>
        <h2>🔥 Leilões Ativos</h2>
        {loading ? <div>Carregando...</div> : auctions.length === 0 ? <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '15px' }}><h3>Nenhum leilão ativo</h3></div> : <div>{auctions.map(a => <div key={a.id}><h3>{a.title}</h3></div>)}</div>}
      </div>
    </div>
  )
}
export default Home
