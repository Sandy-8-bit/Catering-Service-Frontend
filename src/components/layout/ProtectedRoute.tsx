import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Cookies from 'js-cookie'
import { appRoutes } from '../../routes/appRoutes'
import { isTokenExpired } from '../../utils/isJwtExpired'

const ProtectedRoute = () => {
  const token = Cookies.get('CATERING_TOKEN')
  const role = localStorage.getItem('CATERING_ROLE')
  const userId = localStorage.getItem('CATERING_USER_ID')
  const location = useLocation()
  const normalizedRole = (role ?? '').toUpperCase()
  console.log('Unauthorized from handle unauthroized')
  // ❌ No token or expired token → logout
  if (!token || isTokenExpired(token)) {
    Cookies.remove('CATERING_TOKEN')
    localStorage.clear()
    return <Navigate to={appRoutes.signInPage} replace />
  }

  // 🚫 DRIVER access rules
  if (normalizedRole === 'DRIVER' && userId) {
    const allowedDriverDashboard = `/driver/driver-dashboard/${userId}`

    const allowedDriverPaths = [
      allowedDriverDashboard,
      '/driver/order', // prefix match
      '/driver/pending-orders', // prefix match
    ]

    const isAllowed = allowedDriverPaths.some((path) =>
      location.pathname.startsWith(path)
    )

    if (!isAllowed) {
      return <Navigate to={allowedDriverDashboard} replace />
    }
  }

  // 🚫 STAFF access rules: only order management and driver pages
  if (normalizedRole === 'STAFF') {
    const allowedStaffPaths = [appRoutes.orders.path, appRoutes.driver.path]

    const isAllowed = allowedStaffPaths.some((path) =>
      location.pathname.startsWith(path)
    )

    if (!isAllowed) {
      return <Navigate to={appRoutes.orders.path} replace />
    }
  }

  // ✅ ADMIN / others
  return <Outlet />
}

export default ProtectedRoute
