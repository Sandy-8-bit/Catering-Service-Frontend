import { Routes, Route } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import { SignInPage } from '@/Pages/auth/Auth'
import { Dashboard } from '@pages/Dashboard'
import { RawMaterialsPage } from '@/Pages/rawMaterialsPage/RawMaterialsPage'
import { appRoutes } from '@/routes/appRoutes'
import CategoriesPage from '@/Pages/catergoriesPage/CatergoriesPage'
import ProductsPage from '@/Pages/productsPage/ProductsPage'
import AdditionalItemsPage from '@/Pages/additionalItemsPage/AdditionalItemsPage'
import UsersPage from '@/Pages/usersPage/UsersPage'
import { OrdersPage } from '@/Pages/ordersPage/OrdersPage'
import { OrdersForm } from '@/Pages/ordersPage/OrdersForm'
import MasterPage from '@/Pages/masterPage/MasterPage'

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/signin" element={<SignInPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={appRoutes.dashboard.path} element={<Dashboard />} />
          <Route path={appRoutes.master.path} element={<MasterPage />} />
          <Route
            path={appRoutes.rawMaterials.path}
            element={<RawMaterialsPage />}
          />
          <Route
            path={appRoutes.catergories.path}
            element={<CategoriesPage />}
          />
          <Route path={appRoutes.products.path} element={<ProductsPage />} />
          <Route
            path={appRoutes.additionalItems.path}
            element={<AdditionalItemsPage />}
          />
          <Route path={appRoutes.userManagement.path} element={<UsersPage />} />
          <Route path={appRoutes.orders.path} element={<OrdersPage />} />
          <Route path={appRoutes.ordersForm.path} element={<OrdersForm />} />
        
        </Route>
      </Route>

      <Route path="*" element={<SignInPage />} />
    </Routes>
  )
}

export default App
