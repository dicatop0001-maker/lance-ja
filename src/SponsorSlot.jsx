import { useState, useRef } from 'react'
import { supabase } from './supabaseClient'

const PIX_KEY = 'dicatop0001@gmail.com'
const PIX_NAME = 'Conecty'
const RAIO_KM = 2h

function calcDistKm(lat1, lon1, lat2, lon2) {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function SponsorSlot({ slot, city, sponsorData, onRefresh, userId, userLat, userLng }) {
    const [showModal, setShowModal] = useState(false)
    const [step, setStep] = useState('plan')
    const [planType, setPlanType] = useState('monthly')
    const [form, setForm] = useState({
          name: '',
          email: '',
          phone: '',
          link_url: '',
          offers: ['', '', '', '', ''],
          logo_url: '',
          address: ''
    })
    const [saving, setSaving] = useState(false)
    const [logoPreview, setLogoPreview] = useState(null)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [geoStatus, setGeoStatus] = useState('')
    const [sponsorLat, setSponsorLat] = useState(null)
    const [sponsorLng, setSponsorLng] = useState(null)
    const [submitError, setSubmitError] = useState('')
    const fileInputRef = useRef(null)

  const planPrice = planType === 'monthly' ? 50 : 400
    const planLabel = planType === 'monthly' ? 'Mensal' : 'Anual'
    const expiresMonths = planType === 'monthly' ? 1 : 12

  const isOwner = sponsorData && sponsorData.owner_user_id === userId
    const isActive = sponsorData && sponsorData.status === 'active'
    const isPending = sponsorData && sponsorData.status === 'pending'

  const dentroDoRaio = () => {
        if (!isActive) return false
        if (!sponsorData.lat || !sponsorData.lng) return true
        if (!userLat || !userLng) return true
        return calcDistKm(userLat, userLng, sponsorData.lat, sponsorData.lng) <= RAIO_KM
  }

  const handleSponsorClick = () => {
        if (isActive && !isOwner && !dentroDoRaio()) {
                setStep('plan'); setShowModal(true); return
        }
        if (isActive && !isOwner && sponsorData.link_url) {
                window.open(sponsorData.link_url, '_blank'); return
        }
        if (isOwner) {
                setForm({
                          name: sponsorData.sponsor_name || '',
                          email: sponsorData.contact_email || '',
                          phone: sponsorData.contact_phone || '',
                          link_url: sponsorData.link_url || '',
                          offers: sponsorData.offers && sponsorData.offers.length === 5
                            ? sponsorData.offers
                                      : ['', '', '', '', ''],
                          logo_url: sponsorData.logo_url || '',
                          address: sponsorData.address || ''
                })
                setLogoPreview(sponsorData.logo_url || null)
                setSponsorLat(sponsorData.lat || null)
                setSponsorLng(sponsorData.lng || null)
                setGeoStatus(sponsorData.lat ? 'Localizacao registrada.' : '')
                setSubmitError('')
                setStep('form'); setShowModal(true); return
        }
        if (!isActive && !isPending) {
                setStep('plan'); setShowModal(true); return
        }
        if (isPending && isOwner) {
                setStep('form'); setShowModal(true); return
        }
  }

  const handleLogoUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setUploadingLogo(true)
        const ext = file.name.split('.').pop()
        const fileName = 'sponsor_' + city + '_' + slot + '_' + Date.now() + '.' + ext
        const { error } = await supabase.storage
          .from('auction-images')
          .upload(fileName, file, { upsert: true })
        if (!error) {
                const { data: urlData } = supabase.storage
                  .from('auction-images')
                  .getPublicUrl(fileName)
                setForm(prev => ({ ...prev, logo_url: urlData.publicUrl }))
                setLogoPreview(urlData.publicUrl)
        } else {
                alert('Erro ao fazer upload: ' + error.message)
        }
        setUploadingLogo(false)
  }

  const geocodeAddress = async (address) => {
        if (!address || address.trim().length < 5) {
                alert('Digite um endereco valido!')
                return null
        }
        setGeoStatus('Buscando localizacao...')
        try {
                const query = encodeURIComponent(address + ', ' + city + ', Brasil')
                const res = await fetch(
                          'https://nominatim.openstreetmap.org/search?q=' + query + '&format=json&limit=1'
                        )
                const data = await res.json()
                if (data && data.length > 0) {
                          const lat = parseFloat(data[0].lat)
                          const lng = parseFloat(data[0].lon)
                          setSponsorLat(lat)
                          setSponsorLng(lng)
                          setGeoStatus('Localizacao encontrada! ' + lat.toFixed(4) + ', ' + lng.toFixed(4))
                          return { lat, lng }
                }
                setGeoStatus('Endereco nao encontrado. Tente ser mais especifico.')
                return null
        } catch (err) {
                setGeoStatus('Erro ao buscar localizacao.')
                return null
        }
  }

  const handleSubmit = async () => {
        setSubmitError('')
        // Bloquear se slot ja esta ativo por outro patrocinador
              if (sponsorData && sponsorData.id && isActive && !isOwner) {
                              setSubmitError('Este slot ja esta ativo por outro patrocinador. Escolha outro slot disponivel.')
                              return
              }
        if (!form.name || !form.name.trim()) {
                setSubmitError('Preencha o nome do negocio!')
                return
        }
        if (!form.email || !form.email.trim()) {
                setSubmitError('Preencha o e-mail!')
                return
        }

        let lat = sponsorLat
        let lng = sponsorLng

        // Se nao tiver coords e tiver endereco, geocodifica
        if ((!lat || !lng) && form.address && form.address.trim().length >= 5) {
                const coords = await geocodeAddress(form.address)
                if (coords) {
                          lat = coords.lat
                          lng = coords.lng
                }
        }

        // Aviso se nao conseguiu localizar (nao bloqueia o envio)
        if (!lat || !lng) {
                const continuar = window.confirm(
                          'Nao foi possivel localizar o endereco automaticamente. ' +
                          'Deseja enviar o cadastro sem localizacao precisa? ' +
                          'Voce podera atualizar depois.'
                        )
                if (!continuar) return
        }

        setSaving(true)

        const now = new Date()
        const expiresDate = new Date(now.getTime())
        expiresDate.setMonth(expiresDate.getMonth() + expiresMonths)

        const payload = {
                city,
                slot: (['L1','L2','L3','R1','R2','R3'].indexOf(slot) + 1) || 1,
                status: (isOwner && isActive) ? 'active' : 'pending',
                plan_type: planType === 'monthly' ? 'monthly' : 'yearly',
                plan_price: planPrice,
                sponsor_name: form.name.trim(),
                contact_email: form.email.trim(),
                contact_phone: form.phone ? form.phone.trim() : '',
                link_url: form.link_url ? form.link_url.trim() : '',
                offer_text: form.offers.filter(o => o && o.trim() !== '').join('\n'),
                expires_at: expiresDate.toISOString(),
        }

        let error = null

        if (sponsorData && sponsorData.id && (isOwner || isPending)) {
                // UPDATE registro existente
          const updatePayload = { ...payload }
                  if (!isOwner) {
                            updatePayload.paid_at = now.toISOString()
                  }
                const result = await supabase
                  .from('sponsors')
                  .update(updatePayload)
                  .eq('id', sponsorData.id)
                error = result.error
        } else {
                // INSERT novo registro
          const insertPayload = {
                    ...payload,
                            paid_at: now.toISOString()
          }
                const result = await supabase
                                        .from('sponsors')
                  .upsert(insertPayload, { onConflict: 'city,slot' })
                error = result.error
        }

        setSaving(false)

        if (error) {
                console.error('Supabase error:', error)
                setSubmitError('Erro ao salvar: ' + error.message)
        } else {
                setStep('success')
                if (onRefresh) onRefresh()
        }
  }

  const renderSlotContent = () => {
        if (isActive && !isOwner && !dentroDoRaio()) {
                return (
                          <div style={{ textAlign: 'center', padding: '4px' }}>
                                      <div style={{ fontSize: '22px', marginBottom: '4px' }}>⭐</div>
                                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#1e3a8a', lineHeight: '1.4' }}>Patrocinador</div>
                                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#f97316' }}>Clique aqui!</div>
                          </div>
                        )
        }

        if (isActive && (isOwner || dentroDoRaio())) {
                const dist = (!isOwner && userLat && userLng && sponsorData.lat && sponsorData.lng)
                  ? calcDistKm(userLat, userLng, sponsorData.lat, sponsorData.lng)
                          : null
                return (
                          <div style={{ textAlign: 'center', width: '100%', padding: '4px' }}>
                            {sponsorData.logo_url && (
                                        <img
                                                        src={sponsorData.logo_url}
                                                        alt={sponsorData.sponsor_name}
                                                        style={{ width: '100%', maxHeight: '55px', objectFit: 'contain', borderRadius: '6px', marginBottom: '3px' }}
                                                      />
                                      )}
                                      <div style={{ fontWeight: '800', fontSize: '11px', color: '#1e3a8a', marginBottom: '2px', lineHeight: '1.2' }}>
                                        {sponsorData.sponsor_name}
                                      </div>
                            {sponsorData.offers && sponsorData.offers.length > 0 && (
                                        <div>
                                          {sponsorData.offers.slice(0, 2).map((o, i) => (
                                                          <div key={i} style={{ fontSize: '10px', color: '#dc2626', fontWeight: '700', lineHeight: '1.3' }}>
                                                                            Oferta: {o}
                                                          </div>
                                                        ))}
                                        </div>
                                    )}
                            {sponsorData.link_url && (
                                        <div style={{ fontSize: '10px', color: '#667eea', marginTop: '2px' }}>Ver mais</div>
                                    )}
                            {dist !== null && (
                                        <div style={{ fontSize: '9px', color: '#16a34a', marginTop: '2px', fontWeight: '700' }}>
                                          {dist < 1 ? Math.round(dist * 1000) + 'm' : dist.toFixed(1) + 'km'}
                                        </div>
                                    )}
                            {isOwner && (
                                        <div style={{ fontSize: '9px', background: '#fbbf24', color: '#92400e', borderRadius: '4px', padding: '2px 4px', marginTop: '3px', fontWeight: '700' }}>
                                                      Editar
                                        </div>
                                    )}
                          </div>
                        )
                  }
                  
                      if (isPending) {
                              return (
                                        <div style={{ textAlign: 'center', padding: '4px' }}>
                                                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#d97706', lineHeight: '1.3' }}>
                                                              Pague o plano para publicar...
                                                  </div>
                                          {isOwner && (
                                                      <div style={{ fontSize: '9px', color: '#666', marginTop: '3px' }}>Em analise</div>
                                                  )}
                                        </div>
                                      )
                      }
    
        return (
                <div style={{ textAlign: 'center', padding: '4px' }}>
                        <div style={{ fontSize: '22px', marginBottom: '4px' }}>⭐</div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#1e3a8a', lineHeight: '1.4' }}>Patrocinador</div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#f97316' }}>Clique aqui!</div>
                </div>
              )
  }
    
      const successMsg = isOwner
            ? 'Seu espaco foi atualizado com sucesso!'
            : 'Recebemos seus dados. Apos confirmarmos o pagamento, seu espaco sera ativado em ate 24h.'
        
          const slotBg = isActive
                ? (isOwner || dentroDoRaio() ? '#fffbeb' : 'rgba(255,255,255,0.08)')
                : isPending ? '#fef3c7' : 'rgba(255,255,255,0.12)'
            
              const slotBorder = isActive
                    ? (isOwner || dentroDoRaio() ? '2px solid #fbbf24' : '2px dashed #94a3b8')
                    : isPending ? '2px dashed #d97706' : '2px dashed #94a3b8'
                
                  return (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                              <div
                                        onClick={handleSponsorClick}
                                        style={{
                                                    flex: 1,
                                                    minHeight: '120px',
                                                    border: slotBorder,
                                                    borderRadius: '10px',
                                                    background: slotBg,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '8px',
                                                    transition: 'box-shadow 0.2s, transform 0.2s',
                                                    boxSizing: 'border-box',
                                                    overflow: 'hidden'
                                        }}
                                        onMouseEnter={e => {
                                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)'
                                                                e.currentTarget.style.transform = 'scale(1.02)'
                                        }}
                                        onMouseLeave={e => {
                                                    e.currentTarget.style.boxShadow = 'none'
                                                                e.currentTarget.style.transform = 'scale(1)'
                                        }}
                                      >
                                {renderSlotContent()}
                              </div>
                        
                          {showModal && (
                                  <div
                                              style={{
                                                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                                            background: 'rgba(0,0,0,0.65)', zIndex: 9999,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
                                              }}
                                              onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
                                            >
                                            <div style={{
                                                          background: 'white', borderRadius: '20px', padding: '28px',
                                                          maxWidth: '460px', width: '100%',
                                                          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                                                          maxHeight: '92vh', overflowY: 'auto', position: 'relative'
                                            }}>
                                                        <button
                                                                        onClick={() => setShowModal(false)}
                                                                        style={{
                                                                                          position: 'absolute', top: '14px', right: '18px',
                                                                                          background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#888'
                                                                          }}
                                                                      >✕</button>
                                            
                                              {/* STEP: PLAN */}
                                              {step === 'plan' && (
                                                            <div>
                                                                            <h2 style={{ margin: '0 0 4px', fontSize: '22px', color: '#1a202c' }}>Seja Patrocinador</h2>
                                                                            <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>
                                                                                              Escolha o plano ideal para o seu negocio e apareca para o publico da sua regiao!
                                                                            </p>
                                                                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                                                              {[
                                                              { type: 'monthly', label: 'Mensal', price: 'R$ 50,00', sub: 'por mes' },
                                                              { type: 'yearly', label: 'Anual', price: 'R$ 400,00', sub: 'por ano — economize R$ 200!' }
                                                                                ].map(p => (
                                                                                                      <div
                                                                                                                              key={p.type}
                                                                                                                              onClick={() => setPlanType(p.type)}
                                                                                                                              style={{
                                                                                                                                                        flex: 1, padding: '14px 10px',
                                                                                                                                                        border: planType === p.type ? '3px solid #667eea' : '2px solid #e2e8f0',
                                                                                                                                                        borderRadius: '14px', cursor: 'pointer', textAlign: 'center',
                                                                                                                                                        background: planType === p.type ? '#eef2ff' : 'white'
                                                                                                                                }}
                                                                                                                            >
                                                                                                                            <div style={{ fontWeight: '800', fontSize: '15px', color: '#1e3a8a' }}>{p.label}</div>
                                                                                                                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#667eea', margin: '4px 0' }}>{p.price}</div>
                                                                                                                            <div style={{ fontSize: '11px', color: '#666' }}>{p.sub}</div>
                                                                                                        </div>
                                                                                                    ))}
                                                                            </div>
                                                                            <div style={{ background: '#fff7ed', border: '2px solid #f97316', borderRadius: '10px', padding: '10px', marginBottom: '16px', fontSize: '12px', color: '#7c2d12' }}>
                                                                                              <strong>Beneficios do patrocinador:</strong> Um anuncio criado pelo patrocinador ficara sempre entre os 6 primeiros no feed. Cada patrocinador tem o direito de fazer um anuncio para ficar no topo.
                                                                            </div>
                                                                            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: '#374151' }}>
                                                                                              <div style={{ fontWeight: '700', marginBottom: '5px' }}>O que voce recebe:</div>
                                                                                              <div>✅ Logo/foto do estabelecimento no espaco</div>
                                                                                              <div>✅ Ate 5 super ofertas exclusivas</div>
                                                                                              <div>✅ Link clicavel para seu site ou rede social</div>
                                                                                              <div>✅ Visibilidade exclusiva para clientes proximos</div>
                                                                                              <div>✅ Edite seu espaco quando quiser</div>
                                                                            </div>
                                                                            <button
                                                                                                onClick={() => setStep('pix')}
                                                                                                style={{
                                                                                                                      width: '100%', padding: '13px',
                                                                                                                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                                                                                                      color: 'white', border: 'none', borderRadius: '12px',
                                                                                                                      fontSize: '15px', fontWeight: '800', cursor: 'pointer'
                                                                                                  }}
                                                                                              >
                                                                                              Contratar plano {planLabel} — R$ {planPrice},00
                                                                            </button>
                                                            </div>
                                                        )}
                                            
                                              {/* STEP: PIX */}
                                              {step === 'pix' && (
                                                            <div>
                                                                            <h2 style={{ margin: '0 0 6px', fontSize: '20px', color: '#1a202c' }}>Pagamento via Pix</h2>
                                                                            <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>
                                                                                              Plano {planLabel} — <strong>R$ {planPrice},00</strong>
                                                                            </p>
                                                                            <div style={{ background: '#f0fdf4', border: '2px solid #16a34a', borderRadius: '14px', padding: '16px', marginBottom: '14px', textAlign: 'center' }}>
                                                                                              <div style={{ fontSize: '12px', color: '#374151', marginBottom: '8px', fontWeight: '600' }}>Chave Pix:</div>
                                                                                              <div style={{ background: 'white', border: '1px solid #d1fae5', borderRadius: '8px', padding: '10px', fontFamily: 'monospace', fontSize: '14px', fontWeight: '700', color: '#15803d', wordBreak: 'break-all', marginBottom: '8px' }}>
                                                                                                {PIX_KEY}
                                                                                                </div>
                                                                                              <div style={{ fontSize: '12px', color: '#666' }}>Beneficiario: <strong>{PIX_NAME}</strong></div>
                                                                                              <div style={{ fontSize: '24px', fontWeight: '900', color: '#15803d', margin: '8px 0 4px' }}>R$ {planPrice},00</div>
                                                                                              <button
                                                                                                                    onClick={() => navigator.clipboard && navigator.clipboard.writeText(PIX_KEY)}
                                                                                                                    style={{ padding: '7px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', marginTop: '4px' }}
                                                                                                                  >
                                                                                                                  Copiar chave Pix
                                                                                                </button>
                                                                            </div>
                                                                            <div style={{ background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '10px', padding: '10px', fontSize: '12px', color: '#92400e', marginBottom: '14px' }}>
                                                                                              Apos o pagamento, clique em "Ja paguei" e preencha seus dados. Ativamos em ate 24h.
                                                                            </div>
                                                                            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                                                                              <button
                                                                                                                    onClick={() => setStep('plan')}
                                                                                                                    style={{ flex: 1, padding: '14px', background: 'white', color: '#374151', border: '2px solid #64748b', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}
                                                                                                                  >
                                                                                                                  ← Voltar
                                                                                                </button>
                                                                                              <button
                                                                                                                    onClick={() => { setSubmitError(''); setStep('form') }}
                                                                                                                    style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '16px', boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}
                                                                                                                  >
                                                                                                                  ✅ Ja paguei
                                                                                                </button>
                                                                            </div>
                                                            </div>
                                                        )}
                                            
                                              {/* STEP: FORM */}
                                              {step === 'form' && (
                                                            <div>
                                                                            <h2 style={{ margin: '0 0 4px', fontSize: '20px', color: '#1a202c' }}>
                                                                              {isOwner ? 'Editar espaco' : 'Seus dados'}
                                                                            </h2>
                                                                            <p style={{ color: '#666', fontSize: '12px', marginBottom: '14px' }}>
                                                                              {isOwner ? 'Atualize as informacoes do seu espaco.' : 'Preencha seus dados para ativarmos seu espaco.'}
                                                                            </p>
                                                            
                                                              {/* Upload de logo */}
                                                                            <div style={{ marginBottom: '14px', textAlign: 'center' }}>
                                                                                              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                                                                                                  Logo / Foto do estabelecimento
                                                                                                </label>
                                                                              {logoPreview && (
                                                                                  <img
                                                                                                          src={logoPreview}
                                                                                                          alt="preview"
                                                                                                          style={{ width: '110px', height: '70px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #e2e8f0', marginBottom: '6px', display: 'block', margin: '0 auto 6px' }}
                                                                                                        />
                                                                                )}
                                                                                              <input
                                                                                                                    ref={fileInputRef}
                                                                                                                    type="file"
                                                                                                                    accept="image/*"
                                                                                                                    onChange={handleLogoUpload}
                                                                                                                    style={{ display: 'none' }}
                                                                                                                  />
                                                                                              <button
                                                                                                                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                                                                                                    disabled={uploadingLogo}
                                                                                                                    style={{
                                                                                                                                            padding: '8px 18px',
                                                                                                                                            background: uploadingLogo ? '#aaa' : '#667eea',
                                                                                                                                            color: 'white', border: 'none', borderRadius: '8px',
                                                                                                                                            cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                                                                                                                                            fontSize: '12px', fontWeight: '700'
                                                                                                                      }}
                                                                                                                  >
                                                                                                {uploadingLogo ? 'Enviando...' : logoPreview ? 'Trocar logo' : 'Enviar logo'}
                                                                                                </button>
                                                                            </div>
                                                            
                                                              {/* Campos do formulario */}
                                                              {[
                                                              { key: 'name', label: 'Nome do negocio *', placeholder: 'Ex: Pizzaria do Joao' },
                                                              { key: 'email', label: 'E-mail *', placeholder: 'seu@email.com' },
                                                              { key: 'phone', label: 'WhatsApp / Telefone', placeholder: '(42) 99999-9999' },
                                                              { key: 'link_url', label: 'URL do site/rede social (torna clicavel)', placeholder: 'https://instagram.com/seunegocio' }
                                                                              ].map(f => (
                                                                                                  <div key={f.key} style={{ marginBottom: '10px' }}>
                                                                                                                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '3px' }}>
                                                                                                                        {f.label}
                                                                                                                        </label>
                                                                                                                      <input
                                                                                                                                              value={form[f.key]}
                                                                                                                                              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                                                                                                              placeholder={f.placeholder}
                                                                                                                                              style={{ width: '100%', padding: '9px 11px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                                                                                                                                            />
                                                                                                    </div>
                                                                                                ))}
                                                            
                                                              {/* Endereco com geocodificacao */}
                                                                            <div style={{ marginBottom: '14px' }}>
                                                                                              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e3a8a', marginBottom: '3px' }}>
                                                                                                                  Endereco do estabelecimento
                                                                                                </label>
                                                                                              <div style={{ display: 'flex', gap: '6px' }}>
                                                                                                                  <input
                                                                                                                                          value={form.address}
                                                                                                                                          onChange={e => {
                                                                                                                                                                    setForm(prev => ({ ...prev, address: e.target.value }))
                                                                                                                                                                                              setGeoStatus('')
                                                                                                                                                                                                                        setSponsorLat(null)
                                                                                                                                                                                                                                                  setSponsorLng(null)
                                                                                                                                                                                                                                                                          }}
                                                                                                                                          placeholder="Ex: Rua das Flores, 123, Centro"
                                                                                                                                          style={{ flex: 1, padding: '9px 11px', border: '2px solid #a5b4fc', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                                                                                                                                        />
                                                                                                                  <button
                                                                                                                                          onClick={() => geocodeAddress(form.address)}
                                                                                                                                          style={{ padding: '9px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}
                                                                                                                                        >
                                                                                                                                        Localizar
                                                                                                                    </button>
                                                                                                </div>
                                                                              {geoStatus && (
                                                                                  <div style={{ fontSize: '11px', marginTop: '5px', color: sponsorLat ? '#15803d' : '#dc2626', fontWeight: '600' }}>
                                                                                    {geoStatus}
                                                                                    </div>
                                                                                              )}
                                                                              {sponsorLat && sponsorLng && (
                                                                                  <div style={{ fontSize: '11px', marginTop: '4px', color: '#15803d', background: '#f0fdf4', padding: '6px 10px', borderRadius: '6px' }}>
                                                                                                        Localizacao registrada com sucesso!
                                                                                    </div>
                                                                                              )}
                                                                            </div>
                                                            
                                                              {/* Ofertas */}
                                                                            <div style={{ marginBottom: '14px' }}>
                                                                                              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#dc2626', marginBottom: '6px' }}>
                                                                                                                  Ate 5 Super Ofertas
                                                                                                </label>
                                                                              {form.offers.map((offer, i) => (
                                                                                  <div key={i} style={{ marginBottom: '7px' }}>
                                                                                                        <input
                                                                                                                                  value={offer}
                                                                                                                                  onChange={e => {
                                                                                                                                                              const newOffers = [...form.offers]
                                                                                                                                                                                          newOffers[i] = e.target.value
                                                                                                                                                                                                                      setForm(prev => ({ ...prev, offers: newOffers }))
                                                                                                                                                                                                                                                }}
                                                                                                                                  placeholder={'Oferta ' + (i + 1) + ': Ex: 10% OFF na primeira compra!'}
                                                                                                                                  style={{ width: '100%', padding: '8px 11px', border: '2px solid #fca5a5', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box' }}
                                                                                                                                />
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                            
                                                              {/* Aviso pagamento pendente */}
                                                              {isPending && !isOwner && (
                                                                                <div style={{ background: '#fef3c7', border: '2px solid #fbbf24', borderRadius: '10px', padding: '10px', marginBottom: '14px', textAlign: 'center' }}>
                                                                                                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#d97706' }}>Pague o plano para publicar...</div>
                                                                                                    <div style={{ fontSize: '11px', color: '#92400e', marginTop: '3px' }}>Apos confirmacao do pagamento seu espaco sera ativado.</div>
                                                                                </div>
                                                                            )}
                                                            
                                                              {/* Mensagem de erro */}
                                                              {submitError && (
                                                                                <div style={{ background: '#fee2e2', border: '2px solid #f87171', borderRadius: '10px', padding: '10px', marginBottom: '14px', fontSize: '13px', color: '#b91c1c', fontWeight: '600', textAlign: 'center' }}>
                                                                                                    ⚠️ {submitError}
                                                                                </div>
                                                                            )}
                                                            
                                                              {/* Botoes de acao */}
                                                                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '2px solid #e2e8f0' }}>
                                                                              {!isOwner && (
                                                                                  <button
                                                                                                          onClick={() => setStep('pix')}
                                                                                                          style={{ flex: 1, padding: '14px', background: 'white', color: '#374151', border: '2px solid #64748b', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}
                                                                                                        >
                                                                                                        ← Voltar
                                                                                    </button>
                                                                                              )}
                                                                                              <button
                                                                                                                    onClick={handleSubmit}
                                                                                                                    disabled={saving}
                                                                                                                    style={{
                                                                                                                                            flex: 2, padding: '15px',
                                                                                                                                            background: saving ? '#94a3b8' : 'linear-gradient(135deg, #f97316, #ea580c)',
                                                                                                                                            color: 'white', border: 'none', borderRadius: '12px',
                                                                                                                                            cursor: saving ? 'not-allowed' : 'pointer',
                                                                                                                                            fontWeight: '800', fontSize: '17px',
                                                                                                                                            boxShadow: saving ? 'none' : '0 4px 16px rgba(249,115,22,0.45)',
                                                                                                                                            letterSpacing: '0.3px'
                                                                                                                      }}
                                                                                                                  >
                                                                                                {saving ? '⏳ Salvando...' : isOwner ? '💾 Salvar alteracoes' : '📤 Enviar cadastro'}
                                                                                                </button>
                                                                            </div>
                                                            </div>
                                                        )}
                                            
                                              {/* STEP: SUCCESS */}
                                              {step === 'success' && (
                                                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                                                            <div style={{ fontSize: '56px', marginBottom: '14px' }}>🎉</div>
                                                                            <h2 style={{ color: '#15803d', marginBottom: '8px' }}>
                                                                              {isOwner ? 'Alteracoes salvas!' : 'Cadastro enviado!'}
                                                                            </h2>
                                                                            <p style={{ color: '#374151', fontSize: '13px', marginBottom: '20px', lineHeight: '1.6' }}>
                                                                              {successMsg}
                                                                            </p>
                                                                            <button
                                                                                                onClick={() => setShowModal(false)}
                                                                                                style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}
                                                                                              >
                                                                                              Fechar
                                                                            </button>
                                                            </div>
                                                        )}
                                            </div>
                                  </div>
                              )}
                        </div>
                      )
                    }
                    
                    export default SponsorSlot
