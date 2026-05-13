import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import MainLayout from '@/components/layout/MainLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import { appRoutes } from './routes/appRoutes'
import DriverDashboardPage from '@/pages/driver/DriveDashboard'
import DriverOrderPage from './pages/driver/DriverOrderPage'
import DriverPendingOrdersPage from '@/pages/driver/DriverPendingOrdersPage'
import ExpensePage from './pages/expense/ExpensePage'
import FinancialReport from './pages/test'

const AdditionalItemsPage = lazy(
  () => import('@/pages/additionalItemsPage/AdditionalItemsPage')
)
const SignInPage = lazy(async () => ({
  default: (await import('@/pages/auth/Auth')).SignInPage,
}))
const CategoriesPage = lazy(
  () => import('@/pages/catergoriesPage/CatergoriesPage')
)
const MasterCategoriesPage = lazy(
  () => import('@/pages/masterCategoriesPage/MasterCategoriesPage')
)
const Dashboard = lazy(() => import('@/pages/dashboard/Dash'))
const MasterPage = lazy(() => import('@/pages/masterPage/MasterPage'))
const ReportsPage = lazy(() => import('@/pages/reportsPage/ReportsPage'))
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
const CalculateRawMaterialsPage = lazy(
  () => import('@/pages/masterPage/CalculateRawMaterialsPage')
)
const UsersPage = lazy(() => import('@/pages/usersPage/UsersPage'))
const DownloadReportsPage = lazy(
  () => import('@/pages/reportsPage/DownloadReportsPage')
)

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
        <Route
          path={'/test'}
          element={
            <FinancialReport
              reportData={{
                success: true,
                message: 'Financial report generated for MONTHLY',
                data: {
                  totalGlobalIncome: 16000.0,
                  totalGlobalMiscExpense: 0,
                  totalGlobalNetProfit: 16000.0,
                  totalGlobalPeopleServed: 120,
                  orderDetails: [
                    {
                      orderId: 1,
                      customerName: 'Santhosh V P',
                      eventDate: '2026-05-05',
                      totalPeople: 120,
                      orderIncome: 16000.0,
                      orderExpense: 0,
                      orderProfit: 16000.0,
                      menuItems: [
                        {
                          productName: 'சுக்கு பால்',
                          productSecondaryName: null,
                          quantity: 1,
                          productUnitPrice: 40.0,
                          productLineTotal: 40.0,
                          productRawMaterialCost: 0,
                          productProfit: 40.0,
                          rawMaterials: [],
                          perPlate: 40.0,
                        },
                        {
                          productName: 'சின்ன வெங்காயம் சாம்பார்',
                          productSecondaryName: null,
                          quantity: 1,
                          productUnitPrice: 60.0,
                          productLineTotal: 60.0,
                          productRawMaterialCost: 0,
                          productProfit: 60.0,
                          rawMaterials: [],
                          perPlate: 60.0,
                        },
                      ],
                      additionalMenuItems: [
                        {
                          productName: 'சுக்கு பால்',
                          productSecondaryName: null,
                          quantity: 100,
                          productUnitPrice: 40.0,
                          productLineTotal: 4000.0,
                          productRawMaterialCost: 0,
                          productProfit: 4000.0,
                          rawMaterials: [],
                          perPlate: 40.0,
                        },
                      ],
                      additionalItems: [],
                      rawMaterialUsage: null,
                    },
                  ],
                },
                timestamp: '2026-05-05T08:13:59.49958359',
              }}
            />
          }
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="*" element={<Navigate to={appRoutes.orders.path} />} />
            <Route path={appRoutes.dashboard.path} element={<Dashboard />} />
            <Route path={appRoutes.master.path} element={<MasterPage />} />
            <Route
              path={appRoutes.master.children.userManagement}
              element={<UsersPage />}
            />
            <Route
              path={appRoutes.master.children.masterCategories}
              element={<MasterCategoriesPage />}
            />
            <Route path={appRoutes.reports.path} element={<ReportsPage />} />
            <Route
              path={appRoutes.reports.children.download}
              element={<DownloadReportsPage />}
            />
            <Route
              path={appRoutes.rawMaterials.path}
              element={<RawMaterialsPage />}
            />
            <Route
              path={appRoutes.categories.path}
              element={<CategoriesPage />}
            />
            <Route path={appRoutes.expenses.path} element={<ExpensePage />} />

            <Route path={appRoutes.products.path} element={<ProductsPage />} />
            <Route path={appRoutes.recipes.path} element={<RecipesPage />} />
            <Route
              path={appRoutes.calculateRawMaterials.path}
              element={<CalculateRawMaterialsPage />}
            />
            <Route
              path={appRoutes.recipes.children.detail}
              element={<RecipeDetailsPage />}
            />
            <Route
              path={appRoutes.additionalItems.path}
              element={<AdditionalItemsPage />}
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
            <Route
              path={appRoutes.driver.children.driverPendingOrdersPage}
              element={<DriverPendingOrdersPage />}
            />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
