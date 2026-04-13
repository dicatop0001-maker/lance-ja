import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function Notifications({ user }) {
  const [notifications, setNotifications] = useState([])
  const [show, setShow] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
    const unsubscribe = subscribeToNotifications()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    }
  }

  const subscribeToNotifications = () => {
    const channel = supabase.channel('notifications-' + user.id)
    
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'user_id=eq.' + user.id
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
        setUnreadCount(prev => prev + 1)
        showToast(payload.new.message)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const showToast = (message) => {
    const toast = document.createElement('div')
    toast.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #667eea; color: white; padding: 15px 20px; borderRadius: 10px; boxShadow: 0 4px 15px rgba(0,0,0,0.2); zIndex: 9999;'
    toast.innerHTML = 'ðŸ”” ' + message
    document.body.appendChild(toast)
    setTimeout(() => {
      toast.remove()
    }, 3000)
  }

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(notifications.map(n => n.id === id ? {...n, read: true} : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications(notifications.map(n => ({...n, read: true})))
    setUnreadCount(0)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShow(!show)} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid white', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', position: 'relative' }}>
        ðŸ”” NotificaÃ§Ãµes
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>
        )}
      </button>
      {show && (
        <div style={{ position: 'absolute', top: '50px', right: 0, background: 'white', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', width: '350px', maxHeight: '400px', overflowY: 'auto', zIndex: 1000 }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#333' }}>NotificaÃ§Ãµes</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '14px' }}>Marcar todas como lidas</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>Nenhuma notificaÃ§Ã£o</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} onClick={() => !n.read && markAsRead(n.id)} style={{ padding: '15px', borderBottom: '1px solid #f0f0f0', background: n.read ? 'white' : '#f0f5ff', cursor: 'pointer' }}>
                <div style={{ fontSize: '14px', color: '#333', marginBottom: '5px' }}>{n.message}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>{new Date(n.created_at).toLocaleString('pt-BR')}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Notifications
