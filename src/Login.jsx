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

  return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FF6B35 0%, #004E89 100%)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50%', right: '-20%', width: '600px', height: '600px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(80px)' }} />
                <div style={{ position: 'absolute', bottom: '-30%', left: '-10%', width: '500px', height: '500px', background: 'rgba(0,78,137,0.3)', borderRadius: '50%', filter: 'blur(100px)' }} />
                <div className="animate-scale-in" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', padding: '48px', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1 }}>
                          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                      <div style={{ background: 'linear-gradient(180deg, #1565C0 0%, #1976D2 100%)', borderRadius: '10px 10px 0 0', padding: '14px 20px 10px' }}>
                                                    <div style={{ fontSize: 'clamp(22px,5vw,30px)', fontWeight: '900', color: 'white', letterSpacing: '1px', lineHeight: '1.1' }}>Compra e venda</div>div>
                                                    <div style={{ fontSize: 'clamp(14px,3vw,18px)', fontWeight: '700', color: '#FFD600', fontStyle: 'italic', marginTop: '2px' }}>Perto de voce</div>div>
                                      </div>div>
                                      <div style={{ background: 'white', borderRadius: '0 0 10px 10px', border: '2px solid #e2e8f0', borderTop: 'none', overflow: 'hidden', lineHeight: 0 }}>
                                                    <img src="/logo-conecty.png" alt="Conecty" style={{ display: 'block', width: '100%' }} />
                                      </div>div>
                          </div>div>
                          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '800', textAlign: 'center', color: 'var(--gray-900)', marginBottom: '32px' }}>
                            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
                          </h2>h2>
                          <form onSubmit={handleAuth} style={{ marginBottom: '24px' }}>
                                      <div style={{ marginBottom: '20px' }}>
                                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '8px' }}>Email</label>label>
                                                    <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '16px 20px', border: '2px solid var(--gray-300)', borderRadius: '12px', fontSize: '16px', fontFamily: 'var(--font-body)', transition: 'all 0.2s', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'} required />
                                      </div>div>
                                      <div style={{ marginBottom: '24px' }}>
                                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--gray-700)', marginBottom: '8px' }}>Senha</label>label>
                                                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '16px 20px', border: '2px solid var(--gray-300)', borderRadius: '12px', fontSize: '16px', fontFamily: 'var(--font-body)', transition: 'all 0.2s', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = 'var(--primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'} required />
                                      </div>div>
                                      <button type="submit" disabled={loading} style={{ width: '100%', padding: '18px', background: loading ? 'var(--gray-400)' : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-display)', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s', boxShadow: loading ? 'none' : '0 4px 16px rgba(255,107,53,0.3)' }} onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 6px 24px rgba(255,107,53,0.4)')} onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 4px 16px rgba(255,107,53,0.3)')}>
                                        {loading ? 'Aguarde...' : (isLogin ? 'ENTRAR' : 'CRIAR CONTA')}
                                      </button>button>
                          </form>form>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '32px 0' }}>
                                      <div style={{ flex: 1, height: '1px', background: 'var(--gray-300)' }} />
                                      <span style={{ color: 'var(--gray-500)', fontSize: '14px', fontWeight: '500' }}>ou</span>span>
                                      <div style={{ flex: 1, height: '1px', background: 'var(--gray-300)' }} />
                          </div>div>
                          <button onClick={() => setIsLogin(!isLogin)} style={{ width: '100%', padding: '16px', background: 'white', color: 'var(--primary)', border: '2px solid var(--primary)', borderRadius: '12px', fontSize: '16px', fontWeight: '600', fontFamily: 'var(--font-display)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => (e.target.style.background = 'var(--primary)', e.target.style.color = 'white')} onMouseLeave={(e) => (e.target.style.background = 'white', e.target.style.color = 'var(--primary)')}>
                            {isLogin ? 'Criar nova conta' : 'Ja tenho conta'}
                          </button>button>
                          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--gray-600)', marginTop: '32px', lineHeight: '1.6' }}>
                                      Ao continuar, voce concorda com nossos<br/>
                                      <span style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>Termos de Uso</span>span> e{' '}
                                      <span style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>Politica de Privacidade</span>span>
                          </p>p>
                </div>div>
        </div>div>
      )
}

export default Login
