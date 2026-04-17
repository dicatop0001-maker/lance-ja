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

  useEffect(() => { loadCities() }, [])

  const loadCities = async () => {
    try {
      const r = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
      const d = await r.json()
      setAllCities(d.map(m => m.nome + ' - ' + (m.microrregiao?.mesorregiao?.UF?.sigla || m['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla || '')).filter(s => s.trim() !== ' - '))
    } catch (e) {}
  }

  const handleCityInput = (val) => {
    setCity(val)
    if (val.length >= 2) {
      const f = allCities.filter(c => c.toLowerCase().startsWith(val.toLowerCase())).slice(0, 8)
      setFilteredCities(f)
      setShowCityDropdown(f.length > 0)
    } else {
      setShowCityDropdown(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length + photos.length > 5) { alert('Maximo 5 fotos!'); return }
    setUploading(true)
    const uploaded = []
    for (const file of files) {
      const fname = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + file.name.split('.').pop()
      const { error } = await supabase.storage.from('auction-photos').upload(fname, file)
      if (!error) {
        const { data: u } = supabase.storage.from('auction-photos').getPublicUrl(fname)
        uploaded.push(u.publicUrl)
      }
    }
    setPhotos(p => [...p, ...uploaded])
    setUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !startingBid || !endsAt) { alert('Preencha os campos obrigatorios!'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/'); return }
    const cityName = city.includes(' - ') ? city.split(' - ')[0] : city
    const { error } = await supabase.from('auctions').insert({
      title, description, category,
      initial_price: parseFloat(startingBid),
      current_price: parseFloat(startingBid),
      neighborhood, city: cityName, ends_at: endsAt,
      images: photos, seller_id: user.id, status: 'active',
      latitude: -25.0916, longitude: -50.1668, state: 'PR'
    })
    if (error) { alert('Erro: ' + error.message) } else { alert('Leilao criado!'); navigate('/home') }
  }

  const inp = { width: '100%', padding: '14px 16px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '16px', boxSizing: 'border-box', fontFamily: 'inherit' }
  const lbl = { display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '14px' }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <button onClick={() => navigate('/home')} style={{ background: 'none', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '16px' }}>Voltar</button>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1a202c' }}>Criar Novo Leilao</h1>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={lbl}>Titulo *</label>
            <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Sofa em otimo estado" required />
          </div>
          <div>
            <label style={lbl}>Descricao</label>
            <textarea
              style={{ ...inp, height: '100px', resize: 'vertical' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={
                category === 'servicos'
                  ? 'Ex: 20m2 de grama para cortar | 3 comodos para pintar | 15m2 ceramica para instalar...'
                  : category === 'eletronicos'
                  ? 'Ex: iPhone 13 128GB | Notebook Dell i5 | Maquina de lavar 10kg...'
                  : 'Descreva o item...'
              }
            />
            {category === 'servicos' && (
              <div style={{ marginTop: '10px', padding: '14px 16px', background: '#eff6ff', border: '2px solid #1e3a8a', borderRadius: '12px', fontSize: '14px', color: '#1e3a8a' }}>
                <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🔧 SERVICOS — O MENOR LANCE VENCE!
                </div>
                <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#374151' }}>
                  Descreva exatamente o servico com medidas ou quantidade:
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', color: '#374151' }}>
                  <li>20 metros quadrados de grama para cortar</li>
                  <li>20 metros quadrados de parede para pintar</li>
                  <li>20 metros quadrados de ceramica para instalar</li>
                  <li>Limpeza de 3 comodos + banheiro</li>
                  <li>Instalacao de 2 ar condicionado split</li>
                </ul>
              </div>
            )}
            {category === 'eletronicos' && (
              <div style={{ marginTop: '10px', padding: '14px 16px', background: '#f0fdf4', border: '2px solid #15803d', borderRadius: '12px', fontSize: '14px', color: '#15803d' }}>
                <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📱 ELETRONICOS, MAQUINAS E CELULARES
                </div>
                <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#374151' }}>
                  Descreva o item com modelo, estado de conservacao e acessorios inclusos:
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', color: '#374151' }}>
                  <li>Celular: modelo, armazenamento, cor e estado</li>
                  <li>Notebook: processador, RAM, HD/SSD e tela</li>
                  <li>Maquina de lavar: capacidade e marca</li>
                  <li>TV: tamanho, resolucao e Smart ou nao</li>
                  <li>Outros eletronicos: marca, modelo e funcionando</li>
                </ul>
              </div>
            )}
          </div>
          <div>
            <label style={lbl}>Categoria</label>
            <select style={inp} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="veiculos">Veiculos</option>
              <option value="eletronicos">Eletronicos, Maquinas, Celulares</option>
              <option value="moveis">Moveis</option>
              <option value="imoveis">Imoveis</option>
              <option value="servicos">Servicos (menor lance vence)</option>
              <option value="objetos">Objetos</option>
              <option value="outros">Outros</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Lance Inicial (R$) *</label>
            <input style={inp} type="number" min="1" step="0.01" value={startingBid} onChange={e => setStartingBid(e.target.value)} placeholder="0.00" required />
          </div>
          <div>
            <label style={lbl}>Bairro</label>
            <input style={inp} value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Ex: Centro" />
          </div>
          <div>
            <label style={lbl}>Cidade *</label>
            <div style={{ position: 'relative' }}>
              <input
                style={inp}
                value={city}
                onChange={e => handleCityInput(e.target.value)}
                onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                placeholder="Digite sua cidade..."
                required
              />
              {showCityDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e2e8f0', borderRadius: '12px', zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredCities.map((c, i) => (
                    <div key={i} onMouseDown={() => { setCity(c); setShowCityDropdown(false) }} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '14px' }}>{c}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label style={lbl}>Data de Encerramento *</label>
            <input style={inp} type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} required />
          </div>
          <div>
            <label style={lbl}>Fotos (maximo 5)</label>
            <div>
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ ...inp, padding: '10px', cursor: 'pointer' }} />
              {uploading && <p style={{ color: '#667eea', fontSize: '14px', marginTop: '8px' }}>Enviando fotos...</p>}
              {photos.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {photos.map((p, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={p} alt="foto" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px' }} />
                      <button type="button" onClick={() => setPhotos(prev => prev.filter((_, x) => x !== i))} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px' }}>x</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button type="submit" disabled={uploading} style={{ padding: '16px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '18px', fontWeight: '800', cursor: uploading ? 'not-allowed' : 'pointer' }}>
            {uploading ? 'ENVIANDO FOTOS...' : 'CRIAR LEILAO'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default NovoLeilao
