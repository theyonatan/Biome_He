import { SETTINGS_CONTROL_BASE, SETTINGS_LABEL_BASE, SETTINGS_MUTED_TEXT, SETTINGS_OUTLINE_HOVER } from '../../styles'
import { useUISound } from '../../hooks/useUISound'

type SettingsCheckboxProps = {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

const SettingsCheckbox = ({ label, description, checked, onChange }: SettingsCheckboxProps) => {
  const { playHover, playClick } = useUISound()

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-[2cqh]">
        <span className={`${SETTINGS_LABEL_BASE} text-text-primary w-[25cqh] text-right shrink-0`}>{label}</span>
        <button
          type="button"
          className={`w-[3.2cqh] h-[3.2cqh] shrink-0 flex items-center justify-center cursor-pointer ${SETTINGS_CONTROL_BASE} ${SETTINGS_OUTLINE_HOVER}`}
          onMouseEnter={playHover}
          onClick={() => {
            playClick()
            onChange(!checked)
          }}
        >
          {checked && (
            <svg viewBox="0 0 16 16" fill="none" className="w-[2cqh] h-[2cqh]">
              <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
            </svg>
          )}
        </button>
      </div>
      {description && (
        <p className={`${SETTINGS_MUTED_TEXT} text-left m-0 mt-[0.4cqh] text-[1.8cqh] opacity-70 pl-[27cqh]`}>
          {description}
        </p>
      )}
    </div>
  )
}

export default SettingsCheckbox
