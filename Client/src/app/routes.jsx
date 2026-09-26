import { createBrowserRouter, Navigate } from 'react-router'
import { ProtectedRoute, PublicRoute, RouteFallback } from './App.jsx'
import AppLayout from '../shared/layout/AppLayout.jsx'
import {
  ForgotPasswordPage,
  LoginPage,
  ResetPasswordPage,
  SignupPage,
  VerifyOtpPage,
} from '../features/auth/pages/AuthPages.jsx'
import DashboardPage from '../features/dashboard/pages/DashboardPage.jsx'
import ProductsPage from '../features/products/pages/ProductsPage.jsx'
import WarehousesPage from '../features/warehouse/pages/WarehousesPage.jsx'
import OperationsPage from '../features/operations/pages/OperationsPage.jsx'
import LedgerPage from '../features/ledger/pages/LedgerPage.jsx'
import ProfilePage from '../features/profile/pages/ProfilePage.jsx'

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: '/', element: <Navigate to="/login" replace /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/verify-otp', element: <VerifyOtpPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/products', element: <ProductsPage /> },
          { path: '/warehouses', element: <WarehousesPage /> },
          { path: '/receipts', element: <OperationsPage type="receipt" /> },
          { path: '/deliveries', element: <OperationsPage type="delivery" /> },
          { path: '/transfers', element: <OperationsPage type="transfer" /> },
          { path: '/adjustments', element: <OperationsPage type="adjustment" /> },
          { path: '/ledger', element: <LedgerPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <RouteFallback /> },
])

export default router
