import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ApiError } from '../../shared/lib/api-error.ts'
import {
  accountFromDetail,
  inviteFailure,
  inviteUserSchema,
  replaceDirectoryUser,
  statusFailure,
  userUpdateBody,
} from './user-administration.ts'
import type { UserAccount, UserAccountDetail, UserDirectoryResponse } from './user-contract.ts'

const current: Pick<UserAccount, 'firstName' | 'lastName' | 'phoneNumber' | 'roles' | 'profileCompleted'> = {
  firstName: 'Ana',
  lastName: 'Mejía',
  phoneNumber: '+573001112233',
  roles: ['SPECIALIST'],
  profileCompleted: true,
}

describe('administración de usuarios', () => {
  it('valida el correo y exige al menos un rol para invitar', () => {
    assert.equal(inviteUserSchema.safeParse({ email: 'ana@enercol.example', roles: ['VALIDATOR'] }).success, true)
    const email = inviteUserSchema.safeParse({ email: 'correo', roles: ['SPECIALIST'] })
    const roles = inviteUserSchema.safeParse({ email: 'ana@enercol.example', roles: [] })
    assert.equal(email.success, false)
    assert.equal(roles.success, false)
  })

  it('envía solo los campos personales y los roles que cambiaron', () => {
    const result = userUpdateBody(current, {
      firstName: 'Ana',
      lastName: 'Mejía',
      phoneNumber: '+573001112244',
      roles: ['ADMINISTRATOR', 'SPECIALIST'],
    })
    assert.deepEqual(result, {
      ok: true,
      body: { phoneNumber: '+573001112244', roles: ['ADMINISTRATOR', 'SPECIALIST'] },
    })
  })

  it('rechaza un nombre con un carácter de control', () => {
    const result = userUpdateBody(current, {
      firstName: 'A\u0001na',
      lastName: 'Mejía',
      phoneNumber: '+573001112233',
      roles: ['SPECIALIST'],
    })
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.field, 'firstName')
  })

  it('no envía un cuerpo vacío ni campos sin cambios', () => {
    const result = userUpdateBody(current, {
      firstName: ' Ana ',
      lastName: 'Mejía',
      phoneNumber: '+573001112233',
      roles: ['SPECIALIST'],
    })
    assert.deepEqual(result, { ok: false, field: 'form', message: 'No hay cambios para guardar.' })
  })

  it('exige el perfil completo cuando la cuenta todavía no lo tiene', () => {
    const pending = { ...current, firstName: null, lastName: null, phoneNumber: null, profileCompleted: false }
    const partial = userUpdateBody(pending, {
      firstName: 'Ana',
      lastName: '',
      phoneNumber: '',
      roles: ['SPECIALIST'],
    })
    assert.equal(partial.ok, false)
    if (!partial.ok) assert.equal(partial.message, 'Para crear el perfil se requieren nombre, apellido y teléfono.')

    const complete = userUpdateBody(pending, {
      firstName: 'Ana',
      lastName: 'Mejía',
      phoneNumber: '+573001112233',
      roles: ['SPECIALIST'],
    })
    assert.deepEqual(complete, {
      ok: true,
      body: { firstName: 'Ana', lastName: 'Mejía', phoneNumber: '+573001112233' },
    })
  })

  it('conserva el cambio de roles sin enviar datos personales vacíos', () => {
    const pending = { ...current, firstName: null, lastName: null, phoneNumber: null, profileCompleted: false }
    const result = userUpdateBody(pending, {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      roles: ['VALIDATOR'],
    })
    assert.deepEqual(result, { ok: true, body: { roles: ['VALIDATOR'] } })
  })

  it('traduce los errores de invitación y de estado', () => {
    assert.equal(inviteFailure(new ApiError('Ya existe un usuario con ese correo', 409)).field, 'email')
    assert.equal(inviteFailure(new ApiError('No fue posible crear la invitación', 503)).title, 'Invitación no disponible')
    assert.equal(
      statusFailure(new ApiError('No puede deshabilitar su propia cuenta', 403)).title,
      'Acción no permitida',
    )
  })

  it('reemplaza la cuenta del directorio sin conservar grupos internos', () => {
    const page: UserDirectoryResponse = {
      nextToken: 'cursor',
      users: [account('ana'), account('luis')],
    }
    const detail: UserAccountDetail = { ...account('ana'), enabled: false, groups: ['specialist'] }
    const next = replaceDirectoryUser(page, detail)
    assert.equal(next.users[0]?.enabled, false)
    assert.equal(next.users[1]?.id, 'luis')
    assert.equal(next.nextToken, 'cursor')
    assert.equal('groups' in accountFromDetail(detail), false)
  })
})

function account(id: string): UserAccount {
  return {
    id,
    email: `${id}@enercol.example`,
    firstName: 'Ana',
    lastName: 'Mejía',
    phoneNumber: '+573001112233',
    roles: ['SPECIALIST'],
    accountStatus: 'CONFIRMED',
    enabled: true,
    profileCompleted: true,
    invitationStatus: 'ACCEPTED',
    createdAt: '2026-11-01T00:00:00.000Z',
    lastModifiedAt: '2026-11-02T00:00:00.000Z',
  }
}
