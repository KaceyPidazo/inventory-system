<template>
  <div class="viewport">
    <div class="add-product-page">

      <!-- Sidebar -->
      <SidebarAdmin />

      <!-- Main Content -->
      <div class="main-content">

        <!-- Page Title -->
        <h1 class="page-title">Add New Product</h1>

        <!-- Image Placeholder -->
            <div class="image-placeholder" @click="triggerFileInput">
            <img
                v-if="imagePreview"
                :src="imagePreview"
                class="image-preview"
                alt="Product preview"
            />
            <template v-else>
                <div class="image-cross-line1"></div>
                <div class="image-cross-line2"></div>
            </template>
        </div>

        <!-- Add Picture Link -->
        <span class="add-picture" @click="triggerFileInput">Add Picture</span>
        <input
          type="file"
          ref="fileInput"
          accept="image/*"
          style="display:none"
          @change="handleImageUpload"
        />

        <!-- Product Name -->
        <div class="input-wrapper" style="top: 277px;">
          <input
            type="text"
            placeholder="Enter Product ID/Name"
            v-model="productName"
            class="input-field"
          />
        </div>

        <!-- Price -->
        <div class="input-wrapper" style="top: 385px;">
          <input
            type="number"
            placeholder="Enter Price"
            v-model="price"
            class="input-field"
            min="0"
          />
          <div class="arrows">
            <div class="arrow-up" @click="price++"></div>
            <div class="arrow-down" @click="price > 0 ? price-- : null"></div>
          </div>
        </div>

        <!-- Initial Quantity -->
        <div class="input-wrapper" style="top: 504px;">
          <input
            type="number"
            placeholder="Enter Initial Quantity"
            v-model="quantity"
            class="input-field"
            min="0"
          />
          <div class="arrows">
            <div class="arrow-up" @click="quantity++"></div>
            <div class="arrow-down" @click="quantity > 0 ? quantity-- : null"></div>
          </div>
        </div>

        <!-- Category Dropdown -->
        <div class="input-wrapper category-input" style="top: 613px;" @click="toggleCategory">
          <span class="input-field category-text">{{ selectedCategory || 'Choose Category' }}</span>
          <div class="arrow-down-icon"></div>
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

        <!-- Submit Button -->
        <button class="submit-btn" @click="showSubmitConfirm = true">Submit</button>

        <!-- Cancel Button -->
        <button class="cancel-btn" @click="showCancelConfirm = true">Cancel</button>

      </div>

      <!-- Submit Confirmation Popup -->
      <div class="overlay" v-if="showSubmitConfirm">
        <div class="confirm-popup">
          <p class="confirm-text">Are you sure you want to submit this?</p>
          <div class="confirm-buttons">
            <div class="confirm-btn" @click="handleSubmit">Yes</div>
            <div class="confirm-btn" @click="showSubmitConfirm = false">No</div>
          </div>
        </div>
      </div>

      <!-- Cancel Confirmation Popup -->
      <div class="overlay" v-if="showCancelConfirm">
        <div class="confirm-popup">
          <p class="confirm-text">Are you sure you want to cancel this?</p>
          <div class="confirm-buttons">
            <div class="confirm-btn" @click="handleCancel">Yes</div>
            <div class="confirm-btn" @click="showCancelConfirm = false">No</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import SidebarAdmin from '../components/SidebarAdmin.vue'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

export default {
  name: 'AddProduct',
  components: { SidebarAdmin },
  data() {
    return {
      productName: '',
      price: 0,
      quantity: 0,
      selectedCategory: '',
      showCategory: false,
      categories: [],
      imageFile: null,
      imagePreview: null,
      showSubmitConfirm: false,
      showCancelConfirm: false
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
      const page = document.querySelector('.add-product-page')
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
    },
    toggleCategory() {
      this.showCategory = !this.showCategory
    },
    selectCategory(name) {
      this.selectedCategory = name
      this.showCategory = false
    },
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleImageUpload(event) {
      const file = event.target.files[0]
      if (file) {
        this.imageFile = file
        this.imagePreview = URL.createObjectURL(file)
        console.log('Image selected:', this.imagePreview)
      }
    },
    async handleSubmit() {
        this.showSubmitConfirm = false
        if (!this.productName || !this.price || !this.selectedCategory) {
            alert('Please fill in all required fields.')
            return
        }
        try {
            let imageUrl = ''

            // Upload image to Firebase Storage if one was selected
            if (this.imageFile) {
            const storageRef = ref(storage, `products/${Date.now()}_${this.imageFile.name}`)
            const snapshot = await uploadBytes(storageRef, this.imageFile)
            imageUrl = await getDownloadURL(snapshot.ref)
            console.log('Image uploaded:', imageUrl)
            }

            // Save product to Firestore with image URL
            await addDoc(collection(db, 'products'), {
            name: this.productName,
            price: parseFloat(this.price),
            quantity: parseInt(this.quantity),
            category: this.selectedCategory,
            imageUrl: imageUrl
            })

            console.log('Product saved successfully')
            this.$router.push('/admin/products')
        } catch (error) {
            console.error('Error adding product:', error)
            alert('Failed to add product. Please try again.')
        }
    },
    handleCancel() {
      this.showCancelConfirm = false
      this.$router.push('/admin/products')
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

.add-product-page {
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
  left: 55px;
  top: 46px;
  font-style: italic;
  font-weight: 700;
  font-size: 50px;
  line-height: 61px;
  color: #000000;
}

/* Image Placeholder */
.image-placeholder {
  position: absolute;
  width: 379.99px;
  height: 256.55px;
  left: 272px;
  top: 260.49px;
  background: #E6E6E6;
  overflow: hidden;
}

/* .image-cross-line1 {
  position: absolute;
  width: 455px;
  height: 1px;
  background: #000000;
  top: 50%;
  left: -40px;
  transform: rotate(33.39deg);
}

.image-cross-line2 {
  position: absolute;
  width: 457px;
  height: 1px;
  background: #000000;
  top: 50%;
  left: -40px;
  transform: rotate(-33.77deg);
} */

.add-picture {
  position: absolute;
  left: 273px;
  top: 540px;
  font-style: italic;
  font-weight: 400;
  font-size: 35px;
  line-height: 42px;
  text-decoration: underline;
  color: #646464;
  cursor: pointer;
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
  font-weight: 400;
  font-size: 35px;
  line-height: 42px;
  color: #646464;
  background: transparent;
  width: 100%;
}

.input-field::placeholder {
  color: #646464;
}

.category-input {
  cursor: pointer;
}

.category-text {
  font-style: italic;
  font-size: 35px;
  color: #646464;
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

.arrow-down-icon {
  width: 40px;
  height: 31px;
  background: #6D6D6D;
  clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
  flex-shrink: 0;
}

/* Category Popup */
.popup {
  position: absolute;
  background: #636363;
  z-index: 100;
}

.category-popup {
  width: 315px;
  left: 737px;
  top: 702px;
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

/* Buttons */
.submit-btn {
  position: absolute;
  width: 272px;
  height: 111px;
  left: 273px;
  top: 829px;
  background: #B5BDA0;
  border: none;
  border-radius: 15px;
  font-weight: 700;
  font-size: 50px;
  line-height: 61px;
  color: #FFFFFF;
  cursor: pointer;
}

.submit-btn:hover {
  opacity: 0.9;
}

.cancel-btn {
  position: absolute;
  width: 272px;
  height: 111px;
  left: 592px;
  top: 829px;
  background: #E22929;
  border: none;
  border-radius: 15px;
  font-weight: 700;
  font-size: 50px;
  line-height: 61px;
  color: #FFFFFF;
  cursor: pointer;
}

.cancel-btn:hover {
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
  font-weight: 400;
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