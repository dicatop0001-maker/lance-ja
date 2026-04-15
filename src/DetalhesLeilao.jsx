import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { useParams, useNavigate } from 'react-router-dom'
import Chat from './Chat'

function DetalhesLeilao() {
  const { id: auctionId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [auction, setAuction] = useState(null)
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [bidValue, setBidValue] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [canChat, setCanChat] = useState(false)
  const [otherUser, setOtherUser] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const userRef = useRef(null)
  const auctionRef = useRef(null)
  const bidsRef = useRef([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      userRef.current = user
    })
    loadData()
    const unsubscribe = subscribeToNewBids()
    return () => {
      if (unsubscribe) unsubscribe()
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
    }
  }, [auction, bids])

  const loadAuction = async () => {
    const { data } = await supabase.from('auctions').select('*').eq('id', auctionId).single()
    if (data) {
      setAuction(data)
    }
    setLoading(false)
  }

  const loadBids = async () => {
    const { data } = await supabase.from('bids').select('*, users(name, email)').eq('auction_id', auctionId).order('created_at', { ascending: false })
    if (data) setBids(data)
  }

  const loadOtherUser = (currentAuction, currentBids) => {
    const auc = currentAuction || auctionRef.current
    const b = currentBids || bidsRef.current
    const u = userRef.current
    if (!auc || !u) return

    if (auc.seller_id === u.id) {
      if (b.length > 0) {
        setOtherUser({
          id: b[0].user_id,
          email: b[0].users?.email || 'Vencedor'
        })
      }
    } else {
      setOtherUser({
        id: auc.seller_id,
        email: 'Vendedor'
      })
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
      .single()

    if (subscription) {
      setCanChat(true)
      return
    }

    const { data: unlock } = await supabase
      .from('contact_unlocks')
      .select('*')
      .eq('user_id', u.id)
      .eq('auction_id', auctionId)
      .eq('payment_status', 'paid')
      .single()

    if (unlock) {
      setCanChat(true)
    }
  }

  const subscribeToNewBids = () => {
    const channel = supabase.channel('bids-' + auctionId)

    channel
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

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const createNotification = async (sellerId, message) => {
    await supabase.from('notifications').insert([{
      user_id: sellerId,
      message: message,
      read: false
    }])
  }

  const handleBid = async (e) => {
    e.preventDefault()
    const amount = parseFloat(bidValue)
    if (isNaN(amount) || amount <= auction.current_price) {
      alert('Lance deve ser maior que R$ ' + auction.current_price.toFixed(2))
      return
    }
    const { error } = await supabase.from('bids').insert([{ auction_id: auctionId, user_id: user.id, amount }])
    if (error) {
      alert('Erro: ' + error.message)
    } else {
      await supabase.from('auctions').update({ current_price: amount }).eq('id', auctionId)
      await createNotification(auction.seller_id, 'Novo lance de R$ ' + amount.toFixed(2) + ' no leilao: ' + auction.title)
      alert('Lance enviado com sucesso!')
      setBidValue('')
      loadAuction()
      loadBids()
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>
  if (!auction) return <div style={{ padding: '40px', textAlign: 'center' }}>Leilao nao encontrado</div>

  const hasImages = auction.images && auction.images.length > 0
  const isEnded = auction.status === 'ended' || new Date(auction.ends_at) < new Date()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', color: 'white' }}>
        <button onClick={() => navigate('/home')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginRight: '15px' }}>&larr; Voltar</button>
        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>Detalhes do Leilao</span>
      </div>
      <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div>
          {hasImages ? (
            <div>
              <div style={{ background: '#f0f0f0', borderRadius: '20px', height: '400px', marginBottom: '15px', overflow: 'hidden' }}>
                <img src={auction.images[currentImageIndex]} alt={auction.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {auction.images.length > 1 && (
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
                  {auction.images.map((img, i) => (
                    <div key={i} onClick={() => setCurrentImageIndex(i)} style={{ minWidth: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: i === currentImageIndex ? '3px solid #667eea' : '3px solid transparent' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#f0f0f0', borderRadius: '20px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', marginBottom: '20px' }}>📦</div>
          )}
          <div style={{ background: 'white', borderRadius: '20px', padding: '30px', marginTop: '20px' }}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '32px' }}>{auction.title}</h1>
            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>{auction.description || 'Sem descricao'}</p>
            <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '20px' }}>
              <div style={{ marginBottom: '10px' }}><strong>Categoria:</strong> {auction.category}</div>
              <div style={{ marginBottom: '10px' }}><strong>Localizacao:</strong> {auction.neighborhood}, {auction.city} - {auction.state}</div>
              <div style={{ marginBottom: '10px' }}><strong>Criado em:</strong> {new Date(auction.created_at).toLocaleDateString('pt-BR')}</div>
            </div>
          </div>
        </div>
        <div>
          <div style={{ background: 'white', borderRadius: '20px', padding: '30px', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: '#999', marginBottom: '5px' }}>Lance atual</div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#667eea', marginBottom: '20px' }}>R$ {auction.current_price.toFixed(2)}</div>
            <div style={{ fontSize: '14px', color: '#999', marginBottom: '5px' }}>{isEnded ? 'Encerrado em' : 'Encerra em'}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px', color: isEnded ? '#f44336' : '#333' }}>
              {new Date(auction.ends_at).toLocaleString('pt-BR')}
              {isEnded && <span style={{ fontSize: '16px', color: '#f44336', marginLeft: '10px' }}>ENCERRADO</span>}
            </div>
            {!isEnded && user && auction.seller_id !== user.id && (
              <form onSubmit={handleBid}>
                <input type="number" value={bidValue} onChange={(e) => setBidValue(e.target.value)} placeholder={'Minimo: R$ ' + (auction.current_price + 0.01).toFixed(2)} step="0.01" required style={{ width: '100%', padding: '15px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '18px', boxSizing: 'border-box', marginBottom: '15px' }} />
                <button type="submit" style={{ width: '100%', padding: '20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>DAR LANCE</button>
              </form>
            )}
            {!isEnded && user && auction.seller_id === user.id && (
              <div style={{ background: '#fff3e0', padding: '20px', borderRadius: '10px', textAlign: 'center', color: '#f57c00' }}>Voce e o vendedor deste leilao</div>
            )}
          </div>
          <div style={{ background: 'white', borderRadius: '20px', padding: '30px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Historico de Lances ({bids.length})</h3>
            {bids.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Nenhum lance ainda</div>
            ) : (
              <div>{bids.map((bid, i) => (
                <div key={bid.id} style={{ padding: '15px', background: i === 0 ? '#f0f5ff' : '#f9f9f9', borderRadius: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{bid.users?.name || bid.users?.email || 'Anonimo'}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{new Date(bid.created_at).toLocaleString('pt-BR')}</div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: i === 0 ? '#667eea' : '#333' }}>R$ {bid.amount.toFixed(2)}</div>
                </div>
              ))}</div>
            )}
          </div>
          {showChat && isEnded && otherUser && (
            <Chat auction={auction} user={user} otherUser={otherUser} canChat={canChat} />
          )}
        </div>
      </div>
    </div>
  )
}

export default DetalhesLeilao
