import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { useParams, useNavigate } from 'react-router-dom'
import Chat from './Chat'
import PaymentModal from './PaymentModal'

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
    const [canChat, setCanChat] = useState(false)
    const [chatUnlockedForAll, setChatUnlockedForAll] = useState(false)
    const [otherUser, setOtherUser] = useState(null)
    const [showChat, setShowChat] = useState(false)
    const [showUnlockAllModal, setShowUnlockAllModal] = useState(false)
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
        const isEnded = auction && (auction.status === 'ended' || new Date(auction.ends_at) < new Date())
        if (isEnded && userRef.current) {
                setShowChat(true)
                loadOtherUser(auction, bids)
                checkChatAccess(userRef.current)
                checkAllBiddersChatUnlock(auction)
        }
  }, [auction, bids])

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

  const checkAllBiddersChatUnlock = async (currentAuction) => {
        const auc = currentAuction || auctionRef.current
        if (!auc) return
        const { data } = await supabase.from('contact_unlocks').select('*').eq('auction_id', auc.id).eq('unlock_type', 'all_bidders').eq('payment_status', 'paid').maybeSingle()
        if (data) setChatUnlockedForAll(true)
  }

  const handleUnlockAllSuccess = () => {
        setChatUnlockedForAll(true)
        setShowUnlockAllModal(false)
        alert('Chat liberado para todos os participantes!')
        window.location.reload()
  }

  const loadOtherUser = (currentAuction, currentBids) => {
        const auc = currentAuction || auctionRef.current
        const b = currentBids || bidsRef.current
        const u = userRef.current
        if (!auc || !u) return
        if (auc.seller_id === u.id) {
                if (b.length > 0) setOtherUser({ id: b[0].user_id, email: b[0].users?.email || 'Vencedor' })
        } else {
                setOtherUser({ id: auc.seller_id, email: 'Vendedor' })
        }
  }

  const checkChatAccess = async (currentUser) => {
        const u = currentUser || userRef.current
        if (!u) return
        const { data: subscription } = await supabase.from('subscriptions').select('*').eq('user_id', u.id).eq('status', 'active').gte('ends_at', new Date().toISOString()).maybeSingle()
        if (subscription) { setCanChat(true); return }
        const { data: unlock } = await supabase.from('contact_unlocks').select('*').eq('user_id', u.id).eq('auction_id', auctionId).eq('payment_status', 'paid').maybeSingle()
        if (unlock) setCanChat(true)
  }

  const subscribeToNewBids = () => {
        return supabase.channel('bids-' + auctionId)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids', filter: 'auction_id=eq.' + auctionId }, () => { loadAuction(); loadBids() })
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
    const isWinner = bids.length > 0 && bids[0].user_id === user?.id
    const isNonWinnerBidder = userBids.length > 0 && !isWinner

  return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', overflowX: 'hidden' }}>
                <style>{detalhesStyle}</style>
        
              <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '16px 20px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <button onClick={() => navigate('/home')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                Voltar
                      </button>
                      <span style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 'bold' }}>
                        {isAnuncio ? 'Detalhes do Anuncio' : 'Detalhes do Leilao'}
                      </span>
                {isSeller && (
                    <button
                                  onClick={() => navigate(isAnuncio ? '/editar-anuncio/' + auction.id : '/editar-leilao/' + auction.id)}
                                  style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.6)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                                >
                                Editar / Excluir
                    </button>
                      )}
              </div>
        
              <div className="detalhes-grid">
                      <div>
                        {hasImages ? (
                      <div>
                                    <div style={{ background: '#f0f0f0', borderRadius: '16px', height: 'clamp(220px, 55vw, 400px)', marginBottom: '12px', overflow: 'hidden' }}>
                                                    <img src={auction.images[currentImageIndex]} alt={auction.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                        {auction.images.length > 1 && (
                                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                                          {auction.images.map((img, i) => (
                                                              <div key={i} onClick={() => setCurrentImageIndex(i)}
                                                                                      style={{ minWidth: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: i === currentImageIndex ? '3px solid #667eea' : '3px solid transparent', flexShrink: 0 }}>
                                                                                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                      
                                <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(16px, 4vw, 30px)', marginTop: '16px' }}>
                                            <h1 style={{ margin: '0 0 16px 0', fontSize: 'clamp(20px, 5vw, 32px)', wordBreak: 'break-word' }}>{auction.title}</h1>
                                            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '16px', fontSize: 'clamp(14px, 3.5vw, 16px)', wordBreak: 'break-word' }}>{auction.description || 'Sem descricao'}</p>
                                            <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
                                                          <div style={{ marginBottom: '8px', fontSize: 'clamp(13px, 3.5vw, 15px)' }}><strong>Categoria:</strong> {auction.category}</div>
                                                          <div style={{ marginBottom: '8px', fontSize: 'clamp(13px, 3.5vw, 15px)' }}><strong>Localizacao:</strong> {auction.neighborhood ? auction.neighborhood + ', ' : ''}{auction.city} - {auction.state}</div>
                                                          <div style={{ marginBottom: '8px', fontSize: 'clamp(13px, 3.5vw, 15px)' }}><strong>Criado em:</strong> {new Date(auction.created_at).toLocaleDateString('pt-BR')}</div>
                                            </div>
                                </div>
                      </div>
              
                      <div>
                                <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(16px, 4vw, 30px)', marginBottom: '16px' }}>
                                  {isServico && (
                        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#eff6ff', border: '2px solid #1e3a8a', borderRadius: '12px', fontSize: 'clamp(13px, 3.5vw, 14px)', color: '#1e3a8a', fontWeight: '700' }}>
                                        PRESTADOR DE SERVIÇOS - MENOR ORÇAMENTO VENCE!
                        </div>
                                            )}
                                
                                            <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#999', marginBottom: '4px' }}>
                                              {isAnuncio ? 'Preco' : (isServico ? 'Menor orçamento atual' : 'Lance atual')}
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
                                        <input
                                                            type="text"
                                                            inputMode="decimal"
                                                            value={bidValue}
                                                            onChange={(e) => setBidValue(e.target.value)}
                                                            placeholder={isServico ? 'Lance maximo: R$ ' + formatBRL(auction.current_price - 0.01) : 'Minimo: R$ ' + formatBRL(auction.current_price + 0.01)}
                                                            disabled={bidLoading}
                                                            style={{ width: '100%', padding: 'clamp(12px, 3vw, 15px)', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: 'clamp(16px, 4vw, 18px)', boxSizing: 'border-box', marginBottom: '12px' }}
                                                          />
                                        <button type="submit" disabled={bidLoading}
                                                            style={{ width: '100%', padding: 'clamp(14px, 4vw, 20px)', background: bidLoading ? '#aaa' : (isServico ? '#16a34a' : '#667eea'), color: 'white', border: 'none', borderRadius: '10px', fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: 'bold', cursor: bidLoading ? 'not-allowed' : 'pointer' }}>
                                          {bidLoading ? 'ENVIANDO...' : (isServico ? 'ENVIAR ORÇAMENTO (MENOR VENCE)' : 'DAR LANCE')}
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
                                
                                  {!isAnuncio && isEnded && isSeller && bids.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          {chatUnlockedForAll ? (
                                            <div style={{ background: '#e8f5e9', padding: '16px', borderRadius: '12px', textAlign: 'center', color: '#2e7d32', fontWeight: 'bold', border: '2px solid #4CAF50' }}>
                                                                Chat liberado para todos!
                                            </div>
                                          ) : (
                                            <button onClick={() => setShowUnlockAllModal(true)}
                                                                  style={{ width: '100%', padding: 'clamp(14px, 4vw, 18px)', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
                                                                Liberar Chat para Todos - R$ 1,00 via PIX
                                            </button>
                                        )}
                        </div>
                                            )}
                                </div>
                      
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
                      
                        {showChat && isEnded && otherUser && (
                      <Chat auction={auction} user={user} otherUser={otherUser} canChat={canChat} />
                    )}
                      
                        {isEnded && chatUnlockedForAll && isNonWinnerBidder && user && (
                      <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(16px, 4vw, 24px)', marginTop: '16px' }}>
                                    <div style={{ background: '#e8f5e9', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', color: '#2e7d32', fontWeight: 'bold' }}>
                                                    O vendedor liberou o chat para todos os participantes!
                                    </div>
                                    <Chat auction={auction} user={user} otherUser={{ id: auction.seller_id, email: 'Vendedor' }} canChat={true} />
                      </div>
                                )}
                      </div>
              </div>
        
          {showUnlockAllModal && (
                  <PaymentModal user={user} auction={auction} amount={1.00} plan="all_bidders" onClose={() => setShowUnlockAllModal(false)} onSuccess={handleUnlockAllSuccess} />
                )}
        
          {toast && (
                  <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: toast.tipo === 'sucesso' ? '#22c55e' : '#ef4444', color: 'white', padding: '16px 28px', borderRadius: '14px', fontSize: 'clamp(15px,4vw,18px)', fontWeight: 'bold', zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', maxWidth: '90vw', textAlign: 'center' }}>
                    {toast.msg}
                  </div>
              )}
        </div>
      )
}

export default DetalhesLeilao
