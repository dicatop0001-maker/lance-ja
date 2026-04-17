import { useState } from 'react'
import { supabase } from './supabaseClient'

function PaymentModal({ user, auction, amount, plan, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [pixCode, setPixCode] = useState('')
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  const createPayment = async () => {
    setLoading(true)
    // SIMULACAO — Gerar PIX fake
    setTimeout(() => {
      const fakePixCode = '00020126580014br.gov.bcb.pix0136' + Math.random().toString(36).substring(7) + '52040000530398654040' + amount.toFixed(2) + '5802BR5925LANCE JA LEILOES6014PONTA GROSSA62070503***63041D3A'
      setPixCode(fakePixCode)
      setLoading(false)
      setPaymentProcessing(true)
      // Simular aprovacao apos 5 segundos
      setTimeout(() => {
        processPayment()
      }, 5000)
    }, 2000)
  }

  const processPayment = async () => {
    try {
      if (plan === 'single') {
        // Registrar desbloqueio unico (contato com vencedor)
        const { error } = await supabase.from('contact_unlocks').insert({
          user_id: user.id,
          auction_id: auction.id,
          payment_status: 'paid',
          amount: amount,
          paid_at: new Date().toISOString()
        })
        if (error) throw error
      } else if (plan === 'all_bidders') {
        // Registrar desbloqueio para todos os que deram lance
        const { error } = await supabase.from('contact_unlocks').insert({
          user_id: user.id,
          auction_id: auction.id,
          payment_status: 'paid',
          unlock_type: 'all_bidders',
          amount: amount,
          paid_at: new Date().toISOString()
        })
        if (error) throw error
      } else {
        // Registrar assinatura (mensal ou anual)
        const endsAt = plan === 'monthly'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        const { error } = await supabase.from('subscriptions').insert({
          user_id: user.id,
          plan: plan,
          status: 'active',
          starts_at: new Date().toISOString(),
          ends_at: endsAt.toISOString()
        })
        if (error) throw error
      }
      alert('Pagamento confirmado! Chat desbloqueado!')
      onSuccess()
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao processar: ' + error.message)
    }
  }

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode)
    alert('Codigo PIX copiado!\n\nMODO SIMULACAO:\nO pagamento sera aprovado automaticamente em 5 segundos.')
  }

  const getPlanLabel = () => {
    if (plan === 'single') return 'Pagamento unico'
    if (plan === 'all_bidders') return 'Liberar chat para todos os participantes'
    if (plan === 'monthly') return 'Assinatura Mensal'
    return 'Assinatura Anual'
  }

  const getPlanIcon = () => {
    if (plan === 'single') return '💰'
    if (plan === 'all_bidders') return '💬'
    if (plan === 'monthly') return '📅'
    return '🎯'
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '40px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: 0 }}>💳 Pagamento PIX</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>

        {!pixCode ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#f0f5ff', borderRadius: '15px', padding: '30px', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                {getPlanIcon()}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                {getPlanLabel()}
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#667eea' }}>
                R$ {amount.toFixed(2)}
              </div>
              {plan === 'all_bidders' && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#555', background: '#fff', borderRadius: '10px', padding: '12px' }}>
                  Apos o pagamento, todos os participantes que deram lance poderao conversar com voce no chat.
                </div>
              )}
            </div>
            <div style={{ background: '#fff3e0', borderRadius: '10px', padding: '15px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: '#f57c00', fontWeight: 'bold' }}>🧪 MODO SIMULACAO</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Aprovacao automatica para testes</div>
            </div>
            <button
              onClick={createPayment}
              disabled={loading}
              style={{ width: '100%', padding: '20px', background: loading ? '#ccc' : '#667eea', color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Gerando PIX...' : '🔑 GERAR PIX'}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#f0f5ff', borderRadius: '15px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#667eea' }}>
                ✅ PIX Gerado! (Simulacao)
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                <div style={{ width: '200px', height: '200px', background: '#f0f0f0', margin: '0 auto', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>📱</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>QR Code simulado</div>
              </div>
              <div style={{ background: 'white', borderRadius: '10px', padding: '15px', marginBottom: '15px', wordBreak: 'break-all', fontSize: '11px', fontFamily: 'monospace', color: '#333', maxHeight: '100px', overflowY: 'auto' }}>
                {pixCode}
              </div>
              <button
                onClick={copyPixCode}
                style={{ width: '100%', padding: '15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}
              >
                📋 COPIAR CODIGO PIX
              </button>
            </div>
            {paymentProcessing && (
              <div style={{ background: '#e8f5e9', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#4CAF50' }}>
                  ⏱ Processando pagamento...
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Aguarde 5 segundos</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentModal
