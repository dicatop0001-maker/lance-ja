🔒import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import PaymentModal from './PaymentModal'

function Chat({ auction, user, otherUser, canChat }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  useEffect(() => {
    if (canChat) {
      loadMessages()
      subscribeToMessages()
    }
    setLoading(false)
  }, [canChat])

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('auction_id', auction.id)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages-' + auction.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'auction_id=eq.' + auction.id
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    await supabase.from('messages').insert([{
      auction_id: auction.id,
      sender_id: user.id,
      receiver_id: otherUser.id,
      message: newMessage.trim()
    }])

    setNewMessage('')
  }

  const handlePaymentClick = (plan) => {
    setSelectedPlan(plan)
    setShowPayment(true)
  }

  const handlePaymentSuccess = async () => {
    alert('âœ… Pagamento confirmado! Chat desbloqueado!')
    setShowPayment(false)
    window.location.reload()
  }

  if (!canChat) {
    return (
      <>
        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>ðŸ”’</div>
          <h3 style={{ margin: '0 0 15px 0' }}>Chat Bloqueado</h3>
          <p style={{ color: '#666', marginBottom: '30px' }}>Para conversar com o {auction.seller_id === user.id ? 'vencedor' : 'vendedor'}, vocÃª precisa desbloquear o contato.</p>
          <div style={{ background: '#f5f5f5', borderRadius: '15px', padding: '30px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 20px 0' }}>ðŸ’° OpÃ§Ãµes de Pagamento:</h4>
            <div style={{ display: 'grid', gap: '15px' }}>
              <div 
                onClick={() => handlePaymentClick({ type: 'single', amount: 1.00 })}
                style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '2px solid #667eea', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>R$ 1,00</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Desbloquear apenas este contato</div>
              </div>
              <div 
                onClick={() => handlePaymentClick({ type: 'monthly', amount: 8.00 })}
                style={{ background: 'white', padding: '20px', borderRadius: '10px', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>R$ 8,00/mÃªs</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Contatos ilimitados</div>
              </div>
              <div 
                onClick={() => handlePaymentClick({ type: 'annual', amount: 50.00 })}
                style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '2px solid #4CAF50', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>R$ 50,00/ano</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Economia de 48% - Contatos ilimitados</div>
                <div style={{ fontSize: '12px', color: '#4CAF50', marginTop: '5px' }}>â­ MELHOR OFERTA</div>
              </div>
            </div>
          </div>
        </div>

        {showPayment && selectedPlan && (
          <PaymentModal 
            user={user}
            auction={auction}
            amount={selectedPlan.amount}
            plan={selectedPlan.type}
            onClose={() => setShowPayment(false)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </>
    )
  }

  return (
    <div style={{ background: 'white', borderRadius: '20px', padding: '20px', height: '500px', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 20px 0' }}>ðŸ’¬ Chat com {otherUser.email}</h3>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', background: '#f9f9f9', borderRadius: '10px', padding: '15px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>Nenhuma mensagem ainda. Seja o primeiro a enviar!</div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{ marginBottom: '15px', display: 'flex', justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
              <div style={{ background: msg.sender_id === user.id ? '#667eea' : '#e0e0e0', color: msg.sender_id === user.id ? 'white' : '#333', padding: '10px 15px', borderRadius: '15px', maxWidth: '70%' }}>
                <div style={{ fontSize: '14px' }}>{msg.message}</div>
                <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.7 }}>{new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." style={{ flex: 1, padding: '12px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '14px' }} />
        <button type="submit" style={{ padding: '12px 30px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Enviar</button>
      </form>
    </div>
  )
}

export default Chat
