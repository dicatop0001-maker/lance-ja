import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

function NovoLeilao() {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('outros')
    const [startingBid, setStartingBid] = useState('')
    const [neighborhood, setNeighborhood] = useState('')
    const [city, setCity] = useState('Ponta Grossa')
    const [endsAt, setEndsAt] = useState('')
    const [photos, setPhotos] = useState([])
    const [uploading, setUploading] = useState(false)
    const [allCities, setAllCities] = useState([])
    const [filteredCities, setFilteredCities] = useState([])
    const [showCityDropdown, setShowCityDropdown] = useState(false)
    const navigate = useNavigate()
    const cityInputRef = useRef(null)

  const categories = [
        'veiculos',
        'eletronicos',
        'moveis',
        'imoveis',
        'servicos',
        'objetos',
        'outros'
      ]

  const categoryLabels = {
        veiculos: 'Veiculos',
        eletronicos: 'Eletronicos',
        moveis: 'Moveis',
        imoveis: 'Imoveis',
        servicos: 'Servicos',
        objetos: 'Objetos',
        outros: 'Outros'
  }

  useEffect(() => {
        loadCities()
  }, [])

  const loadCities = async () => {
        try {
                const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
                const data = await response.json()
                const cityNames = data.map(m => m.nome + ' - ' + m.microrregiao.mesorregiao.UF.sigla)
                setAllCities(cityNames)
        } catch (e) {
                console.log('IBGE offline, usando cidade padrao')
        }
  }

  const handleCityInput = (val) => {
        setCity(val)
        if (val.length >= 2) {
                const filtered = allCities.filter(c => c.toLowerCase().startsWith(val.toLowerCase())).slice(0, 8)
                setFilteredCities(filtered)
                setShowCityDropdown(filtered.length > 0)
        } else {
                setShowCityDropdown(false)
        }
  }

  const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length + photos.length > 5) {
                alert('Maximo 5 fotos!')
                return
        }
        setUploading(true)
        const uploaded = []
              for (const file of files) {
                      const fileName = Date.now() + '-' + Math.random().toString(36).substring(2) + '.' + file.name.split('.').pop()
                      const { error } = await supabase.storage.from('auction-photos').upload(fileName, file)
                      if (!error) {
                                const { data: urlData } = supabase.storage.from('auction-photos').getPublicUrl(fileName)
                                uploaded.push(urlData.publicUrl)
                      }
              }
        setPhotos(prev => [...prev, ...uploaded])
        setUploading(false)
  }

  const handleSubmit = async (e) => {
        e.preventDefault()
        if (!title || !startingBid || !endsAt) {
                alert('Preencha todos os campos obrigatorios!')
                return
        }
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/'); return }
        const cityName = city.includes(' - ') ? city.split(' - ')[0] : city
        const { error } = await supabase.from('auctions').insert({
                title,
                description,
                category,
                starting_bid: parseFloat(startingBid),
                current_bid: parseFloat(startingBid),
                neighborhood,
                city: cityName,
                ends_at: endsAt,
                photos,
                user_id: user.id,
                seller_email: user.email,
                status: 'active'
        })
        if (error) {
                alert('Erro ao criar leilao: ' + error.message)
        } else {
                alert('Leilao criado com sucesso!')
                navigate('/home')
        }
  }

  const inputStyle = {
        width: '100%', padding: '14px 16px', border: '2px solid #e2e8f0',
        borderRadius: '12px', fontSize: '16px', boxSizing: 'border-box',
        outline: 'none', transition: 'border-color 0.2s',
        fontFamily: 'inherit'
  }

  const labelStyle = {
        display: 'block', marginBottom: '6px', fontWeight: '600',
        color: '#374151', fontSize: '14px'
  }

  return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                                      <button onClick={() => navigate('/home')} style={{ background: 'none', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '16px', color: '#374151' }}>
                                                    Voltar
                                      </button>button>
                                      <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1a202c' }}>Criar Novo Leilao</h1>h1>
                          </div>div>

                          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                      <div>
                                                  <label style={labelStyle}>Titulo *</label>label>
                                                  <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Sofa 3 lugares em otimo estado" required />
                                      </div>div>
                          
                                    <div>
                                                <label style={labelStyle}>Descricao</label>label>
                                                <textarea style={{ ...inputStyle, height: '100px', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o item com detalhes..." />
                                    </div>div>
                          
                                    <div>
                                                <label style={labelStyle}>Categoria</label>label>
                                                <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
                                                  {categories.map(c => <option key={c} value={c}>{categoryLabels[c]}</option>option>)}
                                                </select>select>
                                    </div>div>
                          
                                    <div>
                                                <label style={labelStyle}>Lance Inicial (R$) *</label>label>
                                                <input style={inputStyle} type="number" min="1" step="0.01" value={startingBid} onChange={e => setStartingBid(e.target.value)} placeholder="0.00" required />
                                    </div>div>
                          
                                    <div>
                                                <label style={labelStyle}>Bairro</label>label>
                                                <input style={inputStyle} value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Ex: Centro, Jardim America..." />
                                    </div>div>
                          
                                    <div style={{ position: 'relative' }}>
                                                <label style={labelStyle}>Cidade *</label>label>
                                                <input
                                                                ref={cityInputRef}
                                                                style={inputStyle}
                                                                value={city}
                                                                onChange={e => handleCityInput(e.target.value)}
                                                                onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                                                                placeholder="Digite sua cidade..."
                                                                required
                                                              />
                                      {showCityDropdown && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e2e8f0', borderRadius: '12px', zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxHeight: '200px', overflowY: 'auto' }}>
                          {filteredCities.map((c, i) => (
                                            <div key={i} onMouseDown={() => { setCity(c); setShowCityDropdown(false) }}
                                                                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '14px' }}
                                                                  onMouseEnter={e => e.target.style.background = '#f0f4ff'}
                                                                  onMouseLeave={e => e.target.style.background = 'white'}>
                                              {c}
                                            </div>div>
                                          ))}
                        </div>div>
                                                )}
                                    </div>div>
                          
                                    <div>
                                                <label style={labelStyle}>Data de Encerramento *</label>label>
                                                <input style={inputStyle} type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} required />
                                    </div>div>
                          
                                    <div>
                                                <label style={labelStyle}>Fotos (maximo 5)</label>label>
                                                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ ...inputStyle, padding: '10px', cursor: 'pointer' }} />
                                      {uploading && <p style={{ color: '#667eea', marginTop: '8px', fontSize: '14px' }}>Enviando fotos...</p>p>}
                                      {photos.length > 0 && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                          {photos.map((p, i) => (
                                            <div key={i} style={{ position: 'relative' }}>
                                                                <img src={p} alt="foto" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #e2e8f0' }} />
                                                                <button type="button" onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                                                                                        style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>button>
                                            </div>div>
                                          ))}
                        </div>div>
                                                )}
                                    </div>div>
                          
                                    <button type="submit" disabled={uploading} style={{ padding: '16px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '18px', fontWeight: '800', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1, letterSpacing: '1px' }}>
                                      {uploading ? 'ENVIANDO FOTOS...' : 'CRIAR LEILAO'}
                                    </button>button>
                          </form>form>
                </div>div>
        </div>div>
      )
}

export default NovoLeilao</div>
