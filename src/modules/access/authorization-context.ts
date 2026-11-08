import { createContext } from 'react'
import type { Authorization } from '@/modules/access/authorization.ts'

export const AuthorizationContext = createContext<Authorization | null>(null)
