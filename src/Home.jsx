import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import Notifications from './Notifications'
import './styles.css'

function Home() {
  const [user, setUser] = useState(null)
  const [auctions, setAuctions] = useState([])
  const [filteredAuctions, setFilteredAuctions] = useState([])
  const [filter, setFilter] = useState('active')
  const [userCity, setUserCity] = useState('Ponta Grossa')
  const [userState, setUserState] = useState('PR')
  const [searchCity, setSearchCity] = useState('')
  const [showCitySearch, setShowCitySearch] = useState(false)
  const [allCities, setAllCities] = useState([])
  const [filteredCities, setFilteredCities] = useState([])
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
    filterAuctions()
  }, [auctions, filter])

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
      if (data.city) {
        setUserCity(data.city)
        setUserState(data.region_code || 'BR')
      }
    } catch (error) {
      console.log('Usando localização padrão')
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

  const isEnded = (auction) => {
    return auction.status === 'ended' || new Date(auction.ends_at) <= new Date()
  }

  if (!user) return <div>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-100)' }}>
      {/* Header Premium */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid var(--gray-200)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div className="container" style={{
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: '900',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            LEILÃO DO BAIRRO
          </h1>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Notifications user={user} />
            <button 
              onClick={() => navigate('/meus-leiloes')}
              style={{
                padding: '12px 20px',
                background: 'linear-gradient(135deg, var(--secondary) 0%, var(--secondary-dark) 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 12px rgba(0, 78, 137, 0.2)'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              📦 Meus Leilões
            </button>
            <button 
              onClick={handleLogout}
              style={{
                padding: '12px 20px',
                background: 'white',
                color: 'var(--gray-700)',
                border: '2px solid var(--gray-300)',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => (e.target.style.borderColor = 'var(--danger)', e.target.style.color = 'var(--danger)')}
              onMouseLeave={(e) => (e.target.style.borderColor = 'var(--gray-300)', e.target.style.color = 'var(--gray-700)')}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #FF6B35 0%, #004E89 100%)',
        padding: '60px 20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decoração */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '600px',
          height: '600px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(80px)'
        }} />

        <div className="container animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '56px',
            fontWeight: '900',
            color: 'white',
            textAlign: 'center',
            marginBottom: '16px',
            letterSpacing: '-1px',
            textShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            COMPRE E VENDA<br/>PERTO DE VOCÊ
          </h2>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <span style={{
              fontSize: '32px',
              fontWeight: '800',
              color: 'white',
              fontFamily: 'var(--font-display)'
            }}>
              📍 {userCity} - {userState}
            </span>
          </div>

          <p style={{
            fontSize: '20px',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            fontWeight: '500',
            marginBottom: '32px'
          }}>
            serviços, objetos, móveis e imóveis
          </p>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={() => setShowCitySearch(!showCitySearch)}
              style={{
                padding: '16px 32px',
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => (e.target.style.background = 'rgba(255,255,255,0.3)', e.target.style.borderColor = 'white')}
              onMouseLeave={(e) => (e.target.style.background = 'rgba(255,255,255,0.2)', e.target.style.borderColor = 'rgba(255,255,255,0.3)')}
            >
              🔍 Buscar em outra cidade
            </button>
          </div>

          {/* Modal de busca de cidade */}
          {showCitySearch && (
            <div className="animate-scale-in" style={{
              marginTop: '32px',
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '600px',
              margin: '32px auto 0',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <input 
                type="text" 
                value={searchCity} 
                onChange={(e) => setSearchCity(e.target.value)} 
                placeholder="Digite o nome da cidade (mínimo 2 letras)..." 
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px solid var(--gray-300)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontFamily: 'var(--font-body)',
                  marginBottom: '16px',
                  outline: 'none'
                }}
              />
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {searchCity.length < 2 && (
                  <p style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Digite pelo menos 2 letras</p>
                )}
                {filteredCities.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {filteredCities.map(city => (
                      <button 
                        key={city.id} 
                        onClick={() => handleCitySelect(city)} 
                        style={{
                          padding: '12px',
                          background: 'var(--gray-100)',
                          color: 'var(--gray-900)',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => (e.target.style.background = 'var(--primary)', e.target.style.color = 'white')}
                        onMouseLeave={(e) => (e.target.style.background = 'var(--gray-100)', e.target.style.color = 'var(--gray-900)')}
                      >
                        {city.nome} - {city.microrregiao.mesorregiao.UF.sigla}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="container" style={{ padding: '40px 20px' }}>
        {/* CTA Criar Leilão */}
        <button 
          onClick={() => navigate('/novo')}
          className="animate-slide-up"
          style={{
            width: '100%',
            padding: '24px',
            background: 'linear-gradient(135deg, var(--success) 0%, #04B682 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontSize: '24px',
            fontWeight: '800',
            fontFamily: 'var(--font-display)',
            cursor: 'pointer',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(6, 214, 160, 0.3)',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => (e.target.style.transform = 'translateY(-4px)', e.target.style.boxShadow = '0 12px 32px rgba(6, 214, 160, 0.4)')}
          onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 8px 24px rgba(6, 214, 160, 0.3)')}
        >
          ➕ CRIAR NOVO LEILÃO
        </button>
        <p style={{
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--gray-600)',
          fontWeight: '600',
          marginBottom: '40px'
        }}>
          🚀 clique e venda!
        </p>

        {/* Filtros Premium */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          justifyContent: 'center'
        }}>
          <button 
            onClick={() => setFilter('active')}
            style={{
              flex: 1,
              maxWidth: '200px',
              padding: '16px',
              background: filter === 'active' ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' : 'white',
              color: filter === 'active' ? 'white' : 'var(--gray-700)',
              border: filter === 'active' ? 'none' : '2px solid var(--gray-300)',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: filter === 'active' ? '0 4px 16px rgba(255, 107, 53, 0.3)' : 'none'
            }}
          >
            🔥 Ativos
          </button>
          <button 
            onClick={() => setFilter('ended')}
            style={{
              flex: 1,
              maxWidth: '200px',
              padding: '16px',
              background: filter === 'ended' ? 'linear-gradient(135deg, var(--gray-700) 0%, var(--gray-800) 100%)' : 'white',
              color: filter === 'ended' ? 'white' : 'var(--gray-700)',
              border: filter === 'ended' ? 'none' : '2px solid var(--gray-300)',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '700',
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: filter === 'ended' ? '0 4px 16px rgba(0, 0, 0, 0.2)' : 'none'
            }}
          >
            🏁 Encerrados
          </button>
        </div>

        {/* Grid de Leilões Premium */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {filteredAuctions.map((auction, index) => (
            <div 
              key={auction.id}
              onClick={() => navigate(`/leilao/${auction.id}`)}
              className="animate-fade-in"
              style={{
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: '1px solid var(--gray-200)',
                animationDelay: `${index * 0.1}s`,
                position: 'relative'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-8px)', e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}
            >
              {/* Badge de Status */}
              {isEnded(auction) && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'var(--danger)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(239, 71, 111, 0.4)'
                }}>
                  🏁 ENCERRADO
                </div>
              )}

              {/* Imagem */}
              <div style={{
                width: '100%',
                height: '220px',
                overflow: 'hidden',
                background: 'var(--gray-200)'
              }}>
                <img 
                  src={auction.photos?.[0] || 'https://via.placeholder.com/320x220'} 
                  alt={auction.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                />
              </div>

              {/* Conteúdo */}
              <div style={{ padding: '20px' }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--gray-900)',
                  marginBottom: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {auction.title}
                </h3>
                
                <p style={{
                  fontSize: '14px',
                  color: 'var(--gray-600)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  📍 {auction.city}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--gray-600)',
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>
                      Lance atual
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '28px',
                      fontWeight: '800',
                      color: 'var(--primary)'
                    }}>
                      R$ {parseFloat(auction.starting_bid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <button style={{
                    padding: '12px 24px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: '700',
                    fontSize: '14px',
                    fontFamily: 'var(--font-display)',
                    cursor: 'pointer'
                  }}>
                    VER MAIS →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Estado vazio */}
        {filteredAuctions.length === 0 && (
          <div className="animate-fade-in" style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'white',
            borderRadius: '16px',
            border: '2px dashed var(--gray-300)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--gray-900)',
              marginBottom: '8px'
            }}>
              Nenhum leilão encontrado
            </h3>
            <p style={{
              fontSize: '16px',
              color: 'var(--gray-600)',
              marginBottom: '24px'
            }}>
              Seja o primeiro a criar um leilão em {userCity}!
            </p>
            <button 
              onClick={() => navigate('/novo')}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '16px',
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(255, 107, 53, 0.3)'
              }}
            >
              ➕ CRIAR PRIMEIRO LEILÃO
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home