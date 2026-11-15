import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ApiError } from '../../shared/lib/api-error.ts'
import {
  parsePostSaleRequest,
  parsePostSaleRequestDetail,
  parsePostSaleRequestPage,
  postSaleRequestPath,
} from './request-contract.ts'

const request = {
  id: '6f1c2a10-4b7e-4a1d-9c31-000000000001',
  ticketCode: 'PV-24018',
  customerId: 'CLI-10421',
  customerName: 'Textiles del Altiplano S.A.S.',
  facilityName: 'Planta Fontibón',
  assetId: null,
  assignedSpecialistSub: 'demo-specialist-norte',
  type: 'VERIFICACION_DEMANDA',
  description: 'Revisión del periodo.',
  periodStart: '2026-09-01',
  periodEnd: '2026-09-30',
  status: 'ABIERTA',
  createdAt: '2026-10-02T15:00:00.000Z',
}

describe('contrato de solicitudes', () => {
  it('acepta el listado y el detalle devueltos por la API', () => {
    const page = parsePostSaleRequestPage({ items: [request], page: 1, pageSize: 20, total: 1 })
    assert.equal(page.items[0]?.ticketCode, 'PV-24018')
    assert.equal(page.items[0]?.assetId, null)
    assert.equal(page.items[0]?.assignedSpecialistSub, 'demo-specialist-norte')
    assert.equal(parsePostSaleRequest(request).status, 'ABIERTA')
  })

  it('acepta una solicitud sin especialista asignado y rechaza un identificador vacío', () => {
    const unassigned = parsePostSaleRequest({ ...request, assignedSpecialistSub: null })
    assert.equal(unassigned.assignedSpecialistSub, null)
    assert.equal(
      parsePostSaleRequestPage({ items: [unassigned], page: 1, pageSize: 20, total: 1 }).items[0]?.assignedSpecialistSub,
      null,
    )
    assert.throws(() => parsePostSaleRequest({ ...request, assignedSpecialistSub: '' }), ApiError)
    assert.throws(() => parsePostSaleRequest({ ...request, assignedSpecialistSub: undefined }), ApiError)
  })

  it('rechaza una respuesta con un estado o un periodo inválido', () => {
    assert.throws(() => parsePostSaleRequest({ ...request, status: 'CERRADA' }), ApiError)
    assert.throws(() => parsePostSaleRequest({ ...request, periodEnd: '30-09-2026' }), ApiError)
    assert.throws(() => parsePostSaleRequestPage({ items: [request], total: 1 }), ApiError)
  })

  it('el detalle muestra el nombre del especialista y no acepta el sub como nombre', () => {
    const { assignedSpecialistSub, ...fields } = request
    void assignedSpecialistSub
    const detail = parsePostSaleRequestDetail({
      ...fields,
      assignedSpecialist: { firstName: 'Carlos', lastName: 'Méndez' },
    })
    assert.equal(detail.assignedSpecialist?.lastName, 'Méndez')
    assert.equal('assignedSpecialistSub' in detail, false)
    assert.throws(() => parsePostSaleRequestDetail(request), ApiError)
    assert.equal(
      parsePostSaleRequestDetail({ ...fields, assignedSpecialist: null }).assignedSpecialist,
      null,
    )
  })

  it('codifica el identificador en la ruta de detalle', () => {
    assert.equal(postSaleRequestPath('solicitud/1'), '/post-sale-requests/solicitud%2F1')
  })
})
