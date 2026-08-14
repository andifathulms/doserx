import { useEffect, useRef, useState, ReactNode } from 'react'

/**
 * Fades a section in as it enters the viewport. Landing/about pages only —
 * see the CSS comment above .reveal in index.css for why the calculator,
 * catalog and history screens deliberately skip this.
 *
 * Renders plain (no observer, no animation) under prefers-reduced-motion,
 * rather than toggling a class that a media query would have to undo.
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [reduced, setReduced] = useState(true)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (reduced || !ref.current) return
    const node = ref.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [reduced])

  if (reduced) return <div className={className}>{children}</div>

  return (
    <div ref={ref} className={`reveal${inView ? ' reveal--in' : ''}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}
