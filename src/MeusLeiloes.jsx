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
    .ml-grid-topo {
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .ml-grid-leiloes {
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
  }
  @media (max-width: 480px) {
    .ml-grid-leiloes {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
`

function MeusLeiloes() {
  const [user, setUser] = useState(null)
  const [myAuctions, setMyAuctions] = useState([])
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [views, setViews] = useState(0)
  const navigate = useNavigate()

  useEffect(() => { checkUser() }, [])
  useEffect(() => {
    if (user) {
      loadMyAuctions()
      generateQRCode()
      loadViews()
    }
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
    if (data) setMyAuctions(data)
  }

  const generateQRCode = async () => {
    const link = window.location.origin + '/vendedor/' + user.id
    setShareLink(link)
    try {
      const qrUrl = await QRCode.toDataURL(link, { width: 300, margin: 2, color: { dark: '#667eea', light: '#ffffff' } })
      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
    }
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

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
    alert('Link copiado!')
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent('Confira meus leiloes no Leilao do Bairro: ' + shareLink)
    window.open('https://wa.me/?text=' + text, '_blank')
  }

  const isEnded = (auction) => {
    return auction.status === 'ended' || new Date(auction.ends_at) <= new Date()
  }

  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 'clamp(16px, 4vw, 40px)', overflowX: 'hidden' }}>
      <style>{meusLeiloesStyle}</style>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* CABECALHO */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'clamp(16px, 4vw, 30px)', gap: '12px' }}>
          <button onClick={() => navigate('/home')} style={{ background: 'white', border: 'none', padding: 'clamp(8px, 2vw, 10px) clamp(14px, 3vw, 20px)', borderRadius: '10px', fontSize: 'clamp(14px, 3.5vw, 18px)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Voltar
          </button>
          <h1 style={{ color: 'white', margin: 0, fontSize: 'clamp(20px, 5vw, 32px)' }}>Meus Leiloes</h1>
        </div>

        {/* GRID TOPO — QR Code e Estatisticas */}
        <div className="ml-grid-topo">

          {/* QR CODE */}
          <div style={{ background: 'white', borderRadius: '20px', padding: 'clamp(16px, 4vw, 30px)', textAlign: 'center' }}>
            <h2 style={{ marginTop: 0, fontSize: 'clamp(16px, 4vw, 22px)' }}>Divulgue seus Leiloes</h2>
            <p style={{ color: '#666', marginBottom: '16px', fontSize: 'clamp(13px, 3.5vw, 15px)' }}>
              Compartilhe este QR Code para as pessoas verem todos os seus leiloes
            </p>
            {qrCodeUrl && (
              <div>
                <img src={qrCodeUrl} alt="QR Code" style={{ width: 'clamp(180px, 60vw, 300px)', height: 'clamp(180px, 60vw, 300px)', margin: '16px auto', display: 'block' }} />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
                  <button onClick={downloadQRCode} style={{ padding: 'clamp(10px, 3vw, 15px) clamp(16px, 4vw, 30px)', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', fontSize: 'clamp(13px, 3.5vw, 16px)', fontWeight: 'bold', cursor: 'pointer' }}>
                    Baixar QR Code
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ESTATISTICAS E COMPARTILHAMENTO */}
          <div style={{ background: 'white', borderRadius: '20px', padding: 'clamp(16px, 4vw, 30px)' }}>
            <h2 style={{ marginTop: 0, fontSize: 'clamp(16px, 4vw, 22px)' }}>Estatisticas</h2>
            <div style={{ background: '#f0f5ff', padding: 'clamp(12px, 3vw, 20px)', borderRadius: '15px', marginBottom: '16px' }}>
              <div translate="no" style={{ fontSize: 'clamp(32px, 9vw, 48px)', fontWeight: 'bold', color: '#667eea', textAlign: 'center' }}>{views}</div>
              <div style={{ textAlign: 'center', color: '#666', fontSize: 'clamp(13px, 3.5vw, 15px)' }}>visualizacoes do seu perfil</div>
            </div>
            <div style={{ background: '#f0f5ff', padding: 'clamp(12px, 3vw, 20px)', borderRadius: '15px', marginBottom: '16px' }}>
              <div translate="no" style={{ fontSize: 'clamp(32px, 9vw, 48px)', fontWeight: 'bold', color: '#667eea', textAlign: 'center' }}>{myAuctions.length}</div>
              <div style={{ textAlign: 'center', color: '#666', fontSize: 'clamp(13px, 3.5vw, 15px)' }}>leiloes criados</div>
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

        {/* LISTA DE LEILOES */}
        <div style={{ background: 'white', borderRadius: '20px', padding: 'clamp(16px, 4vw, 30px)' }}>
          <h2 style={{ marginTop: 0, fontSize: 'clamp(16px, 4vw, 22px)' }}>
            Seus Leiloes (<span translate="no">{myAuctions.length}</span>)
          </h2>
          {myAuctions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p style={{ fontSize: 'clamp(15px, 4vw, 18px)' }}>Voce ainda nao criou nenhum leilao</p>
              <button onClick={() => navigate('/novo')} style={{ padding: 'clamp(12px, 3vw, 15px) clamp(20px, 5vw, 30px)', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>
                + Criar Primeiro Leilao
              </button>
            </div>
          ) : (
            <div className="ml-grid-leiloes">
              {myAuctions.map(auction => (
                <div key={auction.id} onClick={() => navigate('/leilao/' + auction.id)} style={{ background: '#f9f9f9', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  {isEnded(auction) && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#f44336', color: 'white', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', zIndex: 10 }}>
                      ENCERRADO
                    </div>
                  )}
                  <img src={auction.images?.[0] || 'https://via.placeholder.com/250x150'} alt={auction.title} style={{ width: '100%', height: 'clamp(100px, 30vw, 150px)', objectFit: 'cover' }} />
                  <div style={{ padding: 'clamp(10px, 3vw, 15px)' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 'clamp(14px, 3.5vw, 18px)', wordBreak: 'break-word' }}>{auction.title}</h3>
                    <div translate="no" style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 'bold', color: '#667eea' }}>
                      R$ {parseFloat(auction.current_price || auction.initial_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: '#999', marginTop: '4px' }}>{auction.city}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default MeusLeiloes
