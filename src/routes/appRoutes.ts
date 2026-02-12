export const appRoutes = {
  // -------- Public Pages --------
  homePage: '/Home',
  signInPage: '/signin',
  signUpPage: '/signup',
  errorPage: '/error',

  // -------- New Dashboard Parent Routes --------
  dashboard: {
    path: '/dashboard',
    children: {},
  },
  master: {
    path: '/master',
    children: {},
  },
  rawMaterials: {
    path: '/master/raw-materials',
    children: {},
  },
  categories: {
    path: '/master/categories',
    children: {},
  },
  products: {
    path: '/master/products',
    children: {},
  },
  recipes: {
    path: '/master/recipes',
    children: {
      detail: '/master/recipes/:productId',
    },
  },
  additionalItems: {
    path: '/master/additional-items',
    children: {},
  },
  orders: {
    path: '/order-management',
    children: {},
  },
  ordersForm: {
    path: '/order-management/form',
    children: {},
  },
  userManagement: {
    path: '/user-management',
    children: {},
  },
  driver: {
    path: '/driver',
    children: {
      driverDashboard: '/driver/driver-dashboard/:id',
      driverOrderPage: '/driver/order/:orderId',
    },
  },
}
