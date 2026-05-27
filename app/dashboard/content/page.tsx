'use client'
import TopBar from '@/components/TopBar'

export default function Page() {
  return (
    <div>
      <TopBar title="Content" subtitle="Coming soon" />
      <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-2)', paddingTop: 80 }}>
        <p style={{ fontSize: 14 }}>Content management — building now...</p>
      </div>
    </div>
  )
}
