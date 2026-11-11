import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { navigation } from '../../config/navigation.ts'
import { authGuardDecision, guestGuardDecision } from '../../app/route-guards.ts'
import {
  navigationForProfile,
  profileIsComplete,
  profileRouteDecision,
  rememberEntryNotice,
  rememberProfileNotice,
  takeEntryNotice,
  takeProfileNotice,
  userIdentity,
} from './profile-completion.ts'

describe('identificación del usuario', () => {
  it('muestra nombre, apellido y roles, sin inventar un nombre pendiente', () => {
    assert.deepEqual(
      userIdentity({ firstName: 'Ana', lastName: 'Mejía', roles: ['SPECIALIST', 'VALIDATOR'] }),
      {
        name: 'Ana Mejía',
        initials: 'AM',
        roleLine: 'Especialista técnico, Especialista validador',
        pending: false,
      },
    )
    const pending = userIdentity({ firstName: null, lastName: ' ', roles: [] })
    assert.equal(pending.name, 'Perfil pendiente')
    assert.equal(pending.pending, true)
    assert.equal(pending.name.includes('@'), false)
  })
})

describe('perfil incompleto', () => {
  it('exige nombre y apellido, y deja el teléfono fuera de la restricción', () => {
    assert.equal(profileIsComplete({ firstName: 'Ana', lastName: 'Mejía' }), true)
    assert.equal(profileIsComplete({ firstName: 'Ana', lastName: null }), false)
    assert.equal(profileIsComplete({ firstName: '  ', lastName: 'Mejía' }), false)
  })

  it('deja Mi perfil y el cierre de sesión, y aparta el resto hasta completar el nombre', () => {
    const visible = navigationForProfile(navigation, false).map((item) => item.label)
    assert.deepEqual(visible, ['Mi perfil'])
    assert.deepEqual(navigationForProfile(navigation, true).map((item) => item.label), navigation.map((item) => item.label))
    assert.equal(profileRouteDecision('ready', false, '/app'), 'profile')
    assert.equal(profileRouteDecision('ready', false, '/app/users'), 'profile')
    assert.equal(profileRouteDecision('ready', false, '/app/profile'), 'allow')
    assert.equal(profileRouteDecision('ready', true, '/app'), 'allow')
    assert.equal(profileRouteDecision('loading', false, '/app'), 'allow')
    assert.equal(profileRouteDecision('error', false, '/app/users'), 'allow')
  })

  it('no altera el login ni el logout', () => {
    assert.equal(profileRouteDecision('ready', false, '/login'), 'allow')
    assert.equal(authGuardDecision('authenticated', '/app').type, 'allow')
    assert.equal(guestGuardDecision('unauthenticated', '/app').type, 'allow')
    assert.equal(guestGuardDecision('authenticated', '/app').type, 'redirect')
  })

  it('conserva el aviso de perfil para reintentar sin repetir el desafío', () => {
    rememberProfileNotice('Guarde sus datos personales.')
    rememberEntryNotice('Su cuenta quedó activada.')
    assert.equal(takeProfileNotice(), 'Guarde sus datos personales.')
    assert.equal(takeProfileNotice(), null)
    assert.equal(takeEntryNotice(), 'Su cuenta quedó activada.')
    assert.equal(takeEntryNotice(), null)
  })
})
