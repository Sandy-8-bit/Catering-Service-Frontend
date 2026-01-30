import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'

import MainLayout from '@/components/layout/MainLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import { appRoutes } from './routes/appRoutes'
import DriverDashboardPage from '@/pages/driver/DriveDashboard'
import DriverOrderPage from './pages/driver/DriverOrderPage'

const AdditionalItemsPage = lazy(
  () => import('@/pages/additionalItemsPage/AdditionalItemsPage')
)
const SignInPage = lazy(async () => ({
  default: (await import('@/pages/auth/Auth')).SignInPage,
}))
const CategoriesPage = lazy(
  () => import('@/pages/catergoriesPage/CatergoriesPage')
)
const Dashboard = lazy(async () => ({
  default: (await import('@/pages/Dashboard')).Dashboard,
}))
const MasterPage = lazy(() => import('@/pages/masterPage/MasterPage'))
const OrdersForm = lazy(() => import('@/pages/ordersPage/OrdersForm'))
const OrdersPage = lazy(async () => ({
  default: (await import('@/pages/ordersPage/OrdersPage')).OrdersPage,
}))
const ProductsPage = lazy(() => import('@/pages/productsPage/ProductsPage'))
const RawMaterialsPage = lazy(
  () => import('@/pages/rawMaterialsPage/RawMaterialsPage')
)
const RecipeDetailsPage = lazy(
  () => import('@/pages/recipesPage/RecipeDetailsPage')
)
const RecipesPage = lazy(() => import('@/pages/recipesPage/RecipesPage'))
const UsersPage = lazy(() => import('@/pages/usersPage/UsersPage'))

function App() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-sm text-zinc-500">
          Loading...
        </div>
      }
    >
      <Routes>
        {/* Public Route */}
        <Route path={appRoutes.signInPage} element={<SignInPage />} />

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
            <Route path={appRoutes.recipes.path} element={<RecipesPage />} />
            <Route
              path={appRoutes.recipes.children.detail}
              element={<RecipeDetailsPage />}
            />
            <Route
              path={appRoutes.additionalItems.path}
              element={<AdditionalItemsPage />}
            />
            <Route
              path={appRoutes.userManagement.path}
              element={<UsersPage />}
            />
            <Route path={appRoutes.orders.path} element={<OrdersPage />} />
            <Route path={appRoutes.ordersForm.path} element={<OrdersForm />} />
            <Route
              path={appRoutes.driver.children.driverDashboard}
              element={<DriverDashboardPage />}
            />
           
<Route
  path={appRoutes.driver.children.driverOrderPage}
  element={<DriverOrderPage />}
/>

          </Route>
        </Route>

        <Route path="*" element={<SignInPage />} />
      </Routes>
    </Suspense>
  )
}

export default App
