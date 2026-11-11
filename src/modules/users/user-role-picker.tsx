import { useId } from 'react'
import { roles, type Role } from '@/modules/access/roles.ts'
import { roleLabel } from '@/modules/home/dashboard-content.ts'
import { roleClass } from '@/modules/users/user-directory.ts'

type UserRolePickerProps = {
  legend: string
  value: readonly Role[]
  describedBy?: string
  invalid?: boolean
  onChange: (roles: Role[]) => void
}

export function UserRolePicker({ legend, value, describedBy, invalid, onChange }: UserRolePickerProps) {
  const baseId = useId()
  function toggle(role: Role, checked: boolean) {
    const next = checked ? [...value, role] : value.filter((item) => item !== role)
    onChange(roles.filter((item) => next.includes(item)))
  }

  return (
    <fieldset aria-describedby={describedBy} aria-invalid={invalid || undefined}>
      <legend className="text-sm font-semibold text-foreground">{legend}</legend>
      <div className="mt-2 grid gap-2">
        {roles.map((role) => {
          const id = `${baseId}-${role}`
          const checked = value.includes(role)
          return (
            <label
              key={role}
              htmlFor={id}
              className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-3 ${roleClass(role) ?? 'border-border text-foreground'}`}
            >
              <input
                id={id}
                type="checkbox"
                className="size-4 accent-energy"
                checked={checked}
                onChange={(event) => toggle(role, event.target.checked)}
              />
              <span className="text-sm font-semibold">{roleLabel(role)}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
