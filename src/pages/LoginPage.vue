<template>
  <div class="viewport">
    <div class="login-page">

      <!-- Logo -->
      <div class="logo">
        <img src="../assets/fonekingdom_logo.png" alt="Fone Kingdom Logo" />
      </div>

      <!-- Login Card -->
      <div class="login-card">

        <!-- Title -->
        <h1 class="title">INVENTORY SYSTEM</h1>

        <!-- Subtitle -->
        <p class="subtitle">Enter your credentials</p>

        <!-- Email Field -->
        <div class="input-wrapper">
          <span class="input-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="57" height="57" viewBox="0 0 57 57" fill="none">
              <circle cx="28.5" cy="22" r="11" stroke="black" stroke-width="1.5"/>
              <path d="M10 46c0-10 8-17 18.5-17S47 36 47 46" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </span>
          <input
            type="email"
            placeholder="Enter your email"
            v-model="email"
            class="input-field"
          />
        </div>

        <!-- Password Field -->
        <div class="input-wrapper">
          <span class="input-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50" fill="none">
              <rect x="8" y="21" width="34" height="24" rx="3" stroke="black" stroke-width="1.5"/>
              <path d="M16 21v-6a9 9 0 0 1 18 0v6" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="25" cy="33" r="3" fill="black"/>
            </svg>
          </span>
          <input
            type="password"
            placeholder="Enter your password"
            v-model="password"
            class="input-field"
          />
        </div>

        <!-- Error Message -->
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <!-- Login Button -->
        <button @click="handleLogin" class="login-btn">
          Login
        </button>

      </div>
    </div>
  </div>
</template>

<script>
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

export default {
  name: 'LoginPage',
  data() {
    return {
      email: '',
      password: '',
      errorMessage: ''
    }
  },
  mounted() {
    this.scaleToFit()
    window.addEventListener('resize', this.scaleToFit)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.scaleToFit)
  },
  methods: {
    scaleToFit() {
        const scaleX = window.innerWidth / 1920
        const scaleY = window.innerHeight / 1080
        const scale = Math.min(scaleX, scaleY)
        const page = document.querySelector('.login-page')
        if (page) {
            page.style.transform = `scale(${scale})`
            page.style.transformOrigin = 'center center'
        }
    },
    async handleLogin() {
      this.errorMessage = ''
      try {
        const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password)
        const uid = userCredential.user.uid
        const userDoc = await getDoc(doc(db, 'users', uid))
        if (userDoc.exists()) {
          const role = userDoc.data().role
          if (role === 'admin') {
            this.$router.push('/admin/dashboard')
          } else {
            this.$router.push('/add-sales')
          }
        } else {
          this.errorMessage = 'Account not found. Please contact your administrator.'
        }
      } catch (error) {
        this.errorMessage = 'Invalid email or password. Please try again.'
      }
    }
  }
}
</script>

<style scoped>
* {
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

.viewport {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFDF1;
}

.login-page {
  width: 1920px;
  height: 1080px;
  background: #FFFDF1;
  overflow: hidden;
  transform-origin: center center;
  flex-shrink: 0;
}

.logo {
  position: absolute;
  width: 843px;
  height: 839px;
  left: 117px;
  top: 139px;
}

.logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.login-card {
  position: absolute;
  width: 575px;
  height: 546px;
  left: 1098px;
  top: 273px;
  background: #FFE4BF;
  box-shadow: 10px 10px 4px rgba(118, 118, 118, 0.25);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 32px 40px;
  gap: 16px;
}

.title {
  font-weight: 700;
  font-size: 30px;
  line-height: 36px;
  text-align: center;
  color: #630606;
  margin: 0;
}

.subtitle {
  font-size: 24px;
  font-weight: 400;
  color: #424242;
  margin: 0;
}

.input-wrapper {
  display: flex;
  align-items: center;
  width: 543px;
  height: 84.69px;
  background: #FFFFFF;
  border: 2px solid #000000;
  box-shadow: 0px 4px 4px rgba(74, 74, 74, 0.25);
  border-radius: 15px;
  padding: 0 16px;
  gap: 12px;
}

.input-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.input-field {
  border: none;
  outline: none;
  font-size: 30px;
  font-style: italic;
  font-weight: 400;
  color: #646464;
  background: transparent;
  width: 100%;
}

.input-field::placeholder {
  color: #646464;
}

.login-btn {
  width: 210px;
  height: 73.19px;
  background: #F2AF82;
  border: none;
  border-radius: 15px;
  font-size: 40px;
  font-weight: 700;
  color: #3D3D3D;
  cursor: pointer;
  margin-top: 8px;
}

.login-btn:hover {
  opacity: 0.9;
}

.error-message {
  color: #E22929;
  font-size: 14px;
  margin: 0;
  text-align: center;
}
</style>