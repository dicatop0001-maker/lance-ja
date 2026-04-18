// API de upload de fotos - ES Module (compatível com "type":"module" no package.json)
const BUCKET = 'auction-photos'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://pgipuwtgxksypyhdfuex.supabase.co'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY

  if (!serviceKey) {
    return res.status(500).json({
      error: 'SUPABASE_SERVICE_ROLE_KEY nao configurada. Acesse Vercel > Settings > Environment Variables e adicione a Service Role Key do Supabase (encontrada em Project Settings > API no painel do Supabase).'
    })
  }

  const { fileName, fileType, fileData } = req.body || {}
  if (!fileName || !fileType || !fileData) {
    return res.status(400).json({ error: 'fileName, fileType e fileData sao obrigatorios' })
  }

  try {
    // Criar bucket se nao existir (ignora erro se ja existe)
    await fetch(SUPABASE_URL + '/storage/v1/bucket', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + serviceKey,
        'apikey': serviceKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true })
    })

    // Converter base64 para Buffer
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload via REST API do Supabase Storage
    const uploadResp = await fetch(
      SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + fileName,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + serviceKey,
          'apikey': serviceKey,
          'Content-Type': fileType,
          'x-upsert': 'true'
        },
        body: buffer
      }
    )

    const respText = await uploadResp.text()
    if (!uploadResp.ok) {
      return res.status(500).json({ error: 'Upload falhou (' + uploadResp.status + '): ' + respText })
    }

    const publicUrl = SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + fileName
    return res.status(200).json({ url: publicUrl })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
