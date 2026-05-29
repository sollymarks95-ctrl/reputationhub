import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { company, website, name, email, message } = body

  const RESEND_KEY = process.env.RESEND_API_KEY
  if (RESEND_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${RESEND_KEY}` },
      body: JSON.stringify({
        from: 'verivex@verivex.co',
        to: ['sollymarks95@gmail.com'],
        subject: `New Business Inquiry: ${company}`,
        html: `<p><strong>Company:</strong> ${company}</p><p><strong>Website:</strong> ${website}</p><p><strong>Contact:</strong> ${name} — ${email}</p><p><strong>Message:</strong> ${message || 'N/A'}</p>`
      })
    })
  }

  return NextResponse.json({ success: true })
}
