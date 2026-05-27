'use client'
import TopBar from '@/components/TopBar'

export default function Page() {
  return (
    <div>
      <TopBar title="Reviews" subtitle="Coming soon" />
      <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-2)', paddingTop: 80 }}>
        <p style={{ fontSize: 14 }}>Reviews management — building now...</p>
      </div>
    </div>
  )
}
