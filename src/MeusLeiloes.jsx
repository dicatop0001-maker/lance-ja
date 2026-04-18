import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'

const meusLeiloesStyle = `
.ml-grid-topo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 40px;
}
.ml-grid-leiloes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}
@media (max-width: 768px) {
  .ml-grid-topo { grid-template-columns: 1fr; gap: 16px; margin-bottom: 24px; }
  .ml-grid-leiloes { grid-template-columns: 1fr 1fr; gap: 12px; }
}
@media (max-width: 480px) {
  .ml-grid-leiloes { grid-template-columns: 1fr; gap: 12px; }
}
`

function MeusLeiloes() {
  const [user, setUser] = useState(null)
  const [myAuctions, setMyAuctions] = useState([])
  const [bidsCount, setBidsCount] = useState({})
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [views, setViews] = useState(0)
  const [repostModal, setRepostModal] = useState(null) // auction sendo repostado
  const [repostPrice, setRepostPrice] = useState('')
  const [repostDate, setRepostDate] = useState('')
  const [reposting, setReposting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { checkUser() }, [])
  useEffect(() => {
    if (user) { loadMyAuctions(); generateQRCode(); loadViews() }
  }, [user])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/'); return }
    setUser(session.user)
  }

  const loadMyAuctions = async () => {
    const { data } = await supabase
      .from('auctions')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
    if (data) {
      setMyAuctions(data)
      // Busca contagem de lances para cada leilão
      const ids = data.map(a => a.id)
      if (ids.length > 0) {
        const { data: bids } = await supabase
          .from('bids')
          .select('auction_id')
          .in('auction_id', ids)
        if (bids) {
          const counts = {}
          bids.forEach(b => { counts[b.auction_id] = (counts[b.auction_id] || 0) + 1 })
          setBidsCount(counts)
        }
      }
    }
  }

  const generateQRCode = async () => {
    const link = window.location.origin + '/vendedor/' + user.id
    setShareLink(link)
    try {
      const qrUrl = await QRCode.toDataURL(link, { width: 300, margin: 2, color: { dark: '#667eea', light: '#ffffff' } })
      setQrCodeUrl(qrUrl)
    } catch (error) { console.error('Erro ao gerar QR Code:', error) }
  }

  const loadViews = async () => {
    const { data } = await supabase.from('seller_views').select('views').eq('seller_id', user.id).single()
    if (data) setViews(data.views || 0)
  }

  const downloadQRCode = () => {
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = 'qrcode-meus-leiloes.png'
    link.click()
  }

  const copyLink = () => { navigator.clipboard.writeText(shareLink); alert('Link copiado!') }
  const shareWhatsApp = () => {
    const text = encodeURIComponent('Confira meus leilões no Leilão do Bairro: ' + shareLink)
    window.open('https://wa.me/?text=' + text, '_blank')
  }

  const isEnded = (auction) => auction.status === 'ended' || new Date(auction.ends_at) <= new Date()

  const openRepostModal = (auction) => {
    setRepostModal(auction)
    setRepostPrice(String(auction.initial_price || auction.current_price || ''))
    // Sugere nova data: 7 dias a partir de hoje
    const d = new Date()
    d.setDate(d.getDate() + 7)
    const iso = d.toISOString().slice(0, 16)
    setRepostDate(iso)
  }

  const handleRepost = async () => {
    if (!repostModal) return
    const price = parseFloat(String(repostPrice).replace(',', '.'))
    if (isNaN(price) || price <= 0) { alert('Informe um preço válido!'); return }
    const originalPrice = repostModal.initial_price || repostModal.current_price || 0
    if (price > originalPrice) {
      alert('O preço de repostagem deve ser igual ou menor que o original (R$ ' +
        parseFloat(originalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + ')')
      return
    }
    if (!repostDate) { alert('Informe a nova data de encerramento!'); return }
    if (new Date(repostDate) <= new Date()) { alert('A data de encerramento deve ser no futuro!'); return }

    setReposting(true)
    const { error } = await supabase.from('auctions').insert({
      title: repostModal.title,
      description: repostModal.description,
      category: repostModal.category,
      initial_price: price,
      current_price: price,
      neighborhood: repostModal.neighborhood,
      city: repostModal.city,
      state: repostModal.state,
      ends_at: repostDate,
      images: repostModal.images,
      seller_id: user.id,
      status: 'active',
      latitude: repostModal.latitude,
      longitude: repostModal.longitude
    })
    setReposting(false)
    if (error) {
      alert('Erro ao repostar: ' + error.message)
    } else {
      setRepostModal(null)
      alert('✅ Leilão repostado com sucesso!')
      loadMyAuctions()
    }
  }

  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>

  // Separa encerrados sem lance
  const encerradosSemLance = myAuctions.filter(a => isEnded(a) && !(bidsCount[a.id] > 0))

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 'clamp(16px, 4vw, 40px)', overflowX: 'hidden' }}>
      <style>{meusLeiloesStyle}</style>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* CABEÇALHO */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'clamp(16px, 4vw, 30px)', gap: '12px' }}>
          <button onClick={() => navigate('/home')} style={{ background: 'white', border: 'none', padding: 'clamp(8px, 2vw, 10px) clamp(14px, 3vw, 20px)', borderRadius: '10px', fontSize: 'clamp(14px, 3.5vw, 18px)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Voltar
          </button>
          <h1 style={{ color: 'white', margin: 0, fontSize: 'clamp(20px, 5vw, 32px)' }}>Meus Leilões</h1>
        </div>

        {/* BANNER: ENCERRADOS SEM LANCE */}
        {encerradosSemLance.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: '16px',
            padding: 'clamp(14px, 3vw, 22px)',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>📢</span>
              <div>
                <p style={{ margin: 0, color: 'white', fontWeight: '800', fontSize: 'clamp(15px, 3.5vw, 18px)' }}>
                  {encerradosSemLance.length === 1
                    ? '1 leilão encerrou sem receber nenhum lance'
                    : encerradosSemLance.length + ' leilões encerraram sem receber nenhum lance'}
                </p>
                <p style={{ margin: '2px 0 0 0', color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(12px, 3vw, 14px)' }}>
                  Reposte com o mesmo preço ou um valor menor para atrair compradores
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {encerradosSemLance.map(a => (
                <button
                  key={a.id}
                  onClick={() => openRepostModal(a)}
                  style={{
                    padding: '10px 18px',
                    background: 'white',
                    color: '#d97706',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: 'clamp(13px, 3vw, 15px)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  🔄 Repostar: {a.title.length > 24 ? a.title.slice(0, 24) + '...' : a.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GRID TOPO */}
        <div className="ml-grid-topo">
          {/* QR CODE */}
          <div style={{ background: 'white', borderRadius: '20px', padding: 'clamp(16px, 4vw, 30px)', textAlign: 'center' }}>
            <h2 style={{ marginTop: 0, fontSize: 'clamp(16px, 4vw, 22px)' }}>Divulgue seus Leilões</h2>
            <p style={{ color: '#666', marginBottom: '16px', fontSize: 'clamp(13px, 3.5vw, 15px)' }}>
              Compartilhe este QR Code para as pessoas verem todos os seus leilões
            </p>
            <img src="/logo-leilao.png" alt="Leilão do Bairro" style={{ width: 'clamp(160px, 50vw, 280px)', height: 'auto', margin: '0 auto 12px auto', display: 'block', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
            {qrCodeUrl && (
              <div>
                <img src={qrCodeUrl} alt="QR Code" style={{ width: 'clamp(180px, 60vw, 300px)', height: 'clamp(180px, 60vw, 300px)', margin: '0 auto', display: 'block' }} />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
                  <button onClick={downloadQRCode} style={{ padding: 'clamp(10px, 3vw, 15px) clamp(16px, 4vw, 30px)', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', fontSize: 'clamp(13px, 3.5vw, 16px)', fontWeight: 'bold', cursor: 'pointer' }}>
                    Baixar QR Code
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ESTATÍSTICAS */}
          <div style={{ background: 'white', borderRadius: '20px', padding: 'clamp(16px, 4vw, 30px)' }}>
            <h2 style={{ marginTop: 0, fontSize: 'clamp(16px, 4vw, 22px)' }}>Estatísticas</h2>
            <div style={{ background: '#f0f5ff', padding: 'clamp(12px, 3vw, 20px)', borderRadius: '15px', marginBottom: '16px' }}>
              <div translate="no" style={{ fontSize: 'clamp(32px, 9vw, 48px)', fontWeight: 'bold', color: '#667eea', textAlign: 'center' }}>{views}</div>
              <div style={{ textAlign: 'center', color: '#666', fontSize: 'clamp(13px, 3.5vw, 15px)' }}>visualizações do seu perfil</div>
            </div>
            <div style={{ background: '#f0f5ff', padding: 'clamp(12px, 3vw, 20px)', borderRadius: '15px', marginBottom: '16px' }}>
              <div translate="no" style={{ fontSize: 'clamp(32px, 9vw, 48px)', fontWeight: 'bold', color: '#667eea', textAlign: 'center' }}>{myAuctions.length}</div>
              <div style={{ textAlign: 'center', color: '#666', fontSize: 'clamp(13px, 3.5vw, 15px)' }}>leilões criados</div>
            </div>
            <h3 style={{ fontSize: 'clamp(14px, 4vw, 18px)' }}>Compartilhar Link</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input type="text" value={shareLink} readOnly style={{ flex: 1, padding: 'clamp(10px, 3vw, 12px)', border: '2px solid #ddd', borderRadius: '10px', fontSize: 'clamp(11px, 3vw, 14px)', minWidth: 0 }} />
              <button onClick={copyLink} style={{ padding: 'clamp(10px, 3vw, 12px) clamp(12px, 3vw, 20px)', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(13px, 3.5vw, 15px)', whiteSpace: 'nowrap' }}>
                Copiar
              </button>
            </div>
            <button onClick={shareWhatsApp} style={{ width: '100%', padding: 'clamp(12px, 3vw, 15px)', background: '#25D366', color: 'white', border: 'none', borderRadius: '10px', fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 'bold', cursor: 'pointer' }}>
              Compartilhar no WhatsApp
            </button>
          </div>
        </div>

        {/* LISTA DE LEILÕES */}
        <div style={{ background: 'white', borderRadius: '20px', padding: 'clamp(16px, 4vw, 30px)' }}>
          <h2 style={{ marginTop: 0, fontSize: 'clamp(16px, 4vw, 22px)' }}>
            Seus Leilões (<span translate="no">{myAuctions.length}</span>)
          </h2>
          {myAuctions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p style={{ fontSize: 'clamp(15px, 4vw, 18px)' }}>Você ainda não criou nenhum leilão</p>
              <button onClick={() => navigate('/novo')} style={{ padding: 'clamp(12px, 3vw, 15px) clamp(20px, 5vw, 30px)', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>
                + Criar Primeiro Leilão
              </button>
            </div>
          ) : (
            <div className="ml-grid-leiloes">
              {myAuctions.map(auction => {
                const ended = isEnded(auction)
                const hasBids = bidsCount[auction.id] > 0
                const semLance = ended && !hasBids
                return (
                  <div key={auction.id}
                    style={{ background: semLance ? '#fffbeb' : '#f9f9f9', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative', border: semLance ? '2px solid #f59e0b' : '2px solid transparent' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    onClick={() => navigate('/leilao/' + auction.id)}
                  >
                    {ended && (
                      <div style={{ position: 'absolute', top: '8px', right: '8px', background: semLance ? '#f59e0b' : '#f44336', color: 'white', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', zIndex: 10 }}>
                        {semLance ? '0 LANCES' : 'ENCERRADO'}
                      </div>
                    )}
                    <img
                      src={auction.images?.[0] || 'https://via.placeholder.com/250x150'}
                      alt={auction.title}
                      style={{ width: '100%', height: 'clamp(100px, 30vw, 150px)', objectFit: 'cover' }}
                    />
                    <div style={{ padding: 'clamp(10px, 3vw, 15px)' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: 'clamp(14px, 3.5vw, 16px)', wordBreak: 'break-word' }}>{auction.title}</h3>
                      <div translate="no" style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: 'bold', color: '#667eea' }}>
                        R$ {parseFloat(auction.current_price || auction.initial_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: '#999', marginTop: '2px' }}>{auction.city}</div>
                      {semLance && (
                        <button
                          onClick={e => { e.stopPropagation(); openRepostModal(auction) }}
                          style={{
                            marginTop: '10px', width: '100%', padding: '9px',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: 'white', border: 'none', borderRadius: '8px',
                            fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: '700', cursor: 'pointer'
                          }}
                        >
                          🔄 Repostar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL REPOSTAGEM */}
      {repostModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px',
            padding: 'clamp(20px, 5vw, 36px)',
            width: '100%', maxWidth: '480px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: 'clamp(18px, 4vw, 22px)', color: '#1a202c' }}>🔄 Repostar Leilão</h2>
            <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>
              <strong>{repostModal.title}</strong>
            </p>

            {/* AVISO PREÇO */}
            <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#92400e' }}>
              💡 Preço original: <strong>R$ {parseFloat(repostModal.initial_price || repostModal.current_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              <br />O novo preço deve ser igual ou menor para atrair mais compradores.
            </div>

            {/* NOVO PREÇO */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#374151', fontSize: '14px', marginBottom: '6px' }}>
                Novo Lance Inicial (R$) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={repostPrice}
                onChange={e => setRepostPrice(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', boxSizing: 'border-box' }}
              />
            </div>

            {/* NOVA DATA */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#374151', fontSize: '14px', marginBottom: '6px' }}>
                Nova Data de Encerramento *
              </label>
              <input
                type="datetime-local"
                value={repostDate}
                onChange={e => setRepostDate(e.target.value)}
                style={{ width: '100%', padding: '14px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', boxSizing: 'border-box' }}
              />
            </div>

            {/* BOTOES */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setRepostModal(null)}
                style={{ flex: 1, padding: '14px', background: 'white', color: '#666', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRepost}
                disabled={reposting}
                style={{ flex: 2, padding: '14px', background: reposting ? '#aaa' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: reposting ? 'not-allowed' : 'pointer' }}
              >
                {reposting ? '⏳ Repostando...' : '🚀 Repostar Agora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MeusLeiloes
