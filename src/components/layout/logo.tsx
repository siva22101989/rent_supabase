'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { GrainFlowLogo } from '@/components/layout/grain-flow-logo'

export function Logo() {
  const pathname = usePathname()
  const router = useRouter()
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // If already on dashboard, scroll to top smoothly
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    // Replace history (don't add to stack) - prevents back button navigation
    router.replace('/')
  }
  
  return (
    <Link 
      href="/" 
      onClick={handleClick}
      className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer" 
      aria-label="Back to dashboard"
    >
      <div className="bg-white p-1 rounded-full border border-border shadow-sm">
        <GrainFlowLogo className="h-8 w-8" />
      </div>
      <span className="font-headline font-bold text-xl text-primary hidden sm:inline tracking-tight">Grain Flow</span>
    </Link>
  )
}
