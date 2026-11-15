import { api } from '@/shared/lib/api.ts'
import { parseRequestActivity, type RequestActivity } from '@/modules/requests/request-activity.ts'
import {
  parsePostSaleRequestDetail,
  parsePostSaleRequestPage,
  postSaleRequestPath,
  type PostSaleRequestDetail,
  type PostSaleRequestPage,
  type PostSaleRequestQuery,
} from '@/modules/requests/request-contract.ts'
import {
  parseTechnicalAnalyses,
  parseTechnicalAnalysis,
  parseTechnicalAnalysisCatalog,
  parseTechnicalDataset,
  type TechnicalAnalysis,
  type TechnicalAnalysisCatalogItem,
  type TechnicalDataset,
} from '@/modules/requests/technical-analysis.ts'
import {
  parseApprovedTechnicalReport,
  parsePendingTechnicalReports,
  parseTechnicalReport,
  parseTechnicalReportCatalog,
  parseTechnicalReportReviewPacket,
  parseTechnicalReportReviews,
  parseTechnicalReports,
  type ApprovedTechnicalReport,
  type PendingTechnicalReportPage,
  type TechnicalReport,
  type TechnicalReportCatalogItem,
  type TechnicalReportContent,
  type TechnicalReportReviewEvent,
  type TechnicalReportReviewPacket,
} from '@/modules/requests/technical-report.ts'

export function listPostSaleRequests(query: PostSaleRequestQuery, signal?: AbortSignal): Promise<PostSaleRequestPage> {
  return api
    .get<unknown>('/post-sale-requests', { params: query, signal })
    .then((response) => parsePostSaleRequestPage(response.data))
}

export function listRequestActivity(id: string, signal?: AbortSignal): Promise<RequestActivity[]> {
  return api
    .get<unknown>(`${postSaleRequestPath(id)}/activity`, { signal })
    .then((response) => parseRequestActivity(response.data))
}

export function readPostSaleRequest(id: string, signal?: AbortSignal): Promise<PostSaleRequestDetail> {
  return api
    .get<unknown>(postSaleRequestPath(id), { signal })
    .then((response) => parsePostSaleRequestDetail(response.data))
}

export function readTechnicalDataset(id: string, signal?: AbortSignal): Promise<TechnicalDataset> {
  return api
    .get<unknown>(`${postSaleRequestPath(id)}/technical-data`, { signal })
    .then((response) => parseTechnicalDataset(response.data))
}

export function readTechnicalAnalyses(id: string, signal?: AbortSignal): Promise<TechnicalAnalysis[]> {
  return api
    .get<unknown>(`${postSaleRequestPath(id)}/analyses`, { signal })
    .then((response) => parseTechnicalAnalyses(response.data))
}

export function executeTechnicalAnalysis(id: string): Promise<TechnicalAnalysis> {
  return api.post<unknown>(`${postSaleRequestPath(id)}/analyses`, {}).then((response) => parseTechnicalAnalysis(response.data))
}

export function listTechnicalReports(id: string, signal?: AbortSignal): Promise<TechnicalReport[]> {
  return api
    .get<unknown>(`${postSaleRequestPath(id)}/reports`, { signal })
    .then((response) => parseTechnicalReports(response.data))
}

export function generateTechnicalReport(id: string): Promise<TechnicalReport> {
  return api
    .post<unknown>(`${postSaleRequestPath(id)}/reports`, {}, { timeout: 90_000 })
    .then((response) => parseTechnicalReport(response.data))
}

export function saveTechnicalReportRevision(
  requestId: string,
  reportId: string,
  body: { baseVersion: number; content: TechnicalReportContent },
): Promise<TechnicalReport> {
  return api
    .post<unknown>(`${postSaleRequestPath(requestId)}/reports/${encodeURIComponent(reportId)}/revisions`, body)
    .then((response) => parseTechnicalReport(response.data))
}

export function listTechnicalAnalysisCatalog(signal?: AbortSignal): Promise<TechnicalAnalysisCatalogItem[]> {
  return api
    .get<unknown>('/technical-analyses', { signal })
    .then((response) => parseTechnicalAnalysisCatalog(response.data))
}

function reportPath(requestId: string, reportId: string) {
  return `${postSaleRequestPath(requestId)}/reports/${encodeURIComponent(reportId)}`
}

export function submitTechnicalReport(requestId: string, reportId: string): Promise<TechnicalReport> {
  return api.post<unknown>(`${reportPath(requestId, reportId)}/submit`, {}).then((response) => parseTechnicalReport(response.data))
}

export function startTechnicalReportReview(requestId: string, reportId: string): Promise<TechnicalReport> {
  return api.post<unknown>(`${reportPath(requestId, reportId)}/review/start`, {}).then((response) => parseTechnicalReport(response.data))
}

export function approveTechnicalReport(requestId: string, reportId: string): Promise<TechnicalReport> {
  return api.post<unknown>(`${reportPath(requestId, reportId)}/review/approve`, {}).then((response) => parseTechnicalReport(response.data))
}

export function requestTechnicalReportChanges(requestId: string, reportId: string, comments: string): Promise<TechnicalReport> {
  return api
    .post<unknown>(`${reportPath(requestId, reportId)}/review/request-changes`, { comments })
    .then((response) => parseTechnicalReport(response.data))
}

export function requireTechnicalReportReanalysis(requestId: string, reportId: string, comments: string): Promise<TechnicalReport> {
  return api
    .post<unknown>(`${reportPath(requestId, reportId)}/review/require-reanalysis`, { comments })
    .then((response) => parseTechnicalReport(response.data))
}

export function listTechnicalReportReviews(requestId: string, reportId: string, signal?: AbortSignal): Promise<TechnicalReportReviewEvent[]> {
  return api
    .get<unknown>(`${reportPath(requestId, reportId)}/reviews`, { signal })
    .then((response) => parseTechnicalReportReviews(response.data))
}

export function readTechnicalReportReview(requestId: string, reportId: string, signal?: AbortSignal): Promise<TechnicalReportReviewPacket> {
  return api
    .get<unknown>(`${reportPath(requestId, reportId)}/review`, { signal })
    .then((response) => parseTechnicalReportReviewPacket(response.data))
}

export function listPendingTechnicalReports(signal?: AbortSignal): Promise<PendingTechnicalReportPage> {
  return api
    .get<unknown>('/technical-reports/pending-review', { signal })
    .then((response) => parsePendingTechnicalReports(response.data))
}

export function readApprovedTechnicalReport(requestId: string, reportId: string): Promise<ApprovedTechnicalReport> {
  return api.get<unknown>(`${reportPath(requestId, reportId)}/approved`).then((response) => parseApprovedTechnicalReport(response.data))
}

export function listTechnicalReportCatalog(signal?: AbortSignal): Promise<TechnicalReportCatalogItem[]> {
  return api.get<unknown>('/technical-reports', { signal }).then((response) => parseTechnicalReportCatalog(response.data))
}
