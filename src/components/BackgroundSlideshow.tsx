import { useEffect, useState, type CSSProperties } from 'react'
import { PARALLAX_ENABLED } from '../constants'

type BackgroundSlideshowProps = {
  videos: string[]
  currentIndex: number
  nextIndex: number
  blurPx: number
  isTransitioning: boolean
  transitionKey: number
  onTransitionComplete: () => void
}

const BackgroundSlideshow = ({
  videos,
  currentIndex,
  nextIndex,
  blurPx,
  isTransitioning,
  transitionKey,
  onTransitionComplete
}: BackgroundSlideshowProps) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!PARALLAX_ENABLED) return

    const handleMouseMove = (event: MouseEvent) => {
      const centerX = window.innerWidth * 0.5
      const centerY = window.innerHeight * 0.5
      // Smaller range than portal parallax to keep background subtle.
      const x = ((event.clientX - centerX) / centerX) * 2.4
      const y = ((event.clientY - centerY) / centerY) * 2
      setOffset({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const backgroundStyle: CSSProperties = {
    ['--app-background-blur' as string]: `${blurPx}px`,
    ['--bg-parallax-x' as string]: `${offset.x}px`,
    ['--bg-parallax-y' as string]: `${offset.y}px`
  }

  const currentVideo = videos[currentIndex]
  const nextVideo = videos[nextIndex]

  return (
    <div className="absolute inset-0 overflow-hidden -z-10 bg-darkest" style={backgroundStyle} aria-hidden="true">
      {currentVideo && (
        <div key={`current-${currentIndex}`} className="app-background-slide active">
          <video src={currentVideo} autoPlay loop muted playsInline />
        </div>
      )}
      {nextVideo && (
        <div
          key={`transition-${transitionKey}`}
          className={isTransitioning ? 'app-background-transition-slide' : 'app-background-slide'}
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget) return
            if (event.animationName === 'portalBgReveal') {
              onTransitionComplete()
            }
          }}
        >
          <video src={nextVideo} autoPlay loop muted playsInline />
        </div>
      )}
      <div className="app-background-scrim" />
    </div>
  )
}

export default BackgroundSlideshow
