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
  const userRef = useRef(null)
  const auctionRef = useRef(null)
  const bidsRef = useRef([])
  const channelRef = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      userRef.current = user
    })
    loadData()
    channelRef.current = subscribeToNewBids()
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
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
    const { data, error } = await supabase.from('auctions').select('*').eq('id', auctionId).single()
    if (error) console.error('Erro ao carregar leilao:', error.message)
    if (data) setAuction(data)
    setLoading(false)
  }

  const loadBids = async () => {
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', auctionId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Erro ao carregar lances:', error.message)
      setBids([])
      return
    }
    if (!data || data.length === 0) {
      setBids([])
      return
    }
    const userIds = [...new Set(data.map(b => b.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', userIds)
    const profileMap = {}
    if (profiles) {
      profiles.forEach(p => { profileMap[p.id] = p })
    }
    const enriched = data.map(bid => ({
      ...bid,
      users: profileMap[bid.user_id] || null
    }))
    setBids(enriched)
  }

  const checkAllBiddersChatUnlock = async (currentAuction) => {
    const auc = currentAuction || auctionRef.current
    if (!auc) return
    const { data } = await supabase
      .from('contact_unlocks')
      .select('*')
      .eq('auction_id', auc.id)
      .eq('unlock_type', 'all_bidders')
      .eq('payment_status', 'paid')
      .maybeSingle()
    if (data) setChatUnlockedForAll(true)
  }

  const handleUnlockAllSuccess = async () => {
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
      if (b.length > 0) {
        setOtherUser({ id: b[0].user_id, email: b[0].users?.email || 'Vencedor' })
      }
    } else {
      setOtherUser({ id: auc.seller_id, email: 'Vendedor' })
    }
  }

  const checkChatAccess = async (currentUser) => {
    const u = currentUser || userRef.current
    if (!u) return
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', u.id)
      .eq('status', 'active')
      .gte('ends_at', new Date().toISOString())
      .maybeSingle()
    if (subscription) { setCanChat(true); return }
    const { data: unlock } = await supabase
      .from('contact_unlocks')
      .select('*')
      .eq('user_id', u.id)
      .eq('auction_id', auctionId)
      .eq('payment_status', 'paid')
      .maybeSingle()
    if (unlock) { setCanChat(true) }
  }

  const subscribeToNewBids = () => {
    const channel = supabase
      .channel('bids-' + auctionId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bids',
        filter: 'auction_id=eq.' + auctionId
      }, () => {
        loadAuction()
        loadBids()
      })
      .subscribe()
    return channel
  }

  const createNotification = async (sellerId, message) => {
    await supabase.from('notifications').insert([{ user_id: sellerId, message, read: false }])
  }

  const isServico = auction?.category === 'servicos'

  const handleBid = async (e) => {
    e.preventDefault()
    if (!user) { alert('Voce precisa estar logado para dar um lance!'); return }
    if (!auction) return
    const amount = parseFloat(bidValue)
    if (isServico) {
      if (isNaN(amount) || amount <= 0) { alert('Digite um valor valido!'); return }
      if (amount >= auction.current_price) {
        alert('Para servicos o MENOR lance vence! Seu lance deve ser MENOR que R$ ' + auction.current_price.toFixed(2))
        return
      }
    } else {
      if (isNaN(amount) || amount <= auction.current_price) {
        alert('Lance deve ser MAIOR que R$ ' + auction.current_price.toFixed(2))
        return
      }
    }
    setBidLoading(true)
    const { error: bidError } = await supabase
      .from('bids')
      .insert([{ auction_id: auctionId, user_id: user.id, amount }])
    if (bidError) {
      alert('Erro ao registrar lance: ' + bidError.message)
      setBidLoading(false)
      return
    }
    const { error: updateError } = await supabase
      .from('auctions')
      .update({ current_price: amount })
      .eq('id', auctionId)
    if (updateError) { console.error('Erro ao atualizar preco:', updateError.message) }
    await createNotification(
      auction.seller_id,
      'Novo lance de R$ ' + amount.toFixed(2) + ' no leilao: ' + auction.title
    )
    setBidLoading(false)
    setBidValue('')
    alert('Lance enviado com sucesso!')
    loadAuction()
    loadBids()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ fontSize: '18px', color: '#667eea' }}>Carregando...</div>
    </div>
  )

  if (!auction) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ fontSize: '18px', color: '#666' }}>Leilao nao encontrado</div>
    </div>
  )

  const hasImages = auction.images && auction.images.length > 0
  const isEnded = auction.status === 'ended' || new Date(auction.ends_at) < new Date()
  const isSeller = user && auction.seller_id === user.id
  const bidPlaceholder = isServico
    ? 'Lance maximo: R$ ' + (auction.current_price - 0.01).toFixed(2)
    : 'Minimo: R$ ' + (auction.current_price + 0.01).toFixed(2)

  const userBids = bids.filter(b => b.user_id === user?.id)
  const isWinner = bids.length > 0 && bids[0].user_id === user?.id
  const isNonWinnerBidder = userBids.length > 0 && !isWinner

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', overflowX: 'hidden' }}>
      <style>{detalhesStyle}</style>

      {/* CABECALHO */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '16px 20px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate('/home')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' }}>
          &larr; Voltar
        </button>
        <span style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 'bold' }}>Detalhes do Leilao</span>
      </div>

      {/* GRID RESPONSIVO */}
      <div className="detalhes-grid">

        {/* COLUNA ESQUERDA */}
        <div>
          {hasImages ? (
            <div>
              <div style={{ background: '#f0f0f0', borderRadius: '16px', height: 'clamp(220px, 55vw, 400px)', marginBottom: '12px', overflow: 'hidden' }}>
                <img src={auction.images[currentImageIndex]} alt={auction.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {auction.images.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {auction.images.map((img, i) => (
                    <div key={i} onClick={() => setCurrentImageIndex(i)} style={{ minWidth: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: i === currentImageIndex ? '3px solid #667eea' : '3px solid transparent', flexShrink: 0 }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#f0f0f0', borderRadius: '16px', height: 'clamp(220px, 55vw, 400px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', marginBottom: '12px' }}>📦</div>
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

        {/* COLUNA DIREITA */}
        <div>
          <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(16px, 4vw, 30px)', marginBottom: '16px' }}>
            {isServico && (
              <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#eff6ff', border: '2px solid #1e3a8a', borderRadius: '12px', fontSize: 'clamp(13px, 3.5vw, 14px)', color: '#1e3a8a', fontWeight: '700' }}>
                🔧 SERVICO — O MENOR LANCE VENCE!
              </div>
            )}
            <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#999', marginBottom: '4px' }}>{isServico ? 'Menor lance atual' : 'Lance atual'}</div>
            <div style={{ fontSize: 'clamp(36px, 9vw, 48px)', fontWeight: 'bold', color: isServico ? '#16a34a' : '#667eea', marginBottom: '16px' }}>
              R$ {auction.current_price.toFixed(2)}
            </div>
            <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#999', marginBottom: '4px' }}>{isEnded ? 'Encerrado em' : 'Encerra em'}</div>
            <div style={{ fontSize: 'clamp(16px, 4vw, 24px)', fontWeight: 'bold', marginBottom: '24px', color: isEnded ? '#f44336' : '#333' }}>
              {new Date(auction.ends_at).toLocaleString('pt-BR')}
              {isEnded && <span style={{ fontSize: 'clamp(13px, 3.5vw, 16px)', color: '#f44336', marginLeft: '8px' }}>ENCERRADO</span>}
            </div>

            {!isEnded && user && auction.seller_id !== user.id && (
              <form onSubmit={handleBid}>
                <input
                  type="number"
                  value={bidValue}
                  onChange={(e) => setBidValue(e.target.value)}
                  placeholder={bidPlaceholder}
                  step="0.01"
                  min="0.01"
                  required
                  disabled={bidLoading}
                  style={{ width: '100%', padding: 'clamp(12px, 3vw, 15px)', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: 'clamp(16px, 4vw, 18px)', boxSizing: 'border-box', marginBottom: '12px' }}
                />
                <button type="submit" disabled={bidLoading} style={{ width: '100%', padding: 'clamp(14px, 4vw, 20px)', background: bidLoading ? '#aaa' : (isServico ? '#16a34a' : '#667eea'), color: 'white', border: 'none', borderRadius: '10px', fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: 'bold', cursor: bidLoading ? 'not-allowed' : 'pointer' }}>
                  {bidLoading ? 'ENVIANDO...' : (isServico ? 'DAR LANCE (MENOR VENCE)' : 'DAR LANCE')}
                </button>
              </form>
            )}

            {!isEnded && isSeller && (
              <div style={{ background: '#fff3e0', padding: '16px', borderRadius: '10px', textAlign: 'center', color: '#f57c00', fontSize: 'clamp(13px, 3.5vw, 15px)' }}>
                Voce e o vendedor deste leilao
              </div>
            )}

            {isEnded && (
              <div style={{ background: '#ffeaea', padding: '16px', borderRadius: '10px', textAlign: 'center', color: '#f44336', fontWeight: 'bold', fontSize: 'clamp(13px, 3.5vw, 15px)' }}>
                Este leilao foi encerrado
              </div>
            )}

            {/* BOTAO LIBERAR CHAT PARA TODOS — so aparece para o vendedor apos encerrar */}
            {isEnded && isSeller && bids.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                {chatUnlockedForAll ? (
                  <div style={{ background: '#e8f5e9', padding: '16px', borderRadius: '12px', textAlign: 'center', color: '#2e7d32', fontWeight: 'bold', fontSize: 'clamp(13px, 3.5vw, 15px)', border: '2px solid #4CAF50' }}>
                    ✅ Chat liberado para todos os participantes!
                  </div>
                ) : (
                  <button
                    onClick={() => setShowUnlockAllModal(true)}
                    style={{ width: '100%', padding: 'clamp(14px, 4vw, 18px)', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 15px rgba(240,147,251,0.4)' }}
                  >
                    💬 Liberar Chat para Todos os Participantes<br />
                    <span style={{ fontSize: 'clamp(11px, 3vw, 13px)', opacity: 0.9 }}>Pague R$ 1,00 via PIX e converse com todos que deram lance</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* HISTORICO DE LANCES */}
          <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(16px, 4vw, 30px)', marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 'clamp(16px, 4vw, 20px)' }}>Historico de Lances ({bids.length})</h3>
            {bids.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px', fontSize: 'clamp(13px, 3.5vw, 15px)' }}>Nenhum lance ainda. Seja o primeiro!</div>
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
                      R$ {bid.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CHAT NORMAL (vencedor ou vendedor) */}
          {showChat && isEnded && otherUser && (
            <Chat auction={auction} user={user} otherUser={otherUser} canChat={canChat} />
          )}

          {/* CHAT PARA NAO-VENCEDORES quando vendedor liberou para todos */}
          {isEnded && chatUnlockedForAll && isNonWinnerBidder && user && (
            <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(16px, 4vw, 24px)', marginTop: '16px' }}>
              <div style={{ background: '#e8f5e9', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: 'clamp(13px, 3.5vw, 15px)', color: '#2e7d32', fontWeight: 'bold' }}>
                💬 O vendedor liberou o chat para todos os participantes!
              </div>
              <Chat auction={auction} user={user} otherUser={{ id: auction.seller_id, email: 'Vendedor' }} canChat={true} />
            </div>
          )}
        </div>
      </div>

      {/* MODAL PAGAMENTO PIX — LIBERAR CHAT PARA TODOS */}
      {showUnlockAllModal && (
        <PaymentModal
          user={user}
          auction={auction}
          amount={1.00}
          plan="all_bidders"
          onClose={() => setShowUnlockAllModal(false)}
          onSuccess={handleUnlockAllSuccess}
        />
      )}
    </div>
  )
}

export default DetalhesLeilao
