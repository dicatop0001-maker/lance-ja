import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

function getTimeLeft(endsAt) {
  const diffMs = new Date(endsAt) - new Date()
  const diffH   = Math.floor(diffMs / 3600000)
  const diffD   = Math.floor(diffMs / 86400000)
  if (diffMin < 60)  return { label: diffMin + ' min para dar lance', urgent: true }
  if (diffH   < 24)  return { label: diffH + (diffH === 1 ? ' hora para dar lance' : ' horas para dar lance'), urgent: true }
  if (diffD   === 1) return { label: '1 dia para dar lance', urgent: false }
  return { label: diffD + ' dias para dar lance', urgent: false }
}

function Vitrine() {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('')
  const [cityState, setCityState] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    detectAndLoad()
  }, [])

  const detectAndLoad = async () => {
    let detectedCity = 'Ponta Grossa'
    let detectedState = 'PR'
    try {
      const res = await fetch('https://ipapi.co/json/')
      const data = await res.json()
      if (data.city) { detectedCity = data.city; detectedState = data.region_code || 'BR' }
    } catch (e) {}
    setCity(detectedCity)
    setCityState(detectedState)
    await loadAuctions(detectedCity)
  }

  const loadAuctions = async (targetCity) => {
    setLoading(true)
    const { data } = await supabase
      .from('auctions')
      .select('id, title, description, city, category, current_price, images, ends_at, status')
      .eq('city', targetCity)
      .order('created_at', { ascending: false })
    const now = new Date()
    const active = (data || []).filter(a =>
      (a.status === 'active' || !a.status) && new Date(a.ends_at) > now
    )
    setAuctions(active)
    setLoading(false)
  }

  const displayed = auctions.filter(a => {
    const matchSearch = !searchTerm ||
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = !selectedCategory || a.category?.toLowerCase() === selectedCategory
    return matchSearch && matchCat
  })

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>

      {/* HEADER */}
      <div style={{
        background: 'rgba(0,0,0,0.25)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <img
          src="/logo-leilao.png"
          alt="Leilão do Bairro"
          style={{ height: '52px', objectFit: 'contain', borderRadius: '8px', cursor: 'pointer' }}
          onClick={() => navigate('/vitrine')}
        />
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 22px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: '50px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            Entrar
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 22px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(76,175,80,0.4)'
            }}
          >
            + Criar Leilão
          </button>
        </div>
      </div>

      {/* HERO */}
      <div style={{ padding: '28px 20px 16px', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: 'clamp(26px, 6vw, 48px)', fontWeight: 'bold', margin: '0 0 6px 0' }}>
          {city ? city + ' — ' + cityState : 'Leilões perto de você'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(14px, 2.5vw, 18px)', margin: '0 0 18px 0' }}>
          Dê um lance e compre perto de você 👇
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '14px 36px',
            background: 'linear-gradient(135deg, #FF6B35, #f7b733)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            fontSize: 'clamp(15px, 2.5vw, 18px)',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(255,107,53,0.45)',
            marginBottom: '8px'
          }}
        >
          🚀 Quero dar um lance! Entrar grátis
        </button>
      </div>

      {/* CONTEÚDO */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px 40px' }}>

        {/* BARRA BUSCA + FILTROS */}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '14px 16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '30px', padding: '8px 16px', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar leilão..."
              style={{ border: 'none', outline: 'none', fontSize: '15px', width: '100%', background: 'transparent', color: '#333' }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#999' }}>✕</button>
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
              { val: 'servicos', label: 'Serviços' }
            ].map(cat => (
              <button
                translate="no"
                key={cat.val}
                onClick={() => setSelectedCategory(cat.val)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '20px',
                  border: selectedCategory === cat.val ? '2px solid white' : '2px solid rgba(255,255,255,0.4)',
                  background: selectedCategory === cat.val ? '#1e3a8a' : 'rgba(255,255,255,0.15)',
                  color: 'white',
                  fontWeight: selectedCategory === cat.val ? 'bold' : 'normal',
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* TITULO */}
        <h2 style={{ color: 'white', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 'bold', marginBottom: '16px' }}>
          Leilões Ativos
        </h2>

        {/* CARDS */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'white', fontSize: '20px' }}>Carregando leilões...</div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px' }}>
            <p style={{ color: 'white', fontSize: '20px', marginBottom: '12px' }}>Nenhum leilão ativo por aqui ainda</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', marginBottom: '24px' }}>Seja o primeiro a criar um leilão na sua cidade!</p>
            <button onClick={() => navigate('/')} style={{ padding: '14px 32px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              + Criar leilão grátis
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {displayed.map(auction => {
              const timeLeft = getTimeLeft(auction.ends_at)
              return (
                <div
                  key={auction.id}
                  style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  onClick={() => navigate('/')}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={auction.images?.[0] || 'https://via.placeholder.com/300x200'}
                      alt={auction.title}
                      style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                    />
                    {timeLeft && (
                      <div translate="no" style={{
                        position: 'absolute', bottom: '10px', left: '10px',
                        background: timeLeft.urgent ? 'rgba(239,68,68,0.92)' : 'rgba(0,0,0,0.62)',
                        color: 'white', padding: '5px 11px', borderRadius: '20px',
                        fontSize: '12px', fontWeight: 'bold', backdropFilter: 'blur(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: '5px'
                      }}>
                        {timeLeft.urgent ? '🔥' : '⏳'} {timeLeft.label}
                      </div>
                    )}
                    {/* OVERLAY BLOQUEADO */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(102,126,234,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'opacity 0.2s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                    >
                      <div style={{ background: 'rgba(0,0,0,0.75)', color: 'white', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '14px' }}>
                        🔒 Entre grátis para dar lance
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: 'clamp(15px, 2vw, 18px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{auction.title}</h3>
                    <p style={{ color: '#888', marginBottom: '10px', fontSize: '13px' }}>{auction.city}</p>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>Lance atual</div>
                    <div style={{ fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 'bold', color: '#667eea' }}>
                      R$ {parseFloat(auction.current_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); navigate('/') }}
                      style={{
                        marginTop: '12px', width: '100%', padding: '10px',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white', border: 'none', borderRadius: '10px',
                        fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
                      }}
                    >
                      🔒 Entrar para dar lance
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* RODAPÉ CTA */}
        <div style={{ marginTop: '40px', textAlign: 'center', padding: '32px 20px', background: 'rgba(255,255,255,0.12)', borderRadius: '20px' }}>
          <p style={{ color: 'white', fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 'bold', marginBottom: '8px' }}>
            Quer vender algo? É grátis!
          </p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', marginBottom: '20px' }}>
            Crie seu leilão em menos de 2 minutos e alcance compradores na sua cidade
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '16px 40px',
              background: '#4CAF50',
              color: 'white', border: 'none', borderRadius: '50px',
              fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(76,175,80,0.4)'
            }}
          >
            + Criar meu leilão grátis
          </button>
        </div>
      </div>
    </div>
  )
}

export default Vitrine
