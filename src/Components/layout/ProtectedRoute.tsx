import { Navigate, Outlet } from 'react-router-dom'
import { appRoutes } from '../../routes/appRoutes'
import { isTokenExpired } from '../../utils/isJwtExpired'
import Cookies from 'js-cookie'

const ProtectedRoute = () => {
  const token = Cookies.get('CATERING_TOKEN')

  if (!token || isTokenExpired(token)) {
    Cookies.remove('CATERING_TOKEN') // remove token from cookie
    return <Navigate to={appRoutes.signInPage} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
