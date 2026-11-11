import { roleLabel } from '@/modules/home/dashboard-content.ts'
import { accountStatusLabel, profileLabel, roleClass } from '@/modules/users/user-directory.ts'
import type { UserAccount } from '@/modules/users/user-contract.ts'
import { Badge } from '@/shared/components/ui/badge.tsx'

export function RoleBadges({ roles }: { roles: UserAccount['roles'] }) {
  if (roles.length === 0) {
    return <span className="text-sm text-muted">Sin rol</span>
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <li key={role}>
          <Badge className={roleClass(role)}>{roleLabel(role)}</Badge>
        </li>
      ))}
    </ul>
  )
}

export function AccountState({ user }: { user: Pick<UserAccount, 'accountStatus' | 'enabled'> }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge>{accountStatusLabel(user.accountStatus)}</Badge>
      {user.enabled ? null : <Badge tone="danger">Deshabilitada</Badge>}
    </div>
  )
}

export function ProfileState({ completed }: { completed: boolean }) {
  return <span className="text-sm text-foreground">{profileLabel(completed)}</span>
}
