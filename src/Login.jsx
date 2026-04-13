import { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        alert('Login realizado com sucesso!')
        navigate('/home')
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Conta criada! Faça login.')
        setIsLogin(true)
      }
    } catch (error) {
      alert('Erro: ' + error.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', maxWidth: '400px', width: '100%' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '36px', color: '#667eea' }}>LANCE 🔨 JÁ</h1>
        <p style={{ textAlign: 'center', color: '#999', marginBottom: '30px' }}>Leilões locais na palma da sua mão</p>
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '15px', marginBottom: '15px', border: '2px solid #ddd', borderRadius: '10px', fontSize: '16px' }} />
          <input type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '15px', marginBottom: '20px', border: '2px solid #ddd', borderRadius: '10px', fontSize: '16px' }} />
          <button type="submit" style={{ width: '100%', padding: '15px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>{isLogin ? 'ENTRAR' : 'CRIAR CONTA'}</button>
          <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ width: '100%', padding: '15px', background: 'transparent', color: '#667eea', border: '2px solid #667eea', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>{isLogin ? 'CRIAR CONTA' : 'JÁ TENHO CONTA'}</button>
        </form>
      </div>
    </div>
  )
}

export default Login