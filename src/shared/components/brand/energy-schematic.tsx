import { cn } from '@/shared/lib/utils.ts'

type EnergySchematicProps = {
  className?: string
}

export function EnergySchematic({ className }: EnergySchematicProps) {
  return (
    <svg
      viewBox="0 0 640 210"
      preserveAspectRatio="xMidYMax meet"
      className={cn('h-full max-h-full min-h-0 w-full flex-1 font-sans text-navy-muted', className)}
      style={{ fontFamily: 'inherit' }}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.25">
        <circle cx="48" cy="96" r="26" />
        <path d="M33 96c4-9 8-9 12 0s8 9 12 0 8-9 12 0" />
        <path d="M74 96H132" />
        <path d="M132 40V168" strokeWidth="2.5" />
        <path d="M132 62H286" />
        <circle cx="286" cy="62" r="3.25" fill="currentColor" stroke="none" />
        <path d="M132 138H318" />
        <circle cx="318" cy="138" r="3.25" fill="currentColor" stroke="none" />
        <rect x="520" y="72" width="68" height="48" />
        <path d="M534 86H572" />
        <path d="M534 96H572" />
        <path d="M534 106H560" />
      </g>
      <path
        d="M132 96H520"
        className="energy-track"
        fill="none"
        stroke="var(--cyan)"
        strokeWidth="1.75"
        strokeOpacity="0.35"
      />
      <path
        d="M132 96H520"
        className="energy-circuit"
        fill="none"
        stroke="var(--cyan)"
        strokeWidth="1.75"
      />
      <circle cx="402" cy="96" r="3.5" fill="var(--cyan)" />
      <g fill="currentColor" className="text-navy-faint" style={{ fontSize: 12, fontWeight: 600 }}>
        <text x="48" y="198" textAnchor="middle">
          Generación
        </text>
        <text x="132" y="198" textAnchor="middle">
          Barra
        </text>
        <text x="554" y="198" textAnchor="middle">
          Demanda
        </text>
      </g>
    </svg>
  )
}
