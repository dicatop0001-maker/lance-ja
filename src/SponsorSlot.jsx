import { useState } from 'react'
import { supabase } from './supabaseClient'

// Chave Pix do Zap Bairro (CNPJ/CPF do dono)
const PIX_KEY = 'zapbairro@pagamento.com'
const PIX_NAME = 'Zap Bairro'

function SponsorSlot({ slot, city, sponsorData, onRefresh }) {
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState('plan') // plan | pix | form | success
  const [planType, setPlanType] = useState('monthly')
  const [form, setForm] = useState({ name: '', email: '', phone: '', link: '', offer: '' })
  const [saving, setSaving] = useState(false)

  const planPrice = planType === 'monthly' ? 90 : 700
  const planLabel = planType === 'monthly' ? 'Mensal' : 'Anual'
  const expiresMonths = planType === 'monthly' ? 1 : 12

  const isActive = sponsorData && sponsorData.status === 'active'

  const handleSponsorClick = () => {
    if (isActive && sponsorData.link_url) {
      window.open(sponsorData.link_url, '_blank')
    } else if (!isActive) {
      setStep('plan')
      setShowModal(true)
    }
  }

  const handleConfirmPlan = () => setStep('pix')

  const handleConfirmPix = () => setStep('form')

  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      alert('Preencha nome e e-mail!')
      return
    }
    setSaving(true)
    const now = new Date()
    const expires = new Date(now)
    expires.setMonth(expires.getMonth() + expiresMonths)

    const { error } = await supabase.from('sponsors').upsert({
      city,
      slot,
      status: 'pending',
      plan_type: planType === 'monthly' ? 'monthly' : 'yearly',
      plan_price: planPrice,
      sponsor_name: form.name,
      contact_email: form.email,
      contact_phone: form.phone,
      link_url: form.link,
      offer_text: form.offer,
      paid_at: now.toISOString(),
      expires_at: expires.toISOString()
    }, { onConflict: 'city,slot' })

    setSaving(false)
    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      setStep('success')
      if (onRefresh) onRefresh()
    }
  }

  // Gerar string Pix copia-e-cola simplificada
  const pixString = `Pix: ${PIX_KEY} | Valor: R$ ${planPrice},00 | Beneficiário: ${PIX_NAME}`

  const slotStyle = {
    width: '100%',
    flex: 1,
    minHeight: '80px',
    border: '2px solid #111',
    borderRadius: '8px',
    background: isActive ? '#fff' : '#fff',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    transition: 'box-shadow 0.2s',
    boxSizing: 'border-box',
    overflow: 'hidden'
  }

  return (
    <>
      <div
        style={slotStyle}
        onClick={handleSponsorClick}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        title={isActive ? (sponsorData.offer_text || sponsorData.sponsor_name) : 'Anunciar aqui'}
      >
        {isActive ? (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontWeight: '800', fontSize: '13px', color: '#1e3a8a', marginBottom: '2px' }}>{sponsorData.sponsor_name}</div>
            {sponsorData.offer_text && (
              <div style={{ fontSize: '11px', color: '#374151', lineHeight: '1.3' }}>{sponsorData.offer_text}</div>
            )}
            {sponsorData.link_url && (
              <div style={{ fontSize: '10px', color: '#667eea', marginTop: '3px' }}>🔗 Ver mais</div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#374151', lineHeight: '1.4' }}>
              Quer patrocinar?
            </div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#f97316' }}>
              Clique aqui! 🚀
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>

            {/* FECHAR */}
            <button onClick={() => setShowModal(false)} style={{
              position: 'absolute', top: '16px', right: '20px',
              background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#888'
            }}>✕</button>

            {/* STEP 1 — PLANO */}
            {step === 'plan' && (
              <>
                <h2 style={{ margin: '0 0 6px', fontSize: '22px', color: '#1a202c' }}>🚀 Anunciar neste espaço</h2>
                <p style={{ color: '#666', fontSize: '13px', marginBottom: '20px' }}>
                  Seu negócio aparece na home do Zap Bairro em <strong>{city}</strong> para todos os usuários da cidade.
                </p>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  {[{ type: 'monthly', label: 'Mensal', price: 'R$ 90,00', sub: 'por mês' },
                    { type: 'yearly', label: 'Anual', price: 'R$ 700,00', sub: 'por ano · economize R$ 380!' }].map(p => (
                    <div key={p.type} onClick={() => setPlanType(p.type)} style={{
                      flex: 1, padding: '16px 12px', border: planType === p.type ? '3px solid #667eea' : '2px solid #e2e8f0',
                      borderRadius: '14px', cursor: 'pointer', textAlign: 'center',
                      background: planType === p.type ? '#eef2ff' : 'white'
                    }}>
                      <div style={{ fontWeight: '800', fontSize: '16px', color: '#1e3a8a' }}>{p.label}</div>
                      <div style={{ fontSize: '20px', fontWeight: '900', color: '#667eea', margin: '6px 0 2px' }}>{p.price}</div>
                      <div style={{ fontSize: '11px', color: '#666' }}>{p.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', marginBottom: '18px', fontSize: '13px', color: '#374151' }}>
                  <div style={{ fontWeight: '700', marginBottom: '6px' }}>✅ O que você recebe:</div>
                  <div>• Espaço exclusivo na home do Zap Bairro em {city}</div>
                  <div>• Link direto para seu site ou rede social</div>
                  <div>• Texto de oferta/promoção visível a todos</div>
                  <div>• Aviso antes do vencimento para renovar</div>
                </div>
                <button onClick={handleConfirmPlan} style={{
                  width: '100%', padding: '14px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px',
                  fontWeight: '800', cursor: 'pointer'
                }}>Contratar plano {planLabel} — R$ {planPrice},00 →</button>
              </>
            )}

            {/* STEP 2 — PIX */}
            {step === 'pix' && (
              <>
                <h2 style={{ margin: '0 0 6px', fontSize: '20px', color: '#1a202c' }}>💰 Pagamento via Pix</h2>
                <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>
                  Plano {planLabel} — <strong>R$ {planPrice},00</strong>
                </p>
                <div style={{ background: '#f0fdf4', border: '2px solid #16a34a', borderRadius: '14px', padding: '18px', marginBottom: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#374151', marginBottom: '10px', fontWeight: '600' }}>Chave Pix:</div>
                  <div style={{ background: 'white', border: '1px solid #d1fae5', borderRadius: '8px', padding: '10px', fontFamily: 'monospace', fontSize: '14px', fontWeight: '700', color: '#15803d', wordBreak: 'break-all', marginBottom: '8px' }}>
                    {PIX_KEY}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Beneficiário: <strong>{PIX_NAME}</strong></div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#15803d', margin: '10px 0 4px' }}>R$ {planPrice},00</div>
                  <button onClick={() => navigator.clipboard?.writeText(PIX_KEY)} style={{
                    padding: '8px 18px', background: '#16a34a', color: 'white', border: 'none',
                    borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', marginTop: '4px'
                  }}>📋 Copiar chave Pix</button>
                </div>
                <div style={{ background: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#92400e', marginBottom: '16px' }}>
                  ⚠️ Após realizar o pagamento, clique em "Já paguei" e preencha seus dados. Nossa equipe confirmará o pagamento em até 24h e ativará seu espaço.
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep('plan')} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>← Voltar</button>
                  <button onClick={handleConfirmPix} style={{ flex: 2, padding: '12px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '15px' }}>✅ Já paguei →</button>
                </div>
              </>
            )}

            {/* STEP 3 — FORMULÁRIO */}
            {step === 'form' && (
              <>
                <h2 style={{ margin: '0 0 6px', fontSize: '20px', color: '#1a202c' }}>📝 Seus dados</h2>
                <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>Preencha para ativarmos seu espaço e enviarmos avisos de renovação.</p>
                {[
                  { key: 'name', label: 'Nome do negócio *', placeholder: 'Ex: Pizzaria do João', required: true },
                  { key: 'email', label: 'E-mail para contato *', placeholder: 'seu@email.com', required: true },
                  { key: 'phone', label: 'WhatsApp / Telefone', placeholder: '(42) 99999-9999' },
                  { key: 'link', label: 'Link do site ou rede social', placeholder: 'https://instagram.com/seunegocio' },
                  { key: 'offer', label: 'Texto de oferta (aparece no espaço)', placeholder: 'Ex: 10% OFF na primeira compra!' }
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>{f.label}</label>
                    <input
                      value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button onClick={() => setStep('pix')} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>← Voltar</button>
                  <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '12px', background: saving ? '#aaa' : 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '15px' }}>
                    {saving ? '⏳ Salvando...' : '🚀 Enviar cadastro'}
                  </button>
                </div>
              </>
            )}

            {/* STEP 4 — SUCESSO */}
            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎉</div>
                <h2 style={{ color: '#15803d', marginBottom: '8px' }}>Cadastro enviado!</h2>
                <p style={{ color: '#374151', fontSize: '14px', marginBottom: '20px' }}>
                  Recebemos seus dados. Após confirmarmos o pagamento Pix, seu espaço será ativado em até 24h.<br/><br/>
                  Você receberá um aviso no e-mail <strong>{form.email}</strong> antes do vencimento para renovar.
                </p>
                <button onClick={() => setShowModal(false)} style={{
                  padding: '12px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px',
                  fontWeight: '800', cursor: 'pointer'
                }}>✓ Fechar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default SponsorSlot
