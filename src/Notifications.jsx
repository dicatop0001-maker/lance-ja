import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function Notifications({ user }) {
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadNotifications()
      subscribeToNotifications()
    }
  }, [user])

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
    const channel = supabase
      .channel('notifications-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: 'user_id=eq.' + user.id
      }, () => {
        loadNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    loadNotifications()
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShowDropdown(!showDropdown)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid white', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', position: 'relative' }}>
        🔔 Notificações
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{unreadCount}</span>
        )}
      </button>
      
      {showDropdown && (
        <div style={{ position: 'absolute', top: '60px', right: 0, background: 'white', borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.3)', minWidth: '350px', maxHeight: '400px', overflowY: 'auto', zIndex: 1000 }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Nenhuma notificação</div>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} onClick={() => markAsRead(notif.id)} style={{ padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer', background: notif.read ? 'white' : '#f0f5ff' }}>
                <div style={{ fontSize: '14px', color: '#333' }}>{notif.message}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>{new Date(notif.created_at).toLocaleString('pt-BR')}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Notifications