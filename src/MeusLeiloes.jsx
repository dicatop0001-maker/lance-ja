import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'

function MeusLeiloes() {
  const [user, setUser] = useState(null)
  const [myAuctions, setMyAuctions] = useState([])
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [views, setViews] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadMyAuctions()
      generateQRCode()
      loadViews()
    }
  }, [user])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/')
      return
    }
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
      const qrUrl = await QRCode.toDataURL(link, {
        width: 300,
        margin: 2,
        color: {
          dark: '#667eea',
          light: '#ffffff'
        }
      })
      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
    }
  }

  const loadViews = async () => {
    const { data } = await supabase
      .from('seller_views')
      .select('views')
      .eq('seller_id', user.id)
      .single()
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
    const text = encodeURIComponent('Confira meus leilões no Leilão do Bairro: ' + shareLink)
    window.open('https://wa.me/?text=' + text, '_blank')
  }

  if (!user) return <div>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
          <button onClick={() => navigate('/home')} style={{ background: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '18px', cursor: 'pointer', marginRight: '15px' }}>← Voltar</button>
          <h1 style={{ color: 'white', margin: 0 }}>Meus Leilões</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
          {/* QR Code Card */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '30px', textAlign: 'center' }}>
            <h2 style={{ marginTop: 0 }}>📱 Divulgue seus Leilões</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Compartilhe este QR Code para as pessoas verem todos os seus leilões</p>
            
            {qrCodeUrl && (
              <div>
                <img src={qrCodeUrl} alt="QR Code" style={{ width: '300px', height: '300px', margin: '20px auto' }} />
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                  <button onClick={downloadQRCode} style={{ padding: '15px 30px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>📥 Baixar QR Code</button>
                </div>
              </div>
            )}
          </div>

          {/* Stats & Share Card */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '30px' }}>
            <h2 style={{ marginTop: 0 }}>📊 Estatísticas</h2>
            
            <div style={{ background: '#f0f5ff', padding: '20px', borderRadius: '15px', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#667eea', textAlign: 'center' }}>{views}</div>
              <div style={{ textAlign: 'center', color: '#666' }}>visualizações do seu perfil</div>
            </div>

            <div style={{ background: '#f0f5ff', padding: '20px', borderRadius: '15px', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#667eea', textAlign: 'center' }}>{myAuctions.length}</div>
              <div style={{ textAlign: 'center', color: '#666' }}>leilões criados</div>
            </div>

            <h3>🔗 Compartilhar Link</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input type="text" value={shareLink} readOnly style={{ flex: 1, padding: '12px', border: '2px solid #ddd', borderRadius: '10px', fontSize: '14px' }} />
              <button onClick={copyLink} style={{ padding: '12px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Copiar</button>
            </div>
            
            <button onClick={shareWhatsApp} style={{ width: '100%', padding: '15px', background: '#25D366', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>📱</span> Compartilhar no WhatsApp
            </button>
          </div>
        </div>

        {/* Lista de leilões */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '30px' }}>
          <h2 style={{ marginTop: 0 }}>📦 Seus Leilões ({myAuctions.length})</h2>
          
          {myAuctions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p style={{ fontSize: '18px' }}>Você ainda não criou nenhum leilão</p>
              <button onClick={() => navigate('/novo')} style={{ padding: '15px 30px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>+ Criar Primeiro Leilão</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
              {myAuctions.map(auction => (
                <div key={auction.id} onClick={() => navigate('/leilao/' + auction.id)} style={{ background: '#f9f9f9', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  <img src={auction.photos?.[0] || 'https://via.placeholder.com/250x150'} alt={auction.title} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                  <div style={{ padding: '15px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{auction.title}</h3>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea' }}>R$ {parseFloat(auction.starting_bid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>{auction.city}</div>
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
