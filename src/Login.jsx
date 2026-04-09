import { useState } from 'react'
import { supabase } from './supabaseClient'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage('Erro: ' + error.message)
    } else {
      setMessage('Login realizado com sucesso! Bem-vindo!')
    }
    setLoading(false)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage('Erro: ' + error.message)
    } else {
      setMessage('Conta criada! Verifique seu email.')
    }
    setLoading(false)
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: '#333',
          marginBottom: '10px',
          fontSize: '32px'
        }}>
          LANCE 🔨 JÁ
        </h1>
        <p style={{ 
          textAlign: 'center', 
          color: '#666',
          marginBottom: '30px',
          fontSize: '14px'
        }}>
          Leilões locais na palma da sua mão
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '15px',
              marginBottom: '15px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />

          <input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '15px',
              marginBottom: '20px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              background: loading ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '10px'
            }}
          >
            {loading ? 'Aguarde...' : 'ENTRAR'}
          </button>

          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Aguarde...' : 'CRIAR CONTA'}
          </button>
        </form>

        {message && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: message.includes('Erro') ? '#fee' : '#efe',
            color: message.includes('Erro') ? '#c00' : '#070',
            borderRadius: '10px',
            textAlign: 'center',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default Login