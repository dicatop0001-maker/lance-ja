import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { useParams, useNavigate } from 'react-router-dom'
import Chat from './Chat'

const detalhesStyle = `
  .detalhes-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    max-width: 1200px;
    margin: 30px auto;
    padding: 0 20px;
  }
  @media (max-width: 768px) {
    .detalhes-grid {
      grid-template-columns: 1fr;
      gap: 16px;
      margin: 16px auto;
      padding: 0 12px;
    }
  }
`

function DetalhesLeilao() {
  const formatBRL = (value) => {
    if (typeof value !== 'number') return '0,00'
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const { id: auctionId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [auction, setAuction] = useState(null)
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [bidValue, setBidValue] = useState('')
  const [bidLoading, setBidLoading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [allBidUsers, setAllBidUsers] = useState([])
  const [selectedChatUser, setSelectedChatUser] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [showAnuncioChat, setShowAnuncioChat] = useState(false)
  const [lightboxImg, setLightboxImg] = useState(null)
  const [anuncioOtherUser, setAnuncioOtherUser] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, tipo = 'erro') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  const userRef = useRef(null)
  const auctionRef = useRef(null)
  const bidsRef = useRef([])
  const channelRef = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u)
      userRef.current = u
    })
    loadData()
    channelRef.current = subscribeToNewBids()
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [])

  const loadData = async () => {
    await loadAuction()
    await loadBids()
  }

  useEffect(() => {
    auctionRef.current = auction
    bidsRef.current = bids
    const isAnuncio = auction && (auction.tipo === 'anuncio' || !auction.ends_at)
    const isEnded = auction && !isAnuncio && (auction.status === 'ended' || new Date(auction.ends_at) < new Date())

    // Leilao encerrado: abre chat para todos automaticamente, sem cobranca
    if (isEnded && userRef.current) {
      setShowChat(true)
      buildAllBidUsers(bids)
    }

    // Anuncio: abre chat para interessados automaticamente, sem cobranca
    if (isAnuncio && userRef.current && auction) {
      const isSeller = auction.seller_id === userRef.current.id
      if (!isSeller) {
        setAnuncioOtherUser({ id: auction.seller_id, email: 'Dono do Anuncio' })
        setShowAnuncioChat(true)
      }
    }
  }, [auction, bids])

  const buildAllBidUsers = (bidList) => {
    if (!bidList || bidList.length === 0) return
    const seen = new Set()
    const users = []
    bidList.forEach((b) => {
      if (!seen.has(b.user_id)) {
        seen.add(b.user_id)
        users.push({
          id: b.user_id,
          email: b.users?.email || b.users?.name || 'Participante',
          name: b.users?.name || b.users?.email || 'Participante',
          position: users.length + 1,
          amount: b.amount
        })
      }
    })
    setAllBidUsers(users)
    if (users.length > 0) setSelectedChatUser(users[0])
  }

  const loadAuction = async () => {
    const { data } = await supabase.from('auctions').select('*').eq('id', auctionId).single()
    if (data) setAuction(data)
    setLoading(false)
  }

  const loadBids = async () => {
    const { data } = await supabase.from('bids').select('*').eq('auction_id', auctionId).order('created_at', { ascending: false })
    if (!data || data.length === 0) { setBids([]); return }
    const userIds = [...new Set(data.map(b => b.user_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, name, email').in('id', userIds)
    const profileMap = {}
    if (profiles) profiles.forEach(p => { profileMap[p.id] = p })
    setBids(data.map(bid => ({ ...bid, users: profileMap[bid.user_id] || null })))
  }

  const subscribeToNewBids = () => {
    return supabase.channel('bids-' + auctionId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids', filter: 'auction_id=eq.' + auctionId }, () => {
        loadAuction(); loadBids()
      })
      .subscribe()
  }

  const createNotification = async (sellerId, message) => {
    await supabase.from('notifications').insert([{ user_id: sellerId, message, read: false }])
  }

  const handleBid = async (e) => {
    e.preventDefault()
    if (!user || !auction) return
    if (!bidValue || !String(bidValue).trim()) { showToast('Digite o valor do lance!'); return }
    const amount = parseFloat(String(bidValue).trim().replace(',', '.'))
    const isServico = auction.category === 'servicos'
    if (isServico) {
      if (isNaN(amount) || amount <= 0) { showToast('Digite um valor valido!'); return }
      if (amount >= auction.current_price) { showToast('Lance deve ser MENOR que R$ ' + formatBRL(auction.current_price)); return }
    } else {
      if (isNaN(amount) || amount <= auction.current_price) { showToast('Lance deve ser MAIOR que R$ ' + formatBRL(auction.current_price)); return }
    }
    setBidLoading(true)
    const { error: bidError } = await supabase.from('bids').insert([{ auction_id: auctionId, user_id: user.id, amount }])
    if (bidError) { showToast('Erro: ' + bidError.message); setBidLoading(false); return }
    await supabase.from('auctions').update({ current_price: amount }).eq('id', auctionId)
    await createNotification(auction.seller_id, 'Novo lance de R$ ' + formatBRL(amount) + ' no leilao: ' + auction.title)
    setBidLoading(false)
    setBidValue('')
    showToast('Lance enviado com sucesso!', 'sucesso')
    loadAuction()
    loadBids()
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '18px', color: '#667eea' }}>Carregando...</div></div>
  if (!auction) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: '18px', color: '#666' }}>Leilao nao encontrado</div></div>

  const hasImages = auction.images && auction.images.length > 0
  const isEnded = auction.status === 'ended' || new Date(auction.ends_at) < new Date()
  const isSeller = user && auction.seller_id === user.id
  const isAnuncio = auction.tipo === 'anuncio' || !auction.ends_at
  const isServico = auction.category === 'servicos'
  const userBids = bids.filter(b => b.user_id === user?.id)
  const otherUserForBidder = { id: auction.seller_id, email: 'Vendedor' }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', overflowX: 'hidden' }}>
      <style>{detalhesStyle}</style>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '16px 20px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/home')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
          Voltar
        </button>
        <span style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 'bold' }}>
          {isAnuncio ? 'Detalhes do Anuncio' : 'Detalhes do Leilao'}
        </span>
        {isSeller && (
          <button onClick={() => navigate(isAnuncio ? '/editar-anuncio/' + auction.id : '/editar-leilao/' + auction.id)}
            style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.6)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
            Editar / Excluir
          </button>
        )}
      </div>

      <div className="detalhes-grid">
        {/* COLUNA ESQUERDA */}
        <div>
          {hasImages ? (
            <div>
              <div style={{ background: '#f0f0f0', borderRadius: '16px', height: 'clamp(220px, 55vw, 400px)', marginBottom: '12px', overflow: 'hidden' }}>
                <img src={auction.images[currentImageIndex]} alt={auction.title} onClick={() => setLightboxImg(auction.images[currentImageIndex])} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
              </div>
              {auction.images.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {auction.images.map((img, i) => (
                    <div key={i} onClick={() => setCurrentImageIndex(i)}
                      style={{ minWidth: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: i === currentImageIndex ? '3px solid #667eea' : '3px solid transparent', flexShrink: 0 }}>
                      <img src={img} alt="" onClick={() => setLightboxImg(img)} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#f0f0f0', borderRadius: '16px', height: 'clamp(220px, 55vw, 400px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', marginBottom: '12px' }}>
              <span>{isAnuncio ? 'Anuncio' : 'Leilao'}</span>
            </div>
          )}

          {/* INFO DO ITEM */}
          <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(16px, 4vw, 30px)', marginTop: '16px' }}>
            <h1 style={{ margin: '0 0 16px 0', fontSize: 'clamp(20px, 5vw, 32px)', wordBreak: 'break-word' }}>{auction.title}</h1>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '16px', fontSize: 'clamp(14px, 3.5vw, 16px)', wordBreak: 'break-word' }}>{auction.description || 'Sem descricao'}</p>
            <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
              <div style={{ marginBottom: '8px', fontSize: 'clamp(13px, 3.5vw, 15px)' }}><strong>Categoria:</strong> {auction.category}</div>
              <div style={{ marginBottom: '8px', fontSize: 'clamp(13px, 3.5vw, 15px)' }}><strong>Localizacao:</strong> {auction.neighborhood ? auction.neighborhood + ', ' : ''}{auction.city} - {auction.state}</div>
              <div style={{ marginBottom: '8px', fontSize: 'clamp(13px, 3.5vw, 15px)' }}><strong>Criado em:</strong> {new Date(auction.created_at).toLocaleDateString('pt-BR')}</div>
            </div>
          </div>

          {/* CHAT ANUNCIO: Interessado -> Dono (gratuito) */}
          {isAnuncio && !isSeller && user && showAnuncioChat && anuncioOtherUser && (
            <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(16px, 4vw, 24px)', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '22px' }}>💬</span>
                <h3 style={{ margin: 0, fontSize: 'clamp(15px,4vw,18px)', color: '#1a202c' }}>Falar com o Dono do Anuncio</h3>
              </div>
              <Chat auction={auction} user={user} otherUser={anuncioOtherUser} canChat={true} />
            </div>
          )}

          {/* CHAT ANUNCIO: Dono ve todas as conversas (gratuito) */}
          {isAnuncio && isSeller && user && (
            <AnuncioSellerChats auction={auction} user={user} />
          )}
        </div>

        {/* COLUNA DIREITA */}
        <div>
          {/* PRECO / LANCE */}
          <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(16px, 4vw, 30px)', marginBottom: '16px' }}>
            {isServico && (
              <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#eff6ff', border: '2px solid #1e3a8a', borderRadius: '12px', fontSize: 'clamp(13px, 3.5vw, 14px)', color: '#1e3a8a', fontWeight: '700' }}>
                PRESTADOR DE SERVICOS - MENOR ORCAMENTO VENCE!
              </div>
            )}
            <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#999', marginBottom: '4px' }}>
              {isAnuncio ? 'Preco' : (isServico ? 'Menor orcamento atual' : 'Lance atual')}
            </div>
            <div style={{ fontSize: 'clamp(36px, 9vw, 48px)', fontWeight: 'bold', color: isAnuncio ? '#f97316' : (isServico ? '#16a34a' : '#667eea'), marginBottom: '16px' }}>
              R$ {formatBRL(auction.current_price)}
            </div>

            {!isAnuncio && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#999', marginBottom: '4px' }}>{isEnded ? 'Encerrado em' : 'Encerra em'}</div>
                <div style={{ fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 'bold', color: isEnded ? '#f44336' : '#333' }}>
                  {new Date(auction.ends_at).toLocaleString('pt-BR')}
                  {isEnded && <span style={{ fontSize: 'clamp(13px, 3.5vw, 16px)', color: '#f44336', marginLeft: '8px' }}>ENCERRADO</span>}
                </div>
              </div>
            )}

            {isAnuncio && isSeller && (
              <div style={{ background: '#fff7ed', padding: '14px', borderRadius: '10px', textAlign: 'center', color: '#f97316', fontSize: 'clamp(13px,3.5vw,15px)', marginBottom: '12px' }}>
                Voce e o dono deste anuncio
              </div>
            )}

            {!isAnuncio && !isEnded && user && !isSeller && (
              <form onSubmit={handleBid}>
                <input type="text" inputMode="decimal" value={bidValue} onChange={(e) => setBidValue(e.target.value)}
                  placeholder={isServico ? 'Lance maximo: R$ ' + formatBRL(auction.current_price - 0.01) : 'Minimo: R$ ' + formatBRL(auction.current_price + 0.01)}
                  disabled={bidLoading}
                  style={{ width: '100%', padding: 'clamp(12px, 3vw, 15px)', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: 'clamp(16px, 4vw, 18px)', boxSizing: 'border-box', marginBottom: '12px' }} />
                <button type="submit" disabled={bidLoading}
                  style={{ width: '100%', padding: 'clamp(14px, 4vw, 20px)', background: bidLoading ? '#aaa' : (isServico ? '#16a34a' : '#667eea'), color: 'white', border: 'none', borderRadius: '10px', fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: 'bold', cursor: bidLoading ? 'not-allowed' : 'pointer' }}>
                  {bidLoading ? 'ENVIANDO...' : (isServico ? 'ENVIAR ORCAMENTO (MENOR VENCE)' : 'DAR LANCE')}
                </button>
              </form>
            )}

            {!isAnuncio && !isEnded && isSeller && (
              <div style={{ background: '#fff3e0', padding: '16px', borderRadius: '10px', textAlign: 'center', color: '#f57c00', fontSize: 'clamp(13px, 3.5vw, 15px)' }}>
                Voce e o vendedor deste leilao
              </div>
            )}

            {!isAnuncio && isEnded && (
              <div style={{ background: '#ffeaea', padding: '16px', borderRadius: '10px', textAlign: 'center', color: '#f44336', fontWeight: 'bold', fontSize: 'clamp(13px, 3.5vw, 15px)' }}>
                Este leilao foi encerrado
              </div>
            )}
          </div>

          {/* HISTORICO DE LANCES */}
          {!isAnuncio && (
            <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(16px, 4vw, 30px)', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 'clamp(16px, 4vw, 20px)' }}>Historico de Lances ({bids.length})</h3>
              {bids.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Nenhum lance ainda. Seja o primeiro!</div>
              ) : (
                <div>
                  {bids.map((bid, i) => (
                    <div key={bid.id} style={{ padding: 'clamp(10px, 3vw, 15px)', background: i === 0 ? '#f0fff4' : '#f9f9f9', borderRadius: '10px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 'clamp(13px, 3.5vw, 15px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : (i+1)+'° '}
                          {bid.users?.name || bid.users?.email || 'Anonimo'}
                        </div>
                        <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: '#999' }}>
                          {new Date(bid.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 'bold', color: i === 0 ? (isServico ? '#16a34a' : '#667eea') : '#333', whiteSpace: 'nowrap' }}>
                        R$ {formatBRL(bid.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CHAT LEILAO ENCERRADO - GRATUITO PARA TODOS */}
          {!isAnuncio && isEnded && showChat && user && bids.length > 0 && (
            <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(16px, 4vw, 24px)', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: 'clamp(15px,4vw,18px)', color: '#1a202c' }}>
                💬 {isSeller ? 'Chat com os Participantes' : 'Chat com o Vendedor'}
              </h3>

              {/* VENDEDOR: seleciona com qual participante conversar */}
              {isSeller && (
                <div>
                  {allBidUsers.length > 1 && (
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '13px', color: '#666', fontWeight: '600', marginBottom: '8px' }}>
                        Selecione com quem conversar:
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {allBidUsers.map((bu) => (
                          <button key={bu.id} onClick={() => setSelectedChatUser(bu)}
                            style={{ padding: '7px 14px', borderRadius: '20px', border: selectedChatUser?.id === bu.id ? '2px solid #667eea' : '2px solid #e2e8f0', background: selectedChatUser?.id === bu.id ? '#667eea' : 'white', color: selectedChatUser?.id === bu.id ? 'white' : '#333', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                            {bu.position === 1 ? '🥇' : bu.position === 2 ? '🥈' : bu.position === 3 ? '🥉' : bu.position + 'o'} {bu.name.length > 16 ? bu.name.substring(0,16)+'...' : bu.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedChatUser && (
                    <Chat auction={auction} user={user} otherUser={selectedChatUser} canChat={true} />
                  )}
                </div>
              )}

              {/* PARTICIPANTE (qualquer posicao): chat com vendedor, gratuito */}
              {!isSeller && userBids.length > 0 && (
                <Chat auction={auction} user={user} otherUser={otherUserForBidder} canChat={true} />
              )}

              {/* Usuario que nao deu lance */}
              {!isSeller && userBids.length === 0 && (
                <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Voce nao participou deste leilao.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

            {lightboxImg && (
                        <div
                                    onClick={() => setLightboxImg(null)}
                                                style={{
                                                              position:'fixed',top:0,left:0,right:0,bottom:0,
                                                                            background:'rgba(0,0,0,0.95)',
                                                                                          zIndex:9999,
                                                                                                        display:'flex',
                                                                                                                      alignItems:'center',
                                                                                                                                    justifyContent:'center',
                                                                                                                                                  cursor:'zoom-out',
                                                                                                                                                                padding:'0'
                                                                                                                                                                            }}
                                                                                                                                                                                      >
                                                                                                                                                                                                  <img
                                                                                                                                                                                                                src={lightboxImg}
                                                                                                                                                                                                                              alt="Foto ampliada"
                                                                                                                                                                                                                                            onClick={e => e.stopPropagation()}
                                                                                                                                                                                                                                                          style={{
                                                                                                                                                                                                                                                                          maxWidth:'100vw',
                                                                                                                                                                                                                                                                                          maxHeight:'100vh',
                                                                                                                                                                                                                                                                                                          width:'auto',
                                                                                                                                                                                                                                                                                                                          height:'auto',
                                                                                                                                                                                                                                                                                                                                          objectFit:'contain',
                                                                                                                                                                                                                                                                                                                                                          display:'block',
                                                                                                                                                                                                                                                                                                                                                                          borderRadius:'0',
                                                                                                                                                                                                                                                                                                                                                                                          boxShadow:'none',
                                                                                                                                                                                                                                                                                                                                                                                                          cursor:'default'
                                                                                                                                                                                                                                                                                                                                                                                                                        }}
                                                                                                                                                                                                                                                                                                                                                                                                                                    />
                                                                                                                                                                                                                                                                                                                                                                                                                                                <button
                                                                                                                                                                                                                                                                                                                                                                                                                                                              onClick={() => setLightboxImg(null)}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            style={{
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            position:'absolute',top:'16px',right:'16px',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            background:'rgba(255,255,255,0.15)',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            border:'none',color:'white',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            fontSize:'28px',width:'48px',height:'48px',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            borderRadius:'50%',cursor:'pointer',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            fontWeight:'bold',lineHeight:'1',
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            display:'flex',alignItems:'center',justifyContent:'center'
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      >✕</button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        )}{toast && (
        <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: toast.tipo === 'sucesso' ? '#22c55e' : '#ef4444', color: 'white', padding: '16px 28px', borderRadius: '14px', fontSize: 'clamp(15px,4vw,18px)', fontWeight: 'bold', zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', maxWidth: '90vw', textAlign: 'center' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function AnuncioSellerChats({ auction, user }) {
  const [conversations, setConversations] = useState([])
  const [selectedConv, setSelectedConv] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('auction_id', auction.id)
      .order('created_at', { ascending: false })

    if (!data || data.length === 0) { setLoading(false); return }

    const senderMap = {}
    data.forEach(msg => {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
      if (otherId && !senderMap[otherId]) {
        senderMap[otherId] = { id: otherId, email: 'Interessado', lastMsg: msg.message, lastAt: msg.created_at }
      }
    })

    const ids = Object.keys(senderMap)
    if (ids.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, name, email').in('id', ids)
      if (profiles) profiles.forEach(p => {
        if (senderMap[p.id]) senderMap[p.id].email = p.name || p.email || 'Interessado'
      })
    }

    const convList = Object.values(senderMap)
    setConversations(convList)
    if (convList.length > 0) setSelectedConv(convList[0])
    setLoading(false)
  }

  if (loading) return null

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(16px, 4vw, 24px)', marginTop: '16px' }}>
      <h3 style={{ margin: '0 0 14px 0', fontSize: 'clamp(15px,4vw,18px)', color: '#1a202c' }}>
        💬 Mensagens de Interessados
      </h3>
      {conversations.length === 0 ? (
        <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          Nenhuma mensagem recebida ainda. Quando alguem se interessar, voce vera aqui.
        </div>
      ) : (
        <div>
          {conversations.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {conversations.map((conv) => (
                <button key={conv.id} onClick={() => setSelectedConv(conv)}
                  style={{ padding: '7px 14px', borderRadius: '20px', border: selectedConv?.id === conv.id ? '2px solid #667eea' : '2px solid #e2e8f0', background: selectedConv?.id === conv.id ? '#667eea' : 'white', color: selectedConv?.id === conv.id ? 'white' : '#333', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                  {conv.email.length > 18 ? conv.email.substring(0,18)+'...' : conv.email}
                </button>
              ))}
            </div>
          )}
          {selectedConv && (
            <Chat auction={auction} user={user} otherUser={selectedConv} canChat={true} />
          )}
        </div>
      )}
    </div>
  )
}



export default DetalhesLeilao