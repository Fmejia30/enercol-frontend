import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { authorizationFromAuth } from '../access/authorization.ts'
import { areaDescription, greetingForHour, roleLabel, workspaceAreas } from './dashboard-content.ts'

function identity(roles: readonly string[]) {
  return authorizationFromAuth({
    status: 'authenticated',
    identity: { userId: 'actor-1', roles },
  })
}

function labels(roles: readonly string[]) {
  return workspaceAreas(identity(roles)).map((area) => area.label)
}

const areas = ['Solicitudes postventa', 'Análisis técnicos', 'Informes técnicos']

describe('saludo', () => {
  it('cambia con la hora y no incluye un nombre', () => {
    assert.equal(greetingForHour(8), 'Buenos días')
    assert.equal(greetingForHour(12), 'Buenas tardes')
    assert.equal(greetingForHour(18), 'Buenas tardes')
    assert.equal(greetingForHour(19), 'Buenas noches')
    assert.equal(greetingForHour(0), 'Buenas noches')
    assert.equal(greetingForHour(4), 'Buenas noches')
  })
})

describe('dashboard por rol', () => {
  it('muestra las áreas de lectura del técnico y del validador', () => {
    assert.deepEqual(labels(['SPECIALIST']), areas)
    assert.deepEqual(labels(['VALIDATOR']), areas)
    assert.deepEqual(labels(['VALIDATOR', 'SPECIALIST']), areas)
    assert.equal(roleLabel('SPECIALIST'), 'Especialista técnico')
    assert.equal(roleLabel('VALIDATOR'), 'Especialista validador')
  })

  it('muestra las mismas áreas cuando la identidad incluye administrador', () => {
    assert.deepEqual(labels(['ADMINISTRATOR']), areas)
    assert.equal(roleLabel('ADMINISTRATOR'), 'Administrador')
  })

  it('deja el espacio sin áreas si no hay roles o son desconocidos', () => {
    assert.deepEqual(labels([]), [])
    assert.deepEqual(labels(['ADMIN', 'ESPECIALISTA_TECNICO']), [])
  })
})

describe('áreas previstas', () => {
  it('no apuntan a rutas y conservan una descripción', () => {
    for (const area of workspaceAreas(identity(['ADMINISTRATOR']))) {
      assert.equal(area.to, undefined)
      assert.equal(areaDescription(area.label).includes('Próximamente'), false)
      assert.equal(areaDescription(area.label).length > 0, true)
    }
  })
})
