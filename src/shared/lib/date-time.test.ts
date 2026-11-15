import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { formatCalendarDate, formatInstant, formatPdfDate } from './date-time.ts'

describe('fecha y hora', () => {
  it('muestra instantes en America/Guatemala sin restar horas a mano', () => {
    assert.equal(formatInstant('2026-10-11T15:00:00.000Z'), '11/10/2026 09:00 (Guatemala)')
    assert.equal(formatInstant('2026-09-01T04:00:00.000Z'), '31/08/2026 22:00 (Guatemala)')
    assert.equal(formatInstant('no-es-fecha'), 'no-es-fecha')
  })

  it('no convierte las fechas calendario del periodo de evaluación', () => {
    assert.equal(formatCalendarDate('2026-09-01'), '01/09/2026')
    assert.equal(formatCalendarDate('2026-09-30'), '30/09/2026')
  })
})

describe('fecha del informe', () => {
  it('muestra dd/MM/yyyy y convierte el instante a Guatemala sin mover una fecha calendario', () => {
    assert.equal(formatPdfDate('2026-11-15'), '15/11/2026')
    assert.equal(formatPdfDate('2026-09-03'), '03/09/2026')
    assert.equal(formatPdfDate('2026-01-07'), '07/01/2026')
    assert.equal(formatPdfDate('2026-09-01T04:00:00.000Z'), '31/08/2026')
    assert.equal(formatPdfDate('2026-11-14T20:00:00.000Z'), '14/11/2026')
    assert.equal(formatPdfDate('no-es-fecha'), 'no-es-fecha')
  })
})
