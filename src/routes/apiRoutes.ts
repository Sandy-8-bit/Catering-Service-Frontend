export const apiRoutes = {
  // AUTH
  login: '/api/auth/login',
  register: '/api/auth/register',
  verify: '/api/auth/verify-totp',

  // MASTER ROUTES
  categories: '/api/admin/categories',
  rawMaterials: '/api/admin/raw-materials',
  additionalItems: '/api/admin/additional-items',
  users: '/api/admin/users',
  orders: '/api/admin/orders',
  products: '/api/admin/products',
  recipes: '/api/admin/recipes',


  //driver routes
  driverdashboard: '/api/driver/dashboard',
  driverorder: '/api/driver/deliveries/order',
  driverDeliveries:"/api/driver/deliveries"
}
