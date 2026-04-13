import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useParams, useNavigate } from 'react-router-dom'

function VendedorPerfil() {
  const { sellerId } = useParams()
  const [auctions, setAuctions] = useState([])
  const [sellerName, setSellerName] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadSellerAuctions()
    trackView()
  }, [sellerId])

  const loadSellerAuctions = async () => {
    const { data } = await supabase
      .from('auctions')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
    
    if (data && data.length > 0) {
      setAuctions(data)
      setSellerName(data[0].city || 'Vendedor')
    }
    setLoading(false)
  }

  const trackView = async () => {
    const { data } = await supabase
      .from('seller_views')
      .select('*')
      .eq('seller_id', sellerId)
      .single()

    if (data) {
      await supabase
        .from('seller_views')
        .update({ views: data.views + 1 })
        .eq('seller_id', sellerId)
    } else {
      await supabase
        .from('seller_views')
        .insert([{ seller_id: sellerId, views: 1 }])
    }
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}><h2 style={{ color: 'white' }}>Carregando...</h2></div>

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '48px', color: '#667eea' }}>LEILÃO DO BAIRRO</h1>
          <p style={{ fontSize: '20px', color: '#666', margin: '0 0 20px 0' }}>Leilões de {sellerName}</p>
          <p style={{ fontSize: '16px', color: '#999' }}>{auctions.length} {auctions.length === 1 ? 'leilão disponível' : 'leilões disponíveis'}</p>
        </div>

        {auctions.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
            <h2 style={{ color: '#999' }}>Este vendedor ainda não tem leilões ativos</h2>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {auctions.map(auction => (
              <div key={auction.id} onClick={() => navigate(/leilao/)} style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <img src={auction.photos?.[0] || 'https://via.placeholder.com/300x200'} alt={auction.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                <div style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{auction.title}</h3>
                  <p style={{ color: '#666', marginBottom: '15px' }}>{auction.city}</p>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>R$ {parseFloat(auction.starting_bid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button onClick={() => navigate('/')} style={{ padding: '15px 40px', background: 'white', color: '#667eea', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>Criar minha conta</button>
        </div>
      </div>
    </div>
  )
}

export default VendedorPerfil