import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
function getSb() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '') }
const CORS = { 'Access-Control-Allow-Origin': '*' }
export async function GET() {
  const sb = getSb()
  const { data } = await getSb().from('verivex_companies').select('*').order('is_featured', { ascending: false }).order('name')
  return NextResponse.json({ companies: data || [] }, { headers: CORS })
}
