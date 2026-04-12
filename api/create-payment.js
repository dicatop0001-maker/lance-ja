const mercadopago = require('mercadopago');

mercadopago.configure({
  access_token: process.env.VITE_MERCADOPAGO_ACCESS_TOKEN
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, description, user_email } = req.body;

  try {
    const payment = await mercadopago.payment.create({
      transaction_amount: amount,
      description: description,
      payment_method_id: 'pix',
      payer: {
        email: user_email
      }
    });

    res.status(200).json({
      success: true,
      payment_id: payment.body.id,
      pix_code: payment.body.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: payment.body.point_of_interaction.transaction_data.qr_code_base64
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
