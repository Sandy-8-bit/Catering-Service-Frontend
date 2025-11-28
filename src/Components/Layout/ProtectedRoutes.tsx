import { Navigate, Outlet } from "react-router-dom";
import { appRoutes } from "../../Routes/appRoutes";
import { isTokenExpired } from "../../Utils/isJwtExpired";
import Cookies from "js-cookie";

const ProtectedRoute = () => {
  const token = Cookies.get("token");

  if (!token || isTokenExpired(token)) {
    Cookies.remove("token"); // remove token from cookie
    return <Navigate to={appRoutes.signInPage} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;