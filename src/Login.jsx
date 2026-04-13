import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import logo from './assets/logo.png'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault()
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/home')
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Conta criada! Faça login.')
        setIsLogin(true)
      }
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: '100%', maxWidth: '450px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img src={logo} alt="LEILÃO DO BAIRRO" style={{ width: '100%', maxWidth: '350px', height: 'auto', margin: '0 auto 20px' }} />
        </div>

        <form onSubmit={handleAuth}>
          <input type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '15px', marginBottom: '15px', border: '2px solid #ddd', borderRadius: '10px', fontSize: '16px' }} required />
          <input type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '15px', marginBottom: '20px', border: '2px solid #ddd', borderRadius: '10px', fontSize: '16px' }} required />
          <button type="submit" style={{ width: '100%', padding: '15px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>{isLogin ? 'ENTRAR' : 'CRIAR CONTA'}</button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} style={{ width: '100%', padding: '15px', background: 'white', color: '#667eea', border: '2px solid #667eea', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>{isLogin ? 'CRIAR CONTA' : 'JÁ TENHO CONTA'}</button>
      </div>
    </div>
  )
}

export default Login