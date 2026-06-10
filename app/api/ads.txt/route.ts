import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET() {
  return new NextResponse(
    'google.com, pub-7010447785244398, DIRECT, f08c47fec0942fa0\n',
    { headers: { 'Content-Type': 'text/plain' } }
  )
}
