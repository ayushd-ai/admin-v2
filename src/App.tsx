import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '@/store'
import { useAuth } from '@/hooks/useAuth'
import LoginPage from '@/components/auth/LoginPage'
import Dashboard from '@/pages/Dashboard'
import AdminLayout from '@/components/layout/AdminLayout'
import AdminDashboard from '@/pages/AdminDashboard'
import OrganizationsPage from '@/pages/OrganizationsPage'
import UsersPage from '@/pages/UsersPage'
import TokenUsagePage from '@/pages/TokenUsagePage'
import ConnectorsPage from '@/pages/ConnectorsPage'
import ToolsPage from '@/pages/ToolsPage'
import LogsPage from '@/pages/LogsPage'
import { ROUTES } from '@/lib/constants'
import './App.css'
import { AuthProvider, ProtectedRoute } from './components/auth/AuthContext'

// App component with authentication logic
const AppContent = () => {
  // const { isAuthenticated, isLoading } = useAuth()

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  //     </div>
  //   )
  // }

  return (
    <Router>
      <AuthProvider>

        <Routes>
          <Route
            path={ROUTES.LOGIN}
            element={<LoginPage />}
          />
          <Route
            path={ROUTES.HOME}
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path={ROUTES.ORGANIZATIONS} element={<OrganizationsPage />} />
            <Route
              path={ROUTES.USERS}
              element={
                <UsersPage />
              }
            />
            <Route
              path={ROUTES.TOKEN_USAGE}
              element={<TokenUsagePage />}
            />
            <Route
              path={ROUTES.CONNECTORS}
              element={<ConnectorsPage />}
            />
            <Route
              path={ROUTES.TOOLS}
              element={<ToolsPage />}
            />
            <Route
              path={ROUTES.LOGS}
              element={<LogsPage />}
            />

          </Route>


          {/* Admin Routes */}
          {/* <Route
            path={ROUTES.ADMIN}
            element={
              // <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              // </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ORGANIZATIONS}
            element={
              // <ProtectedRoute>
                <AdminLayout>
                  <OrganizationsPage />
                </AdminLayout>
              // </ProtectedRoute>
            }
          />
          

          <Route
          path={ROUTES.HOME}
          element={
            // <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              // </ProtectedRoute>
          }
          /> */}
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />

        </Routes>
      </AuthProvider>
    </Router>
  )
}

// Main App component with Redux Provider
function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App
