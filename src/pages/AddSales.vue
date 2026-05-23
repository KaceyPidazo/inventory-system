<template>
  <div class="viewport">
    <div class="addsales-page">

      <!-- Sidebar — dynamic based on role -->
      <SidebarAdmin v-if="isAdmin" />
      <SidebarStaff v-else />

      <!-- Main Content -->
      <div class="main-content">

        <!-- Page Title -->
        <h1 class="page-title">Add New Sale</h1>

        <!-- Product Image -->
        <div class="product-image">
          <img
            v-if="selectedProduct && selectedProduct.imageUrl"
            :src="selectedProduct.imageUrl"
            :alt="selectedProduct.name"
            class="product-img"
          />
          <template v-else>
            <div class="img-line1"></div>
            <div class="img-line2"></div>
          </template>
        </div>

        <!-- Product Name Input with Dropdown -->
        <div class="input-wrapper" style="top: 277px;">
          <input
            type="text"
            placeholder="Enter Product ID/Name"
            v-model="searchQuery"
            class="input-field"
            @input="filterProducts"
            @focus="showDropdown = true"
          />
        </div>

        <!-- Product Dropdown -->
        <div class="product-dropdown" v-if="showDropdown && filteredProducts.length > 0">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="dropdown-item"
            @click="selectProduct(product)"
          >
            {{ product.name }}
          </div>
        </div>

        <!-- Quantity Input -->
        <div class="input-wrapper" style="top: 385px;">
          <input
            type="number"
            placeholder="Enter Quantity"
            v-model="quantity"
            class="input-field"
            min="1"
            @input="updateSummary"
          />
          <div class="arrows">
            <div class="arrow-up" @click="incrementQuantity"></div>
            <div class="arrow-down" @click="decrementQuantity"></div>
          </div>
        </div>

        <!-- Summary -->
        <div class="summary" v-if="selectedProduct">
          <p>Price Per Piece: ₱{{ selectedProduct.price.toFixed(2) }}</p>
          <p>Total Quantity: {{ quantity || 0 }}</p>
          <p>Total Price: ₱{{ totalPrice.toFixed(2) }}</p>
        </div>
        <div class="summary" v-else>
          <p>Price Per Piece: ₱0.00</p>
          <p>Total Quantity: 0</p>
          <p>Total Price: ₱0.00</p>
        </div>

        <!-- Add Sales Button -->
        <button class="addsales-btn" @click="handleAddSales">Add Sales</button>

      </div>

      <!-- Submit Confirmation Popup -->
      <div class="overlay" v-if="showConfirm">
        <div class="confirm-popup">
          <p class="confirm-text">Are you sure you want to submit this?</p>
          <div class="confirm-buttons">
            <div class="confirm-btn" @click="submitSale">Yes</div>
            <div class="confirm-btn" @click="showConfirm = false">No</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import SidebarAdmin from '../components/SidebarAdmin.vue'
import SidebarStaff from '../components/SidebarStaff.vue'
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../firebase'

export default {
  name: 'AddSales',
  components: { SidebarAdmin, SidebarStaff },
  data() {
    return {
      isAdmin: false,
      products: [],
      filteredProducts: [],
      searchQuery: '',
      selectedProduct: null,
      showDropdown: false,
      quantity: null,
      showConfirm: false
    }
  },
  computed: {
    totalPrice() {
      if (!this.selectedProduct || !this.quantity) return 0
      return this.selectedProduct.price * parseInt(this.quantity)
    }
  },
  async mounted() {
    this.scaleToFit()
    window.addEventListener('resize', this.scaleToFit)
    await this.checkRole()
    await this.loadProducts()
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.scaleToFit)
  },
  methods: {
    scaleToFit() {
      const scaleX = window.innerWidth / 1920
      const scaleY = window.innerHeight / 1080
      const scale = Math.min(scaleX, scaleY)
      const page = document.querySelector('.addsales-page')
      if (page) {
        const scaledWidth = 1920 * scale
        const scaledHeight = 1080 * scale
        const offsetX = (window.innerWidth - scaledWidth) / 2
        const offsetY = (window.innerHeight - scaledHeight) / 2
        page.style.transform = `scale(${scale})`
        page.style.transformOrigin = 'top left'
        page.style.position = 'absolute'
        page.style.left = `${offsetX}px`
        page.style.top = `${offsetY}px`
      }
    },
    async checkRole() {
      const uid = auth.currentUser?.uid
      if (uid) {
        const { doc, getDoc } = await import('firebase/firestore')
        const userDoc = await getDoc(doc(db, 'users', uid))
        if (userDoc.exists()) {
          this.isAdmin = userDoc.data().role === 'admin'
        }
      }
    },
    async loadProducts() {
      const snapshot = await getDocs(collection(db, 'products'))
      this.products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      this.filteredProducts = this.products
    },
    filterProducts() {
      this.selectedProduct = null
      if (!this.searchQuery.trim()) {
        this.filteredProducts = this.products
      } else {
        this.filteredProducts = this.products.filter(p =>
          p.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      }
      this.showDropdown = true
    },
    selectProduct(product) {
      this.selectedProduct = product
      this.searchQuery = product.name
      this.showDropdown = false
      this.quantity = null
    },
    incrementQuantity() {
      this.quantity = (parseInt(this.quantity) || 0) + 1
    },
    decrementQuantity() {
      if (this.quantity > 1) this.quantity--
    },
    updateSummary() {},
    handleAddSales() {
      if (!this.selectedProduct) {
        alert('Please select a product.')
        return
      }
      if (!this.quantity || this.quantity < 1) {
        alert('Please enter a valid quantity.')
        return
      }
      if (parseInt(this.quantity) > this.selectedProduct.quantity) {
        alert(`Not enough stock. Available: ${this.selectedProduct.quantity}`)
        return
      }
      this.showConfirm = true
    },
    async submitSale() {
      this.showConfirm = false
      try {
        const newQuantity = this.selectedProduct.quantity - parseInt(this.quantity)

        // Add transaction to Firestore
        await addDoc(collection(db, 'transactions'), {
          timestamp: serverTimestamp(),
          productId: this.selectedProduct.id,
          productName: this.selectedProduct.name,
          price: this.selectedProduct.price,
          quantity: parseInt(this.quantity)
        })

        // Update product stock
        await updateDoc(doc(db, 'products', this.selectedProduct.id), {
          quantity: newQuantity
        })

        // Reset form
        this.searchQuery = ''
        this.selectedProduct = null
        this.quantity = null
        await this.loadProducts()

        alert('Sale recorded successfully!')
      } catch (error) {
        console.error('Error recording sale:', error)
        alert('Failed to record sale. Please try again.')
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
  background: #FFFDF1;
}

.addsales-page {
  position: absolute;
  width: 1920px;
  height: 1080px;
  background: #FFFDF1;
  overflow: hidden;
}

.main-content {
  position: absolute;
  left: 296px;
  top: 0;
  width: 1624px;
  height: 1080px;
}

.page-title {
  position: absolute;
  left: -80px;
  top: 46px;
  width: 608px;
  font-style: italic;
  font-weight: 700;
  font-size: 50px;
  line-height: 61px;
  text-align: center;
  color: #000000;
}

/* Product Image */
.product-image {
  position: absolute;
  width: 379.99px;
  height: 256.55px;
  left: 272px;
  top: 260.49px;
  background: #E6E6E6;
  overflow: hidden;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-line1 {
  position: absolute;
  width: 100%;
  height: 1px;
  background: #000000;
  top: 50%;
  transform: rotate(33.39deg);
  transform-origin: left center;
}

.img-line2 {
  position: absolute;
  width: 100%;
  height: 1px;
  background: #000000;
  top: 50%;
  transform: rotate(-33.77deg);
  transform-origin: left center;
}

/* Input Fields */
.input-wrapper {
  position: absolute;
  left: 737px;
  width: 583px;
  height: 89px;
  background: #FFFFFF;
  border: 3px solid #000000;
  border-radius: 15px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  justify-content: space-between;
}

.input-field {
  border: none;
  outline: none;
  font-style: italic;
  font-size: 35px;
  color: #646464;
  background: transparent;
  width: 100%;
}

.input-field::placeholder {
  color: #646464;
}

/* Product Dropdown */
.product-dropdown {
  position: absolute;
  left: 737px;
  top: 366px;
  width: 583px;
  background: #636363;
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-item {
  width: 100%;
  height: 76px;
  background: #DADADA;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
  font-size: 35px;
  color: #646464;
  cursor: pointer;
  border-bottom: 2px solid #636363;
}

.dropdown-item:hover {
  background: #c8c8c8;
}

/* Arrows */
.arrows {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.arrow-up {
  width: 40px;
  height: 31px;
  background: #D9D9D9;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  cursor: pointer;
}

.arrow-down {
  width: 40px;
  height: 31px;
  background: #D9D9D9;
  clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
  cursor: pointer;
}

/* Summary */
.summary {
  position: absolute;
  left: 737px;
  top: 521px;
  width: 439px;
  font-style: italic;
  font-size: 35px;
  line-height: 42px;
  color: #424242;
  display: flex;
  flex-direction: column;
  gap: 44px;
}

/* Add Sales Button */
.addsales-btn {
  position: absolute;
  width: 584px;
  height: 111px;
  left: 729px;
  top: 839px;
  background: #E22929;
  border: none;
  border-radius: 15px;
  font-weight: 700;
  font-size: 50px;
  color: #FFFFFF;
  cursor: pointer;
}

.addsales-btn:hover {
  opacity: 0.9;
}

/* Overlay */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 1920px;
  height: 1080px;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

/* Confirm Popup */
.confirm-popup {
  position: relative;
  width: 556px;
  height: 287px;
  background: #636363;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 34px;
  gap: 40px;
}

.confirm-text {
  width: 477px;
  font-style: italic;
  font-size: 38px;
  line-height: 46px;
  text-align: center;
  color: #FFFFFF;
  margin: 0;
}

.confirm-buttons {
  display: flex;
  gap: 52px;
}

.confirm-btn {
  width: 205px;
  height: 76px;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
  font-weight: 700;
  font-size: 38px;
  color: #646464;
  cursor: pointer;
}

.confirm-btn:hover {
  background: #f0f0f0;
}
</style>