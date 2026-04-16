import  { useState } from 'react'
import { supabase } from './supabaseClient'

function PaymentModal({ user, auction, amount, plan, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [pixCode, setPixCode] = useState('')
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  const createPayment = async () => {
    setLoading(true)
    
    // SIMULAÃ‡ÃƒO - Gerar PIX fake
    setTimeout(() => {
      const fakePixCode = '00020126580014br.gov.bcb.pix0136' + Math.random().toString(36).substring(7) + '52040000530398654040' + amount.toFixed(2) + '5802BR5925LANCE JA LEILOES6014PONTA GROSSA62070503***63041D3A'
      
      setPixCode(fakePixCode)
      setLoading(false)
      setPaymentProcessing(true)
      
      // Simular aprovaÃ§Ã£o apÃ³s 5 segundos
      setTimeout(() => {
        processPayment()
      }, 5000)
    }, 2000)
  }

  const processPayment = async () => {
    try {
      if (plan === 'single') {
        // Registrar desbloqueio Ãºnico
        const { error } = await supabase.from('contact_unlocks').insert({
          user_id: user.id,
          auction_id: auction.id,
          payment_status: 'paid',
          amount: amount,
          paid_at: new Date().toISOString()
        })
        
        if (error) throw error
      } else {
        // Registrar assinatura
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
      
      alert('âœ… Pagamento confirmado! Chat desbloqueado!')
      onSuccess()
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao processar: ' + error.message)
    }
  }

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode)
    alert('âœ… CÃ³digo PIX copiado!\n\nâš ï¸ MODO SIMULAÃ‡ÃƒO:\nO pagamento serÃ¡ aprovado automaticamente em 5 segundos.')
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '40px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: 0 }}>ðŸ’³ Pagamento PIX</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>âœ•</button>
        </div>

        {!pixCode ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#f0f5ff', borderRadius: '15px', padding: '30px', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                {plan === 'single' ? 'ðŸ’°' : plan === 'monthly' ? 'ðŸ“…' : 'ðŸŽ¯'}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                {plan === 'single' ? 'Pagamento Ãºnico' : plan === 'monthly' ? 'Assinatura Mensal' : 'Assinatura Anual'}
              </div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#667eea' }}>
                R$ {amount.toFixed(2)}
              </div>
            </div>

            <div style={{ background: '#fff3e0', borderRadius: '10px', padding: '15px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: '#f57c00', fontWeight: 'bold' }}>ðŸ§ª MODO SIMULAÃ‡ÃƒO</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>AprovaÃ§Ã£o automÃ¡tica para testes</div>
            </div>

            <button onClick={createPayment} disabled={loading} style={{ width: '100%', padding: '20px', background: loading ? '#ccc' : '#667eea', color: 'white', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Gerando PIX...' : 'ðŸ”‘ GERAR PIX'}
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#f0f5ff', borderRadius: '15px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#667eea' }}>
                âœ… PIX Gerado! (SimulaÃ§Ã£o)
              </div>
              
              <div style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
                <div style={{ width: '200px', height: '200px', background: '#f0f0f0', margin: '0 auto', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>ðŸ“±</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>QR Code simulado</div>
              </div>

              <div style={{ background: 'white', borderRadius: '10px', padding: '15px', marginBottom: '15px', wordBreak: 'break-all', fontSize: '11px', fontFamily: 'monospace', color: '#333', maxHeight: '100px', overflowY: 'auto' }}>
                {pixCode}
              </div>

              <button onClick={copyPixCode} style={{ width: '100%', padding: '15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
                ðŸ“‹ COPIAR CÃ“DIGO PIX
              </button>
            </div>

            {paymentProcessing && (
              <div style={{ background: '#e8f5e9', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#4CAF50' }}>
                  â±ï¸ Processando pagamento...
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
