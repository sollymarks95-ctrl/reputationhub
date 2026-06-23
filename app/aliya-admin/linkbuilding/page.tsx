'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LinkBuildingRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/aliya-admin#linkbuilding')
  }, [router])
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter,sans-serif',color:'#111'}}>
      Redirecting to Link Building Hub...
    </div>
  )
}
