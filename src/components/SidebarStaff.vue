<template>
  <div class="sidebar">

    <!-- Profile Picture -->
    <div class="profile-pic"></div>

    <!-- Hi Staff -->
    <p class="greeting">Hi, Staff!</p>

    <!-- Navigation Links -->
    <nav class="nav">
      <router-link to="/add-sales" class="nav-link" :class="{ active: $route.path === '/add-sales' }">Add Sales</router-link>
      <router-link to="/products" class="nav-link" :class="{ active: $route.path === '/products' }">Products</router-link>
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
  name: 'SidebarStaff',
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
  width: 137px;
  height: 36px;
  left: 79px;
  top: 216px;
  font-style: italic;
  font-weight: 700;
  font-size: 30px;
  line-height: 36px;
  text-align: center;
  color: #000000;
  margin: 0;
}

.nav {
  position: absolute;
  top: 454px;
  left: 0;
  width: 296px;
  display: flex;
  flex-direction: column;
  gap: 34px;
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
  text-align: center;
  color: #000000;
  cursor: pointer;
}

.logout-btn:hover {
  opacity: 0.8;
}
</style>