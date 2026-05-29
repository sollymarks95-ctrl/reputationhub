import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const CORS = { 'Access-Control-Allow-Origin': '*' }
function getDb() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL||'', process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'') }
export async function GET() {
  const { data } = await getDb().from('verivex_companies').select('*').order('is_featured', { ascending: false }).order('name')
  // Always ensure eToro is first (our client)
  const companies = (data || [])
  const etoro = companies.find((c: any) => c.slug === 'etoro')
  const rest = companies.filter((c: any) => c.slug !== 'etoro')
  return NextResponse.json({ companies: etoro ? [etoro, ...rest] : companies }, { headers: CORS })
}
