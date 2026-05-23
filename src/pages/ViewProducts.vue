<template>
  <div class="viewport">
    <div class="products-page">

      <!-- Sidebar -->
      <SidebarAdmin v-if="isAdmin" />
      <SidebarStaff v-else />

      <!-- Main Content -->
      <div class="main-content">

        <!-- Page Title -->
        <h1 class="page-title">List of Products</h1>

        <!-- Add New Product Button (Admin only) -->
        <button
          v-if="isAdmin"
          class="add-new-btn"
          @click="$router.push('/admin/add-product')"
        >
          Add New Product
        </button>

        <!-- Search Bar -->
        <div class="search-wrapper">
          <input
            type="text"
            placeholder="Enter Product ID/Name"
            v-model="searchQuery"
            class="search-input"
            @keyup.enter="handleSearch"
          />
        </div>

        <!-- Category Filter -->
        <div class="filter-row">
          <span class="filter-label">Search by Category:</span>
          <div class="filter-btn" @click="toggleCategory">
            <span class="filter-text">{{ selectedCategory || 'All' }}</span>
            <div class="arrow-down-small"></div>
          </div>
        </div>

        <!-- Category Popup -->
        <div class="popup category-popup" v-if="showCategory">
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="popup-item"
            @click="selectCategory(cat.name)"
          >
            {{ cat.name }}
          </div>
        </div>

        <!-- Sort By -->
        <div class="sortby-wrapper">
          <span class="sortby-label">Sort by:</span>
          <div class="sortby-btn" @click="toggleSortBy">
            <span class="sortby-text">{{ selectedSortBy || '' }}</span>
            <div class="arrow-down-small"></div>
          </div>
        </div>

        <!-- Sort By Popup -->
        <div class="popup sortby-popup" v-if="showSortBy">
          <div
            v-for="option in sortOptions"
            :key="option"
            class="popup-item"
            @click="selectSortBy(option)"
          >
            {{ option }}
          </div>
        </div>

        <!-- Products Frame -->
        <div class="products-frame">
          <div class="products-grid" v-if="filteredProducts.length > 0">
            <div
              v-for="product in filteredProducts"
              :key="product.id"
              class="product-card"
              @click="goToEdit(product.id)"
            >
              <!-- Product Image -->
              <div class="product-image">
                <img
                  v-if="product.imageUrl"
                  :src="product.imageUrl"
                  :alt="product.name"
                  class="product-img"
                />
                <template v-else>
                  <div class="img-line1"></div>
                  <div class="img-line2"></div>
                </template>
              </div>

              <!-- Product Info -->
              <p class="product-name">{{ product.name }}</p>
              <p class="product-stock">Stock: {{ product.quantity }}</p>
              <p class="product-price">Price: ₱{{ product.price.toFixed(2) }}</p>

              <!-- Add Stock Button (Admin only) -->
              <div
                v-if="isAdmin"
                class="plus-btn"
                @click.stop="openAddStock(product)"
              >
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <rect width="80" height="80" rx="8" fill="#666666"/>
                  <path d="M40 20V60M20 40H60" stroke="white" stroke-width="8" stroke-linecap="round"/>
                </svg>
              </div>

            </div>
          </div>
          <div v-else class="no-products">
            <p>No products found.</p>
          </div>
        </div>

        <!-- Scrollbar -->
        <div class="custom-scrollbar"></div>

      </div>

      <!-- Add Stock Popup -->
      <div class="overlay" v-if="showAddStock">
        <div class="addstock-popup">
          <!-- X Close Button -->
          <div class="close-btn" @click="closeAddStock">✕</div>
          <p class="addstock-title">Enter Additional Stock:</p>
          <div class="addstock-input-wrapper">
            <input
              type="number"
              v-model="additionalStock"
              class="addstock-input"
              placeholder="e.g. 1"
              min="1"
            />
            <div class="arrows">
              <div class="arrow-up" @click="additionalStock++"></div>
              <div class="arrow-down" @click="additionalStock > 1 ? additionalStock-- : null"></div>
            </div>
          </div>
          <button class="okay-btn" @click="confirmAddStock">Okay</button>
        </div>
      </div>

      <!-- Add Stock Confirmation Popup -->
      <div class="overlay" v-if="showAddStockConfirm">
        <div class="confirm-popup">
          <p class="confirm-text">
            {{ additionalStock }} + {{ selectedProduct?.quantity }} Stock Added.
            New Stock: {{ (selectedProduct?.quantity || 0) + parseInt(additionalStock || 0) }}
          </p>
          <button class="okay-btn" @click="handleAddStock">Okay</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import SidebarAdmin from '../components/SidebarAdmin.vue'
import SidebarStaff from '../components/SidebarStaff.vue'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'

export default {
  name: 'ViewProducts',
  components: { SidebarAdmin, SidebarStaff },
  data() {
    return {
      products: [],
      filteredProducts: [],
      searchQuery: '',
      categories: [],
      selectedCategory: 'All',
      showCategory: false,
      selectedSortBy: 'Default',
      showSortBy: false,
      sortOptions: ['Least Quantity', 'Most Quantity', 'Best Selling', 'Default'],
      isAdmin: false,
      showAddStock: false,
      showAddStockConfirm: false,
      selectedProduct: null,
      additionalStock: 1
    }
  },
  async mounted() {
    this.scaleToFit()
    window.addEventListener('resize', this.scaleToFit)
    await this.checkRole()
    await this.loadCategories()
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
      const page = document.querySelector('.products-page')
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
        console.log('Current user UID:', uid)
        if (uid) {
            const { doc, getDoc } = await import('firebase/firestore')
            const userDoc = await getDoc(doc(db, 'users', uid))
            if (userDoc.exists()) {
            this.isAdmin = userDoc.data().role === 'admin'
            console.log('Role:', userDoc.data().role)
            console.log('isAdmin:', this.isAdmin)
            } else {
            console.log('User document not found in Firestore')
            }
        } else {
            console.log('No current user found')
        }
    },
    async loadCategories() {
      const snapshot = await getDocs(collection(db, 'categories'))
      this.categories = [
        { id: 'all', name: 'All' },
        ...snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }))
      ]
    },
    async loadProducts() {
      const snapshot = await getDocs(collection(db, 'products'))
      this.products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      this.applyFilters()
    },
    applyFilters() {
      let result = [...this.products]

      // Filter by category
      if (this.selectedCategory && this.selectedCategory !== 'All') {
        result = result.filter(p => p.category === this.selectedCategory)
      }

      // Filter by search
      if (this.searchQuery.trim()) {
        result = result.filter(p =>
          p.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      }

      // Sort
      if (this.selectedSortBy === 'Least Quantity') {
        result.sort((a, b) => a.quantity - b.quantity)
      } else if (this.selectedSortBy === 'Most Quantity') {
        result.sort((a, b) => b.quantity - a.quantity)
      }

      this.filteredProducts = result
    },
    handleSearch() {
      this.applyFilters()
    },
    toggleCategory() {
      this.showCategory = !this.showCategory
      this.showSortBy = false
    },
    selectCategory(name) {
      this.selectedCategory = name
      this.showCategory = false
      this.applyFilters()
    },
    toggleSortBy() {
      this.showSortBy = !this.showSortBy
      this.showCategory = false
    },
    selectSortBy(option) {
      this.selectedSortBy = option
      this.showSortBy = false
      this.applyFilters()
    },
    goToEdit(id) {
      if (this.isAdmin) {
        this.$router.push(`/admin/edit-product/${id}`)
      }
    },
    openAddStock(product) {
      this.selectedProduct = product
      this.additionalStock = 1
      this.showAddStock = true
    },
    closeAddStock() {
      this.showAddStock = false
      this.selectedProduct = null
    },
    confirmAddStock() {
      if (!this.additionalStock || this.additionalStock < 1) {
        alert('Please enter a valid quantity.')
        return
      }
      this.showAddStock = false
      this.showAddStockConfirm = true
    },
    async handleAddStock() {
      try {
        const newQuantity = this.selectedProduct.quantity + parseInt(this.additionalStock)
        await updateDoc(doc(db, 'products', this.selectedProduct.id), {
          quantity: newQuantity
        })
        this.selectedProduct.quantity = newQuantity
        this.showAddStockConfirm = false
        this.selectedProduct = null
        await this.loadProducts()
      } catch (error) {
        console.error('Error updating stock:', error)
        alert('Failed to update stock. Please try again.')
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

.products-page {
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
  left: 56px;
  top: 46px;
  font-style: italic;
  font-weight: 700;
  font-size: 50px;
  line-height: 61px;
  color: #000000;
}

.add-new-btn {
  position: absolute;
  width: 383px;
  height: 81px;
  left: 1154px;
  top: 39px;
  background: #B5BDA0;
  border: none;
  border-radius: 15px;
  font-weight: 700;
  font-size: 40px;
  color: #FFFFFF;
  cursor: pointer;
}

.add-new-btn:hover {
  opacity: 0.9;
}

/* Search */
.search-wrapper {
  position: absolute;
  left: 41px;
  top: 149px;
  width: 583px;
  height: 89px;
  background: #FFFFFF;
  border: 3px solid #000000;
  border-radius: 15px;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.search-input {
  border: none;
  outline: none;
  font-style: italic;
  font-size: 35px;
  color: #646464;
  background: transparent;
  width: 100%;
}

.search-input::placeholder {
  color: #646464;
}

/* Category Filter */
.filter-row {
  position: absolute;
  left: 639px;
  top: 141px;
  display: flex;
  align-items: center;
  gap: 0;
}

.filter-label {
  width: 210px;
  font-style: italic;
  font-size: 30px;
  line-height: 36px;
  text-align: center;
  color: #000000;
}

.filter-btn {
  width: 320px;
  height: 89px;
  background: #FFFFFF;
  border: 3px solid #000000;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  cursor: pointer;
}

.filter-text {
  font-style: italic;
  font-size: 30px;
  color: #646464;
}

/* Sort By */
.sortby-wrapper {
  position: absolute;
  left: 1189px;
  top: 141px;
  display: flex;
  align-items: center;
}

.sortby-label {
  width: 133px;
  font-style: italic;
  font-size: 30px;
  text-align: center;
  color: #000000;
}

.sortby-btn {
  width: 276px;
  height: 89px;
  background: #FFFFFF;
  border: 3px solid #000000;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  cursor: pointer;
}

.sortby-text {
  font-style: italic;
  font-size: 28px;
  color: #646464;
}

.arrow-down-small {
  width: 45px;
  height: 35px;
  background: #6D6D6D;
  clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
  flex-shrink: 0;
}

/* Popups */
.popup {
  position: absolute;
  background: #636363;
  z-index: 100;
}

.category-popup {
  width: 315px;
  left: 849px;
  top: 230px;
}

.sortby-popup {
  width: 286px;
  left: 1322px;
  top: 230px;
}

.popup-item {
  width: 100%;
  height: 76px;
  background: #DADADA;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
  font-size: 38px;
  color: #646464;
  cursor: pointer;
  border-bottom: 2px solid #636363;
}

.popup-item:hover {
  background: #c8c8c8;
}

/* Products Frame */
.products-frame {
  position: absolute;
  left: 46px;
  top: 268px;
  width: 1461px;
  height: 812px;
  border: 3px solid #000000;
  overflow-y: auto;
  overflow-x: hidden;
}

.products-frame::-webkit-scrollbar {
  width: 9px;
}

.products-frame::-webkit-scrollbar-thumb {
  background: #6D6D6D;
  border-radius: 4px;
}

.products-frame::-webkit-scrollbar-track {
  background: transparent;
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(3, 428px);
  gap: 20px;
  padding: 20px;
}

.no-products {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-style: italic;
  font-size: 35px;
  color: #646464;
}

/* Product Card */
.product-card {
  position: relative;
  width: 428px;
  height: 383px;
  background: #B5BDA0;
  border-radius: 15px;
  cursor: pointer;
}

.product-card:hover {
  opacity: 0.95;
}

/* Product Image */
.product-image {
  position: absolute;
  width: 385px;
  height: 198px;
  left: 21px;
  top: 19px;
  background: #FFFFFF;
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

.product-name {
  position: absolute;
  left: 18px;
  top: 232px;
  width: 229px;
  font-style: italic;
  font-size: 30px;
  color: #646464;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-stock {
  position: absolute;
  left: 15px;
  top: 282px;
  font-style: italic;
  font-size: 30px;
  color: #646464;
  margin: 0;
}

.product-price {
  position: absolute;
  left: 18px;
  top: 328px;
  font-style: italic;
  font-size: 30px;
  color: #646464;
  margin: 0;
}

.plus-btn {
  position: absolute;
  right: 15px;
  top: 282px;
  cursor: pointer;
  z-index: 10;
}

.plus-btn:hover {
  opacity: 0.8;
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

/* Add Stock Popup */
.addstock-popup {
  position: relative;
  width: 556px;
  height: 403px;
  background: #636363;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 40px 34px;
}

.close-btn {
  position: absolute;
  top: 14px;
  left: 20px;
  width: 38px;
  height: 38px;
  background: #EC1C24;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 700;
}

.addstock-title {
  font-style: italic;
  font-size: 38px;
  color: #FFFFFF;
  text-align: center;
  margin: 0;
}

.addstock-input-wrapper {
  width: 462px;
  height: 106px;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  padding: 0 20px;
  justify-content: space-between;
}

.addstock-input {
  border: none;
  outline: none;
  font-style: italic;
  font-size: 38px;
  color: #646464;
  background: transparent;
  width: 100%;
}

.addstock-input::placeholder {
  color: #646464;
}

.arrows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.arrow-up {
  width: 40px;
  height: 31px;
  background: #6D6D6D;
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  cursor: pointer;
}

.arrow-down {
  width: 40px;
  height: 31px;
  background: #6D6D6D;
  clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
  cursor: pointer;
}

.okay-btn {
  width: 205px;
  height: 76px;
  background: #B5BDA0;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
  font-weight: 700;
  font-size: 38px;
  color: #FFFFFF;
  cursor: pointer;
}

.okay-btn:hover {
  opacity: 0.9;
}

/* Add Stock Confirmation */
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
  gap: 24px;
  padding: 28px 34px;
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
</style>