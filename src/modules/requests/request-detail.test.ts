import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { PostSaleRequestDetail } from './request-contract.ts'
import { assignedSpecialistLabel, detailFailureCopy, detailFields, formatCreatedAt } from './request-detail.ts'

const request: PostSaleRequestDetail = {
  id: '6f1c2a10-4b7e-4a1d-9c31-000000000004',
  ticketCode: 'PV-24025',
  customerId: 'CLI-10502',
  customerName: 'Industrias Roble Andino S.A.S.',
  facilityName: 'Subestación Chía',
  assetId: null,
  assignedSpecialist: { firstName: 'Carlos', lastName: 'Méndez' },
  type: 'CALIDAD_DE_POTENCIA',
  description: 'Revisión de eventos de calidad de potencia.',
  periodStart: '2026-09-01',
  periodEnd: '2026-09-15',
  status: 'INFORME_EMITIDO',
  createdAt: '2026-10-11T15:00:00.000Z',
}

describe('detalle de solicitud', () => {
  it('muestra el contexto y omite el activo cuando no existe', () => {
    const labels = detailFields(request).map((field) => field.label)
    assert.equal(labels.includes('Activo'), false)
    assert.deepEqual(
      detailFields({ ...request, assetId: 'MED-CHI-001' }).find((field) => field.label === 'Activo'),
      { label: 'Activo', value: 'MED-CHI-001' },
    )
  })

  it('presenta el periodo, el nombre del especialista y la fecha de creación en Guatemala', () => {
    const fields = detailFields(request)
    assert.equal(fields.find((field) => field.label === 'Periodo de evaluación')?.value, '01/09/2026 – 15/09/2026')
    assert.equal(fields.find((field) => field.label === 'Especialista asignado')?.value, 'Carlos Méndez')
    assert.equal(
      detailFields({ ...request, assignedSpecialist: null }).find((field) => field.label === 'Especialista asignado')
        ?.value,
      'Sin asignar',
    )
    assert.equal(assignedSpecialistLabel({ firstName: null, lastName: null }), 'Nombre no disponible')
    assert.equal(assignedSpecialistLabel({ firstName: 'Carlos', lastName: null }), 'Carlos')
    assert.equal(fields.find((field) => field.label === 'Cliente')?.value, 'Industrias Roble Andino S.A.S.')
    assert.equal(formatCreatedAt(request.createdAt), '11/10/2026 09:00 (Guatemala)')
  })

  it('trata una solicitud inaccesible como no disponible y permite reintentar un fallo de red', () => {
    assert.equal(detailFailureCopy(404).retry, false)
    assert.equal(detailFailureCopy(404).title, 'Solicitud no disponible')
    assert.equal(detailFailureCopy(null).retry, true)
    assert.equal(detailFailureCopy(500).retry, true)
  })
})
