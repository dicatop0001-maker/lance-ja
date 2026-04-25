import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import BottomBar from './BottomBar'

const meusAnunciosStyle = `
  .ma-grid-topo {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 40px;
  }
  .ma-grid-anuncios {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }
  @media (max-width: 768px) {
    .ma-grid-topo { grid-template-columns: 1fr; gap: 16px; margin-bottom: 24px; }
    .ma-grid-anuncios { grid-template-columns: 1fr 1fr; gap: 12px; }
  }
  @media (max-width: 480px) {
    .ma-grid-anuncios { grid-template-columns: 1fr; gap: 12px; }
  }
`

function MeusAnuncios() {
  const [user, setUser] = useState(null)
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [shareLink, setShareLink] = useState('')
  const navigate = useNavigate()

  useEffect(() => { checkUser() }, [])
  useEffect(() => { if (user) { loadAnuncios(); generateQRCode() } }, [user])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { navigate('/'); return }
    setUser(session.user)
  }

  const loadAnuncios = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('auctions')
      .select('*')
      .eq('seller_id', user.id)
      .eq('tipo', 'anuncio')
      .order('created_at', { ascending: false })
    if (data) setAnuncios(data)
    setLoading(false)
  }

  const generateQRCode = async () => {
    const link = window.location.origin + '/vendedor/' + user.id
    setShareLink(link)
    try {
      const qrUrl = await QRCode.toDataURL(link, {
        width: 300, margin: 2,
        color: { dark: '#f97316', light: '#ffffff' }
      })
      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const downloadQRCode = () => {
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = 'qrcode-meus-anuncios.png'
    link.click()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink)
    alert('Link copiado!')
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent('Confira meus anúncios na Conecty: ' + shareLink)
    window.open('https://wa.me/?text=' + text, '_blank')
  }

  if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', padding: 'clamp(16px, 4vw, 40px)', overflowX: 'hidden' }}>
      <style>{meusAnunciosStyle}</style>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* CABEÇALHO */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'clamp(16px, 4vw, 30px)', gap: '12px' }}>
          <button onClick={() => navigate('/home')} style={{ background: 'white', border: 'none', padding: 'clamp(8px, 2vw, 10px) clamp(14px, 3vw, 20px)', borderRadius: '10px', fontSize: 'clamp(14px, 3.5vw, 18px)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Voltar
          </button>
          <h1 style={{ color: 'white', margin: 0, fontSize: 'clamp(20px, 5vw, 32px)' }}>Meus Anúncios</h1>
        </div>

        {/* BOTÃO CRIAR */}
        <button onClick={() => navigate('/anuncio')} style={{ width: '100%', padding: '18px', background: 'white', color: '#f97316', border: '3px solid white', borderRadius: '15px', fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 'bold', cursor: 'pointer', marginBottom: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
          📢 + CRIAR NOVO ANÚNCIO
        </button>

        {/* GRID TOPO: QR CODE + DIVULGAÇÃO */}
        <div className="ma-grid-topo">

          {/* QR CODE */}
          <div style={{ background: 'white', borderRadius: '20px', padding: 'clamp(16px, 4vw, 30px)', textAlign: 'center' }}>
            <h2 style={{ marginTop: 0, fontSize: 'clamp(16px, 4vw, 22px)' }}>Divulgue seus Anúncios</h2>
            <p style={{ color: '#666', marginBottom: '16px', fontSize: 'clamp(13px, 3.5vw, 15px)' }}>
              Compartilhe este QR Code para as pessoas verem todos os seus anúncios
            </p>
            <img src="/logo-conecty.png" alt="Conecty" style={{ width: 'clamp(160px, 50vw, 280px)', height: 'auto', margin: '0 auto 12px auto', display: 'block', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
            {qrCodeUrl && (
              <div>
                <img src={qrCodeUrl} alt="QR Code" style={{ width: 'clamp(180px, 60vw, 300px)', height: 'clamp(180px, 60vw, 300px)', margin: '0 auto', display: 'block' }} />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
                  <button onClick={downloadQRCode} style={{ padding: 'clamp(10px, 3vw, 15px) clamp(16px, 4vw, 30px)', background: '#f97316', color: 'white', border: 'none', borderRadius: '10px', fontSize: 'clamp(13px, 3.5vw, 16px)', fontWeight: 'bold', cursor: 'pointer' }}>
                    Baixar QR Code
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* LINK DE COMPARTILHAMENTO */}
          <div style={{ background: 'white', borderRadius: '20px', padding: 'clamp(16px, 4vw, 30px)' }}>
            <h2 style={{ marginTop: 0, fontSize: 'clamp(16px, 4vw, 22px)' }}>Compartilhar Link</h2>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: 'clamp(13px, 3.5vw, 15px)' }}>
              Envie seu link de anúncios para amigos, clientes e grupos!
            </p>
            <div style={{ background: '#fff7ed', padding: 'clamp(12px, 3vw, 20px)', borderRadius: '15px', marginBottom: '16px' }}>
              <div style={{ fontSize: 'clamp(32px, 9vw, 48px)', fontWeight: 'bold', color: '#f97316', textAlign: 'center' }}>{anuncios.length}</div>
              <div style={{ textAlign: 'center', color: '#666', fontSize: 'clamp(13px, 3.5vw, 15px)' }}>anúncios publicados</div>
            </div>
            <h3 style={{ fontSize: 'clamp(14px, 4vw, 18px)', marginBottom: '10px' }}>Seu link de divulgação</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input type="text" value={shareLink} readOnly style={{ flex: 1, padding: 'clamp(10px, 3vw, 12px)', border: '2px solid #ddd', borderRadius: '10px', fontSize: 'clamp(11px, 3vw, 14px)', minWidth: 0 }} />
              <button onClick={copyLink} style={{ padding: 'clamp(10px, 3vw, 12px) clamp(12px, 3vw, 20px)', background: '#f97316', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(13px, 3.5vw, 15px)', whiteSpace: 'nowrap' }}>
                Copiar
              </button>
            </div>
            <button onClick={shareWhatsApp} style={{ width: '100%', padding: 'clamp(12px, 3vw, 15px)', background: '#25D366', color: 'white', border: 'none', borderRadius: '10px', fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 'bold', cursor: 'pointer' }}>
              Compartilhar no WhatsApp
            </button>
          </div>
        </div>

        {/* LISTA DE ANÚNCIOS */}
        <div style={{ background: 'white', borderRadius: '20px', padding: 'clamp(16px, 4vw, 30px)' }}>
          <h2 style={{ marginTop: 0, fontSize: 'clamp(16px, 4vw, 22px)' }}>
            Seus Anúncios (<span translate="no">{anuncios.length}</span>)
          </h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999', fontSize: '20px' }}>Carregando...</div>
          ) : anuncios.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <p style={{ color: '#999', fontSize: 'clamp(15px, 4vw, 18px)' }}>Você ainda não criou nenhum anúncio</p>
              <button onClick={() => navigate('/anuncio')} style={{ padding: 'clamp(12px, 3vw, 15px) clamp(20px, 5vw, 30px)', background: '#f97316', color: 'white', border: 'none', borderRadius: '10px', fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>
                + Criar Primeiro Anúncio
              </button>
            </div>
          ) : (
            <div className="ma-grid-anuncios">
              {anuncios.map(a => (
                <div key={a.id} onClick={() => navigate('/leilao/' + a.id)}
                  style={{ background: '#f9f9f9', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '2px solid transparent', transition: 'transform 0.2s, border-color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = '#f97316' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'transparent' }}>
                  <img src={a.images?.[0] || ''} alt={a.title}
                    style={{ width: '100%', height: 'clamp(100px, 30vw, 160px)', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none' }} />
                  <div style={{ padding: 'clamp(10px, 3vw, 15px)' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: 'clamp(14px, 3.5vw, 16px)', color: '#1a202c', wordBreak: 'break-word' }}>{a.title}</h3>
                    <div translate="no" style={{ fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: 'bold', color: '#f97316' }}>
                      R$ {parseFloat(a.current_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                      <button onClick={e => { e.stopPropagation(); navigate('/editar-anuncio/' + a.id) }}
                        style={{ flex: 1, padding: '8px', background: '#f97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: 'clamp(12px, 3vw, 13px)' }}>
                        ✏️ Editar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomBar user={user} onLogout={handleLogout} />
    </div>
  )
}

export default MeusAnuncios
