import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

function Notifications({ user }) {
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!user) return

    loadNotifications()

    // Cleanup existing subscription before creating new one
    try {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    } catch (e) {}

    // Create new subscription with try/catch guard
    try {
      const channel = supabase
        .channel('notifications-' + user.id + '-' + Date.now())
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'user_id=eq.' + user.id
        }, () => {
          loadNotifications()
        })
        .subscribe()

      channelRef.current = channel
    } catch (e) {
      console.log('Notification subscription skipped:', e.message)
    }

    return () => {
      try {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current)
          channelRef.current = null
        }
      } catch (e) {}
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

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    loadNotifications()
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          padding: '14px 28px',
          background: '#1e3a8a',
          color: 'white',
          border: '3px solid #4a90d9',
          borderRadius: '50px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '16px',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 15px rgba(30,58,138,0.5)',
          letterSpacing: '0.5px',
          position: 'relative'
        }}
      >
        Notificacoes
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '22px',
            height: '22px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '0',
          background: 'white',
          borderRadius: '15px',
          padding: '16px',
          minWidth: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#333' }}>Notificacoes</h3>
          {notifications.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Nenhuma notificacao</p>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  marginBottom: '8px',
                  background: notif.read ? '#f9f9f9' : '#e8f4fd',
                  cursor: 'pointer',
                  borderLeft: notif.read ? '3px solid #ddd' : '3px solid #667eea'
                }}
              >
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#333' }}>{notif.message}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                  {new Date(notif.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Notifications
