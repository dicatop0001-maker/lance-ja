import { useNavigate } from 'react-router-dom'
import Notifications from './Notifications'

function BottomBar({ user, onLogout }) {
  const navigate = useNavigate()

    const btnStyle = {
        display: 'flex',
            flexDirection: 'column',
                alignItems: 'center',
                    justifyContent: 'center',
                        gap: '3px',
                            background: 'none',
                                border: 'none',
                                    color: '#cce0ff',
                                        cursor: 'pointer',
                                            fontSize: 'clamp(9px, 2vw, 12px)',
                                                fontWeight: '600',
                                                    padding: '6px 10px',
                                                        borderRadius: '8px',
                                                            minWidth: '60px',
                                                                transition: 'background 0.15s, color 0.15s',
                                                                    whiteSpace: 'nowrap',
                                                                      }

                                                                        const iconStyle = {
                                                                            fontSize: 'clamp(20px, 4vw, 26px)',
                                                                                lineHeight: 1,
                                                                                  }

                                                                                    const hoverIn = (e) => {
                                                                                        e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                                                                                            e.currentTarget.style.color = 'white'
                                                                                              }
                                                                                                const hoverOut = (e) => {
                                                                                                    e.currentTarget.style.background = 'none'
                                                                                                        e.currentTarget.style.color = '#cce0ff'
                                                                                                          }

                                                                                                            return (
                                                                                                                <div>
                                                                                                                      <div style={{ height: '72px' }} />
                                                                                                                            <nav style={{
                                                                                                                                    position: 'fixed',
                                                                                                                                            bottom: 0,
                                                                                                                                                    left: 0,
                                                                                                                                                            right: 0,
                                                                                                                                                                    height: '64px',
                                                                                                                                                                            background: 'linear-gradient(180deg, #1a2a4a 0%, #0f172a 100%)',
                                                                                                                                                                                    borderTop: '2px solid #2d4a8a',
                                                                                                                                                                                            display: 'flex',
                                                                                                                                                                                                    alignItems: 'center',
                                                                                                                                                                                                            justifyContent: 'space-around',
                                                                                                                                                                                                                    padding: '0 8px',
                                                                                                                                                                                                                            zIndex: 9999,
                                                                                                                                                                                                                                    boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
                                                                                                                                                                                                                                          }}>
                                                                                                                                                                                                                                                  <button style={btnStyle} onClick={() => navigate('/meus-leiloes')} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                                                                                                                                                                                                                                                            <span style={iconStyle}>🔨</span>
                                                                                                                                                                                                                                                                      <span>Meus Leilões</span>
                                                                                                                                                                                                                                                                              </button>
                                                                                                                                                                                                                                                                                      <button style={btnStyle} onClick={() => navigate('/meus-anuncios')} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
                                                                                                                                                                                                                                                                                                <span style={iconStyle}>📢</span>
                                                                                                                                                                                                                                                                                                          <span>Meus Anúncios</span>
                                                                                                                                                                                                                                                                                                                  </button>
                                                                                                                                                                                                                                                                                                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                                                                                                                                                                                                                                                                                    <Notifications user={user} bottomBar />
                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                    <button style={{ ...btnStyle, color: '#fca5a5' }} onClick={onLogout}
                                                                                                                                                                                                                                                                                                                                                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171' }}
                                                                                                                                                                                                                                                                                                                                                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#fca5a5' }}>
                                                                                                                                                                                                                                                                                                                                                                                  <span style={iconStyle}>🚪</span>
                                                                                                                                                                                                                                                                                                                                                                                            <span>Sair</span>
                                                                                                                                                                                                                                                                                                                                                                                                    </button>
                                                                                                                                                                                                                                                                                                                                                                                                          </nav>
                                                                                                                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                                                                                                                )
                                                                                                                                                                                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                                                                                                                                                                                export default BottomBar