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
    children: {
      userManagement: '/master/user-management',
      masterCategories: '/master/master-categories',
    },
  },
  reports: {
    path: '/reports',
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
  calculateRawMaterials: {
    path: '/master/calculate-raw-materials',
    children: {},
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
  driver: {
    path: '/driver',
    children: {
      driverDashboard: '/driver/driver-dashboard/:id',
      driverOrderPage: '/driver/order/:orderId',
      driverPendingOrdersPage: '/driver/pending-orders/:id',
    },
  },
}
