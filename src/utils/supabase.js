import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabaseAnonKey = process.env.VUE_APP_SUPABASE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 環境變數未設定！')
  console.error('請確保 .env 中有以下變數：')
  console.error('  - VUE_APP_SUPABASE_URL')
  console.error('  - VUE_APP_SUPABASE_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
