import { useState } from 'react'
import { supabase } from './supabaseClient'
function NovoLeilao({ user, onBack, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'eletronicos', initial_price: '', duration: '48' })
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const endsAt = new Date()
    endsAt.setHours(endsAt.getHours() + parseInt(form.duration))
    const { error } = await supabase.from('auctions').insert([{ seller_id: user.id, title: form.title, description: form.description, category: form.category, initial_price: parseFloat(form.initial_price), current_price: parseFloat(form.initial_price), status: 'active', ends_at: endsAt.toISOString(), latitude: -25.0916, longitude: -50.1668, neighborhood: 'Centro', city: 'Ponta Grossa', state: 'PR', images: [] }])
    setLoading(false)
    if (error) { alert('Erro: ' + error.message) } else { alert('🎉 Leilão criado!'); onSuccess() }
  }
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', color: 'white' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginRight: '15px' }}>← Voltar</button>
        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>Criar Novo Leilão</span>
      </div>
      <div style={{ maxWidth: '800px', margin: '30px auto', padding: '20px' }}>
        <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '20px', padding: '40px' }}>
          <div style={{ marginBottom: '20px' }}><label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Título *</label><input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required style={{ width: '100%', padding: '15px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box' }} /></div>
          <div style={{ marginBottom: '20px' }}><label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Descrição</label><textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows="4" style={{ width: '100%', padding: '15px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box', fontFamily: 'Arial' }} /></div>
          <div style={{ marginBottom: '20px' }}><label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Categoria *</label><select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} required style={{ width: '100%', padding: '15px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box' }}><option value="eletronicos">📱 Eletrônicos</option><option value="moveis">🪑 Móveis</option><option value="veiculos">🚗 Veículos</option><option value="roupas">👕 Roupas</option><option value="livros">📚 Livros</option><option value="outros">📦 Outros</option></select></div>
          <div style={{ marginBottom: '20px' }}><label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Preço Inicial *</label><input type="number" value={form.initial_price} onChange={(e) => setForm({...form, initial_price: e.target.value})} min="1" step="0.01" required style={{ width: '100%', padding: '15px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box' }} /></div>
          <div style={{ marginBottom: '30px' }}><label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Duração *</label><select value={form.duration} onChange={(e) => setForm({...form, duration: e.target.value})} required style={{ width: '100%', padding: '15px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box' }}><option value="24">24 horas</option><option value="48">48 horas</option><option value="72">72 horas</option><option value="168">7 dias</option></select></div>
          <div style={{ display: 'flex', gap: '15px' }}><button type="button" onClick={onBack} style={{ flex: 1, padding: '15px', background: 'white', color: '#667eea', border: '2px solid #667eea', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button><button type="submit" disabled={loading} style={{ flex: 1, padding: '15px', background: loading ? '#ccc' : '#667eea', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Criando...' : '🔨 CRIAR LEILÃO'}</button></div>
        </form>
      </div>
    </div>
  )
}
export default NovoLeilao
