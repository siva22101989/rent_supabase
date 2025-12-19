'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Package } from 'lucide-react'

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
      <div className="bg-primary text-primary-foreground p-2 rounded-lg">
        <Package size={24} />
      </div>
      <span className="font-headline font-semibold text-xl text-primary">BagBill</span>
    </Link>
  )
}
