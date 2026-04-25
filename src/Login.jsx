import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import './styles.css'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

  const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
                if (isLogin) {
                          const { error } = await supabase.auth.signInWithPassword({ email, password })
                          if (error) throw error
                          navigate('/home')
                } else {
                          const { error } = await supabase.auth.signUp({ email, password })
                          if (error) throw error
                          alert('Conta criada! Verifique seu email e faca login.')
                          setIsLogin(true)
                }
        } catch (error) {
                alert(error.message)
        } finally {
                setLoading(false)
        }
  }

  const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin + '/home' }
        })
        if (error) alert(error.message)
  }

  const handleFacebookLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
                provider: 'facebook',
                options: { redirectTo: window.location.origin + '/home' }
        })
        if (error) alert(error.message)
  }

  return (
        <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #FF6B35 0%, #004E89 100%)',
                position: 'relative',
                overflow: 'hidden'
        }}>
                <div style={{
                  position: 'absolute', top: '-50%', right: '-20%',
                  width: '600px', height: '600px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%', filter: 'blur(80px)'
        }} />
                <div style={{
                  position: 'absolute', bottom: '-30%', left: '-10%',
                  width: '500px', height: '500px',
                  background: 'rgba(0,78,137,0.3)',
                  borderRadius: '50%', filter: 'blur(100px)'
        }} />
                <div className="animate-scale-in" style={{
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  padding: '48px',
                  borderRadius: '24px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                  width: '100%',
                  maxWidth: '480px',
                  position: 'relative',
                  zIndex: 1
        }}>
                          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                      <div style={{
                      background: 'linear-gradient(180deg, #1565C0 0%, #1976D2 100%)',
                      borderRadius: '10px 10px 0 0',
                      padding: '14px 20px 10px'
        }}>
                                                    <div style={{ fontSize: 'clamp(22px,5vw,30px)', fontWeight: '900', color: 'white', letterSpacing: '1px', lineHeight: '1.1' }}>Compra e venda</div>
                                                    <div style={{ fontSize: 'clamp(14px,3vw,18px)', fontWeight: '700', color: '#FFD600', fontStyle: 'italic', marginTop: '2px' }}>Perto de voce</div>
                                      </div>
                                      <div style={{
                      background: 'white',
                      borderRadius: '0 0 10px 10px',
                      border: '2px solid #e2e8f0',
                      borderTop: 'none',
                      overflow: 'hidden',
                      lineHeight: 0
        }}>
                                                    <img src="/logo-conecty.png" alt="Conecty" style={{ display: 'block', width: '100%' }} />
                                      </div>
                          </div>

                          <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '26px',
                    fontWeight: '800',
                    textAlign: 'center',
                    color: 'var(--gray-900)',
                    marginBottom: '6px'
        }}>
                                      Bem vindo ao seu bairro!
                          </h2>
                          <p style={{
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--gray-600)',
                    marginBottom: '28px',
                    fontStyle: 'italic'
        }}>
                                      aqui tem de tudo, ate horario do seu onibus!
                          </p>

                          <form onSubmit={handleAuth} style={{ marginBottom: '20px' }}>
                                      <div style={{ marginBottom: '20px' }}>
                                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '8px' }}>Email</label>
                                                    <input
                                                                    type="email"
                                                                    placeholder="seu@email.com"
                                                                    value={email}
                                                                    onChange={(e) => setEmail(e.target.value)}
                                                                    style={{ width: '100%', padding: '16px 20px', border: '2px solid var(--gray-300)', borderRadius: '12px', fontSize: '16px', fontFamily: 'var(--font-body)', transition: 'all 0.2s', outline: 'none' }}
                                                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                                                    onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
                                                                    required
                                                                  />
                                      </div>
                                      <div style={{ marginBottom: '24px' }}>
                                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '8px' }}>Senha</label>
                                                    <input
                                                                    type="password"
                                                                    placeholder="••••••••"
                                                                    value={password}
                                                                    onChange={(e) => setPassword(e.target.value)}
                                                                    style={{ width: '100%', padding: '16px 20px', border: '2px solid var(--gray-300)', borderRadius: '12px', fontSize: '16px', fontFamily: 'var(--font-body)', transition: 'all 0.2s', outline: 'none' }}
                                                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                                                    onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
                                                                    required
                                                                  />
                                      </div>
                                      <button
                                                    type="submit"
                                                    disabled={loading}
                                                    style={{
                                                                    width: '100%', padding: '18px',
                                                                    background: loading ? 'var(--gray-400)' : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                                                                    color: 'white', border: 'none', borderRadius: '12px',
                                                                    fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-display)',
                                                                    cursor: loading ? 'not-allowed' : 'pointer',
                                                                    transition: 'all 0.3s',
                                                                    boxShadow: loading ? 'none' : '0 4px 16px rgba(255,107,53,0.3)'
                                                    }}
                                                    onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 6px 24px rgba(255,107,53,0.4)')}
                                                    onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 4px 16px rgba(255,107,53,0.3)')}>
                                        {loading ? 'Aguarde...' : (isLogin ? 'ENTRAR' : 'CRIAR CONTA')}
                                      </button>
                          </form>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '20px 0' }}>
                                      <div style={{ flex: 1, height: '1px', background: 'var(--gray-300)' }} />
                                      <span style={{ color: 'var(--gray-500)', fontSize: '14px', fontWeight: '500' }}>ou entre com</span>
                                      <div style={{ flex: 1, height: '1px', background: 'var(--gray-300)' }} />
                          </div>

                          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                                      <button
                                                    onClick={handleGoogleLogin}
                                                    style={{
                                                                    flex: 1, padding: '14px 10px',
                                                                    background: 'white',
                                                                    border: '2px solid #e2e8f0',
                                                                    borderRadius: '12px',
                                                                    fontSize: '15px', fontWeight: '600',
                                                                    cursor: 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                                    transition: 'all 0.2s',
                                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}>
                                                    <svg width="20" height="20" viewBox="0 0 48 48">
                                                                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                                                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                                                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                                                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                                    </svg>
                                                  <span style={{ color: '#444' }}>Google</span>
                                      </button>
                          
                                    <button
                                                  onClick={handleFacebookLogin}
                                                  style={{
                                                                  flex: 1, padding: '14px 10px',
                                                                  background: '#1877F2',
                                                                  border: '2px solid #1877F2',
                                                                  borderRadius: '12px',
                                                                  fontSize: '15px', fontWeight: '600',
                                                                  cursor: 'pointer',
                                                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                                  transition: 'all 0.2s',
                                                                  boxShadow: '0 2px 8px rgba(24,119,242,0.3)'
                                                  }}
                                                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(24,119,242,0.5)'}
                                                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(24,119,242,0.3)'}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                                </svg>
                                                <span style={{ color: 'white' }}>Facebook</span>
                                    </button>
                          </div>
                
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '20px 0' }}>
                                  <div style={{ flex: 1, height: '1px', background: 'var(--gray-300)' }} />
                                  <span style={{ color: 'var(--gray-500)', fontSize: '14px', fontWeight: '500' }}>ou</span>
                                  <div style={{ flex: 1, height: '1px', background: 'var(--gray-300)' }} />
                        </div>
                
                        <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    style={{
                                                  width: '100%', padding: '16px',
                                                  background: 'white', color: 'var(--primary)',
                                                  border: '2px solid var(--primary)',
                                                  borderRadius: '12px', fontSize: '16px', fontWeight: '600',
                                                  fontFamily: 'var(--font-display)', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => (e.target.style.background = 'var(--primary)', e.target.style.color = 'white')}
                                    onMouseLeave={(e) => (e.target.style.background = 'white', e.target.style.color = 'var(--primary)')}>
                          {isLogin ? 'Criar nova conta' : 'Ja tenho conta'}
                        </button>
                
                        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--gray-600)', marginTop: '32px', lineHeight: '1.6' }}>
                                  Ao continuar, voce concorda com nossos<br/>
                                  <span style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>Termos de Uso</span> e{' '}
                                  <span style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>Politica de Privacidade</span>
                        </p>
                </div>
        </div>
  
  )
}

export default Login
