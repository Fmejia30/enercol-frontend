import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { navigation } from '../../config/navigation.ts'
import { authorizationFromAuth } from './authorization.ts'
import { meetsRequirement, visibleWhenAllowed } from './permission-requirement.ts'

const account = ['Inicio', 'Mi perfil']
const sections = [...account, 'Solicitudes postventa', 'Análisis técnicos', 'Informes técnicos']

function identity(roles: readonly string[]) {
  return authorizationFromAuth({
    status: 'authenticated',
    identity: { userId: 'actor-1', roles },
  })
}

function labels(roles: readonly string[]) {
  return visibleWhenAllowed(navigation, identity(roles)).map((item) => item.label)
}

describe('visualización con permiso', () => {
  it('acepta el permiso que el técnico posee', () => {
    assert.equal(
      meetsRequirement(identity(['SPECIALIST']), { permissions: ['analysis:execute'] }),
      true,
    )
  })
})

describe('ocultamiento sin permiso', () => {
  it('niega validar informes a un técnico', () => {
    assert.equal(
      meetsRequirement(identity(['SPECIALIST']), { permissions: ['reports:validate'] }),
      false,
    )
  })
})

describe('requisito all', () => {
  it('exige todos los permisos indicados', () => {
    const requirement = {
      permissions: ['analysis:execute', 'reports:validate'] as const,
      match: 'all' as const,
    }
    assert.equal(meetsRequirement(identity(['SPECIALIST']), requirement), false)
    assert.equal(meetsRequirement(identity(['SPECIALIST', 'VALIDATOR']), requirement), true)
  })
})

describe('requisito any', () => {
  it('acepta cualquiera de los permisos indicados', () => {
    const requirement = {
      permissions: ['analysis:execute', 'reports:validate'] as const,
      match: 'any' as const,
    }
    assert.equal(meetsRequirement(identity(['VALIDATOR']), requirement), true)
    assert.equal(meetsRequirement(identity(['SPECIALIST']), requirement), true)
    assert.equal(meetsRequirement(identity([]), requirement), false)
  })
})

describe('acumulación de permisos', () => {
  it('muestra las secciones de técnico y de validador', () => {
    assert.deepEqual(labels(['SPECIALIST', 'VALIDATOR']), sections)
    assert.equal(
      meetsRequirement(identity(['SPECIALIST', 'VALIDATOR']), {
        permissions: ['analysis:execute', 'reports:validate'],
        match: 'all',
      }),
      true,
    )
  })
})

describe('usuario autenticado sin roles', () => {
  it('conserva el inicio y oculta las secciones protegidas', () => {
    assert.deepEqual(labels([]), account)
    assert.equal(meetsRequirement(identity([]), { permissions: ['workspace:access'] }), false)
  })
})

describe('ADMINISTRATOR explícito', () => {
  it('ve las secciones y un permiso que los otros roles no tienen', () => {
    assert.deepEqual(labels(['ADMINISTRATOR']), [...sections, 'Usuarios'])
    assert.equal(meetsRequirement(identity(['ADMINISTRATOR']), { permissions: ['users:manage'] }), true)
    assert.equal(
      meetsRequirement(identity(['SPECIALIST', 'VALIDATOR']), { permissions: ['users:manage'] }),
      false,
    )
  })
})

describe('roles desconocidos', () => {
  it('no conceden secciones protegidas', () => {
    assert.deepEqual(labels(['ADMIN', 'ESPECIALISTA_TECNICO']), account)
    assert.equal(
      meetsRequirement(identity(['DESCONOCIDO']), { permissions: ['reports:read'] }),
      false,
    )
  })
})

describe('estado de carga', () => {
  it('oculta las secciones protegidas mientras no hay identidad', () => {
    const loading = authorizationFromAuth({ status: 'loading' })
    assert.equal(meetsRequirement(loading, { permissions: ['workspace:access'] }), false)
    assert.deepEqual(
      visibleWhenAllowed(navigation, loading).map((item) => item.label),
      account,
    )
  })
})

describe('integración con navegación', () => {
  it('mantiene las secciones próximas y las filtra con la matriz', () => {
    for (const item of navigation) {
      if (item.label === 'Inicio') {
        assert.equal(item.to, '/app')
        assert.equal(item.requirement, undefined)
      } else if (item.label === 'Mi perfil') {
        assert.equal(item.to, '/app/profile')
        assert.equal(item.section, 'Cuenta')
        assert.equal(item.requirement, undefined)
      } else if (item.label === 'Usuarios') {
        assert.equal(item.to, '/app/users')
        assert.equal(item.section, 'Administración')
        assert.deepEqual(item.requirement, { permissions: ['users:manage'] })
      } else {
        assert.equal(item.to, undefined)
      }
    }
    assert.deepEqual(labels(['SPECIALIST']), sections)
    assert.deepEqual(labels(['VALIDATOR']), sections)
    assert.deepEqual(
      visibleWhenAllowed(
        [...navigation, { label: 'Validar informes', requirement: { permissions: ['reports:validate'] as const } }],
        identity(['SPECIALIST']),
      ).some((item) => item.label === 'Validar informes'),
      false,
    )
    assert.equal(
      visibleWhenAllowed(
        [{ label: 'Validar informes', requirement: { permissions: ['reports:validate'] as const } }],
        identity(['VALIDATOR']),
      ).length,
      1,
    )
  })
})
