import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../pages/LoginPage.vue'
import AdminDashboard from '../pages/AdminDashboard.vue'
import AddSales from '../pages/AddSales.vue'
import ViewProducts from '../pages/ViewProducts.vue'
import AddProduct from '../pages/AddProduct.vue'
import EditProduct from '../pages/EditProduct.vue'
import Reports from '../pages/Reports.vue'

const routes = [
  { path: '/', component: LoginPage },
  { path: '/admin/dashboard', component: AdminDashboard },
  { path: '/add-sales', component: AddSales },
  { path: '/admin/products', component: ViewProducts },
  { path: '/admin/add-product', component: AddProduct },
  { path: '/admin/edit-product/:id', component: EditProduct },
  { path: '/reports', component: Reports },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router