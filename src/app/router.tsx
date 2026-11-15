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
import { requestsPermission } from '@/modules/requests/request-access.ts'
import { AnalysesPage } from '@/modules/requests/analyses-page.tsx'
import { ReportEditorPage } from '@/modules/requests/report-editor-page.tsx'
import { ReportsPage } from '@/modules/requests/reports-page.tsx'
import { RequestDetailPage } from '@/modules/requests/request-detail-page.tsx'
import { RequestsPage } from '@/modules/requests/requests-page.tsx'
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
                    element: <PermissionGuard requirement={{ permissions: ['analysis:read'] }} />,
                    children: [{ path: 'analyses', element: <AnalysesPage /> }],
                  },
                  {
                    element: <PermissionGuard requirement={{ permissions: ['reports:read'] }} />,
                    children: [{ path: 'reports', element: <ReportsPage /> }],
                  },
                  {
                    element: <PermissionGuard requirement={requestsPermission} />,
                    children: [
                      { path: 'requests', element: <RequestsPage /> },
                      { path: 'requests/:requestId', element: <RequestDetailPage /> },
                      {
                        element: <PermissionGuard requirement={{ permissions: ['reports:read'] }} />,
                        children: [
                          { path: 'requests/:requestId/reports/:reportId', element: <ReportEditorPage /> },
                        ],
                      },
                    ],
                  },
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
