import { createRouter, createWebHistory } from 'vue-router'
import { getAuth } from 'firebase/auth'
import LoginPage from '../pages/LoginPage.vue'
import AdminDashboard from '../pages/AdminDashboard.vue'
import AddSales from '../pages/AddSales.vue'
import ViewProducts from '../pages/ViewProducts.vue'
import AddProduct from '../pages/AddProduct.vue'
import EditProduct from '../pages/EditProduct.vue'
import Reports from '../pages/Reports.vue'

const routes = [
  { 
    path: '/', 
    component: LoginPage,
    meta: { requiresGuest: true }
  },
  { 
    path: '/admin/dashboard', 
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/add-sales', 
    component: AddSales,
    meta: { requiresAuth: true }
  },
  { 
    path: '/admin/products', 
    component: ViewProducts,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/products', 
    component: ViewProducts,
    meta: { requiresAuth: true }
  },
  { 
    path: '/admin/add-product', 
    component: AddProduct,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/admin/edit-product/:id', 
    component: EditProduct,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/reports', 
    component: Reports,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from) => {
  const auth = getAuth()
  const user = auth.currentUser

  if (to.meta.requiresAuth && !user) {
    return '/'
  } else if (to.meta.requiresGuest && user) {
    return '/add-sales'
  }
  return true
})

export default router