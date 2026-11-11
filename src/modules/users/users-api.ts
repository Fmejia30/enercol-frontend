import { api } from '@/shared/lib/api.ts'
import type { InviteUserValues } from '@/modules/users/user-administration.ts'
import {
  parseInvitedUser,
  parseOwnProfile,
  parseUserDetail,
  parseUserDirectory,
  type InvitedUser,
  type OwnProfileBody,
  type UserAccountDetail,
  type UserDirectoryQuery,
  type UserDirectoryResponse,
  type UserUpdateBody,
} from '@/modules/users/user-contract.ts'

export function listUsers(query: UserDirectoryQuery, signal?: AbortSignal) {
  return api.get<unknown>('/users', { params: query, signal }).then((response) => parseUserDirectory(response.data))
}

export function readUser(id: string, signal?: AbortSignal): Promise<UserAccountDetail> {
  return api
    .get<unknown>(`/users/${encodeURIComponent(id)}`, { signal })
    .then((response) => parseUserDetail(response.data))
}

export function createUser(body: InviteUserValues, signal?: AbortSignal): Promise<InvitedUser> {
  return api
    .post<unknown>('/users', { email: body.email, roles: body.roles }, { signal })
    .then((response) => parseInvitedUser(response.data))
}

export function updateUser(id: string, body: UserUpdateBody, signal?: AbortSignal): Promise<UserAccountDetail> {
  return api
    .patch<unknown>(`/users/${encodeURIComponent(id)}`, body, { signal })
    .then((response) => parseUserDetail(response.data))
}

export function updateUserStatus(id: string, enabled: boolean, signal?: AbortSignal): Promise<UserAccountDetail> {
  return api
    .patch<unknown>(`/users/${encodeURIComponent(id)}/status`, { enabled }, { signal })
    .then((response) => parseUserDetail(response.data))
}

export function readOwnProfile(signal?: AbortSignal) {
  return api.get<unknown>('/users/me', { signal }).then((response) => parseOwnProfile(response.data))
}

export function updateOwnProfile(body: OwnProfileBody, signal?: AbortSignal) {
  return api.patch<unknown>('/users/me', body, { signal }).then((response) => parseOwnProfile(response.data))
}

export type { UserDirectoryQuery, UserDirectoryResponse }
