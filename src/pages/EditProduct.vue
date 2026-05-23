<template>
  <div class="viewport">
    <div class="edit-product-page">

      <!-- Sidebar -->
      <SidebarAdmin />

      <!-- Main Content -->
      <div class="main-content">

        <!-- Page Title -->
        <h1 class="page-title">Edit Existing Product</h1>

        <!-- Image -->
        <div class="image-placeholder" @click="triggerFileInput">
          <img
            v-if="imagePreview"
            :src="imagePreview"
            class="image-preview"
            alt="Product"
          />
          <template v-else>
            <div class="img-line1"></div>
            <div class="img-line2"></div>
          </template>
        </div>

        <!-- Edit Picture Link -->
        <span class="edit-picture" @click="triggerFileInput">Edit Picture</span>
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
            placeholder="Edit Product ID/Name"
            v-model="productName"
            class="input-field"
          />
        </div>

        <!-- Price -->
        <div class="input-wrapper" style="top: 385px;">
          <input
            type="number"
            placeholder="Edit Price"
            v-model="price"
            class="input-field"
            min="0"
          />
          <div class="arrows">
            <div class="arrow-up" @click="price++"></div>
            <div class="arrow-down" @click="price > 0 ? price-- : null"></div>
          </div>
        </div>

        <!-- Add Stock Button -->
        <button class="addstock-btn" @click="showAddStock = true">+ Add Stock</button>

        <!-- Delete Product Button -->
        <button class="delete-btn" @click="showDeleteConfirm = true">Delete Product</button>

        <!-- Submit Button -->
        <button class="submit-btn" @click="showSubmitConfirm = true">Submit</button>

        <!-- Cancel Button -->
        <button class="cancel-btn" @click="showCancelConfirm = true">Cancel</button>

      </div>

      <!-- Add Stock Popup -->
      <div class="overlay" v-if="showAddStock">
        <div class="addstock-popup">
          <div class="close-btn" @click="showAddStock = false">✕</div>
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
        <div class="addstockconfirm-popup">
          <p class="confirm-text">
            {{ additionalStock }} + {{ originalQuantity }} Stock Added.
            New Stock: {{ originalQuantity + parseInt(additionalStock || 0) }}
          </p>
          <button class="okay-btn" @click="handleAddStock">Okay</button>
        </div>
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

      <!-- Delete Confirmation Popup -->
      <div class="overlay" v-if="showDeleteConfirm">
        <div class="confirm-popup">
          <p class="confirm-text">Are you sure you want to delete this?</p>
          <div class="confirm-buttons">
            <div class="confirm-btn delete-yes" @click="handleDelete">Yes</div>
            <div class="confirm-btn" @click="showDeleteConfirm = false">No</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import SidebarAdmin from '../components/SidebarAdmin.vue'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

export default {
  name: 'EditProduct',
  components: { SidebarAdmin },
  data() {
    return {
      productName: '',
      price: null,
      originalQuantity: 0,
      imagePreview: null,
      imageFile: null,
      existingImageUrl: '',
      additionalStock: 1,
      showAddStock: false,
      showAddStockConfirm: false,
      showSubmitConfirm: false,
      showCancelConfirm: false,
      showDeleteConfirm: false
    }
  },
  async mounted() {
    this.scaleToFit()
    window.addEventListener('resize', this.scaleToFit)
    await this.loadProduct()
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.scaleToFit)
  },
  methods: {
    scaleToFit() {
      const scaleX = window.innerWidth / 1920
      const scaleY = window.innerHeight / 1080
      const scale = Math.min(scaleX, scaleY)
      const page = document.querySelector('.edit-product-page')
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
    async loadProduct() {
      const id = this.$route.params.id
      const productDoc = await getDoc(doc(db, 'products', id))
      if (productDoc.exists()) {
        const data = productDoc.data()
        this.productName = data.name
        this.price = data.price
        this.originalQuantity = data.quantity
        this.existingImageUrl = data.imageUrl || ''
        if (data.imageUrl) {
          this.imagePreview = data.imageUrl
        }
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleImageUpload(event) {
      const file = event.target.files[0]
      if (file) {
        this.imageFile = file
        this.imagePreview = URL.createObjectURL(file)
      }
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
        const id = this.$route.params.id
        const newQuantity = this.originalQuantity + parseInt(this.additionalStock)
        await updateDoc(doc(db, 'products', id), {
          quantity: newQuantity
        })
        this.originalQuantity = newQuantity
        this.showAddStockConfirm = false
        this.additionalStock = 1
      } catch (error) {
        console.error('Error adding stock:', error)
        alert('Failed to add stock. Please try again.')
      }
    },
    async handleSubmit() {
      this.showSubmitConfirm = false
      if (!this.productName || !this.price) {
        alert('Please fill in all required fields.')
        return
      }
      try {
        const id = this.$route.params.id
        let imageUrl = this.existingImageUrl

        if (this.imageFile) {
          const storageRef = ref(storage, `products/${Date.now()}_${this.imageFile.name}`)
          const snapshot = await uploadBytes(storageRef, this.imageFile)
          imageUrl = await getDownloadURL(snapshot.ref)
        }

        await updateDoc(doc(db, 'products', id), {
          name: this.productName,
          price: parseFloat(this.price),
          imageUrl: imageUrl
        })

        this.$router.push('/admin/products')
      } catch (error) {
        console.error('Error updating product:', error)
        alert('Failed to update product. Please try again.')
      }
    },
    handleCancel() {
      this.showCancelConfirm = false
      this.$router.push('/admin/products')
    },
    async handleDelete() {
      try {
        const id = this.$route.params.id
        await deleteDoc(doc(db, 'products', id))
        this.$router.push('/admin/products')
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Failed to delete product. Please try again.')
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

.edit-product-page {
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
  left: 55px;
  top: 46px;
  font-style: italic;
  font-weight: 700;
  font-size: 50px;
  line-height: 61px;
  color: #000000;
}

/* Image */
.image-placeholder {
  position: absolute;
  width: 379.99px;
  height: 256.55px;
  left: 272px;
  top: 260.49px;
  background: #E6E6E6;
  overflow: hidden;
  cursor: pointer;
}

.image-preview {
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

.edit-picture {
  position: absolute;
  left: 273px;
  top: 540px;
  font-style: italic;
  font-size: 35px;
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
  font-size: 35px;
  color: #646464;
  background: transparent;
  width: 100%;
}

.input-field::placeholder {
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

/* Buttons */
.addstock-btn {
  position: absolute;
  width: 234px;
  height: 74px;
  left: 737px;
  top: 492px;
  background: #B5BDA0;
  border: none;
  border-radius: 15px;
  font-weight: 700;
  font-size: 35px;
  color: #FFFFFF;
  cursor: pointer;
}

.addstock-btn:hover {
  opacity: 0.9;
}

.delete-btn {
  position: absolute;
  width: 319px;
  height: 74px;
  left: 1001px;
  top: 492px;
  background: #E22929;
  border: none;
  border-radius: 15px;
  font-weight: 700;
  font-size: 35px;
  color: #FFFFFF;
  cursor: pointer;
}

.delete-btn:hover {
  opacity: 0.9;
}

.submit-btn {
  position: absolute;
  width: 272px;
  height: 111px;
  left: 268px;
  top: 824px;
  background: #B5BDA0;
  border: none;
  border-radius: 15px;
  font-weight: 700;
  font-size: 50px;
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
  left: 587px;
  top: 824px;
  background: #E22929;
  border: none;
  border-radius: 15px;
  font-weight: 700;
  font-size: 50px;
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
.addstockconfirm-popup {
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

.delete-yes {
  background: #E22929;
  color: #FFFFFF;
}

.delete-yes:hover {
  background: #c91f1f;
}
</style>