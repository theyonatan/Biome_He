import { useState, useCallback } from 'react'
import { SPARK_TUNING, SPARK_TUNING_DEFAULTS } from '../lib/portalSparksTuning'
import type { PortalSparksTuning } from '../lib/portalSparksTuning'
import { invoke } from '../bridge'

type TuningKey = keyof PortalSparksTuning

const TUNING_KEYS = Object.keys(SPARK_TUNING_DEFAULTS) as TuningKey[]

const PortalSparksConfigurator = () => {
  // Force re-render when sliders change
  const [, setTick] = useState(0)
  const rerender = useCallback(() => setTick((t) => t + 1), [])

  // Track raw text per field so intermediate strings like "0." or "-" aren't clobbered
  const [editing, setEditing] = useState<Partial<Record<TuningKey, string>>>({})

  const handleSliderChange = (key: TuningKey, value: number) => {
    SPARK_TUNING[key] = value
    setEditing((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    rerender()
  }

  const handleInputChange = (key: TuningKey, raw: string) => {
    setEditing((prev) => ({ ...prev, [key]: raw }))
    const value = parseFloat(raw)
    if (!isNaN(value)) {
      SPARK_TUNING[key] = value
    }
    rerender()
  }

  const handleInputBlur = (key: TuningKey) => {
    setEditing((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    rerender()
  }

  const handleReset = () => {
    for (const key of TUNING_KEYS) {
      SPARK_TUNING[key] = SPARK_TUNING_DEFAULTS[key]
    }
    setEditing({})
    rerender()
  }

  const handleSave = () => {
    invoke('write-spark-tuning', { ...SPARK_TUNING })
  }

  return (
    <div
      className="fixed right-0 top-0 bottom-0 z-[100] w-[320px] overflow-y-auto bg-black/80 backdrop-blur-sm p-3 text-white text-xs font-mono pointer-events-auto select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3">
        <span className="text-sm font-bold tracking-wide">Spark Tuning</span>
      </div>
      {TUNING_KEYS.map((key) => {
        const defaultVal = SPARK_TUNING_DEFAULTS[key]
        const current = SPARK_TUNING[key]
        const sliderMax = Math.abs(defaultVal) * 10 || 10
        const sliderMin = defaultVal < 0 ? -sliderMax : 0
        const step = sliderMax / 1000
        const displayValue = editing[key] ?? String(current)

        const modified = current !== defaultVal

        return (
          <div key={key} className="mb-2">
            <label className="block text-[10px] text-white/60 mb-0.5">{key}</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={step}
                value={Math.max(sliderMin, Math.min(sliderMax, current))}
                onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
                className="flex-1 h-1 accent-orange-400"
              />
              <input
                type="text"
                value={displayValue}
                onChange={(e) => handleInputChange(key, e.target.value)}
                onBlur={() => handleInputBlur(key)}
                className="w-[72px] bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-right text-[11px] text-white"
              />
              <button
                type="button"
                className={`w-4 h-4 flex items-center justify-center rounded text-[10px] leading-none ${modified ? 'bg-white/10 hover:bg-white/20 text-white/80' : 'text-white/10 pointer-events-none'}`}
                onClick={() => handleSliderChange(key, defaultVal)}
                title={`Reset to ${defaultVal}`}
              >
                x
              </button>
            </div>
          </div>
        )
      })}
      <div className="sticky bottom-0 flex justify-end gap-1 pt-2 pb-1 bg-black/80">
        <button
          type="button"
          className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[10px]"
          onClick={handleReset}
        >
          Reset
        </button>
        <button
          type="button"
          className="px-2 py-0.5 bg-orange-500/80 hover:bg-orange-500 rounded text-[10px]"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  )
}

export default PortalSparksConfigurator
