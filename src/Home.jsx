import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import Notifications from './Notifications'

function Home() {
  const [user, setUser] = useState(null)
  const [auctions, setAuctions] = useState([])
  const [filteredAuctions, setFilteredAuctions] = useState([])
  const [filter, setFilter] = useState('active')
  const [userCity, setUserCity] = useState('Ponta Grossa')
  const [userState, setUserState] = useState('PR')
  const [searchCity, setSearchCity] = useState('')
  const [showCitySearch, setShowCitySearch] = useState(false)
  const navigate = useNavigate()

  const cityStateMap = {
    'Ponta Grossa': 'PR', 'Curitiba': 'PR', 'Londrina': 'PR', 'Maringá': 'PR',
    'São Paulo': 'SP', 'Rio de Janeiro': 'RJ', 'Belo Horizonte': 'MG',
    'Porto Alegre': 'RS', 'Brasília': 'DF', 'Salvador': 'BA',
    'Fortaleza': 'CE', 'Recife': 'PE', 'Manaus': 'AM', 'Belém': 'PA'
  }

  useEffect(() => {
    checkUser()
    detectLocation()
  }, [])

  useEffect(() => {
    if (user) loadAuctions()
  }, [user, userCity])

  useEffect(() => {
    filterAuctions()
  }, [auctions, filter])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/')
      return
    }
    setUser(session.user)
  }

  const detectLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      if (data.city && cityStateMap[data.city]) {
        setUserCity(data.city)
        setUserState(cityStateMap[data.city])
      }
    } catch (error) {
      console.log('Usando localização padrão: Ponta Grossa - PR')
    }
  }

  const loadAuctions = async () => {
    const { data } = await supabase
      .from('auctions')
      .select('*')
      .eq('city', userCity)
      .order('created_at', { ascending: false })
    if (data) setAuctions(data)
  }

  const filterAuctions = () => {
    const now = new Date()
    if (filter === 'active') {
      setFilteredAuctions(auctions.filter(a => 
        (a.status === 'active' || !a.status) && new Date(a.ends_at) > now
      ))
    } else if (filter === 'ended') {
      setFilteredAuctions(auctions.filter(a => 
        a.status === 'ended' || new Date(a.ends_at) <= now
      ))
    }
  }

  const handleCitySearch = (city) => {
    if (cityStateMap[city]) {
      setUserCity(city)
      setUserState(cityStateMap[city])
      setShowCitySearch(false)
      setSearchCity('')
    } else {
      alert('Cidade não encontrada!')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const isEnded = (auction) => {
    return auction.status === 'ended' || new Date(auction.ends_at) <= new Date()
  }

  if (!user) return <div>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)' }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '32px', fontWeight: 'bold' }}>LANCE 🔨 JÁ</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <Notifications user={user} />
          <button onClick={handleLogout} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid white', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Sair</button>
        </div>
      </div>

      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <h2 style={{ color: 'white', fontSize: '48px', fontWeight: 'bold', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>COMPRE E VENDA!</h2>
        <h3 style={{ color: 'white', fontSize: '64px', fontWeight: 'bold', margin: '0 0 20px 0' }}>{userCity} - {userState}</h3>
        <p style={{ color: 'white', fontSize: '20px', margin: '0 0 30px 0' }}>serviços, objetos, móveis e imóveis</p>
        <button onClick={() => setShowCitySearch(!showCitySearch)} style={{ padding: '15px 30px', background: 'rgba(255,255,255,0.3)', color: 'white', border: '2px solid white', borderRadius: '15px', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>🔍 Buscar em outra cidade</button>
        
        {showCitySearch && (
          <div style={{ marginTop: '20px', background: 'white', borderRadius: '15px', padding: '20px', maxWidth: '500px', margin: '20px auto' }}>
            <input type="text" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} placeholder="Digite o nome da cidade..." style={{ width: '100%', padding: '15px', border: '2px solid #ddd', borderRadius: '10px', fontSize: '16px', marginBottom: '15px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {Object.keys(cityStateMap).filter(c => c.toLowerCase().includes(searchCity.toLowerCase())).map(city => (
                <button key={city} onClick={() => handleCitySearch(city)} style={{ padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{city} - {cityStateMap[city]}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <button onClick={() => navigate('/novo')} style={{ width: '100%', padding: '25px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '15px', fontSize: '24px', fontWeight: 'bold', cursor: 'pointer' }}>+ CRIAR NOVO LEILÃO</button>
          <div style={{ fontSize: '14px', color: 'white', marginTop: '10px', fontWeight: 'normal' }}>clique e venda!</div>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          <button onClick={() => setFilter('active')} style={{ flex: 1, padding: '15px', background: filter === 'active' ? '#667eea' : 'white', color: filter === 'active' ? 'white' : '#333', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>🔥 Ativos</button>
          <button onClick={() => setFilter('ended')} style={{ flex: 1, padding: '15px', background: filter === 'ended' ? '#667eea' : 'white', color: filter === 'ended' ? 'white' : '#333', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>🏁 Encerrados</button>
        </div>

        <h2 style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>🔥 Leilões {filter === 'active' ? 'Ativos' : 'Encerrados'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredAuctions.map(auction => (
            <div key={auction.id} onClick={() => navigate(/leilao/)} style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              {isEnded(auction) && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#f44336', color: 'white', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', zIndex: 10 }}>🏁 ENCERRADO</div>
              )}
              <img src={auction.photos?.[0] || 'https://via.placeholder.com/300x200'} alt={auction.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{auction.title}</h3>
                <p style={{ color: '#666', marginBottom: '15px' }}>{auction.city}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#999' }}>Lance atual</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>R$ {parseFloat(auction.starting_bid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAuctions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '15px' }}>
            <p style={{ color: 'white', fontSize: '24px' }}>Nenhum leilão encontrado em {userCity}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home