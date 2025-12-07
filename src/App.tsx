import { Routes, Route } from 'react-router-dom'
import MainLayout from '@components/layout/MainLayout'
import ProtectedRoute from '@components/layout/ProtectedRoute'
import { SignInPage } from '@pages/Auth/Auth'
import { Dashboard } from '@pages/Dashboard'

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/signin" element={<SignInPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<SignInPage />} />
    </Routes>
  )
}

export default App
