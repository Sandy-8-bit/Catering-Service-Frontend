import { Routes, Route } from 'react-router-dom'
import MainLayout from '@components/layout/MainLayout'
import ProtectedRoute from '@components/layout/ProtectedRoute'
import { SignInPage } from '@pages/Auth/Auth'
import { Dashboard } from '@pages/Dashboard'
import { RawMaterialsPage } from '@/pages/RawMaterialsPage/RawMaterialsPage'
import { appRoutes } from '@/routes/appRoutes'
import CategoriesPage from '@pages/CatergoriesPage/CatergoriesPage'
import ProductsPage from '@pages/ProductsPage/ProductsPage'

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/signin" element={<SignInPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={appRoutes.dashboard.path} element={<Dashboard />} />
          <Route
            path={appRoutes.rawMaterials.path}
            element={<RawMaterialsPage />}
          />
          <Route
            path={appRoutes.catergories.path}
            element={<CategoriesPage />}
          />
          <Route path={appRoutes.products.path} element={<ProductsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<SignInPage />} />
    </Routes>
  )
}

export default App
