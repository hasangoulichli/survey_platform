import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Uygulamanın her yerinden bu supabase değişkenini çağırarak işlem yapacağız
export const supabase = createClient(supabaseUrl, supabaseAnonKey)