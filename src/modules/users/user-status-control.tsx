import { useState } from 'react'
import { statusFailure } from '@/modules/users/user-administration.ts'
import type { UserAccount, UserAccountDetail } from '@/modules/users/user-contract.ts'
import { UserDialog } from '@/modules/users/user-dialog.tsx'
import { updateUserStatus } from '@/modules/users/users-api.ts'
import { isAbortError, toApiError } from '@/shared/lib/api-error.ts'
import { Alert } from '@/shared/components/ui/alert.tsx'
import { Button } from '@/shared/components/ui/button.tsx'

type UserStatusControlProps = {
  user: Pick<UserAccount, 'id' | 'enabled' | 'email'>
  onUpdated: (user: UserAccountDetail) => void
}

export function UserStatusControl({ user, onUpdated }: UserStatusControlProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null)
  const enabling = !user.enabled

  async function confirm() {
    if (pending) return
    setNotice(null)
    setPending(true)
    const controller = new AbortController()
    try {
      const updated = await updateUserStatus(user.id, enabling, controller.signal)
      setOpen(false)
      onUpdated(updated)
    } catch (cause) {
      if (controller.signal.aborted || isAbortError(cause)) return
      setNotice(statusFailure(toApiError(cause)))
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }

  return (
    <>
      <Button type="button" variant={enabling ? 'secondary' : 'destructive'} size="sm" onClick={() => setOpen(true)}>
        {enabling ? 'Reactivar' : 'Desactivar'}
      </Button>
      {open ? (
        <UserDialog
          title={enabling ? 'Reactivar cuenta' : 'Desactivar cuenta'}
          description={
            enabling
              ? `${accountLabel(user)} podrá ingresar de nuevo a EnerCol.`
              : `${accountLabel(user)} dejará de poder ingresar a EnerCol. La cuenta se conserva y puede reactivarse.`
          }
          busy={pending}
          onClose={() => {
            if (!pending) setOpen(false)
          }}
        >
          {notice ? (
            <Alert tone="error" title={notice.title}>
              {notice.message}
            </Alert>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" disabled={pending} onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant={enabling ? 'primary' : 'destructive'}
              loading={pending}
              onClick={() => void confirm()}
            >
              {pending ? 'Actualizando estado' : enabling ? 'Reactivar cuenta' : 'Desactivar cuenta'}
            </Button>
          </div>
        </UserDialog>
      ) : null}
    </>
  )
}

function accountLabel(user: Pick<UserAccount, 'email'>) {
  return user.email ? `La cuenta ${user.email}` : 'Esta cuenta'
}
