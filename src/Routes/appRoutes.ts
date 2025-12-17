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
  rawMaterials: {
    path: '/raw-materials',
    children: {},
  },
  catergories: {
    path: '/categories',
    children: {},
  },
  products: {
    path: '/products',
    children: {},
  },
  additionalItems: {
    path: '/additional-items',
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
}
