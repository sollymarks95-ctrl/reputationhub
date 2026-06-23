'use client'
import { useEffect } from 'react'

export default function LinkBuildingPage() {
  useEffect(() => {
    // Navigate to aliya-admin with hash to trigger tab switch
    window.location.href = '/aliya-admin#linkbuilding'
  }, [])
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'Inter,sans-serif',background:'#111',color:'#fff',fontSize:14}}>
      Loading Link Building Hub...
    </div>
  )
}
