import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function Chat({ auction, user, otherUser }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMessages()
    const unsub = subscribeToMessages()
    return unsub
  }, [otherUser?.id])

  // Carrega apenas mensagens entre este par (user <-> otherUser) neste leilao
  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('auction_id', auction.id)
      .or(
        'and(sender_id.eq.' + user.id + ',receiver_id.eq.' + otherUser.id + '),' +
        'and(sender_id.eq.' + otherUser.id + ',receiver_id.eq.' + user.id + ')'
      )
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    setLoading(false)
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('chat-' + auction.id + '-' + user.id + '-' + otherUser.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'auction_id=eq.' + auction.id
      }, (payload) => {
        const msg = payload.new
        const isThisPair =
          (msg.sender_id === user.id && msg.receiver_id === otherUser.id) ||
          (msg.sender_id === otherUser.id && msg.receiver_id === user.id)
        if (isThisPair) setMessages(prev => [...prev, msg])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
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

  return (
    <div style={{ background: '#f9f9f9', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', height: '400px' }}>
      <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px', fontWeight: '600' }}>
        Conversa com <span style={{ color: '#667eea' }}>{otherUser.email || otherUser.name || 'Participante'}</span>
      </div>
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '14px' }}>
          Carregando mensagens...
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#bbb', padding: '40px 0', fontSize: '14px' }}>
              Nenhuma mensagem ainda. Diga ola!
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} style={{ marginBottom: '10px', display: 'flex', justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start' }}>
                <div style={{ background: msg.sender_id === user.id ? '#667eea' : '#e8e8e8', color: msg.sender_id === user.id ? 'white' : '#333', padding: '10px 14px', borderRadius: msg.sender_id === user.id ? '14px 14px 4px 14px' : '14px 14px 14px 4px', maxWidth: '74%', wordBreak: 'break-word' }}>
                  <div style={{ fontSize: '14px', lineHeight: '1.4' }}>{msg.message}</div>
                  <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.65 }}>
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          style={{ flex: 1, padding: '11px 14px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
        />
        <button type="submit"
          style={{ padding: '11px 22px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '14px' }}>
          Enviar
        </button>
      </form>
    </div>
  )
}

export default Chat
