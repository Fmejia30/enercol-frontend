import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { navigation } from '../../config/navigation.ts'
import { authorizationFromAuth } from '../access/authorization.ts'
import { visibleWhenAllowed } from '../access/permission-requirement.ts'
import { ApiError } from '../../shared/lib/api-error.ts'
import { parseOwnProfile } from '../users/user-contract.ts'
import { ownProfileBody, ownProfileReadFailure, ownProfileUpdateFailure } from './own-profile.ts'

const completed = {
  id: 'actor-1',
  email: 'ana@enercol.example',
  roles: ['SPECIALIST', 'VALIDATOR'],
  firstName: 'Ana',
  lastName: 'Mejía',
  phoneNumber: '+573001112233',
  profileCompleted: true,
}

describe('consulta del perfil personal', () => {
  it('conserva el correo, los roles y los datos personales', () => {
    assert.deepEqual(parseOwnProfile(completed), completed)
  })

  it('acepta un perfil pendiente con datos personales nulos', () => {
    const profile = parseOwnProfile({
      ...completed,
      firstName: null,
      lastName: null,
      phoneNumber: null,
      roles: ['SPECIALIST', 'DESCONOCIDO'],
      profileCompleted: false,
    })
    assert.equal(profile.profileCompleted, false)
    assert.equal(profile.firstName, null)
    assert.deepEqual(profile.roles, ['SPECIALIST'])
  })
})

describe('actualización del perfil personal', () => {
  it('envía solo el campo modificado cuando el perfil ya existe', () => {
    const result = ownProfileBody(completed, {
      firstName: 'Ana',
      lastName: 'Mejía',
      phoneNumber: '+573001112244',
    })
    assert.deepEqual(result, { ok: true, body: { phoneNumber: '+573001112244' } })
  })

  it('exige nombre y apellido, y permite crear el perfil sin teléfono', () => {
    const pending = { ...completed, firstName: null, lastName: null, phoneNumber: null, profileCompleted: false }
    const missing = ownProfileBody(pending, { firstName: 'Ana', lastName: '', phoneNumber: '' })
    assert.equal(missing.ok, false)
    if (!missing.ok) assert.equal(missing.field, 'lastName')

    const withoutPhone = ownProfileBody(pending, { firstName: 'Ana', lastName: 'Mejía', phoneNumber: '  ' })
    assert.deepEqual(withoutPhone, { ok: true, body: { firstName: 'Ana', lastName: 'Mejía' } })

    const created = ownProfileBody(pending, {
      firstName: 'Ana',
      lastName: 'Mejía',
      phoneNumber: '+573001112233',
    })
    assert.deepEqual(created, {
      ok: true,
      body: { firstName: 'Ana', lastName: 'Mejía', phoneNumber: '+573001112233' },
    })
  })

  it('rechaza un teléfono incompleto y un guardado sin cambios', () => {
    const phone = ownProfileBody(completed, {
      firstName: 'Ana',
      lastName: 'Mejía',
      phoneNumber: '123',
    })
    assert.equal(phone.ok, false)
    if (!phone.ok) assert.equal(phone.field, 'phoneNumber')

    const same = ownProfileBody(completed, {
      firstName: ' Ana ',
      lastName: 'Mejía',
      phoneNumber: '+573001112233',
    })
    assert.deepEqual(same, { ok: false, field: 'form', message: 'No hay cambios para guardar.' })
  })

  it('traduce los errores de consulta y de actualización', () => {
    assert.equal(ownProfileReadFailure(new ApiError('No fue posible conectar con el servicio. Inténtelo de nuevo.', null)).title, 'Sin conexión')
    assert.equal(
      ownProfileUpdateFailure(new ApiError('Para crear el perfil se requieren nombre, apellido y teléfono', 400)).title,
      'Datos no válidos',
    )
    assert.equal(
      ownProfileUpdateFailure(new ApiError('No fue posible actualizar el perfil', 503)).title,
      'No fue posible actualizar el perfil',
    )
  })
})

describe('acceso a Mi perfil', () => {
  it('está disponible para cualquier usuario autenticado y no exige administrar usuarios', () => {
    const item = navigation.find((entry) => entry.label === 'Mi perfil')
    assert.ok(item)
    assert.equal(item.to, '/app/profile')
    assert.equal(item.requirement, undefined)
    assert.equal(item.section, 'Cuenta')

    for (const roles of [[], ['SPECIALIST'], ['VALIDATOR'], ['SPECIALIST', 'VALIDATOR'], ['ADMINISTRATOR']]) {
      const visible = visibleWhenAllowed(navigation, identity(roles)).some((entry) => entry.label === 'Mi perfil')
      assert.equal(visible, true)
    }
    const manager = visibleWhenAllowed(navigation, identity(['SPECIALIST'])).some((entry) => entry.label === 'Usuarios')
    assert.equal(manager, false)
  })
})

function identity(roles: readonly string[]) {
  return authorizationFromAuth({
    status: 'authenticated',
    identity: { userId: 'actor-1', roles },
  })
}
