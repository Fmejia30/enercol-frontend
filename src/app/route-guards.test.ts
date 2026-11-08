import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { authorizationFromAuth } from '../modules/access/authorization.ts'
import { permissions } from '../modules/access/permissions.ts'
import {
  authGuardDecision,
  guestGuardDecision,
  permissionGuardDecision,
  type PermissionRequirement,
} from './route-guards.ts'
import { safeInternalPath } from './return-path.ts'

const restricted: PermissionRequirement = { permissions: ['reports:validate'], match: 'all' }

function identity(roles: readonly string[]) {
  return authorizationFromAuth({
    status: 'authenticated',
    identity: { userId: 'actor-1', roles },
  })
}

describe('usuario no autenticado en /app', () => {
  it('redirige al inicio de sesión y conserva el destino', () => {
    const decision = authGuardDecision('unauthenticated', '/app')
    assert.deepEqual(decision, { type: 'redirect', to: '/login?redirect=%2Fapp' })
  })
})

describe('usuario autenticado en /app', () => {
  it('permite el espacio de trabajo sin exigir un permiso', () => {
    assert.deepEqual(authGuardDecision('authenticated', '/app'), { type: 'allow' })
    assert.deepEqual(authGuardDecision('authenticated', '/app?panel=inicio'), { type: 'allow' })
  })
})

describe('usuario autenticado en /login', () => {
  it('sale del acceso hacia el espacio de trabajo', () => {
    assert.deepEqual(guestGuardDecision('authenticated', null), { type: 'redirect', to: '/app' })
  })
})

describe('estado loading', () => {
  it('espera la sesión y no redirige', () => {
    assert.deepEqual(authGuardDecision('loading', '/app'), { type: 'pending' })
    assert.deepEqual(guestGuardDecision('loading', '/app'), { type: 'pending' })
    assert.deepEqual(
      permissionGuardDecision(authorizationFromAuth({ status: 'loading' }), restricted, '/app/informes'),
      { type: 'pending' },
    )
  })
})

describe('usuario sin roles', () => {
  const authorization = identity([])

  it('entra al espacio de trabajo y no a una ruta con permiso', () => {
    assert.deepEqual(authGuardDecision('authenticated', '/app'), { type: 'allow' })
    assert.deepEqual(permissionGuardDecision(authorization, restricted, '/app/informes'), { type: 'deny' })
  })
})

describe('usuario técnico', () => {
  const authorization = identity(['SPECIALIST'])

  it('ejecuta análisis y no valida informes', () => {
    assert.equal(
      permissionGuardDecision(authorization, { permissions: ['analysis:execute'] }, '/app/analisis').type,
      'allow',
    )
    assert.equal(permissionGuardDecision(authorization, restricted, '/app/informes').type, 'deny')
  })
})

describe('usuario validador', () => {
  const authorization = identity(['VALIDATOR'])

  it('valida informes y no ejecuta análisis', () => {
    assert.equal(permissionGuardDecision(authorization, restricted, '/app/informes').type, 'allow')
    assert.equal(
      permissionGuardDecision(authorization, { permissions: ['analysis:execute'] }, '/app/analisis').type,
      'deny',
    )
  })
})

describe('usuario con ambos roles', () => {
  const authorization = identity(['SPECIALIST', 'VALIDATOR'])

  it('exige los dos permisos juntos y acepta cualquiera de ellos', () => {
    const both: PermissionRequirement = {
      permissions: ['analysis:execute', 'reports:validate'],
      match: 'all',
    }
    const either: PermissionRequirement = {
      permissions: ['analysis:execute', 'reports:validate'],
      match: 'any',
    }
    assert.equal(permissionGuardDecision(authorization, both, '/app/informes').type, 'allow')
    assert.equal(permissionGuardDecision(authorization, either, '/app/informes').type, 'allow')
    assert.equal(permissionGuardDecision(identity(['SPECIALIST']), both, '/app/informes').type, 'deny')
  })
})

describe('usuario administrador reconocido', () => {
  it('accede a una ruta que exige la matriz completa', () => {
    const decision = permissionGuardDecision(
      identity(['ADMINISTRATOR']),
      { permissions, match: 'all' },
      '/app/configuracion',
    )
    assert.equal(decision.type, 'allow')
    assert.equal(
      permissionGuardDecision(identity(['SPECIALIST', 'VALIDATOR']), { permissions: ['users:manage'] }, '/app/usuarios')
        .type,
      'deny',
    )
  })
})

describe('usuario sin permisos en una ruta restringida', () => {
  it('muestra acceso denegado y no lo devuelve al login', () => {
    const decision = permissionGuardDecision(identity(['SPECIALIST']), { permissions: ['users:manage'] }, '/app/usuarios')
    assert.deepEqual(decision, { type: 'deny' })
  })
})

describe('conservación de la ruta de destino', () => {
  it('regresa a la ruta interna indicada después del acceso', () => {
    const towardLogin = authGuardDecision('unauthenticated', '/app/informes?id=8#detalle')
    assert.equal(towardLogin.type, 'redirect')
    if (towardLogin.type !== 'redirect') return
    const requested = new URLSearchParams(towardLogin.to.split('?')[1]).get('redirect')
    assert.equal(guestGuardDecision('authenticated', requested).type, 'redirect')
    assert.deepEqual(guestGuardDecision('authenticated', requested), {
      type: 'redirect',
      to: '/app/informes?id=8#detalle',
    })
  })
})

describe('prevención de redirecciones externas', () => {
  it('sustituye destinos ajenos al sitio por el espacio de trabajo', () => {
    for (const target of [
      'https://evil.example/app',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
      '/login',
      '/app/../login',
    ]) {
      assert.equal(safeInternalPath(target), '/app', target)
      assert.deepEqual(guestGuardDecision('authenticated', target), { type: 'redirect', to: '/app' })
    }
  })
})

describe('ausencia de ciclos de redirección', () => {
  it('se detiene en el login hasta autenticarse y después entra una sola vez', () => {
    const denied = authGuardDecision('unauthenticated', '/app')
    assert.deepEqual(denied, { type: 'redirect', to: '/login?redirect=%2Fapp' })
    assert.deepEqual(guestGuardDecision('unauthenticated', '/app'), { type: 'allow' })
    assert.deepEqual(guestGuardDecision('challenge', '/app'), { type: 'allow' })
    assert.deepEqual(guestGuardDecision('authenticated', '/app'), { type: 'redirect', to: '/app' })
    assert.deepEqual(authGuardDecision('authenticated', '/app'), { type: 'allow' })
    assert.deepEqual(guestGuardDecision('authenticated', '/login'), { type: 'redirect', to: '/app' })
    assert.equal(permissionGuardDecision(identity([]), { permissions: [] }, '/app').type, 'deny')
  })
})
