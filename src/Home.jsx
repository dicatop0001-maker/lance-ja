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
.lj-nav-logo { display: flex; justify-content: center; }
.lj-nav-left, .lj-nav-right { display: flex; align-items: center; gap: 8px; }
.lj-nav-right { justify-content: flex-end; }
@media (max-width: 599px) {
  .lj-nav { grid-template-columns: 1fr; grid-template-rows: auto auto; }
  .lj-nav-logo { grid-column: 1; grid-row: 1; }
  .lj-nav-left { display: none; }
  .lj-nav-right { display: none; }
  .lj-nav-mobile-btns { grid-column: 1; grid-row: 2; display: flex !important; justify-content: center; gap: 8px; }
}
@media (min-width: 600px) {
  .lj-nav-mobile-btns { display: none !important; }
}
`

function getTimeLeft(endsAt) {
  const now = new Date()
  const end = new Date(endsAt)
  const diffMs = end - now
  if (diffMs <= 0) return null
  const diffMin = Math.floor(diffMs / 1000 / 60)
  const diffH = Math.floor(diffMs / 1000 / 60 / 60)
  const diffD = Math.floor(diffMs / 1000 / 60 / 60 / 24)
  if (diffMin < 60) return { label: diffMin + ' min restantes', urgent: true }
  if (diffH < 24) return { label: diffH + (diffH === 1 ? ' hora restante' : ' horas restantes'), urgent: true }
  if (diffD === 1) return { label: '1 dia restante', urgent: false }
  return { label: diffD + ' dias restantes', urgent: false }
}

function Home() {
  const [user, setUser] = useState(null)
  const [auctions, setAuctions] = useState([])
  const [activeAuctions, setActiveAuctions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [userCity, setUserCity] = useState('Ponta Grossa')
  const [userState, setUserState] = useState('PR')
  const [userNeighborhood, setUserNeighborhood] = useState('')
  const [showBuscaPanel, setShowBuscaPanel] = useState(false)
  const [buscaTab, setBuscaTab] = useState('bairro')
  const [searchBairro, setSearchBairro] = useState('')
  const [searchCity, setSearchCity] = useState('')
  const [allCities, setAllCities] = useState([])
  const [filteredCities, setFilteredCities] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkUser(); detectLocation(); loadBrazilianCities()
    const timer = setInterval(() => {}, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => { if (user) loadAuctions() }, [user, userCity])

  useEffect(() => {
    const n = new Date()
    const filtered = auctions.filter(a =>
      (a.status === 'active' || !a.status) &&
      (a.tipo === 'anuncio' || !a.ends_at || new Date(a.ends_at) > n)
    )
    const sameN = filtered.filter(a =>
      userNeighborhood && a.neighborhood &&
      a.neighborhood.toLowerCase().trim() === userNeighborhood.toLowerCase().trim()
    )
    const otherN = filtered.filter(a =>
      !(userNeighborhood && a.neighborhood &&
        a.neighborhood.toLowerCase().trim() === userNeighborhood.toLowerCase().trim())
    )
    setActiveAuctions([...sameN, ...otherN])
  }, [auctions, userNeighborhood])

  useEffect(() => {
    if (searchCity.length >= 2) {
      setFilteredCities(allCities.filter(c => c.nome.toLowerCase().includes(searchCity.toLowerCase())).slice(0, 50))
    } else {
      setFilteredCities([])
    }
  }, [searchCity, allCities])

  const loadBrazilianCities = async () => {
    try {
      const r = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
      setAllCities(await r.json())
    } catch (e) {}
  }

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/'); return }
    setUser(session.user)
  }

  const detectLocation = async () => {
    try {
      const r = await fetch('https://ipapi.co/json/')
      const d = await r.json()
      if (d.city) { setUserCity(d.city); setUserState(d.region_code || 'BR') }
    } catch (e) {}
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
    setUserNeighborhood('')
    setShowBuscaPanel(false)
    setSearchCity('')
  }

  const handleBairroSelect = (bairro) => {
    setUserNeighborhood(bairro)
    setShowBuscaPanel(false)
    setSearchBairro('')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const bairrosDisponiveis = [...new Set(
    auctions.map(a => a.neighborhood).filter(b => b && b.trim() !== '')
  )].sort()

  const bairrosFiltrados = searchBairro.length >= 1
    ? bairrosDisponiveis.filter(b => b.toLowerCase().includes(searchBairro.toLowerCase()))
    : bairrosDisponiveis

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

      <nav className="lj-nav">
        <div className="lj-nav-left">
          <button onClick={() => navigate('/meus-leiloes')} style={{ padding: 'clamp(8px,1.5vw,14px) clamp(10px,2vw,28px)', background: '#1e3a8a', color: 'white', border: '3px solid #4a90d9', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(11px,2vw,16px)', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(30,58,138,0.5)' }}>Meus Leilões</button>
        </div>
        <div className="lj-nav-logo">
          <img src="/logo-leilao.png" alt="Zap Bairro" style={{ height: 'clamp(130px, 36vw, 400px)', maxWidth: 'clamp(320px, 95vw, 900px)', width: '100%', objectFit: 'contain', borderRadius: '10px', cursor: 'pointer', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.35))' }} onClick={() => navigate('/home')} />
        </div>
        <div className="lj-nav-right">
          <Notifications user={user} />
          <button onClick={handleLogout} style={{ padding: 'clamp(8px,1.5vw,14px) clamp(10px,2vw,28px)', background: '#1e3a8a', color: 'white', border: '3px solid #4a90d9', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(11px,2vw,16px)', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(30,58,138,0.5)' }}>Sair</button>
        </div>
        <div className="lj-nav-mobile-btns" style={{ display: 'none' }}>
          <button onClick={() => navigate('/meus-leiloes')} style={{ padding: 'clamp(8px,1.5vw,14px) clamp(10px,2vw,28px)', background: '#1e3a8a', color: 'white', border: '3px solid #4a90d9', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(11px,2vw,16px)', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(30,58,138,0.5)' }}>Meus Leilões</button>
          <Notifications user={user} />
          <button onClick={handleLogout} style={{ padding: 'clamp(8px,1.5vw,14px) clamp(10px,2vw,28px)', background: '#1e3a8a', color: 'white', border: '3px solid #4a90d9', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(11px,2vw,16px)', whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(30,58,138,0.5)' }}>Sair</button>
        </div>
      </nav>

      <div style={{ padding: '30px 20px 10px', textAlign: 'center' }}>
        <h3 style={{ color: 'white', fontSize: 'clamp(32px, 7vw, 60px)', fontWeight: 'bold', margin: '0 0 4px 0' }}>{userCity} - {userState}</h3>
        {userNeighborhood && (
          <div style={{ color: '#fbbf24', fontSize: 'clamp(14px,2.5vw,20px)', fontWeight: '700', marginBottom: '4px' }}>📍 Bairro: {userNeighborhood}</div>
        )}
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(13px, 2vw, 17px)', margin: '0 0 14px 0' }}>veículos, objetos, móveis e imóveis</p>

        <button onClick={() => setShowBuscaPanel(!showBuscaPanel)} style={{ padding: '14px 36px', background: showBuscaPanel ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.25)', color: 'white', border: '2px solid rgba(255,255,255,0.8)', borderRadius: '15px', fontSize: 'clamp(15px, 2vw, 19px)', cursor: 'pointer', fontWeight: 'bold', marginBottom: '14px' }}>
          🔍 Busca por bairro
        </button>

        {showBuscaPanel && (
          <div style={{ background: 'white', borderRadius: '18px', padding: '20px', maxWidth: '560px', margin: '0 auto 10px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '2px solid #e2e8f0', marginBottom: '16px' }}>
              <button onClick={() => setBuscaTab('bairro')} style={{ flex: 1, padding: '11px', background: buscaTab === 'bairro' ? '#667eea' : 'white', color: buscaTab === 'bairro' ? 'white' : '#555', fontWeight: 'bold', fontSize: '15px', border: 'none', cursor: 'pointer' }}>📍 Outro bairro</button>
              <button onClick={() => setBuscaTab('cidade')} style={{ flex: 1, padding: '11px', background: buscaTab === 'cidade' ? '#667eea' : 'white', color: buscaTab === 'cidade' ? 'white' : '#555', fontWeight: 'bold', fontSize: '15px', border: 'none', cursor: 'pointer', borderLeft: '2px solid #e2e8f0' }}>🏙️ Outra cidade</button>
            </div>

            {buscaTab === 'bairro' && (
              <div>
                <p style={{ color: '#666', fontSize: '13px', marginBottom: '10px', textAlign: 'left' }}>Bairros com anúncios em <strong>{userCity}</strong>:</p>
                <input type="text" value={searchBairro} onChange={e => setSearchBairro(e.target.value)} placeholder="Filtrar bairro..." style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '15px', marginBottom: '10px', boxSizing: 'border-box' }} />
                {bairrosFiltrados.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#aaa', fontSize: '14px', padding: '10px 0' }}>{bairrosDisponiveis.length === 0 ? 'Nenhum bairro cadastrado ainda.' : 'Nenhum bairro encontrado.'}</p>
                )}
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {userNeighborhood && (
                    <button onClick={() => handleBairroSelect('')} style={{ padding: '10px 14px', background: '#fee2e2', color: '#dc2626', border: '2px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', textAlign: 'left' }}>✕ Ver todos os bairros</button>
                  )}
                  {bairrosFiltrados.map((b, i) => (
                    <button key={i} onClick={() => handleBairroSelect(b)} style={{ padding: '10px 14px', background: userNeighborhood === b ? '#667eea' : '#f1f5f9', color: userNeighborhood === b ? 'white' : '#333', border: userNeighborhood === b ? '2px solid #667eea' : '2px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', textAlign: 'left' }}>📍 {b}</button>
                  ))}
                </div>
              </div>
            )}

            {buscaTab === 'cidade' && (
              <div>
                <input type="text" value={searchCity} onChange={e => setSearchCity(e.target.value)} placeholder="Digite o nome da cidade (mínimo 2 letras)..." style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box' }} />
                <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                  {searchCity.length < 2 && <p style={{ textAlign: 'center', color: '#aaa', fontSize: '14px' }}>Digite pelo menos 2 letras</p>}
                  {filteredCities.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '8px' }}>
                      {filteredCities.map(city => (
                        <button key={city.id} onClick={() => handleCitySelect(city)} style={{ padding: '11px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', textAlign: 'left' }}>{city.nome} - {city.microrregiao.mesorregiao.UF.sigla}</button>
                      ))}
                    </div>
                  )}
                  {searchCity.length >= 2 && filteredCities.length === 0 && <p style={{ textAlign: 'center', color: '#aaa' }}>Nenhuma cidade encontrada</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 40px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => navigate('/anuncio')} style={{ width: '100%', padding: 'clamp(16px, 3vw, 25px)', background: '#f97316', color: 'white', border: 'none', borderRadius: '15px', fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 'bold', cursor: 'pointer' }}>📢 + CRIAR SEU ANÚNCIO</button>
          <button onClick={() => navigate('/novo')} style={{ width: '100%', padding: 'clamp(16px, 3vw, 25px)', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '15px', fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 'bold', cursor: 'pointer' }}>🔨 + CRIAR NOVO LEILÃO</button>
        </div>

        <h2 style={{ color: 'white', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 'bold', marginBottom: '16px' }}>
          Leilões e itens Ativos{userNeighborhood && <span style={{ fontSize: '16px', fontWeight: '400', opacity: 0.85, marginLeft: '10px' }}>· bairro {userNeighborhood} primeiro</span>}
        </h2>

        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '14px 16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '30px', padding: '8px 16px', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar leilões e itens..." style={{ border: 'none', outline: 'none', fontSize: '15px', width: '100%', background: 'transparent', color: '#333' }} />
            {searchTerm && <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#999', padding: '0' }}>✕</button>}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[{val:'',label:'Todos'},{val:'veiculos',label:'Veículos'},{val:'eletronicos',label:'Eletrônicos'},{val:'objetos',label:'Objetos'},{val:'moveis',label:'Móveis'},{val:'imoveis',label:'Imóveis'},{val:'outros',label:'Outros'},{val:'servicos',label:'Serviços'}].map(cat => (
              <button key={cat.val} onClick={() => setSelectedCategory(cat.val)} style={{ padding: '7px 16px', borderRadius: '20px', border: selectedCategory === cat.val ? '2px solid white' : '2px solid rgba(255,255,255,0.4)', background: selectedCategory === cat.val ? '#1e3a8a' : 'rgba(255,255,255,0.15)', color: 'white', fontWeight: selectedCategory === cat.val ? 'bold' : 'normal', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{cat.label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'white', fontSize: '20px' }}>Carregando...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {displayedAuctions.map(auction => {
              const timeLeft = getTimeLeft(auction.ends_at)
              const isAnuncio = auction.tipo === 'anuncio' || !auction.ends_at
              const isSameN = userNeighborhood && auction.neighborhood &&
                auction.neighborhood.toLowerCase().trim() === userNeighborhood.toLowerCase().trim()
              const bairroLabel = (auction.neighborhood && auction.neighborhood.trim() !== '')
                ? auction.neighborhood : auction.city

              return (
                <div key={auction.id}
                  onClick={() => navigate('/leilao/' + auction.id)}
                  style={{
                    background: 'white',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: isSameN
                      ? '0 0 0 3px #f97316, 0 8px 24px rgba(0,0,0,0.18)'
                      : '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {/* AREA DA IMAGEM - overflow hidden e fontSize 0 para esconder alt text */}
                  <div style={{
                    position: 'relative',
                    height: '190px',
                    overflow: 'hidden',
                    backgroundColor: '#f1f5f9',
                    fontSize: 0,
                    lineHeight: 0
                  }}>
                    <img
                      src={auction.images?.[0] || ''}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        fontSize: 0
                      }}
                      onError={e => { e.target.style.display = 'none' }}
                    />

                    {/* TEMPO — TOPO ESQUERDO */}
                    {timeLeft && (
                      <div translate="no" style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: timeLeft.urgent ? 'rgba(220,38,38,0.95)' : 'rgba(30,58,138,0.92)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        whiteSpace: 'nowrap',
                        zIndex: 2,
                        lineHeight: '1.4'
                      }}>
                        {timeLeft.urgent ? '🔥' : '⏳'} {timeLeft.label}
                      </div>
                    )}

                    {/* BADGE ANUNCIO — TOPO DIREITO */}
                    {isAnuncio && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(249,115,22,0.95)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        zIndex: 2,
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        lineHeight: '1.4'
                      }}>📢 ANÚNCIO</div>
                    )}

                    {/* BAIRRO — FUNDO VERDE SÓLIDO NA BASE */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      right: '0',
                      background: '#16a34a',
                      color: 'white',
                      padding: '5px 10px',
                      fontSize: '12px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 2,
                      lineHeight: '1.4'
                    }}>
                      📍 {bairroLabel}
                      {isSameN && (
                        <span style={{ marginLeft: 'auto', background: '#f97316', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '1px 8px', borderRadius: '10px' }}>Perto de você ⭐</span>
                      )}
                    </div>
                  </div>

                  {/* CORPO — separado da imagem, sem sobreposição */}
                  <div style={{ padding: '14px 16px' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: '1.3', color: '#1a202c' }}>{auction.title}</h3>
                    <p style={{ color: '#888', fontSize: '13px', margin: '0 0 10px 0' }}>{auction.city}</p>
                    <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '2px' }}>{isAnuncio ? 'Preço' : 'Lance atual'}</div>
                    <div style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 'bold', color: isAnuncio ? '#f97316' : '#667eea' }}>
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
            <p style={{ color: 'white', fontSize: '22px' }}>Nenhum leilão ativo em {userCity}{userNeighborhood ? ' · ' + userNeighborhood : ''}</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', marginTop: '10px' }}>Seja o primeiro a criar um leilão na sua cidade!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
