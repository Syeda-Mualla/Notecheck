import { createClient } from '@supabase/supabase-js'
let client: ReturnType<typeof createClient> | undefined
export function authClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 if(!url||!key)throw Error('Connect Supabase first. Follow SETUP.md to configure Google sign-in and saved profiles.')
 return client??=createClient(url,key,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}})
}
