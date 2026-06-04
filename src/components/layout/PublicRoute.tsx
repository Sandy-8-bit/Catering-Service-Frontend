import { Navigate, Outlet } from 'react-router-dom'
import Cookies from 'js-cookie'
import { isTokenExpired } from '../../utils/isJwtExpired'
import { appRoutes } from '../../routes/appRoutes'

const PublicRoute = () => {
  const token = Cookies.get('CATERING_TOKEN')

  if (token && !isTokenExpired(token)) {
    return <Navigate to={appRoutes.orders.path} replace />
  }

  return <Outlet />
}

export default PublicRoute
