import { useEffect, useRef, useState } from 'react'
import { useStreaming } from '../context/StreamingContext'

// QWERTY keyboard layout (simple labels) — copied verbatim from owl-tube/app/InputDisplay/constants.ts
const KEYBOARD_LAYOUT = [
  ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Win', 'Ctrl']
]

// Maps Biome's uppercase key names → keyboard layout labels
const BIOME_TO_LAYOUT: Record<string, string> = {
  SHIFT: 'Shift',
  CTRL: 'Ctrl',
  SPACE: 'Space',
  ENTER: 'Enter',
  TAB: 'Tab'
}

const KEY_PRESSED = 'bg-white text-black border-white scale-105'
const KEY_UNPRESSED = 'bg-black/50 border-white/20 text-white/40'
const KEY_BASE = 'flex items-center justify-center font-mono transition-all duration-75 border rounded-none select-none'

/** Base key unit in cqh — all key sizes are multiples of this */
const U = 4

type KeyProps = {
  label: string
  isPressed: boolean
  width?: number
}

const Key = ({ label, isPressed, width = U }: KeyProps) => (
  <div
    className={`${KEY_BASE} ${isPressed ? KEY_PRESSED : KEY_UNPRESSED}`}
    style={{ width: `${width}cqh`, height: `${U}cqh`, fontSize: `${U * 0.5}cqh` }}
  >
    <span className="truncate" style={{ padding: `0 ${U * 0.06}cqh` }}>
      {label}
    </span>
  </div>
)

type VirtualKeyboardProps = {
  pressedKeys: Set<string>
}

const VirtualKeyboard = ({ pressedKeys }: VirtualKeyboardProps) => {
  const isKeyPressed = (layoutLabel: string): boolean => {
    if (pressedKeys.has(layoutLabel)) return true
    for (const [biomeKey, label] of Object.entries(BIOME_TO_LAYOUT)) {
      if (label === layoutLabel && pressedKeys.has(biomeKey)) return true
    }
    return false
  }

  return (
    <div
      className="absolute bottom-[1.5cqh] left-[1.5cqh] z-10 pointer-events-none flex flex-col"
      style={{ gap: `${U * 0.11}cqh` }}
    >
      {KEYBOARD_LAYOUT.map((row, rowIdx) => (
        <div key={rowIdx} className="flex" style={{ gap: `${U * 0.11}cqh` }}>
          {row.map((key, colIdx) => {
            let width = U
            if (key === 'Backspace') width = U * 1.6
            else if (key === 'Tab') width = U * 1.4
            else if (key === '\\') width = U * 1.2
            else if (key === 'Caps' || key === 'Enter') width = U * 1.8
            else if (key === 'Shift') width = colIdx === 0 ? U * 2 : U * 2.4
            else if (key === 'Space') width = U * 6
            else if (key === 'Ctrl' || key === 'Alt' || key === 'Win') width = U * 1.2
            return <Key key={`${rowIdx}-${colIdx}`} label={key} isPressed={isKeyPressed(key)} width={width} />
          })}
        </div>
      ))}
    </div>
  )
}

type VirtualMouseProps = {
  mouseButtons: Set<string>
  mouseDelta: { dx: number; dy: number }
  scrollActive: { up: boolean; down: boolean }
}

const VirtualMouse = ({ mouseButtons, mouseDelta, scrollActive }: VirtualMouseProps) => {
  const isPressed = (key: string) => mouseButtons.has(key)

  const arrowScale = 0.02
  const adx = mouseDelta.dx * arrowScale
  const ady = mouseDelta.dy * arrowScale
  const arrowLength = Math.sqrt(adx * adx + ady * ady)
  const arrowAngle = Math.atan2(ady, adx) * (180 / Math.PI)

  return (
    <div
      className="absolute bottom-[1.5cqh] right-[1.5cqh] z-10 pointer-events-none flex flex-col items-center"
      style={{ gap: `${U * 0.15}cqh` }}
    >
      {/* Movement arrow */}
      <div className="relative flex items-center justify-center w-[18cqh] h-[18cqh]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-gray-800/80 w-[18cqh] h-[18cqh]" />
        </div>
        <svg width="100%" height="100%" viewBox="-50 -50 100 100" className="overflow-visible relative z-10">
          {arrowLength > 0.1 && (
            <g transform={`rotate(${arrowAngle})`}>
              <line x1="0" y1="0" x2={arrowLength} y2="0" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
              <polygon points={`${arrowLength},0 ${arrowLength - 8},-5 ${arrowLength - 8},5`} fill="#d1d5db" />
            </g>
          )}
          {arrowLength <= 0.1 && <circle cx="0" cy="0" r="3" fill="#6b7280" />}
        </svg>
      </div>

      {/* LMB / MMB / RMB row */}
      <div className="flex" style={{ gap: `${U * 0.11}cqh` }}>
        <div
          className={`${KEY_BASE} ${isPressed('MOUSE_LEFT') ? KEY_PRESSED : KEY_UNPRESSED} rounded-t-[0.6cqh] rounded-b-none`}
          style={{ width: `${U * 1.2}cqh`, height: `${U * 1.2}cqh`, fontSize: `${U * 0.5}cqh` }}
        >
          LMB
        </div>
        <div className="relative">
          <div
            className={`${KEY_BASE} ${isPressed('MOUSE_MIDDLE') ? KEY_PRESSED : KEY_UNPRESSED} rounded-t-[0.6cqh] rounded-b-none`}
            style={{ width: `${U * 1.2}cqh`, height: `${U * 1.2}cqh`, fontSize: `${U * 0.5}cqh` }}
          >
            MMB
          </div>
          {(scrollActive.up || scrollActive.down) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 20 40" className="overflow-visible">
                {scrollActive.up ? (
                  <polygon points="10,5 5,12 15,12" fill="#d1d5db" stroke="#6b7280" strokeWidth="1" />
                ) : (
                  <polygon points="10,35 5,28 15,28" fill="#d1d5db" stroke="#6b7280" strokeWidth="1" />
                )}
              </svg>
            </div>
          )}
        </div>
        <div
          className={`${KEY_BASE} ${isPressed('MOUSE_RIGHT') ? KEY_PRESSED : KEY_UNPRESSED} rounded-t-[0.6cqh] rounded-b-none`}
          style={{ width: `${U * 1.2}cqh`, height: `${U * 1.2}cqh`, fontSize: `${U * 0.5}cqh` }}
        >
          RMB
        </div>
      </div>

      {/* X1 / X2 row */}
      <div className="flex" style={{ gap: `${U * 0.11}cqh` }}>
        <Key label="X1" isPressed={isPressed('MOUSE_X1')} width={U * 1.2} />
        <Key label="X2" isPressed={isPressed('MOUSE_X2')} width={U * 1.2} />
      </div>
    </div>
  )
}

const InputOverlay = () => {
  const { inputOverlay, isStreaming, pressedKeys, mouseButtons, scrollActive } = useStreaming()

  const mouseDeltaRef = useRef({ dx: 0, dy: 0 })
  const [mouseDelta, setMouseDelta] = useState({ dx: 0, dy: 0 })
  const decayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!inputOverlay || !isStreaming) {
      if (decayTimeoutRef.current) clearTimeout(decayTimeoutRef.current)
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseDeltaRef.current.dx += e.movementX
      mouseDeltaRef.current.dy += e.movementY
      if (decayTimeoutRef.current) clearTimeout(decayTimeoutRef.current)
      decayTimeoutRef.current = setTimeout(() => {
        mouseDeltaRef.current = { dx: 0, dy: 0 }
        setMouseDelta({ dx: 0, dy: 0 })
      }, 150)
      setMouseDelta({ ...mouseDeltaRef.current })
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (decayTimeoutRef.current) clearTimeout(decayTimeoutRef.current)
    }
  }, [inputOverlay, isStreaming])

  if (!inputOverlay || !isStreaming) return null

  return (
    <>
      <VirtualKeyboard pressedKeys={pressedKeys} />
      <VirtualMouse mouseButtons={mouseButtons} mouseDelta={mouseDelta} scrollActive={scrollActive} />
    </>
  )
}

export default InputOverlay
