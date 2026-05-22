<template>
  <div class="sidebar">

    <!-- Profile Picture -->
    <div class="profile-pic"></div>

    <!-- Hi Admin -->
    <p class="greeting">Hi, admin!</p>

    <!-- Navigation Links -->
    <nav class="nav">
      <router-link to="/admin/dashboard" class="nav-link" :class="{ active: $route.path === '/admin/dashboard' }">Dashboard</router-link>
      <router-link to="/add-sales" class="nav-link" :class="{ active: $route.path === '/add-sales' }">Add Sales</router-link>
      <router-link to="/admin/products" class="nav-link" :class="{ active: $route.path === '/admin/products' }">View Products</router-link>
      <router-link to="/admin/add-product" class="nav-link" :class="{ active: $route.path === '/admin/add-product' }">Add Product</router-link>
      <router-link to="/reports" class="nav-link" :class="{ active: $route.path === '/reports' }">Reports</router-link>
    </nav>

    <!-- Logout Button -->
    <button @click="handleLogout" class="logout-btn">Logout</button>

  </div>
</template>

<script>
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

export default {
  name: 'SidebarAdmin',
  methods: {
    async handleLogout() {
      await signOut(auth)
      this.$router.push('/')
    }
  }
}
</script>

<style scoped>
* {
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

.sidebar {
  position: absolute;
  width: 296px;
  height: 1080px;
  left: 0px;
  top: 0px;
  background: #FFE4BF;
}

.profile-pic {
  position: absolute;
  width: 155px;
  height: 155px;
  left: 70px;
  top: 46px;
  background: #FFFFFF;
  border-radius: 50%;
}

.greeting {
  position: absolute;
  width: 154px;
  height: 36px;
  left: 71px;
  top: 218px;
  font-style: italic;
  font-weight: 700;
  font-size: 30px;
  line-height: 36px;
  color: #000000;
}

.nav {
  position: absolute;
  top: 394px;
  left: 0;
  width: 296px;
  display: flex;
  flex-direction: column;
  gap: 40px;
  align-items: center;
}

.nav-link {
  font-style: italic;
  font-weight: 700;
  font-size: 30px;
  line-height: 36px;
  text-align: center;
  color: #000000;
  text-decoration: none;
  width: 100%;
  text-align: center;
}

.nav-link.active {
  text-decoration: underline;
}

.nav-link:hover {
  opacity: 0.7;
}

.logout-btn {
  position: absolute;
  width: 232px;
  height: 58px;
  left: 32px;
  top: 963px;
  background: #FFFFFF;
  border: none;
  border-radius: 15px;
  font-weight: 700;
  font-size: 30px;
  line-height: 36px;
  text-align: center;
  color: #000000;
  cursor: pointer;
}

.logout-btn:hover {
  opacity: 0.8;
}
</style>