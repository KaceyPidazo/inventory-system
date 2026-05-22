<template>
  <div class="viewport">
    <div class="dashboard-page">

      <!-- Sidebar -->
      <SidebarAdmin />

      <!-- Main Content -->
      <div class="main-content">

        <!-- Page Title -->
        <h1 class="page-title">Dashboard</h1>

        <!-- Sort By -->
        <div class="sortby-wrapper">
            <span class="sortby-label">Sort by:</span>
            <div class="sortby-btn" @click="toggleSortBy">
                <span class="sortby-selected">{{ selectedSortBy || '' }}</span>
                <div class="arrow-down-small"></div>
            </div>
            </div>

            <!-- Sort By Popup (moved outside wrapper) -->
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

        <!-- Charts Row -->
        <div class="charts-row">

          <!-- Products Sold Breakdown -->
          <div class="chart-block">
            <p class="chart-label">Products Sold Breakdown</p>
            <div class="chart-placeholder circle"></div>
          </div>

          <!-- Best Selling Products -->
          <div class="chart-block">
            <p class="chart-label">Best Selling Products (Per Category)</p>
            <div class="chart-placeholder rect"></div>
          </div>

          <!-- Monthly Reports -->
          <div class="chart-block">
            <p class="chart-label">Monthly Reports</p>
            <div class="chart-placeholder rect"></div>
          </div>

        </div>

        <!-- Category Dropdown -->
        <div class="category-wrapper" @click="toggleCategory">
          <span class="category-text">{{ selectedCategory || 'Choose Category' }}</span>
          <div class="arrow-down-large"></div>
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

      </div>
    </div>
  </div>
</template>

<script>
import SidebarAdmin from '../components/SidebarAdmin.vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

export default {
  name: 'AdminDashboard',
  components: { SidebarAdmin },
  data() {
    return {
      categories: [],
      selectedCategory: '',
      showCategory: false,
      selectedSortBy: '',
      showSortBy: false,
      sortOptions: ['Least Quantity', 'Most Quantity', 'Best Selling', 'Default']
    }
  },
  async mounted() {
    this.scaleToFit()
    window.addEventListener('resize', this.scaleToFit)
    await this.loadCategories()
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.scaleToFit)
  },
  methods: {
    scaleToFit() {
      const scaleX = window.innerWidth / 1920
      const scaleY = window.innerHeight / 1080
      const scale = Math.min(scaleX, scaleY)
      const page = document.querySelector('.dashboard-page')
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
    async loadCategories() {
        const snapshot = await getDocs(collection(db, 'categories'))
        this.categories = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        }))
        console.log('Categories loaded:', this.categories)
    },
    toggleCategory() {
      this.showCategory = !this.showCategory
      this.showSortBy = false
    },
    selectCategory(name) {
      this.selectedCategory = name
      this.showCategory = false
    },
    toggleSortBy() {
      this.showSortBy = !this.showSortBy
      this.showCategory = false
    },
    selectSortBy(option) {
      this.selectedSortBy = option
      this.showSortBy = false
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

.dashboard-page {
  position: absolute;
  width: 1920px;
  height: 1080px;
  background: #FFFDF1;
  overflow: hidden;
  flex-shrink: 0;
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
  left: 41px;
  top: 38px;
  font-style: italic;
  font-weight: 700;
  font-size: 50px;
  line-height: 61px;
  color: #000000;
}

/* Sort By */
.sortby-wrapper {
  position: absolute;
  left: 1189px;
  top: 141px;
  display: flex;
  align-items: center;
  gap: 0;
}

.sortby-label {
  width: 133px;
  font-style: italic;
  font-weight: 400;
  font-size: 30px;
  line-height: 36px;
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

.sortby-selected {
  font-style: italic;
  font-size: 28px;
  color: #646464;
}

.arrow-down-small {
  width: 45px;
  height: 35px;
  background: #6D6D6D;
  clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
}

/* Category */
.category-wrapper {
  position: absolute;
  left: 528px;
  top: 614px;
  width: 427px;
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

.category-text {
  font-style: italic;
  font-weight: 400;
  font-size: 40px;
  line-height: 48px;
  color: #646464;
}

.arrow-down-large {
  width: 73px;
  height: 56px;
  background: #D9D9D9;
  clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
}

/* Popups */
.popup {
  position: absolute;
  background: #636363;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.category-popup {
  width: 315px;
  left: 528px;
  top: 703px;
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
  font-weight: 400;
  font-size: 38px;
  line-height: 46px;
  color: #646464;
  cursor: pointer;
  border-bottom: 2px solid #636363;
}

.popup-item:hover {
  background: #c8c8c8;
}

/* Charts */
.charts-row {
  position: absolute;
  top: 247px;
  left: 107px;
  display: flex;
  gap: 90px;
  align-items: flex-start;
}

.chart-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.chart-label {
  width: 332px;
  font-style: italic;
  font-weight: 400;
  font-size: 30px;
  line-height: 36px;
  text-align: center;
  color: #000000;
  margin: 0;
}

.chart-placeholder.circle {
  width: 270px;
  height: 270px;
  background: #D9D9D9;
  border-radius: 50%;
}

.chart-placeholder.rect {
  width: 422px;
  height: 244px;
  background: #D9D9D9;
}
</style>