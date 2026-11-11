import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  accountStatusLabel,
  canAdvance,
  currentCursor,
  directoryParams,
  initialCursorSession,
  moveCursor,
  userPrimaryLabel,
} from './user-directory.ts'

const base = {
  email: 'ana@enercol.example',
  firstName: 'Ana',
  lastName: 'Mejía',
  profileCompleted: true,
}

describe('directorio de usuarios', () => {
  it('usa el correo cuando el perfil está pendiente', () => {
    assert.equal(userPrimaryLabel({ ...base, profileCompleted: false }), 'ana@enercol.example')
    assert.equal(userPrimaryLabel({ ...base, profileCompleted: true }), 'Ana Mejía')
    assert.equal(
      userPrimaryLabel({ email: null, firstName: null, lastName: null, profileCompleted: false }),
      'Sin correo',
    )
  })

  it('conserva un estado de Cognito que no está traducido', () => {
    assert.equal(accountStatusLabel('CONFIRMED'), 'Confirmada')
    assert.equal(accountStatusLabel('FORCE_CHANGE_PASSWORD'), 'Cambio de contraseña')
    assert.equal(accountStatusLabel('RESET_REQUIRED'), 'Restablecimiento requerido')
    assert.equal(accountStatusLabel('CUSTOM_STATUS'), 'CUSTOM_STATUS')
    assert.equal(accountStatusLabel(null), 'Sin estado')
  })

  it('envía el cursor tal como se recibió y omite filtros vacíos', () => {
    const token = 'opaque token/value'
    assert.deepEqual(directoryParams({ search: '  Ana@ ', status: '', role: '' }, null), {
      pageSize: 20,
      search: 'Ana@',
    })
    assert.deepEqual(directoryParams({ search: '', status: 'CONFIRMED', role: 'VALIDATOR' }, token), {
      pageSize: 20,
      nextToken: token,
      status: 'CONFIRMED',
      role: 'VALIDATOR',
    })
  })

  it('avanza y regresa con el historial de cursores', () => {
    const first = initialCursorSession()
    const second = moveCursor(first, 'next', 'page-2')
    assert.ok(second)
    assert.equal(currentCursor(second), 'page-2')
    const back = moveCursor(second, 'previous', 'ignored')
    assert.deepEqual(back, { cursors: [null, 'page-2'], index: 0 })
    const forward = moveCursor(back!, 'next', null)
    assert.equal(forward && currentCursor(forward), 'page-2')
    assert.equal(canAdvance(second, null), false)
    assert.equal(moveCursor(first, 'previous', null), null)
  })
})
