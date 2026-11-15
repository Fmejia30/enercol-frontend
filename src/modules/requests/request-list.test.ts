import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  canGoToNextPage,
  canGoToPreviousPage,
  formatEvaluationPeriod,
  listFailureCopy,
  listMessage,
  listMessageCopy,
  readRequestFilters,
  requestListParams,
  statusLabel,
  typeLabel,
  visibleRequestCountLabel,
} from './request-list.ts'

describe('listado de solicitudes', () => {
  it('arma la consulta con búsqueda, estado y página, y omite filtros vacíos', () => {
    assert.deepEqual(requestListParams({ search: '  Fontibón  ', status: 'ABIERTA', page: 2 }), {
      page: 2,
      pageSize: 20,
      status: 'ABIERTA',
      search: 'Fontibón',
    })
    assert.deepEqual(requestListParams({ search: '   ', status: '', page: 1 }), {
      page: 1,
      pageSize: 20,
    })
  })

  it('lee los filtros de la URL y descarta un estado o una página inválidos', () => {
    const params = new URLSearchParams('search=rio&status=CERRADA&page=0')
    assert.deepEqual(readRequestFilters(params), { search: 'rio', status: '', page: 1 })
    assert.deepEqual(readRequestFilters(new URLSearchParams('status=EN_ANALISIS&page=3')), {
      search: '',
      status: 'EN_ANALISIS',
      page: 3,
    })
  })

  it('distingue el listado vacío de una búsqueda sin resultados', () => {
    assert.equal(listMessage({ total: 0, filtered: false }), 'empty')
    assert.equal(listMessageCopy('empty'), 'No hay solicitudes visibles.')
    assert.equal(listMessage({ total: 0, filtered: true }), 'no-results')
    assert.equal(listMessageCopy('no-results'), 'Ninguna solicitud coincide con la búsqueda o el estado.')
    assert.equal(listMessage({ total: 4, filtered: true }), 'ready')
  })

  it('pagina solo cuando hay otra página y traduce el estado y el periodo', () => {
    assert.equal(canGoToPreviousPage(1), false)
    assert.equal(canGoToPreviousPage(2), true)
    assert.equal(canGoToNextPage(1, 20, 8), false)
    assert.equal(canGoToNextPage(1, 3, 8), true)
    assert.equal(visibleRequestCountLabel(1), '1 solicitud visible')
    assert.equal(visibleRequestCountLabel(8), '8 solicitudes visibles')
    assert.equal(statusLabel('INFORME_EMITIDO'), 'Informe emitido')
    assert.equal(statusLabel('RECEIVED'), 'Recibida')
    assert.equal(statusLabel('REPORT_APPROVED'), 'Informe aprobado')
    assert.equal(typeLabel('CONSUMO_ATIPICO'), 'Consumo atípico')
    assert.equal(formatEvaluationPeriod('2026-09-01', '2026-09-30'), '01/09/2026 – 30/09/2026')
  })

  it('ofrece reintento en un fallo de carga y no en una negación de acceso', () => {
    assert.equal(listFailureCopy(403).retry, false)
    assert.equal(listFailureCopy(500).retry, true)
    assert.equal(listFailureCopy(null).title, 'Sin conexión')
  })
})
