import { EnergySchematic } from '@/shared/components/brand/energy-schematic.tsx'
import { LogoLockup } from '@/shared/components/brand/logo.tsx'

const domains = [
  ['01', 'Red', 'Topología y flujos del sistema'],
  ['02', 'Generación', 'Disponibilidad y entrega de energía'],
  ['03', 'Mercado', 'Señales de precio y contratos'],
] as const

export function IdentityPanel() {
  return (
    <aside
      aria-label="EnerCol"
      className="identity-surface relative flex shrink-0 flex-col border-b-2 border-cyan px-5 py-5 text-cloud sm:px-8 sm:py-6 lg:h-full lg:min-h-0 lg:overflow-hidden lg:border-r-2 lg:border-b-0 lg:px-12 lg:py-8 short:lg:px-10 short:lg:py-5 xl:px-14"
    >
      <div className="flex min-h-0 flex-1 flex-col lg:overflow-y-auto">
        <div className="flex shrink-0 items-center justify-between gap-4 lg:justify-start">
          <LogoLockup />
          <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-cyan uppercase lg:hidden">
            Sistema eléctrico
          </p>
        </div>

        <div className="mt-4 shrink-0 lg:mt-8 lg:max-w-xl short:lg:mt-5">
          <p className="hidden text-xs font-semibold tracking-[0.16em] text-cyan uppercase lg:block">
            Sistema eléctrico
          </p>
          <p className="max-w-[20ch] text-lg leading-snug font-semibold tracking-[-0.02em] text-balance sm:text-xl lg:mt-3 lg:max-w-[9em] lg:text-[2.5rem] lg:leading-[1.12] lg:tracking-[-0.03em] short:lg:text-[2rem] xl:text-[2.85rem] short:xl:text-[2rem]">
            Lectura técnica de la energía.
          </p>
          <p className="mt-3 hidden max-w-[36ch] text-base leading-relaxed text-navy-muted compact:hidden lg:block short:mt-2">
            EnerCol reúne la red, la generación y el mercado eléctrico en una superficie de análisis.
          </p>
          <ol className="mt-5 hidden border-t border-white/15 compact:hidden lg:block short:mt-4">
            {domains.map(([index, title, detail]) => (
              <li
                key={index}
                className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 border-b border-white/15 py-2.5 short:py-2"
              >
                <span className="text-sm font-semibold text-cyan tabular-nums">{index}</span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold">{title}</span>
                  <span className="mt-0.5 block text-sm leading-5 text-navy-muted compact:hidden">
                    {detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-4 hidden min-h-16 flex-1 flex-col justify-end compact:hidden lg:flex">
          <EnergySchematic />
          <p className="mt-3 flex shrink-0 items-center gap-3 text-sm text-navy-faint short:mt-2">
            <span className="h-px w-8 bg-cyan" aria-hidden="true" />
            Sector eléctrico colombiano
          </p>
        </div>
      </div>
    </aside>
  )
}
