import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/Layout/AppLayout';
import { Spinner } from 'react-bootstrap';

import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import SetupWizard from './pages/Setup/SetupWizard';
import DashboardPage from './pages/Dashboard/DashboardPage';
import MoneyPage from './pages/Money/MoneyPage';
import IncomePage from './pages/Money/IncomePage';
import AccountsPage from './pages/Money/AccountsPage';
import ExpensesPage from './pages/Expenses/ExpensesPage';
import RecurringExpensesPage from './pages/Expenses/RecurringExpensesPage';
import SubscriptionsPage from './pages/Subscriptions/SubscriptionsPage';
import PlannedPurchasesPage from './pages/Purchases/PlannedPurchasesPage';
import SavingsPage from './pages/Savings/SavingsPage';
import ReportsPage from './pages/Reports/ReportsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import CategoriesPage from './pages/Settings/CategoriesPage';
import AccountsSettingsPage from './pages/Settings/AccountsSettingsPage';
import AuditPage from './pages/Audit/AuditPage';

// AI Assistant — lazy loaded so it doesn't affect normal app performance
const AIAssistantPage = lazy(() => import('./pages/AIAssistant/AIAssistantPage'));

const AIPageFallback = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
    <Spinner animation="border" variant="primary" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="d-flex justify-content-center p-5"><Spinner animation="border" /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="d-flex justify-content-center p-5"><Spinner animation="border" /></div>;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/setup" element={<SetupWizard />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/money" element={<MoneyPage />} />
              <Route path="/money/income" element={<IncomePage />} />
              <Route path="/money/accounts" element={<AccountsPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/expenses/recurring" element={<RecurringExpensesPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/purchases" element={<PlannedPurchasesPage />} />
              <Route path="/savings" element={<SavingsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/categories" element={<CategoriesPage />} />
              <Route path="/settings/accounts" element={<AccountsSettingsPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/ai" element={
                <Suspense fallback={<AIPageFallback />}>
                  <AIAssistantPage />
                </Suspense>
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
