import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Notifications from './Notifications'

// Mapeamento de cidades para estados
const cityStateMap = {
  'ponta grossa': 'PR',
  'curitiba': 'PR',
  'londrina': 'PR',
  'maringá': 'PR',
  'rio de janeiro': 'RJ',
  'niterói': 'RJ',
  'são paulo': 'SP',
  'campinas': 'SP',
  'santos': 'SP',
  'belo horizonte': 'MG',
  'brasília': 'DF',
  'goiânia': 'GO',
  'salvador': 'BA',
  'recife': 'PE',
  'fortaleza': 'CE',
  'manaus': 'AM',
  'porto alegre': 'RS',
  'florianópolis': 'SC',
  'vitória': 'ES',
  'campo grande': 'MS',
  'cuiabá': 'MT'
}

function Home({ user, onLogout, onCreate, onOpenAuction }) {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')
  const [userCity, setUserCity] = useState('Ponta Grossa')
  const [userState, setUserState] = useState('PR')
  const [searchCity, setSearchCity] = useState('')
  const [searchState, setSearchState] = useState('')
  const [showCitySearch, setShowCitySearch] = useState(false)

  useEffect(() => {
    detectUserLocation()
    loadAuctions()
  }, [filter, searchCity])

  const detectUserLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      if (data.city && data.region_code) {
        setUserCity(data.city)
        setUserState(data.region_code)
      }
    } catch (error) {
      console.log('Usando localização padrão: Ponta Grossa - PR')
    }
  }

  const loadAuctions = async () => {
    let query = supabase.from('auctions').select('*').order('created_at', { ascending: false })
    
    if (filter === 'active') {
      query = query.eq('status', 'active')
    } else if (filter === 'ended') {
      query = query.eq('status', 'ended')
    }

    if (searchCity) {
      query = query.ilike('city', '%' + searchCity + '%')
    } else {
      query = query.eq('city', userCity)
    }
    
    const { data } = await query
    if (data) setAuctions(data)
    setLoading(false)
  }

  const handleCitySearch = (e) => {
    e.preventDefault()
    if (!searchCity.trim()) return

    // Buscar sigla do estado
    const normalizedCity = searchCity.toLowerCase().trim()
    const state = cityStateMap[normalizedCity]
    
    if (state) {
      setSearchState(state)
    } else {
      setSearchState('BR') // Estado genérico se não encontrar
    }

    loadAuctions()
    setShowCitySearch(false)
  }

  const clearCityFilter = () => {
    setSearchCity('')
    setSearchState('')
    loadAuctions()
  }

  const displayCity = searchCity || userCity
  const displayState = searchState || userState

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>LANCE 🔨 JÁ</h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Notifications user={user} />
            <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid white', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Sair</button>
          </div>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)', padding: '40px 20px', textAlign: 'center', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '36px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            O LEILÃO DA SUA REGIÃO
          </h2>
          <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '10px 0', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
            {displayCity.toUpperCase()} - {displayState}
          </div>
          <div style={{ fontSize: '18px', opacity: 0.9, marginTop: '10px' }}>
            automóveis, objetos, móveis e imóveis
          </div>
          
          {!showCitySearch ? (
            <button onClick={() => setShowCitySearch(true)} style={{ marginTop: '20px', padding: '12px 30px', background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', borderRadius: '25px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>
              🔍 Buscar em outra cidade
            </button>
          ) : (
            <form onSubmit={handleCitySearch} style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <input type="text" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} placeholder="Digite o nome da cidade..." style={{ padding: '12px 20px', borderRadius: '25px', border: 'none', fontSize: '16px', width: '300px' }} autoFocus />
              <button type="submit" style={{ padding: '12px 30px', background: 'white', color: '#667eea', border: 'none', borderRadius: '25px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Buscar</button>
              <button type="button" onClick={() => { setShowCitySearch(false); clearCityFilter(); }} style={{ padding: '12px 30px', background: 'rgba(255,255,255,0.2)', border: '2px solid white', color: 'white', borderRadius: '25px', fontSize: '16px', cursor: 'pointer' }}>Cancelar</button>
            </form>
          )}

          {searchCity && (
            <div style={{ marginTop: '15px' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 15px', borderRadius: '20px', fontSize: '14px' }}>
                Buscando em: {searchCity}
                <button onClick={clearCityFilter} style={{ background: 'none', border: 'none', color: 'white', marginLeft: '10px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
              </span>
            </div>
          )}
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
        {loading ? <div>Carregando...</div> : auctions.length === 0 ? <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '15px' }}><h3>Nenhum leilão encontrado em {displayCity}</h3><p style={{ color: '#666' }}>Tente buscar em outra cidade</p></div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>{auctions.map(a => <div key={a.id} onClick={() => onOpenAuction(a.id)} style={{ background: 'white', borderRadius: '15px', padding: '20px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', position: 'relative' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)' }}>
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
