'use client'

import { usePathname } from 'next/navigation'
import { ReactNode, useState, useEffect, useRef } from 'react'
import { ChimiLoader } from './ChimiLoader'

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [showLoader, setShowLoader] = useState(false)
  const [loaderKey, setLoaderKey] = useState(0)
  const prevPathRef = useRef<string | null>(null)

  useEffect(() => {
    // No mostrar en la carga inicial
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname
      return
    }
    // Mostrar el loader solo cuando cambia la ruta
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname
      setLoaderKey(k => k + 1)
      setShowLoader(true)
      // El CSS del overlay dura 800ms — lo desmontamos un poco después
      const t = setTimeout(() => setShowLoader(false), 850)
      return () => clearTimeout(t)
    }
  }, [pathname])

  return (
    <>
      {showLoader && <ChimiLoader key={loaderKey} />}
      <div key={pathname} className="page-enter flex flex-col flex-1 min-h-screen">
        {children}
      </div>
    </>
  )
}
