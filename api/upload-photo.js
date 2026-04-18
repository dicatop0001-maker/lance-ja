const { createClient } = require('@supabase/supabase-js')

const BUCKET = 'auction-photos'

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pgipuwtgxksypyhdfuex.supabase.co'

    if (!serviceKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' })

    const supabase = createClient(supabaseUrl, serviceKey)

    // Garantir que o bucket existe
    const { data: buckets } = await supabase.storage.listBuckets()
    const exists = buckets?.some(b => b.name === BUCKET)
    if (!exists) {
      await supabase.storage.createBucket(BUCKET, { public: true, allowedMimeTypes: ['image/*'], fileSizeLimit: 10485760 })
    }

    // Ler o body da requisição (base64)
    const { fileName, fileType, fileData } = req.body
    if (!fileName || !fileType || !fileData) {
      return res.status(400).json({ error: 'fileName, fileType e fileData são obrigatórios' })
    }

    // Converter base64 para Buffer
    const base64Data = fileData.replace(/^data:image\/[a-z]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, { contentType: fileType, upsert: false })

    if (uploadError) return res.status(500).json({ error: uploadError.message })

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    return res.status(200).json({ url: urlData.publicUrl })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
