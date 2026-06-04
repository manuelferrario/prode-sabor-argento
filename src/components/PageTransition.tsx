'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="page-enter flex flex-col flex-1 min-h-screen">
      {children}
    </div>
  )
}
