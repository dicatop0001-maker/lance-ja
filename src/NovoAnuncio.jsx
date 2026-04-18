import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'

function NovoAnuncio() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('outros')
  const [price, setPrice] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('Ponta Grossa')
  const [cityState, setCityState] = useState('PR')
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [allCities, setAllCities] = useState([])
  const [filteredCities, setFilteredCities] = useState([])
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { loadCities(); detectUserCity() }, [])

  const detectUserCity = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/')
      const data = await res.json()
      if (data.city) { setCity(data.city); setCityState(data.region_code || 'BR') }
    } catch (e) {}
  }

  const loadCities = async () => {
    try {
      const r = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
      const d = await r.json()
      setAllCities(d)
    } catch (e) {}
  }

  const handleCityInput = (val) => {
    setCity(val)
    setCityState('')
    if (val.length >= 2) {
      const f = allCities.filter(c => c.nome.toLowerCase().startsWith(val.toLowerCase())).slice(0, 8)
      setFilteredCities(f)
      setShowCityDropdown(f.length > 0)
    } else {
      setShowCityDropdown(false)
    }
  }

  const selectCity = (c) => {
    const uf = c.microrregiao?.mesorregiao?.UF?.sigla || c['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla || 'BR'
    setCity(c.nome)
    setCityState(uf)
    setShowCityDropdown(false)
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length + photos.length > 5) { alert('Máximo 5 fotos!'); return }
    setUploading(true)
    setPhotoError(false)
    const uploaded = []
    for (const file of files) {
      const fname = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + file.name.split('.').pop()
      const { error } = await supabase.storage.from('auction-photos').upload(fname, file)
      if (error) { alert('Erro ao enviar foto: ' + error.message) }
      else {
        const { data: u } = supabase.storage.from('auction-photos').getPublicUrl(fname)
        uploaded.push(u.publicUrl)
      }
    }
    setPhotos(p => [...p, ...uploaded])
    setUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { alert('Preencha o título!'); return }
    if (!price || parseFloat(price) <= 0) { alert('Informe um preço válido!'); return }
    if (!city.trim()) { alert('Informe a cidade!'); return }
    if (photos.length === 0) {
      setPhotoError(true)
      const el = document.getElementById('foto-upload-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/'); return }
    const { error } = await supabase.from('auctions').insert({
      title: title.trim(),
      description: description.trim(),
      category,
      initial_price: parseFloat(price),
      current_price: parseFloat(price),
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      state: cityState || 'BR',
      ends_at: null,
      images: photos,
      seller_id: user.id,
      status: 'active',
      tipo: 'anuncio',
      latitude: -25.0916,
      longitude: -50.1668
    })
    setSubmitting(false)
    if (error) { alert('Erro ao criar anúncio: ' + error.message) }
    else { alert('Anúncio criado com sucesso!'); navigate('/home') }
  }

  const inp = {
    width: '100%', padding: '14px 16px', border: '2px solid #e2e8f0',
    borderRadius: '12px', fontSize: '16px', boxSizing: 'border-box', fontFamily: 'inherit'
  }
  const lbl = { display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '14px' }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <button onClick={() => navigate('/home')} style={{ background: 'none', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '16px' }}>
            Voltar
          </button>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1a202c' }}>📢 Criar Anúncio de Venda</h1>
        </div>

        <div style={{ marginBottom: '20px', padding: '14px 16px', background: '#fff7ed', border: '2px solid #f97316', borderRadius: '12px', fontSize: '14px', color: '#9a3412' }}>
          <strong>📋 Anúncio direto:</strong> sem data de encerramento. Seu item fica disponível até você remover ou vender.
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* TITULO */}
          <div>
            <label style={lbl}>Título *</label>
            <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Sofá em ótimo estado" required />
          </div>

          {/* DESCRICAO */}
          <div>
            <label style={lbl}>Descrição</label>
            <textarea style={{ ...inp, height: '100px', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o item com detalhes..." />
          </div>

          {/* CATEGORIA */}
          <div>
            <label style={lbl}>Categoria</label>
            <select style={inp} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="veiculos">Veículos</option>
              <option value="eletronicos">Eletrônicos, Máquinas, Celulares</option>
              <option value="moveis">Móveis</option>
              <option value="imoveis">Imóveis</option>
              <option value="servicos">Serviços</option>
              <option value="objetos">Objetos</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          {/* PRECO */}
          <div>
            <label style={lbl}>Preço de Venda (R$) *</label>
            <input style={inp} type="number" min="1" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" required />
          </div>

          {/* BAIRRO */}
          <div>
            <label style={lbl}>Bairro</label>
            <input style={inp} value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Ex: Centro" />
          </div>

          {/* CIDADE */}
          <div>
            <label style={lbl}>Cidade *</label>
            <div style={{ position: 'relative' }}>
              <input style={inp} value={city} onChange={e => handleCityInput(e.target.value)} onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)} placeholder="Digite sua cidade..." required />
              {cityState && <div style={{ marginTop: '4px', fontSize: '12px', color: '#f97316', fontWeight: '600' }}>Estado: {cityState}</div>}
              {showCityDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e2e8f0', borderRadius: '12px', zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredCities.map((c, i) => {
                    const uf = c.microrregiao?.mesorregiao?.UF?.sigla || ''
                    return (
                      <div key={i} onMouseDown={() => selectCity(c)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '14px' }}>
                        {c.nome} - {uf}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* FOTOS */}
          <div id="foto-upload-section">
            <label style={{ ...lbl, color: photoError ? '#ef4444' : '#374151' }}>
              📸 Fotos * <span style={{ fontWeight: '400', color: '#888', fontSize: '13px' }}>(máximo 5 — obrigatório ao menos 1)</span>
            </label>
            <div style={{ border: photoError ? '2px dashed #ef4444' : '2px dashed #f97316', borderRadius: '14px', padding: '20px', background: photoError ? '#fef2f2' : '#fff7ed', textAlign: 'center', transition: 'all 0.3s' }}>
              {photos.length === 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
                  <p style={{ margin: 0, color: photoError ? '#ef4444' : '#ea580c', fontWeight: '600', fontSize: '15px' }}>
                    {photoError ? '⚠️ Adicione pelo menos 1 foto para continuar!' : 'Adicione fotos do item'}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#888', fontSize: '13px' }}>Anúncios com foto vendem muito mais rápido</p>
                </div>
              )}
              <label style={{ display: 'inline-block', padding: '12px 24px', background: photoError ? '#ef4444' : 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', boxShadow: '0 4px 12px rgba(249,115,22,0.35)' }}>
                {photos.length > 0 ? '+ Adicionar mais fotos' : '📷 Escolher fotos'}
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
              {uploading && <p style={{ color: '#f97316', fontSize: '14px', marginTop: '10px' }}>⏳ Enviando fotos...</p>}
            </div>
            {photos.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                {photos.map((p, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={p} alt="foto" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #f97316' }} />
                    <button type="button" onClick={() => setPhotos(prev => prev.filter((_, x) => x !== i))} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {photos.length > 0 && (
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#f97316', fontWeight: '600' }}>
                ✅ {photos.length} foto{photos.length > 1 ? 's' : ''} adicionada{photos.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* BOTAO SUBMIT */}
          <button type="submit" disabled={uploading || submitting} style={{ padding: '18px', background: (uploading || submitting) ? '#aaa' : photos.length === 0 ? '#94a3b8' : 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '18px', fontWeight: '800', cursor: (uploading || submitting) ? 'not-allowed' : 'pointer' }}>
            {uploading ? '⏳ Enviando fotos...' : submitting ? '⏳ Criando anúncio...' : photos.length === 0 ? '📷 Adicione fotos para continuar' : '📢 PUBLICAR ANÚNCIO'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default NovoAnuncio
