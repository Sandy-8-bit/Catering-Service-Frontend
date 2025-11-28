import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignInPage from "./Pages/Auth/Auth";
import DashboardPage from "./Pages/Dashboard";
import ProtectedRoute from "./Components/Layout/ProtectedRoutes";

function App() {
  return (

      <Routes>

        {/* Public Route */}
        <Route path="/signin" element={<SignInPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<SignInPage />} />

      </Routes>

  );
}

export default App;
