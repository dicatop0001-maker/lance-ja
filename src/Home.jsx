import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import Notifications from './Notifications'

const blinkStyle = `
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.15; }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
}
.aviso-lance {
  animation: blink 1.2s ease-in-out infinite;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.mao-bounce {
  display: inline-block;
  animation: bounce 0.8s ease-in-out infinite;
  font-size: 2em;
}
`

function Home() {
  const [user, setUser] = useState(null)
  const [auctions, setAuctions] = useState([])
  const [activeAuctions, setActiveAuctions] = useState([])
  const [userCity, setUserCity] = useState('Ponta Grossa')
  const [userState, setUserState] = useState('PR')
  const [searchCity, setSearchCity] = useState('')
  const [showCitySearch, setShowCitySearch] = useState(false)
  const [allCities, setAllCities] = useState([])
  const [filteredCities, setFilteredCities] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkUser()
    detectLocation()
    loadBrazilianCities()
  }, [])

  useEffect(() => {
    if (user) loadAuctions()
  }, [user, userCity])

  useEffect(() => {
    const now = new Date()
    setActiveAuctions(
      auctions.filter(a =>
        (a.status === 'active' || !a.status) && new Date(a.ends_at) > now
      )
    )
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
      if (data.city) {
        setUserCity(data.city)
        setUserState(data.region_code || 'BR')
      }
    } catch (error) {
      console.log('Usando localizacao padrao: Ponta Grossa - PR')
    }
  }

  const loadAuctions = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('auctions')
      .select('*')
      .eq('city', userCity)
      .order('created_at', { ascending: false })
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

  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <style>{blinkStyle}</style>

      {/* NAVBAR */}
      <nav style={{
        padding: '10px 16px',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(8px)',
        gap: '10px',
        minHeight: '100px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/meus-leiloes')}
            style={{
              padding: '12px 22px',
              background: 'rgba(255,255,255,0.25)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.8)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '15px',
              whiteSpace: 'nowrap'
            }}
          >
            Meus Leiloes
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img
            src="/logo-leilao.png"
            alt="Leilao do Bairro"
            style={{
              height: 'clamp(80px, 14vw, 180px)',
              maxWidth: '60vw',
              objectFit: 'contain',
              borderRadius: '10px',
              cursor: 'pointer',
              filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.35))'
            }}
            onClick={() => navigate('/home')}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Notifications user={user} />
          <button
            onClick={handleLogout}
            style={{
              padding: '12px 22px',
              background: 'rgba(255,255,255,0.25)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.8)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '15px',
              whiteSpace: 'nowrap'
            }}
          >
            Sair
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ padding: '30px 20px 10px', textAlign: 'center' }}>
        <h3 style={{
          color: 'white',
          fontSize: 'clamp(32px, 7vw, 60px)',
          fontWeight: 'bold',
          margin: '0 0 6px 0'
        }}>
          {userCity} - {userState}
        </h3>
        <p style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: 'clamp(14px, 2.5vw, 20px)',
          margin: '0 0 20px 0'
        }}>
          veiculos, objetos, moveis e imoveis
        </p>

        <button
          onClick={() => setShowCitySearch(!showCitySearch)}
          style={{
            padding: '14px 28px',
            background: 'rgba(255,255,255,0.3)',
            color: 'white',
            border: '2px solid white',
            borderRadius: '15px',
            fontSize: 'clamp(14px, 2vw, 18px)',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}
        >
          Buscar em outra cidade
        </button>

        {showCitySearch && (
          <div style={{
            marginTop: '10px',
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            maxWidth: '600px',
            margin: '10px auto 0'
          }}>
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Digite o nome da cidade (minimo 2 letras)..."
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #ddd',
                borderRadius: '10px',
                fontSize: '16px',
                marginBottom: '15px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {searchCity.length < 2 && (
                <p style={{ textAlign: 'center', color: '#999' }}>Digite pelo menos 2 letras para buscar</p>
              )}
              {filteredCities.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '10px'
                }}>
                  {filteredCities.map(city => (
                    <button
                      key={city.id}
                      onClick={() => handleCitySelect(city)}
                      style={{
                        padding: '12px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        textAlign: 'left'
                      }}
                    >
                      {city.nome} - {city.microrregiao.mesorregiao.UF.sigla}
                    </button>
                  ))}
                </div>
              )}
              {searchCity.length >= 2 && filteredCities.length === 0 && (
                <p style={{ textAlign: 'center', color: '#999' }}>Nenhuma cidade encontrada</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CONTEUDO PRINCIPAL */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 40px' }}>

        {/* BOTAO CRIAR NOVO LEILAO */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => navigate('/novo')}
            style={{
              width: '100%',
              padding: 'clamp(16px, 3vw, 25px)',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              fontSize: 'clamp(18px, 3vw, 24px)',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            + CRIAR NOVO LEILAO
          </button>
          <div style={{ fontSize: '14px', color: 'white', marginTop: '8px', textAlign: 'center' }}>
            clique e venda!
          </div>
        </div>

        {/* AVISO PISCANDO */}
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          padding: '14px',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '14px'
        }}>
          <span className="aviso-lance" style={{
            color: 'white',
            fontSize: 'clamp(16px, 2.5vw, 22px)',
            fontWeight: 'bold',
            letterSpacing: '0.5px'
          }}>
            <span className="mao-bounce">👇</span>
            escolha e de um lance!
            <span className="mao-bounce">👇</span>
          </span>
        </div>

        {/* TITULO LEILOES ATIVOS */}
        <h2 style={{
          color: 'white',
          fontSize: 'clamp(22px, 4vw, 32px)',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}>
          Leiloes Ativos
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'white', fontSize: '20px' }}>
            Carregando leiloes...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {activeAuctions.map(auction => (
              <div
                key={auction.id}
                onClick={() => navigate('/leilao/' + auction.id)}
                style={{
                  background: 'white',
                  borderRadius: '15px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <img
                  src={auction.images?.[0] || 'https://via.placeholder.com/300x200'}
                  alt={auction.title}
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                />
                <div style={{ padding: '16px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 'clamp(16px, 2vw, 20px)' }}>{auction.title}</h3>
                  <p style={{ color: '#666', marginBottom: '12px', fontSize: '14px' }}>{auction.city}</p>
                  <div style={{ fontSize: '13px', color: '#999' }}>Lance atual</div>
                  <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 'bold', color: '#667eea' }}>
                    R$ {parseFloat(auction.current_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && activeAuctions.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '15px'
          }}>
            <p style={{ color: 'white', fontSize: '22px' }}>
              Nenhum leilao ativo em {userCity}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', marginTop: '10px' }}>
              Seja o primeiro a criar um leilao na sua cidade!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
