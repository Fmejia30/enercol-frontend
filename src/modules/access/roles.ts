export const roles = ['SPECIALIST', 'VALIDATOR', 'ADMINISTRATOR'] as const

export type Role = (typeof roles)[number]

export function isRole(value: string): value is Role {
  return roles.some((role) => role === value)
}

export function knownRoles(values: readonly unknown[]): Role[] {
  const recognized: Role[] = []
  for (const value of values) {
    if (typeof value !== 'string' || !isRole(value) || recognized.includes(value)) continue
    recognized.push(value)
  }
  return recognized
}
