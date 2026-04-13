import { useState } from 'react'
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
  const navigate = useNavigate()

  const categories = [
    'veículos',
    'eletrônicos',
    'móveis',
    'imóveis',
    'serviços',
    'objetos',
    'outros'
  ]

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length + photos.length > 5) {
      alert('Máximo 5 fotos!')
      return
    }

    setUploading(true)
    const uploadedUrls = []

    for (const file of files) {
      const fileExt = file.name.split('.').pop()
      const fileName = Math.random().toString(36).substring(7) + '.' + fileExt
      const { data, error } = await supabase.storage
        .from('auction-photos')
        .upload(fileName, file)

      if (error) {
        console.error('Erro upload:', error)
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('auction-photos')
          .getPublicUrl(fileName)
        uploadedUrls.push(publicUrl)
      }
    }

    setPhotos([...photos, ...uploadedUrls])
    setUploading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Você precisa estar logado!')
      return
    }

    const { error } = await supabase.from('auctions').insert([{
      title,
      description,
      category,
      starting_bid: parseFloat(startingBid),
      neighborhood,
      city,
      ends_at: new Date(endsAt).toISOString(),
      photos,
      seller_id: user.id,
      status: 'active'
    }])

    if (error) {
      alert('Erro ao criar leilão: ' + error.message)
    } else {
      alert('Leilão criado com sucesso!')
      navigate('/home')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '40px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '20px', padding: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
          <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '15px' }}>←</button>
          <h1 style={{ margin: 0 }}>Criar Novo Leilão</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Título</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '10px', fontSize: '16px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '10px', fontSize: '16px', minHeight: '100px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '10px', fontSize: '16px' }}>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Lance Inicial (R$)</label>
            <input type="number" step="0.01" value={startingBid} onChange={(e) => setStartingBid(e.target.value)} required style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '10px', fontSize: '16px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Bairro</label>
            <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} required style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '10px', fontSize: '16px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Cidade</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '10px', fontSize: '16px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Data de Encerramento</label>
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '10px', fontSize: '16px' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Fotos (máximo 5)</label>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} disabled={uploading || photos.length >= 5} style={{ width: '100%', padding: '12px', border: '2px solid #ddd', borderRadius: '10px' }} />
            {uploading && <p>Enviando fotos...</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '15px' }}>
              {photos.map((url, i) => (
                <img key={i} src={url} alt="Preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
              ))}
            </div>
          </div>

          <button type="submit" style={{ width: '100%', padding: '15px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>CRIAR LEILÃO</button>
        </form>
      </div>
    </div>
  )
}

export default NovoLeilao