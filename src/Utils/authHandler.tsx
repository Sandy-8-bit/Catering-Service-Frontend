import { appRoutes } from '@/routes/appRoutes'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

// eslint-disable-next-line react-refresh/only-export-components
export function authHandler() {
  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('token='))
    ?.split('=')[1]

  if (!token) {
    HandleUnauthorized()
  }

  return token
}

export function HandleUnauthorized() {
  const navigate = useNavigate()
  const location = useLocation()

  return () => {
    toast.error('Unauthorized. Please login again.')

    setTimeout(() => {
      const currentPath = location.pathname + location.search
      const redirectPath = `${appRoutes.signInPage}?redirect=${encodeURIComponent(currentPath)}`
      navigate(redirectPath, { replace: true })
    }, 8000)
  }
}
