import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useParams, useNavigate } from 'react-router-dom'

function VendedorPerfil() {
    const { sellerId } = useParams()
    const [auctions, setAuctions] = useState([])
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
          .eq('status', 'active')
          .order('created_at', { ascending: false })
        if (data) setAuctions(data)
        setLoading(false)
  }

  const trackView = async () => {
        try {
                const { data } = await supabase
                  .from('seller_views')
                  .select('*')
                  .eq('seller_id', sellerId)
                  .single()
                if (data) {
                          await supabase.from('seller_views').update({ views: data.views + 1 }).eq('seller_id', sellerId)
                } else {
                          await supabase.from('seller_views').insert([{ seller_id: sellerId, views: 1 }])
                }
        } catch (e) {}
  }

  const sellerCity = auctions.length > 0 ? auctions[0].city : ''

  if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <h2 style={{ color: 'white' }}>Carregando...</h2>h2>
        </div>div>
      )

  return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                  {/* HEADER */}
                          <div style={{ background: 'white', borderRadius: '20px', padding: 'clamp(20px, 4vw, 40px)', marginBottom: '24px', textAlign: 'center' }}>
                                      <img src="/logo-leilao.png" alt="Zap Bairro" style={{ height: 'clamp(60px, 15vw, 100px)', objectFit: 'contain', marginBottom: '12px' }} />
                                      <h1 style={{ margin: '0 0 6px 0', fontSize: 'clamp(22px, 5vw, 36px)', color: '#667eea' }}>Zap Bairro</h1>h1>
                            {sellerCity && <p style={{ fontSize: 'clamp(14px, 3vw, 18px)', color: '#666', margin: '0 0 8px 0' }}>Leiloes e anuncios em {sellerCity}</p>p>}
                                      <p style={{ fontSize: 'clamp(13px, 2.5vw, 16px)', color: '#999', margin: 0 }}>
                                        {auctions.length} {auctions.length === 1 ? 'item disponivel' : 'itens disponiveis'}
                                      </p>p>
                          </div>div>

                  {auctions.length === 0 ? (
                    <div style={{ background: 'white', borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
                                  <h2 style={{ color: '#999', fontSize: 'clamp(16px, 4vw, 22px)' }}>Este vendedor nao tem itens ativos no momento</h2>h2>
                                  <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '14px 32px', background: '#667eea', color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                  Criar minha conta gratis
                                  </button>button>
                    </div>div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      {auctions.map(auction => {
                                    const isAnuncio = auction.tipo === 'anuncio' || !auction.ends_at
                                    const img = auction.images?.[0]
                                    return (
                                                      <div key={auction.id}
                                                                          onClick={() => navigate('/leilao/' + auction.id)}
                                                                          style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                                                                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                                                                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                                        >
                                                                        <div style={{ position: 'relative', height: '180px', background: '#f0f0f0', overflow: 'hidden' }}>
                                                                          {img ? (
                                                                                                <img src={img} alt={auction.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                                              ) : (
                                                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px' }}>
                                                                                                  {isAnuncio ? '' : ''}
                                                                                                  </div>div>
                                                                                            )}
                                                                          {isAnuncio && (
                                                                                                <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(249,115,22,0.95)', color: 'white', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                                                                                                                        ANUNCIO
                                                                                                  </div>div>
                                                                                            )}
                                                                        </div>div>
                                                                        <div style={{ padding: '14px 16px' }}>
                                                                                            <h3 style={{ margin: '0 0 4px 0', fontSize: 'clamp(14px, 3vw, 16px)', lineHeight: '1.3', color: '#1a202c' }}>{auction.title}</h3>h3>
                                                                                            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '2px' }}>{isAnuncio ? 'Preco' : 'Lance atual'}</div>div>
                                                                                            <div style={{ fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 'bold', color: isAnuncio ? '#f97316' : '#667eea' }}>
                                                                                                                  R$ {parseFloat(auction.current_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                                              </div>div>
                                                                                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                                                                  <span style={{ background: '#16a34a', color: 'white', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                                                                                                    {auction.neighborhood || auction.city}
                                                                                                                    </span>span>
                                                                                              </div>div>
                                                                        </div>div>
                                                      </div>div>
                                                    )
                      })}
                    </div>div>
                        )}
                
                        <div style={{ textAlign: 'center', marginTop: '40px' }}>
                                  <button onClick={() => navigate('/')} style={{ padding: '14px 36px', background: 'white', color: '#667eea', border: 'none', borderRadius: '50px', fontSize: 'clamp(14px, 3vw, 18px)', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                                              Criar minha conta no Zap Bairro - Gratis!
                                  </button>button>
                        </div>div>
                
                </div>div>
        </div>div>
      )
}

export default VendedorPerfil</div>
