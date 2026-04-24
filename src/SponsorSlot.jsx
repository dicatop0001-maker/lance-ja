import { useState, useRef } from 'react'
import { supabase } from './supabaseClient'

const PIX_KEY = 'dicatop0001@gmail.com'
const PIX_NAME = 'Zap Bairro'

function SponsorSlot({ slot, city, sponsorData, onRefresh, userId }) {
      const [showModal, setShowModal] = useState(false)
      const [step, setStep] = useState('plan')
      const [planType, setPlanType] = useState('monthly')
      const [form, setForm] = useState({
              name: '',
              email: '',
              phone: '',
              link_url: '',
              offers: ['', '', '', '', ''],
              logo_url: ''
      })
      const [saving, setSaving] = useState(false)
      const [logoPreview, setLogoPreview] = useState(null)
      const [uploadingLogo, setUploadingLogo] = useState(false)
      const fileInputRef = useRef(null)

  const planPrice = planType === 'monthly' ? 50 : 400
      const planLabel = planType === 'monthly' ? 'Mensal' : 'Anual'
      const expiresMonths = planType === 'monthly' ? 1 : 12

  const isOwner = sponsorData && sponsorData.owner_user_id === userId
      const isActive = sponsorData && sponsorData.status === 'active'
      const isPending = sponsorData && sponsorData.status === 'pending'

  const handleSponsorClick = () => {
          if (isActive && !isOwner && sponsorData.link_url) {
                    window.open(sponsorData.link_url, '_blank')
          } else if (isOwner) {
                    setForm({
                                name: sponsorData.sponsor_name || '',
                                email: sponsorData.contact_email || '',
                                phone: sponsorData.contact_phone || '',
                                link_url: sponsorData.link_url || '',
                                offers: sponsorData.offers || ['', '', '', '', ''],
                                logo_url: sponsorData.logo_url || ''
                    })
                    setLogoPreview(sponsorData.logo_url || null)
                    setStep('form')
                    setShowModal(true)
          } else if (!isActive && !isPending) {
                    setStep('plan')
                    setShowModal(true)
          }
  }

  const handleLogoUpload = async (e) => {
          const file = e.target.files[0]
          if (!file) return
          setUploadingLogo(true)
          const ext = file.name.split('.').pop()
          const fileName = `sponsor_${city}_${slot}_${Date.now()}.${ext}`
          const { error } = await supabase.storage
            .from('auction-images')
            .upload(fileName, file, { upsert: true })
          if (!error) {
                    const { data: urlData } = supabase.storage.from('auction-images').getPublicUrl(fileName)
                    setForm(prev => ({ ...prev, logo_url: urlData.publicUrl }))
                    setLogoPreview(urlData.publicUrl)
          } else {
                    alert('Erro ao fazer upload: ' + error.message)
          }
          setUploadingLogo(false)
  }

  const handleSubmit = async () => {
          if (!form.name || !form.email) {
                    alert('Preencha nome e e-mail!')
                    return
          }
          setSaving(true)
          const now = new Date()
          const expires = new Date(now)
          expires.setMonth(expires.getMonth() + expiresMonths)

          const payload = {
                    city,
                    slot,
                    status: isOwner && isActive ? 'active' : 'pending',
                    plan_type: planType === 'monthly' ? 'monthly' : 'yearly',
                    plan_price: planPrice,
                    sponsor_name: form.name,
                    contact_email: form.email,
                    contact_phone: form.phone,
                    link_url: form.link_url,
                    offers: form.offers.filter(o => o.trim() !== ''),
                    logo_url: form.logo_url,
                    paid_at: isOwner ? sponsorData.paid_at : now.toISOString(),
                    expires_at: expires.toISOString()
          }
          if (!isOwner) {
                    payload.owner_user_id = userId
          }

          const { error } = await supabase.from('sponsors').upsert(payload, { onConflict: 'city,slot' })
          setSaving(false)
          if (error) {
                    alert('Erro ao salvar: ' + error.message)
          } else {
                    setStep('success')
                    if (onRefresh) onRefresh()
          }
  }

  const renderSlotContent = () => {
          if (isActive) {
                    return (
                                <div style={{ textAlign: 'center', width: '100%', padding: '4px' }}>
                                    {sponsorData.logo_url && (
                                                <img src={sponsorData.logo_url} alt={sponsorData.sponsor_name}
                                                                  style={{ width: '100%', maxHeight: '60px', objectFit: 'contain', borderRadius: '6px', marginBottom: '4px' }} />
                                              )}
                                              <div style={{ fontWeight: '800', fontSize: '11px', color: '#1e3a8a', marginBottom: '2px' }}>
                                                  {sponsorData.sponsor_name}
                                              </div>div>
                                    {sponsorData.offers && sponsorData.offers.length > 0 && (
                                                <div style={{ fontSize: '10px', color: '#374151', lineHeight: '1.3' }}>
                                                    {sponsorData.offers.slice(0, 2).map((o, i) => (
                                                                    <div key={i} style={{ color: '#dc2626', fontWeight: '700' }}>fogo {o}</div>div>
                                                                  ))}
                                                </div>div>
                                              )}
                                    {sponsorData.link_url && (
                                                <div style={{ fontSize: '10px', color: '#667eea', marginTop: '3px' }}>Ver mais</div>div>
                                              )}
                                    {isOwner && (
                                                <div style={{ fontSize: '9px', background: '#fbbf24', color: '#92400e', borderRadius: '4px', padding: '2px 4px', marginTop: '3px', fontWeight: '700' }}>
                                                                  Editar
                                                </div>div>
                                              )}
                                </div>div>
                              )
                        }
          if (isPending) {
                    return (
                                <div style={{ textAlign: 'center', padding: '4px' }}>
                                              <div style={{ fontSize: '18px', marginBottom: '3px' }}>⏳</div>div>
                                              <div style={{ fontSize: '10px', fontWeight: '800', color: '#d97706', lineHeight: '1.3' }}>
                                                              Pague o plano para publicar...
                                              </div>div>
                                    {isOwner && (
                                                <div style={{ fontSize: '9px', color: '#666', marginTop: '3px' }}>Em análise</div>div>
                                              )}
                                </div>div>
                              )
          }
          return (
                    <div style={{ textAlign: 'center', padding: '4px' }}>
                                <div style={{ fontSize: '20px', marginBottom: '4px' }}>⭐</div>div>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#1e3a8a', lineHeight: '1.4' }}>
                                              Patrocinador
                                </div>div>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#f97316' }}>
                                              Clique aqui!
                                </div>div>
                    </div>div>
                  )
  }

  const successMsg = isOwner
        ? 'Seu espaço de patrocinador foi atualizado com sucesso!'
          : 'Recebemos seus dados. Após confirmarmos o pagamento Pix, seu espaço será ativado em até 24h. Você receberá um aviso no e-mail ' + form.email + ' antes do vencimento para renovar.'

  return (
          <div>
                <div
                            onClick={handleSponsorClick}
                            style={{
                                          width: '100%',
                                          flex: 1,
                                          minHeight: '120px',
                                          border: isActive ? '2px solid #fbbf24' : isPending ? '2px dashed #d97706' : '2px dashed #94a3b8',
                                          borderRadius: '10px',
                                          background: isActive ? '#fffbeb' : isPending ? '#fef3c7' : 'rgba(255,255,255,0.12)',
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
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)'; e.currentTarget.style.transform = 'scale(1.02)' }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'scale(1)' }}
                            title={isActive ? sponsorData.sponsor_name : isPending ? 'Aguardando pagamento' : 'Anuncie aqui!'}
                          >
                    {renderSlotContent()}
                </div>div>
          
              {showModal && (
                      <div
                                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
                                    onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
                                  >
                                <div style={{ background: 'white', borderRadius: '20px', padding: '28px', maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', maxHeight: '92vh', overflowY: 'auto', position: 'relative' }}>
                                            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '14px', right: '18px', background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#888' }}>X</button>button>
                                
                                    {step === 'plan' && (
                                                    <div>
                                                                    <h2 style={{ margin: '0 0 6px', fontSize: '22px', color: '#1a202c' }}>Seja Patrocinador</h2>h2>
                                                                    <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
                                                                                      Seu negócio aparece na home do Zap Bairro em {city} para todos os usuários!
                                                                    </p>p>
                                                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                                                                        {[
                                                        { type: 'monthly', label: 'Mensal', price: 'R$ 50,00', sub: 'por mês' },
                                                        { type: 'yearly', label: 'Anual', price: 'R$ 400,00', sub: 'por ano · economize R$ 200!' }
                                                                          ].map(p => (
                                                                                                  <div key={p.type} onClick={() => setPlanType(p.type)}
                                                                                                                            style={{ flex: 1, padding: '16px 12px', border: planType === p.type ? '3px solid #667eea' : '2px solid #e2e8f0', borderRadius: '14px', cursor: 'pointer', textAlign: 'center', background: planType === p.type ? '#eef2ff' : 'white' }}>
                                                                                                                        <div style={{ fontWeight: '800', fontSize: '16px', color: '#1e3a8a' }}>{p.label}</div>div>
                                                                                                                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#667eea', margin: '6px 0 2px' }}>{p.price}</div>div>
                                                                                                                        <div style={{ fontSize: '11px', color: '#666' }}>{p.sub}</div>div>
                                                                                                      </div>div>
                                                                                                ))}
                                                                    </div>div>
                                                                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', marginBottom: '18px', fontSize: '13px', color: '#374151' }}>
                                                                                      <div style={{ fontWeight: '700', marginBottom: '6px' }}>O que você recebe:</div>div>
                                                                                      <div>Espaco exclusivo com sua logo na home do Zap Bairro</div>div>
                                                                                      <div>Ate 5 super ofertas visiveis para todos os visitantes</div>div>
                                                                                      <div>Link clicavel direto para seu site ou rede social</div>div>
                                                                                      <div>Edite seu espaco quando quiser</div>div>
                                                                                      <div>Aviso antes do vencimento para renovar</div>div>
                                                                    </div>div>
                                                                    <button onClick={() => setStep('pix')}
                                                                                          style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
                                                                                      Contratar plano {planLabel} - R$ {planPrice},00
                                                                    </button>button>
                                                    </div>div>
                                            )}
                                
                                    {step === 'pix' && (
                                                    <div>
                                                                    <h2 style={{ margin: '0 0 6px', fontSize: '20px', color: '#1a202c' }}>Pagamento via Pix</h2>h2>
                                                                    <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>
                                                                                      Plano {planLabel} - R$ {planPrice},00
                                                                    </p>p>
                                                                    <div style={{ background: '#f0fdf4', border: '2px solid #16a34a', borderRadius: '14px', padding: '18px', marginBottom: '16px', textAlign: 'center' }}>
                                                                                      <div style={{ fontSize: '13px', color: '#374151', marginBottom: '10px', fontWeight: '600' }}>Chave Pix:</div>div>
                                                                                      <div style={{ background: 'white', border: '1px solid #d1fae5', borderRadius: '8px', padding: '10px', fontFamily: 'monospace', fontSize: '14px', fontWeight: '700', color: '#15803d', wordBreak: 'break-all', marginBottom: '8px' }}>
                                                                                          {PIX_KEY}
                                                                                          </div>div>
                                                                                      <div style={{ fontSize: '12px', color: '#666' }}>Beneficiario: {PIX_NAME}</div>div>
                                                                                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#15803d', margin: '10px 0 4px' }}>R$ {planPrice},00</div>div>
                                                                                      <button onClick={() => navigator.clipboard && navigator.clipboard.writeText(PIX_KEY)}
                                                                                                              style={{ padding: '8px 18px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', marginTop: '4px' }}>
                                                                                                          Copiar chave Pix
                                                                                          </button>button>
                                                                    </div>div>
                                                                    <div style={{ background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#92400e', marginBottom: '16px' }}>
                                                                                      Apos realizar o pagamento, clique em "Ja paguei" e preencha seus dados. Nossa equipe confirmara o pagamento em ate 24h e ativara seu espaco.
                                                                    </div>div>
                                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                                                      <button onClick={() => setStep('plan')} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Voltar</button>button>
                                                                                      <button onClick={() => setStep('form')} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '15px' }}>Ja paguei</button>button>
                                                                    </div>div>
                                                    </div>div>
                                            )}
                                
                                    {step === 'form' && (
                                                    <div>
                                                                    <h2 style={{ margin: '0 0 6px', fontSize: '20px', color: '#1a202c' }}>{isOwner ? 'Editar espaco' : 'Seus dados'}</h2>h2>
                                                                    <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>
                                                                        {isOwner ? 'Atualize as informacoes do seu espaco de patrocinador.' : 'Preencha para ativarmos seu espaco.'}
                                                                    </p>p>
                                                    
                                                                    <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                                                                                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                                                                                                          Logo / Foto do estabelecimento
                                                                                          </label>label>
                                                                        {logoPreview && (
                                                                            <img src={logoPreview} alt="Logo preview" style={{ width: '120px', height: '80px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #e2e8f0', marginBottom: '8px' }} />
                                                                          )}
                                                                                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                                                                                      <button onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                                                                                              disabled={uploadingLogo}
                                                                                                              style={{ padding: '9px 20px', background: uploadingLogo ? '#aaa' : '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: uploadingLogo ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '700' }}>
                                                                                          {uploadingLogo ? 'Enviando...' : logoPreview ? 'Trocar logo' : 'Enviar logo'}
                                                                                          </button>button>
                                                                    </div>div>
                                                    
                                                        {[
                                                        { key: 'name', label: 'Nome do negocio *', placeholder: 'Ex: Pizzaria do Joao' },
                                                        { key: 'email', label: 'E-mail para contato *', placeholder: 'seu@email.com' },
                                                        { key: 'phone', label: 'WhatsApp / Telefone', placeholder: '(42) 99999-9999' },
                                                        { key: 'link_url', label: 'URL do seu site/rede social (torna seu espaco clicavel)', placeholder: 'https://instagram.com/seunegocio' }
                                                                        ].map(f => (
                                                                                              <div key={f.key} style={{ marginBottom: '12px' }}>
                                                                                                                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>{f.label}</label>label>
                                                                                                                  <input
                                                                                                                                            value={form[f.key]}
                                                                                                                                            onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                                                                                                            placeholder={f.placeholder}
                                                                                                                                            style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                                                                                                                                          />
                                                                                                  </div>div>
                                                                                            ))}
                                                    
                                                                    <div style={{ marginBottom: '16px' }}>
                                                                                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#dc2626', marginBottom: '8px' }}>
                                                                                                          Ate 5 Super Ofertas (aparecem no seu espaco)
                                                                                          </label>label>
                                                                        {form.offers.map((offer, i) => (
                                                                            <div key={i} style={{ marginBottom: '8px' }}>
                                                                                                  <input
                                                                                                                              value={offer}
                                                                                                                              onChange={e => {
                                                                                                                                                            const newOffers = [...form.offers]
                                                                                                                                                                                          newOffers[i] = e.target.value
                                                                                                                                                                                                                        setForm(prev => ({ ...prev, offers: newOffers }))
                                                                                                                                                                                                                                                    }}
                                                                                                                              placeholder={'Oferta ' + (i + 1) + ': Ex: 10% OFF na primeira compra!'}
                                                                                                                              style={{ width: '100%', padding: '9px 12px', border: '2px solid #fca5a5', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }}
                                                                                                                            />
                                                                            </div>div>
                                                                          ))}
                                                                    </div>div>
                                                    
                                                        {isPending && (
                                                                          <div style={{ background: '#fef3c7', border: '2px solid #fbbf24', borderRadius: '10px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
                                                                                              <div style={{ fontSize: '14px', fontWeight: '800', color: '#d97706' }}>Pague o plano para publicar...</div>div>
                                                                                              <div style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>Apos confirmacao do pagamento seu espaco sera ativado.</div>div>
                                                                          </div>div>
                                                                    )}
                                                    
                                                                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                                                        {!isOwner && (
                                                                            <button onClick={() => setStep('pix')} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Voltar</button>button>
                                                                                      )}
                                                                                      <button onClick={handleSubmit} disabled={saving}
                                                                                                              style={{ flex: 2, padding: '12px', background: saving ? '#aaa' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '15px' }}>
                                                                                          {saving ? 'Salvando...' : isOwner ? 'Salvar alteracoes' : 'Enviar cadastro'}
                                                                                          </button>button>
                                                                    </div>div>
                                                    </div>div>
                                            )}
                                
                                    {step === 'success' && (
                                                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                                                    <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎉</div>div>
                                                                    <h2 style={{ color: '#15803d', marginBottom: '8px' }}>{isOwner ? 'Alteracoes salvas!' : 'Cadastro enviado!'}</h2>h2>
                                                                    <p style={{ color: '#374151', fontSize: '14px', marginBottom: '20px' }}>
                                                                        {successMsg}
                                                                    </p>p>
                                                                    <button onClick={() => setShowModal(false)}
                                                                                          style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
                                                                                      Fechar
                                                                    </button>button>
                                                    </div>div>
                                            )}
                                </div>div>
                      </div>div>
                )}
          </div>div>
        )
}

export default SponsorSlot</div>
