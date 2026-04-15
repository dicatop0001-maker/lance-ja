import { useState, useEffect, useRef, createElement as h } from 'react'
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
          if (error) { alert('Erro: ' + error.message) }
          else { alert('Leilao criado!'); navigate('/home') }
  }

  const inp = {
          width: '100%', padding: '14px 16px', border: '2px solid #e2e8f0',
          borderRadius: '12px', fontSize: '16px', boxSizing: 'border-box', fontFamily: 'inherit'
  }
      const lbl = { display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '14px' }

  const Field = ({ label, children }) => h('div', null,
                                               h('label', { style: lbl }, label),
                                               children
                                             )

  return h('div', { style: { minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' } },
               h('div', { style: { maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' } },
                       h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' } },
                                 h('button', { onClick: () => navigate('/home'), style: { background: 'none', border: '2px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontSize: '16px' } }, 'Voltar'),
                                 h('h1', { style: { margin: 0, fontSize: '24px', fontWeight: '800', color: '#1a202c' } }, 'Criar Novo Leilao')
                               ),
                       h('form', { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: '20px' } },
                                 h(Field, { label: 'Titulo *' },
                                             h('input', { style: inp, value: title, onChange: e => setTitle(e.target.value), placeholder: 'Ex: Sofa em otimo estado', required: true })
                                           ),
                                 h(Field, { label: 'Descricao' },
                                             h('textarea', { key: 'desc-field', style: { ...inp, height: '100px', resize: 'vertical' }, inputMode: 'text', value: description, onChange: e => setDescription(e.target.value), placeholder: 'Descreva o item...' })
                                           ),
                                 h(Field, { label: 'Categoria' },
                                             h('select', { style: inp, value: category, onChange: e => setCategory(e.target.value) },
                                                           h('option', { value: 'veiculos' }, 'Veiculos'),
                                                           h('option', { value: 'eletronicos' }, 'Eletronicos'),
                                                           h('option', { value: 'moveis' }, 'Moveis'),
                                                           h('option', { value: 'imoveis' }, 'Imoveis'),
                                                           h('option', { value: 'servicos' }, 'Servicos'),
                                                           h('option', { value: 'objetos' }, 'Objetos'),
                                                           h('option', { value: 'outros' }, 'Outros')
                                                         )
                                           ),
                                 h(Field, { label: 'Lance Inicial (R$) *' },
                                             h('input', { style: inp, type: 'number', min: '1', step: '0.01', value: startingBid, onChange: e => setStartingBid(e.target.value), placeholder: '0.00', required: true })
                                           ),
                                 h(Field, { label: 'Bairro' },
                                             h('input', { style: inp, value: neighborhood, onChange: e => setNeighborhood(e.target.value), placeholder: 'Ex: Centro' })
                                           ),
                                 h(Field, { label: 'Cidade *' },
                                             h('div', { style: { position: 'relative' } },
                                                           h('input', { style: inp, value: city, onChange: e => handleCityInput(e.target.value), onBlur: () => setTimeout(() => setShowCityDropdown(false), 200), placeholder: 'Digite sua cidade...', required: true }),
                                                           showCityDropdown && h('div', { style: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '2px solid #e2e8f0', borderRadius: '12px', zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxHeight: '200px', overflowY: 'auto' } },
                                                                                               filteredCities.map((c, i) => h('div', { key: i, onMouseDown: () => { setCity(c); setShowCityDropdown(false) }, style: { padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '14px' } }, c))
                                                                                             )
                                                         )
                                           ),
                                 h(Field, { label: 'Data de Encerramento *' },
                                             h('input', { style: inp, type: 'datetime-local', value: endsAt, onChange: e => setEndsAt(e.target.value), required: true })
                                           ),
                                 h(Field, { label: 'Fotos (maximo 5)' },
                                             h('div', null,
                                                           h('input', { type: 'file', accept: 'image/*', multiple: true, onChange: handlePhotoUpload, style: { ...inp, padding: '10px', cursor: 'pointer' } }),
                                                           uploading && h('p', { style: { color: '#667eea', fontSize: '14px', marginTop: '8px' } }, 'Enviando fotos...'),
                                                           photos.length > 0 && h('div', { style: { display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' } },
                                                                                                photos.map((p, i) => h('div', { key: i, style: { position: 'relative' } },
                                                                                                                                       h('img', { src: p, alt: 'foto', style: { width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px' } }),
                                                                                                                                       h('button', { type: 'button', onClick: () => setPhotos(prev => prev.filter((_, x) => x !== i)), style: { position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px' } }, 'x')
                                                                                                                                     ))
                                                                                              )
                                                         )
                                           ),
                                 h('button', { type: 'submit', disabled: uploading, style: { padding: '16px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '18px', fontWeight: '800', cursor: uploading ? 'not-allowed' : 'pointer' } },
                                             uploading ? 'ENVIANDO FOTOS...' : 'CRIAR LEILAO'
                                           )
                               )
                     )
             )
}


export default NovoLeilao
