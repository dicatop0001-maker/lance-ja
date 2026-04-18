import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import Notifications from './Notifications'

const blinkStyle = `

  50% { opacity: 0.15; }
}

  50% { transform: translateY(8px); }
}


.lj-nav {
  padding: 10px 16px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  background: rgba(255,255,255,0.12);
  backdrop-filter: blur(8px);
  gap: 10px;
}
.lj-nav-logo {
  display: flex;
  justify-content: center;
}
.lj-nav-left, .lj-nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lj-nav-right {
  justify-content: flex-end;
}
@media (max-width: 599px) {
  .lj-nav {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
  }
  .lj-nav-logo {
    grid-column: 1;
    grid-row: 1;
  }
  .lj-nav-left {
    display: none;
  }
  .lj-nav-right {
    display: none;
  }
  .lj-nav-mobile-btns {
    grid-column: 1;
    grid-row: 2;
    display: flex !important;
    justify-content: center;
    gap: 8px;
  }
}
@media (min-width: 600px) {
  .lj-nav-mobile-btns {
    display: none !important;
  }
}
`

function getTimeLeft(endsAt) {
  const now = new Date()
  const end = new Date(endsAt)
  const diffMs = end - now
  if (diffMs <= 0) return null

  const diffMin = Math.floor(diffMs / 1000 / 60)
  const diffH   = Math.floor(diffMs / 1000 / 60 / 60)
  const diffD   = Math.floor(diffMs / 1000 / 60 / 60 / 24)

  if (diffMin < 60) {
    return { label: diffMin + ' min para dar lance', urgent: true }
  } else if (diffH < 24) {
    return { label: diffH + (diffH === 1 ? ' hora para dar lance' : ' horas para dar lance'), urgent: true }
  } else if (diffD === 1) {
    return { label: '1 dia para dar lance', urgent: false }
  } else {
    return { label: diffD + ' dias para dar lance', urgent: false }
  }
}

function Home() {
  const [user, setUser] = useState(null)
  const [auctions, setAuctions] = useState([])
  const [activeAuctions, setActiveAuctions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [userCity, setUserCity] = useState('Ponta Grossa')
  const [userState, setUserState] = useState('PR')
  const [searchCity, setSearchCity] = useState('')
  const [showCitySearch, setShowCitySearch] = useState(false)
  const [allCities, setAllCities] = useState([])
  const [filteredCities, setFilteredCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())
  const navigate = useNavigate()

  useEffect(() => {
    checkUser(); detectLocation(); loadBrazilianCities()
    // atualiza o tempo restante a cada 30 segundos
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user) loadAuctions()
  }, [user, userCity])

  useEffect(() => {
    const n = new Date()
    setActiveAuctions(auctions.filter(a => (a.status === 'active' || !a.status) && new Date(a.ends_at) > n))
  }, [auctions])

  useEffect(() => {
    if (searchCity.length >= 2) {
      const filtered = allCities.filter(city =>
        city.nome.toLowerCase().includes(searchCity.toLowerCase())
      ).slice(0, 50)
      setFilteredCities(filtered)
    } else {
      setFilteredCities([])
    }
  }, [searchCity, allCities])

  const loadBrazilianCities = async () => {
    try {
      const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
      const data = await response.json()
      setAllCities(data)
    } catch (error) {
      console.error('Erro ao carregar cidades:', error)
    }
  }

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/'); return }
    setUser(session.user)
  }

  const detectLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      if (data.city) { setUserCity(data.city); setUserState(data.region_code || 'BR') }
    } catch (error) {
      console.log('Usando localizacao padrao: Ponta Grossa - PR')
    }
  }

  const loadAuctions = async () => {
    setLoading(true)
    const { data } = await supabase.from('auctions').select('*').eq('city', userCity).order('created_at', { ascending: false })
    if (data) setAuctions(data)
    setLoading(false)
  }

  const handleCitySelect = (city) => {
    setUserCity(city.nome)
    setUserState(city.microrregiao.mesorregiao.UF.sigla)
    setShowCitySearch(false)
    setSearchCity('')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const displayedAuctions = activeAuctions.filter(a => {
    const matchSearch = searchTerm === '' ||
      (a.title && a.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchCat = selectedCategory === '' ||
      (a.category && a.category.toLowerCase() === selectedCategory.toLowerCase())
    return matchSearch && matchCat
  })

  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <style>{blinkStyle}</style>

      {/* NAVBAR */}
      <nav className="lj-nav">
        <div className="lj-nav-left">
          <button onClick={() => navigate('/meus-leiloes')} style={{ padding: 'clamp(8px,1.5vw,14px) clamp(10px,2vw,28px)', background: '#1e3a8a', color: 'white', border: '3px solid #4a90d9', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(11px,2vw,16px)', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(30,58,138,0.5)' }}>
            Meus Leilões
          </button>
        </div>
        <div className="lj-nav-logo">
          <img src="/logo-leilao.png" alt="Zap Bairro" style={{ height: 'clamp(130px, 36vw, 400px)', maxWidth: 'clamp(320px, 95vw, 900px)', width: '100%', objectFit: 'contain', borderRadius: '10px', cursor: 'pointer', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.35))' }} onClick={() => navigate('/home')} />
        </div>
        <div className="lj-nav-right">
          <Notifications user={user} />
          <button onClick={handleLogout} style={{ padding: 'clamp(8px,1.5vw,14px) clamp(10px,2vw,28px)', background: '#1e3a8a', color: 'white', border: '3px solid #4a90d9', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(11px,2vw,16px)', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(30,58,138,0.5)' }}>
            Sair
          </button>
        </div>
        <div className="lj-nav-mobile-btns" style={{ display: 'none' }}>
          <button onClick={() => navigate('/meus-leiloes')} style={{ padding: 'clamp(8px,1.5vw,14px) clamp(10px,2vw,28px)', background: '#1e3a8a', color: 'white', border: '3px solid #4a90d9', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(11px,2vw,16px)', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(30,58,138,0.5)' }}>
            Meus Leilões
          </button>
          <Notifications user={user} />
          <button onClick={handleLogout} style={{ padding: 'clamp(8px,1.5vw,14px) clamp(10px,2vw,28px)', background: '#1e3a8a', color: 'white', border: '3px solid #4a90d9', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(11px,2vw,16px)', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(30,58,138,0.5)' }}>
            Sair
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ padding: '30px 20px 10px', textAlign: 'center' }}>
        <h3 style={{ color: 'white', fontSize: 'clamp(32px, 7vw, 60px)', fontWeight: 'bold', margin: '0 0 6px 0' }}>
          {userCity} - {userState}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(14px, 2.5vw, 20px)', margin: '0 0 20px 0' }}>
          veículos, objetos, móveis e imóveis
        </p>
        <button onClick={() => setShowCitySearch(!showCitySearch)} style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.3)', color: 'white', border: '2px solid white', borderRadius: '15px', fontSize: 'clamp(14px, 2vw, 18px)', cursor: 'pointer', fontWeight: 'bold', marginBottom: '16px' }}>
          Buscar em outra cidade
        </button>
        {showCitySearch && (
          <div style={{ marginTop: '10px', background: 'white', borderRadius: '15px', padding: '20px', maxWidth: '600px', margin: '10px auto 0' }}>
            <input type="text" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} placeholder="Digite o nome da cidade (mínimo 2 letras)..." style={{ width: '100%', padding: '15px', border: '2px solid #ddd', borderRadius: '10px', fontSize: '16px', marginBottom: '15px', boxSizing: 'border-box' }} />
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {searchCity.length < 2 && (<p style={{ textAlign: 'center', color: '#999' }}>Digite pelo menos 2 letras para buscar</p>)}
              {filteredCities.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                  {filteredCities.map(city => (
                    <button key={city.id} onClick={() => handleCitySelect(city)} style={{ padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', textAlign: 'left' }}>
                      {city.nome} - {city.microrregiao.mesorregiao.UF.sigla}
                    </button>
                  ))}
                </div>
              )}
              {searchCity.length >= 2 && filteredCities.length === 0 && (<p style={{ textAlign: 'center', color: '#999' }}>Nenhuma cidade encontrada</p>)}
            </div>
          </div>
        )}
      </div>

      {/* CONTEUDO PRINCIPAL */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 40px' }}>
        {/* BOTAO CRIAR NOVO LEILAO */}
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => navigate('/novo')} style={{ width: '100%', padding: 'clamp(16px, 3vw, 25px)', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '15px', fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 'bold', cursor: 'pointer' }}>
            + CRIAR NOVO LEILÃO
          </button>
        </div>
        {/* TITULO LEILOES ATIVOS */}
        <h2 style={{ color: 'white', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 'bold', marginBottom: '16px' }}>
          Leilões Ativos
        </h2>

        {/* BUSCA E FILTRO CATEGORIA */}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '14px 16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '30px', padding: '8px 16px', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar leilão..." style={{ border: 'none', outline: 'none', fontSize: '15px', width: '100%', background: 'transparent', color: '#333' }} />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#999', padding: '0' }}>X</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { val: '', label: 'Todos' },
              { val: 'veiculos', label: 'Veículos' },
              { val: 'eletronicos', label: 'Eletrônicos, Máquinas, Celulares' },
              { val: 'objetos', label: 'Objetos' },
              { val: 'moveis', label: 'Móveis' },
              { val: 'imoveis', label: 'Imóveis' },
              { val: 'outros', label: 'Outros' },
              { val: 'servicos', label: 'Serviços (lance menor vence)' }
            ].map(cat => (
              <button key={cat.val} onClick={() => setSelectedCategory(cat.val)} style={{ padding: '7px 16px', borderRadius: '20px', border: selectedCategory === cat.val ? '2px solid white' : '2px solid rgba(255,255,255,0.4)', background: selectedCategory === cat.val ? '#1e3a8a' : 'rgba(255,255,255,0.15)', color: 'white', fontWeight: selectedCategory === cat.val ? 'bold' : 'normal', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'white', fontSize: '20px' }}>Carregando leilões...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {displayedAuctions.map(auction => {
              const timeLeft = getTimeLeft(auction.ends_at)
              return (
                <div key={auction.id} onClick={() => navigate('/leilao/' + auction.id)}
                  style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {/* IMAGEM COM BADGE DE TEMPO */}
                  <div style={{ position: 'relative' }}>
                    <img
                      src={auction.images?.[0] || 'https://via.placeholder.com/300x200'}
                      alt={auction.title}
                      style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                    />
                    {timeLeft && (
                      <div translate="no" style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        background: timeLeft.urgent ? 'rgba(239,68,68,0.92)' : 'rgba(0,0,0,0.62)',
                        color: 'white',
                        padding: '5px 11px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        whiteSpace: 'nowrap'
                      }}>
                        {timeLeft.urgent ? '🔥' : '⏳'} {timeLeft.label}
                      </div>
                    )}
                  </div>

                  {/* CORPO DO CARD */}
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 'clamp(16px, 2vw, 20px)' }}>{auction.title}</h3>
                    <p style={{ color: '#666', marginBottom: '12px', fontSize: '14px' }}>{auction.city}</p>
                    <div style={{ fontSize: '13px', color: '#999' }}>Lance atual</div>
                    <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 'bold', color: '#667eea' }}>
                      R$ {parseFloat(auction.current_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && displayedAuctions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '15px' }}>
            <p style={{ color: 'white', fontSize: '22px' }}>Nenhum leilão ativo em {userCity}</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', marginTop: '10px' }}>Seja o primeiro a criar um leilão na sua cidade!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
