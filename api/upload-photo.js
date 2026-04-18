const { createClient } = require('@supabase/supabase-js')

const BUCKET = 'auction-photos'

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Tentar diferentes nomes de variável de ambiente para a service role key
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SECRET_KEY

    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      'https://pgipuwtgxksypyhdfuex.supabase.co'

    if (!serviceKey) {
      return res.status(500).json({
        error: 'Configure a variável SUPABASE_SERVICE_ROLE_KEY no painel do Vercel com a service role key do Supabase.'
      })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    })

    // Garantir que o bucket existe e é público
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets()
    if (!listErr) {
      const exists = buckets?.some(b => b.name === BUCKET)
      if (!exists) {
        await supabase.storage.createBucket(BUCKET, {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 10485760
        })
      }
    }

    const { fileName, fileType, fileData } = req.body
    if (!fileName || !fileType || !fileData) {
      return res.status(400).json({ error: 'fileName, fileType e fileData são obrigatórios' })
    }

    // Converter base64 para Buffer
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, { contentType: fileType, upsert: true })

    if (uploadError) {
      return res.status(500).json({ error: 'Upload falhou: ' + uploadError.message })
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    return res.status(200).json({ url: urlData.publicUrl })

  } catch (err) {
    return res.status(500).json({ error: 'Erro interno: ' + err.message })
  }
}
