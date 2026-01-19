import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Cookies from 'js-cookie'
import { appRoutes } from '../../routes/appRoutes'
import { isTokenExpired } from '../../utils/isJwtExpired'

const DRIVER_DASHBOARD_PATH = '/driver/driver-dashboard'

const ProtectedRoute = () => {
  const token = Cookies.get('CATERING_TOKEN')
  const role = localStorage.getItem('CATERING_ROLE')
  const userId = localStorage.getItem('CATERING_USER_ID')
  const location = useLocation()

  // ❌ No token or expired token → logout
  if (!token || isTokenExpired(token)) {
    Cookies.remove('CATERING_TOKEN')
    localStorage.clear()
    return <Navigate to={appRoutes.signInPage} replace />
  }

  // 🚫 DRIVER: block EVERYTHING except driver dashboard
  if (role === 'DRIVER' && userId) {
    const allowedPath = `${DRIVER_DASHBOARD_PATH}/${userId}`

    // If driver tries ANY other route → force redirect
    if (location.pathname !== allowedPath) {
      return <Navigate to={allowedPath} replace />
    }
  }

  // ✅ ADMIN → allow access normally
  return <Outlet />
}

export default ProtectedRoute
