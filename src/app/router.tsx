import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard } from '@/app/auth-guard.tsx'
import { GuestGuard } from '@/app/guest-guard.tsx'
import { NotFoundPage } from '@/app/not-found-page.tsx'
import { RootLayout } from '@/app/root-layout.tsx'
import { LoginPage } from '@/modules/auth/login-page.tsx'
import { PermissionGuard } from '@/app/permission-guard.tsx'
import { HomePage } from '@/modules/home/home-page.tsx'
import { ProfilePage } from '@/modules/profile/profile-page.tsx'
import { ProfileCompletionGate } from '@/modules/profile/profile-completion-gate.tsx'
import { AppShell } from '@/modules/shell/app-shell.tsx'
import { UserDetailPage } from '@/modules/users/user-detail-page.tsx'
import { UsersDirectoryPage } from '@/modules/users/users-directory-page.tsx'

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
            children: [
              {
                element: <ProfileCompletionGate />,
                children: [
                  { index: true, element: <HomePage /> },
                  { path: 'profile', element: <ProfilePage /> },
                  {
                    element: <PermissionGuard requirement={{ permissions: ['users:manage'] }} />,
                    children: [
                      { path: 'users', element: <UsersDirectoryPage /> },
                      { path: 'users/:userId', element: <UserDetailPage /> },
                    ],
                  },
                ],
              },
            ],
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
