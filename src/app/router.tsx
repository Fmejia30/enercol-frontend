import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard } from '@/app/auth-guard.tsx'
import { GuestGuard } from '@/app/guest-guard.tsx'
import { NotFoundPage } from '@/app/not-found-page.tsx'
import { RootLayout } from '@/app/root-layout.tsx'
import { LoginPage } from '@/modules/auth/login-page.tsx'
import { HomePage } from '@/modules/home/home-page.tsx'
import { AppShell } from '@/modules/shell/app-shell.tsx'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/login" replace />,
      },
      {
        element: <GuestGuard />,
        children: [{ path: '/login', element: <LoginPage /> }],
      },
      {
        element: <AuthGuard />,
        children: [
          {
            path: '/app',
            element: <AppShell />,
            children: [{ index: true, element: <HomePage /> }],
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
