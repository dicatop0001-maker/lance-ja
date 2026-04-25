import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate, useParams } from 'react-router-dom'

function EditarLeilao() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('outros')
  const [startingBid, setStartingBid] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [cityState, setCityState] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [sellerId, setSellerId] = useState('')
  const [allCities, setAllCities] = useState([])
  const [filteredCities, setFilteredCities] = useState([])
  const [showCityDropdown, setShowCityDropdown] = useState(false)

  useEffect(() => { loadAuction(); loadCities() }, [id])

  const loadCities = async () => {
    try {
      const r = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
      setAllCities(await r.json())
    } catch(e) {}
  }

  const loadAuction = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/'); return }
    const { data, error } = await supabase.from('auctions').select('*').eq('id', id).single()
    if (error || !data) { alert('Leilão não encontrado'); navigate('/home'); return }
    if (data.seller_id !== user.id) { alert('Sem permissão para editar este leilão'); navigate('/home'); return }

    setTitle(data.title || '')
    setDescription(data.description || '')
    setCategory(data.category || 'outros')
    setStartingBid(data.initial_price?.toString() || '')
    setNeighborhood(data.neighborhood || '')
    setCity(data.city || '')
    setCityState(data.state || '')
    setPhotos(data.images || [])
    if (data.ends_at) {
      const d = new Date(data.ends_at)
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      setEndsAt(local.toISOString().slice(0, 16))
    }
    setLoading(false)
  }

  const handleCityInput = (val) => {
    setCity(val); setCityState('')
    if (val.length >= 2) {
      const f = allCities.filter(c => c.nome.toLowerCase().startsWith(val.toLowerCase())).slice(0, 8)
      setFilteredCities(f); setShowCityDropdown(f.length > 0)
    } else { setShowCityDropdown(false) }
  }

  const selectCity = (c) => {
    const uf = c.microrregiao?.mesorregiao?.UF?.sigla || 'BR'
    setCity(c.nome); setCityState(uf); setShowCityDropdown(false)
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length + photos.length > 5) { alert('Máximo 5 fotos!'); return }
    setUploading(true)
    const uploaded = []
    for (const file of files) {
      try {
        const fname = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + file.name.split('.').pop()
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const res = await fetch('/api/upload-photo', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: fname, fileType: file.type, fileData: base64 })
        })
        const data = await res.json()
        if (!res.ok || data.error) alert('Erro foto: ' + (data.error || res.statusText))
        else uploaded.push(data.url)
      } catch(err) { alert('Erro: ' + err.message) }
    }
    setPhotos(p => [...p, ...uploaded]); setUploading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!title.trim()) { alert('Preencha o título!'); return }
    if (!startingBid || parseFloat(startingBid) <= 0) { alert('Informe um lance válido!'); return }
    if (!endsAt) { alert('Informe a data de encerramento!'); return }
    setSaving(true)
    const { error } = await supabase.from('auctions').update({
      title: title.trim(), description: description.trim(), category,
      initial_price: parseFloat(startingBid),
      neighborhood: neighborhood.trim(), city: city.trim(), state: cityState || 'BR',
      ends_at: endsAt, images: photos, updated_at: new Date().toISOString()
    }).eq('id', id)
    setSaving(false)
    if (error) alert('Erro: ' + error.message)
    else { alert('Leilão atualizado!'); navigate('/home') }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('auctions').delete().eq('id', id)
    setDeleting(false)
    if (error) alert('Erro ao excluir: ' + error.message)
    else { alert('Leilão excluído!'); navigate('/home') }
  }

  const inp = { width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '15px', boxSizing: 'border-box', fontFamily: 'inherit' }
  const lbl = { display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151', fontSize: '14px' }

  if (loading) return <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' }}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => navigate('/home')} style={{ background: 'none', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '15px' }}>← Voltar</button>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1a202c' }}>✏️ Editar Leilão</h1>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div><label style={lbl}>Título *</label><input style={inp} value={title} onChange={e => setTitle(e.target.value)} required /></div>
          <div><label style={lbl}>Descrição</label><textarea style={{ ...inp, height: '90px', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div><label style={lbl}>Categoria</label>
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
          <div><label style={lbl}>Lance Inicial (R$) *</label><input style={inp} type="number" min="1" step="0.01" value={startingBid} onChange={e => setStartingBid(e.target.value)} required /></div>
          <div><label style={lbl}>Bairro</label><input style={inp} value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Ex: Centro" /></div>
          <div>
            <label style={lbl}>Cidade *</label>
            <div style={{ position: 'relative' }}>
              <input style={inp} value={city} onChange={e => handleCityInput(e.target.value)} onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)} required />
              {cityState && <div style={{ fontSize: '12px', color: '#667eea', fontWeight: '600', marginTop: '3px' }}>Estado: {cityState}</div>}
              {showCityDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e2e8f0', borderRadius: '10px', zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxHeight: '180px', overflowY: 'auto' }}>
                  {filteredCities.map((c, i) => (
                    <div key={i} onMouseDown={() => selectCity(c)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '14px' }}>{c.nome} - {c.microrregiao?.mesorregiao?.UF?.sigla}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div><label style={lbl}>Data de Encerramento *</label><input style={inp} type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} required /></div>

          <div>
            <label style={lbl}>Fotos (máximo 5)</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={p} alt="foto" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #667eea' }} />
                  <button type="button" onClick={() => setPhotos(prev => prev.filter((_, x) => x !== i))} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>✕</button>
                </div>
              ))}
              {photos.length < 5 && (
                <label style={{ width: '72px', height: '72px', border: '2px dashed #667eea', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '24px', color: '#667eea' }}>
                  +<input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>
            {uploading && <p style={{ color: '#667eea', fontSize: '13px' }}>⏳ Enviando fotos...</p>}
          </div>

          <button type="submit" disabled={saving || uploading} style={{ padding: '16px', background: saving ? '#aaa' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? '⏳ Salvando...' : '💾 Salvar alterações'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid #e0e7ff' }}>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ width: '100%', padding: '14px', background: 'white', color: '#dc2626', border: '2px solid #dc2626', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
              🗑️ Excluir este leilão
            </button>
          ) : (
            <div style={{ background: '#fef2f2', border: '2px solid #dc2626', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <p style={{ color: '#dc2626', fontWeight: '700', fontSize: '15px', margin: '0 0 12px' }}>⚠️ Tem certeza? Esta ação não pode ser desfeita!</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '12px', background: 'white', border: '2px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
                <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: '800' }}>
                  {deleting ? '⏳ Excluindo...' : '🗑️ Confirmar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EditarLeilao
