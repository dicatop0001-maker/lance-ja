import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pgipuwtgxksypyhdfuex.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnaXB1d3RneGtzeXB5aGRmdWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2OTI5ODQsImV4cCI6MjA5MTI2ODk4NH0.k_rNmFlHTIdBUEMOV4PDrIi-VAN1639Ak0avJksQT5s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)