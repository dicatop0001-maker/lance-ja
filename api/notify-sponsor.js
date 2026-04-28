export default async function handler(req, res) {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' })
              }

                const { sponsorName, sponsorEmail, city, slot, planType, planPrice } = req.body || {}

                  const RESEND_KEY = process.env.RESEND_API_KEY
                    const OWNER_EMAIL = 'dicatop0001@gmail.com'
                      const WHATS_NUMBER = '5542988880353'

                        const slotLabel = ['L1','L2','L3','R1','R2','R3'][slot - 1] || slot
                          const planLabel = planType === 'monthly' ? 'Mensal R$ 50,00' : 'Anual R$ 400,00'

                            const whatsLink = `https://wa.me/${WHATS_NUMBER}?text=${encodeURIComponent(
                                `Ola! Sou ${sponsorName} (${sponsorEmail}). Acabo de me cadastrar como patrocinador no Lance Ja - Cidade: ${city}, Slot: ${slotLabel}, Plano: ${planLabel}. Segue meu comprovante de pagamento.`
                                  )}`

                                    const emailHtml = `
                                        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc;border-radius:12px;">
                                              <h2 style="color:#1e3a8a;margin-bottom:16px;">🎯 Novo Patrocinador Reservou um Slot! - Lance Ja</h2>
                                                    <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;">
                                                            <tr><td style="padding:10px 16px;background:#eff6ff;font-weight:bold;width:40%;">Nome do Negocio</td><td style="padding:10px 16px;">${sponsorName}</td></tr>
                                                                    <tr><td style="padding:10px 16px;background:#eff6ff;font-weight:bold;">E-mail</td><td style="padding:10px 16px;">${sponsorEmail}</td></tr>
                                                                            <tr><td style="padding:10px 16px;background:#eff6ff;font-weight:bold;">Cidade/Regiao</td><td style="padding:10px 16px;">${city}</td></tr>
                                                                                    <tr><td style="padding:10px 16px;background:#eff6ff;font-weight:bold;">Slot</td><td style="padding:10px 16px;">${slotLabel}</td></tr>
                                                                                            <tr><td style="padding:10px 16px;background:#eff6ff;font-weight:bold;">Plano</td><td style="padding:10px 16px;">${planLabel}</td></tr>
                                                                                                    <tr><td style="padding:10px 16px;background:#eff6ff;font-weight:bold;">Status</td><td style="padding:10px 16px;color:#d97706;font-weight:bold;">🟡 RESERVADO - Aguardando comprovante</td></tr>
                                                                                                          </table>
                                                                                                                <div style="margin-top:20px;padding:14px;background:#fff7ed;border-radius:8px;border:2px solid #f97316;">
                                                                                                                        <p style="margin:0 0 8px 0;color:#374151;font-size:14px;">
                                                                                                                                  <strong>Acao necessaria:</strong> O patrocinador foi orientado a enviar o comprovante de pagamento via WhatsApp 
                                                                                                                                            para o numero <strong>(42) 98888-0353</strong>.
                                                                                                                                                    </p>
                                                                                                                                                            <p style="margin:0;color:#374151;font-size:14px;">
                                                                                                                                                                      Apos confirmar o pagamento, acesse o app Lance Ja, clique no slot <strong>"Reservado"</strong> 
                                                                                                                                                                                da cidade <strong>${city}</strong>, digite seu e-mail <strong>${OWNER_EMAIL}</strong> e libere o acesso do patrocinador.
                                                                                                                                                                                        </p>
                                                                                                                                                                                              </div>
                                                                                                                                                                                                    <p style="color:#6b7280;font-size:12px;margin-top:12px;">App Lance Ja - notificacao automatica</p>
                                                                                                                                                                                                        </div>
                                                                                                                                                                                                          `

                                                                                                                                                                                                            if (!RESEND_KEY) {
                                                                                                                                                                                                                console.warn('RESEND_API_KEY not set - email not sent')
                                                                                                                                                                                                                    return res.status(200).json({ ok: true, warned: 'no_key' })
                                                                                                                                                                                                                      }

                                                                                                                                                                                                                        try {
                                                                                                                                                                                                                            const emailRes = await fetch('https://api.resend.com/emails', {
                                                                                                                                                                                                                                  method: 'POST',
                                                                                                                                                                                                                                        headers: {
                                                                                                                                                                                                                                                'Authorization': `Bearer ${RESEND_KEY}`,
                                                                                                                                                                                                                                                        'Content-Type': 'application/json'
                                                                                                                                                                                                                                                              },
                                                                                                                                                                                                                                                                    body: JSON.stringify({
                                                                                                                                                                                                                                                                            from: 'Lance Ja <noreply@lanceja.com.br>',
                                                                                                                                                                                                                                                                                    to: [OWNER_EMAIL],
                                                                                                                                                                                                                                                                                            subject: `🎯 Novo patrocinador: ${sponsorName} - ${city} slot ${slotLabel}`,
                                                                                                                                                                                                                                                                                                    html: emailHtml
                                                                                                                                                                                                                                                                                                          })
                                                                                                                                                                                                                                                                                                              })

                                                                                                                                                                                                                                                                                                                  const data = await emailRes.json()

                                                                                                                                                                                                                                                                                                                      if (!emailRes.ok) {
                                                                                                                                                                                                                                                                                                                            console.error('Resend error:', data)
                                                                                                                                                                                                                                                                                                                                  return res.status(500).json({ error: 'Email failed', details: data })
                                                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                                                          return res.status(200).json({ ok: true, emailId: data.id })
                                                                                                                                                                                                                                                                                                                                            } catch (err) {
                                                                                                                                                                                                                                                                                                                                                console.error('notify-sponsor error:', err)
                                                                                                                                                                                                                                                                                                                                                    return res.status(500).json({ error: err.message })
                                                                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                                                                      }