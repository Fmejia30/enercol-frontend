import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { CSRF_HEADER_NAME, csrfHeaders, setCsrfToken } from './csrf.ts'

describe('token CSRF', () => {
  afterEach(() => {
    setCsrfToken(null)
  })

  it('no adjunta un encabezado cuando la sesión no entregó un token', () => {
    assert.deepEqual(csrfHeaders(), {})
  })

  it('adjunta el token recibido al iniciar o consultar la sesión', () => {
    setCsrfToken('csrf-de-sesion')
    assert.deepEqual(csrfHeaders(), { [CSRF_HEADER_NAME]: 'csrf-de-sesion' })
  })
})
