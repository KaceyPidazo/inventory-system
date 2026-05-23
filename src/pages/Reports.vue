<template>
  <div class="viewport">
    <div class="reports-page">

      <!-- Sidebar — dynamic based on role -->
      <SidebarAdmin v-if="isAdmin" />
      <SidebarStaff v-else />

      <!-- Main Content -->
      <div class="main-content">

        <!-- Page Title -->
        <h1 class="page-title">Daily Reports</h1>

        <!-- Date Filter -->
        <div class="date-filter-wrapper">
          <input
            type="text"
            placeholder="DD/MM/YYYY"
            v-model="dateQuery"
            class="date-input"
            @input="filterByDate"
          />
          <div class="arrow-down-small"></div>
        </div>

        <!-- Date Dropdown -->
        <div class="date-dropdown" v-if="showDateDropdown && filteredDates.length > 0">
          <div
            v-for="date in filteredDates"
            :key="date"
            class="date-item"
            @click="selectDate(date)"
          >
            {{ date }}
          </div>
        </div>

        <!-- Print as PDF Button (Admin only) -->
        <button
          v-if="isAdmin"
          class="print-btn"
          @click="printPDF"
        >
          Print as PDF
        </button>

        <!-- Summary Header -->
        <div class="summary-header">
          <span class="summary-title">
            {{ selectedDate ? `Daily Summary for ${formatDateLong(selectedDate)}` : 'Transaction History (Lifetime)' }}
          </span>
          <span class="total-sales">TOTAL SALES: ₱{{ totalSales.toFixed(2) }}</span>
        </div>

        <!-- Reports Frame -->
        <div class="reports-frame" id="reports-frame">

          <!-- No transactions -->
          <div class="no-transactions" v-if="paginatedTransactions.length === 0">
            <p>No transactions found.</p>
          </div>

          <!-- Transaction Rows -->
          <div
            v-for="transaction in paginatedTransactions"
            :key="transaction.id"
            class="transaction-row"
          >
            <span class="t-time">{{ formatTime(transaction.timestamp) }}</span>
            <span class="t-name">{{ transaction.productName }}</span>
            <span class="t-qty">Qty: {{ transaction.quantity }}</span>
            <span class="t-price">₱{{ (transaction.price * transaction.quantity).toFixed(2) }}</span>
            <button
              v-if="isAdmin"
              class="delete-btn"
              @click="openDeletePopup(transaction)"
            >
              Delete
            </button>
          </div>

        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 1">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            ← Prev
          </button>
          <span
            v-for="page in totalPages"
            :key="page"
            class="page-number"
            :class="{ active: page === currentPage }"
            @click="currentPage = page"
          >
            {{ page }}
          </span>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            Next →
          </button>
        </div>

      </div>

      <!-- Delete Confirmation Popup -->
      <div class="overlay" v-if="showDeletePopup">
        <div class="delete-popup">
          <!-- X Close Button -->
          <div class="close-btn" @click="showDeletePopup = false">✕</div>

          <!-- Reason for Deleting -->
          <p class="delete-label">Reason for Deleting:</p>

          <!-- Notes Textarea -->
          <div class="notes-wrapper">
            <textarea
              v-model="deleteReason"
              class="notes-input"
              placeholder="Notes"
            ></textarea>
          </div>

          <!-- Add item/s back to inventory checkbox -->
          <div class="checkbox-wrapper">
            <div
              class="checkbox"
              :class="{ checked: returnToInventory }"
              @click="returnToInventory = !returnToInventory"
            ></div>
            <span class="checkbox-label">Add item/s back to inventory?</span>
          </div>

          <!-- Confirm Button -->
          <button class="confirm-btn" @click="handleDelete">Confirm</button>
        </div>
      </div>

      <!-- Add Stock Confirmation (when returning to inventory) -->
      <div class="overlay" v-if="showReturnConfirm">
        <div class="addstockconfirm-popup">
          <p class="confirm-text">
            {{ transactionToDelete?.quantity }} units of
            {{ transactionToDelete?.productName }} returned to inventory.
          </p>
          <button class="okay-btn" @click="showReturnConfirm = false">Okay</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import SidebarAdmin from '../components/SidebarAdmin.vue'
import SidebarStaff from '../components/SidebarStaff.vue'
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import emailjs from '@emailjs/browser'

export default {
  name: 'Reports',
  components: { SidebarAdmin, SidebarStaff },
  data() {
    return {
      isAdmin: false,
      transactions: [],
      filteredTransactions: [],
      availableDates: [],
      filteredDates: [],
      selectedDate: '',
      dateQuery: '',
      showDateDropdown: false,
      currentPage: 1,
      itemsPerPage: 10,
      showDeletePopup: false,
      transactionToDelete: null,
      deleteReason: '',
      returnToInventory: false,
      showReturnConfirm: false
    }
  },
  computed: {
    totalSales() {
      return this.filteredTransactions.reduce((sum, t) => {
        return sum + (t.price * t.quantity)
      }, 0)
    },
    totalPages() {
      return Math.ceil(this.filteredTransactions.length / this.itemsPerPage)
    },
    paginatedTransactions() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.filteredTransactions.slice(start, end)
    }
  },
  async mounted() {
    this.scaleToFit()
    window.addEventListener('resize', this.scaleToFit)
    await this.checkRole()
    await this.loadTransactions()

    // Close date dropdown when clicking outside
    document.addEventListener('click', this.handleOutsideClick)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.scaleToFit)
    document.removeEventListener('click', this.handleOutsideClick)
  },
  methods: {
    scaleToFit() {
      const scaleX = window.innerWidth / 1920
      const scaleY = window.innerHeight / 1080
      const scale = Math.min(scaleX, scaleY)
      const page = document.querySelector('.reports-page')
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
        const userDoc = await getDoc(doc(db, 'users', uid))
        if (userDoc.exists()) {
          this.isAdmin = userDoc.data().role === 'admin'
        }
      }
    },
    async loadTransactions() {
      const snapshot = await getDocs(collection(db, 'transactions'))
      this.transactions = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(t => t.timestamp)
        .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)

      // Extract unique dates
      const dateSet = new Set()
      this.transactions.forEach(t => {
        const date = this.formatDateDDMMYYYY(t.timestamp)
        dateSet.add(date)
      })
      this.availableDates = Array.from(dateSet).sort().reverse()

      // Default to all transactions
      this.filteredTransactions = this.transactions
    },
    formatDateDDMMYYYY(timestamp) {
      if (!timestamp) return ''
      const date = timestamp.toDate()
      const dd = String(date.getDate()).padStart(2, '0')
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const yyyy = date.getFullYear()
      return `${dd}/${mm}/${yyyy}`
    },
    formatDateLong(ddmmyyyy) {
      const [dd, mm, yyyy] = ddmmyyyy.split('/')
      const date = new Date(`${yyyy}-${mm}-${dd}`)
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    },
    formatTime(timestamp) {
      if (!timestamp) return '00:00:00'
      const date = timestamp.toDate()
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    },
    filterByDate() {
      this.showDateDropdown = true
      if (!this.dateQuery.trim()) {
        this.filteredDates = this.availableDates
        this.filteredTransactions = this.transactions
        this.selectedDate = ''
      } else {
        this.filteredDates = this.availableDates.filter(d =>
          d.includes(this.dateQuery)
        )
      }
      this.currentPage = 1
    },
    selectDate(date) {
      this.selectedDate = date
      this.dateQuery = date
      this.showDateDropdown = false
      this.filteredTransactions = this.transactions.filter(t =>
        this.formatDateDDMMYYYY(t.timestamp) === date
      )
      this.currentPage = 1
    },
    handleOutsideClick(e) {
      if (!e.target.closest('.date-filter-wrapper') && !e.target.closest('.date-dropdown')) {
        this.showDateDropdown = false
      }
    },
    async printPDF() {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      const isLifetime = !this.selectedDate

      // Title
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('FK Inventory System', 14, 20)

      doc.setFontSize(14)
      doc.text(
        isLifetime
          ? 'Transaction History (Lifetime)'
          : `Daily Summary for ${this.formatDateLong(this.selectedDate)}`,
        14, 30
      )

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total Sales: P${this.totalSales.toFixed(2)}`, 14, 40)

      // Table
      const rows = this.filteredTransactions.map(t => [
        this.formatDateDDMMYYYY(t.timestamp),
        this.formatTime(t.timestamp),
        t.productName,
        t.quantity,
        `P${(t.price * t.quantity).toFixed(2)}`
      ])

      autoTable(doc, {
        startY: 48,
        head: [['Date', 'Time', 'Product', 'Qty', 'Total Price']],
        body: rows,
        styles: { fontSize: 10 }
      })

      doc.save(
        isLifetime
          ? 'FK_Inventory_Lifetime_Report.pdf'
          : `FK_Inventory_${this.selectedDate.replace(/\//g, '-')}.pdf`
      )
    },
    openDeletePopup(transaction) {
      this.transactionToDelete = transaction
      this.deleteReason = ''
      this.returnToInventory = false
      this.showDeletePopup = true
    },
    async handleDelete() {
      const reason = this.deleteReason.trim() || 'N/A'
      const t = this.transactionToDelete

      try {
        // Return to inventory if checked
        if (this.returnToInventory) {
          const productDoc = await getDoc(doc(db, 'products', t.productId))
          if (productDoc.exists()) {
            const currentQty = productDoc.data().quantity
            await updateDoc(doc(db, 'products', t.productId), {
              quantity: currentQty + t.quantity
            })
          }
        }

        // Delete transaction
        await deleteDoc(doc(db, 'transactions', t.id))

        // Send email via EmailJS
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            product_name: t.productName,
            quantity: t.quantity,
            price: `P${(t.price * t.quantity).toFixed(2)}`,
            transaction_date: `${this.formatDateDDMMYYYY(t.timestamp)} ${this.formatTime(t.timestamp)}`,
            reason: reason,
            returned_to_inventory: this.returnToInventory ? 'Yes' : 'No',
            cc_email: import.meta.env.VITE_ADMIN_EMAIL
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        )

        // Show return confirm if applicable
        if (this.returnToInventory) {
          this.showReturnConfirm = true
        }

        // Remove from local list
        this.transactions = this.transactions.filter(tr => tr.id !== t.id)
        this.filteredTransactions = this.filteredTransactions.filter(tr => tr.id !== t.id)
        this.showDeletePopup = false
        this.transactionToDelete = null

        // Reset to page 1 if current page is now empty
        if (this.currentPage > this.totalPages) {
          this.currentPage = Math.max(1, this.totalPages)
        }

      } catch (error) {
        console.error('Error deleting transaction:', error)
        alert('Failed to delete transaction. Please try again.')
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

.reports-page {
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
  color: #000000;
}

/* Date Filter */
.date-filter-wrapper {
  position: absolute;
  left: 332px;
  top: 127px;
  width: 402px;
  height: 89px;
  background: #FFFFFF;
  border: 3px solid #000000;
  border-radius: 15px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  justify-content: space-between;
  cursor: pointer;
}

.date-input {
  border: none;
  outline: none;
  font-style: italic;
  font-size: 30px;
  color: #646464;
  background: transparent;
  width: 100%;
}

.date-input::placeholder {
  color: #646464;
}

.arrow-down-small {
  width: 45px;
  height: 35px;
  background: #6D6D6D;
  clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
  flex-shrink: 0;
}

/* Date Dropdown */
.date-dropdown {
  position: absolute;
  left: 332px;
  top: 216px;
  width: 402px;
  background: #636363;
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
}

.date-item {
  width: 100%;
  height: 76px;
  background: #DADADA;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
  font-size: 30px;
  color: #646464;
  cursor: pointer;
  border-bottom: 2px solid #636363;
}

.date-item:hover {
  background: #c8c8c8;
}

/* Print Button */
.print-btn {
  position: absolute;
  width: 294px;
  height: 89px;
  left: 776px;
  top: 127px;
  background: #B5BDA0;
  border: none;
  border-radius: 15px;
  font-weight: 700;
  font-size: 35px;
  color: #FFFFFF;
  cursor: pointer;
}

.print-btn:hover {
  opacity: 0.9;
}

/* Summary Header */
.summary-header {
  position: absolute;
  left: 46px;
  top: 287px;
  width: 1428px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-title {
  font-weight: 700;
  font-size: 40px;
  line-height: 48px;
  color: #646464;
}

.total-sales {
  font-style: italic;
  font-weight: 700;
  font-size: 40px;
  color: #E22929;
}

/* Reports Frame */
.reports-frame {
  position: absolute;
  left: 88px;
  top: 372px;
  width: 1428px;
  height: 620px;
  border: 3px solid #000000;
  overflow-y: auto;
  overflow-x: hidden;
}

.reports-frame::-webkit-scrollbar {
  width: 9px;
}

.reports-frame::-webkit-scrollbar-thumb {
  background: #6D6D6D;
}

.no-transactions {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-style: italic;
  font-size: 35px;
  color: #646464;
}

/* Transaction Row */
.transaction-row {
  width: 100%;
  height: 123px;
  background: #B5BDA0;
  display: flex;
  align-items: center;
  padding: 0 30px;
  gap: 40px;
  border-bottom: 2px solid #FFFDF1;
}

.t-time {
  width: 252px;
  font-style: italic;
  font-size: 40px;
  color: #000000;
  flex-shrink: 0;
}

.t-name {
  width: 395px;
  font-style: italic;
  font-size: 40px;
  color: #000000;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.t-qty {
  width: 133px;
  font-style: italic;
  font-size: 40px;
  color: #000000;
  flex-shrink: 0;
}

.t-price {
  flex: 1;
  font-style: italic;
  font-size: 40px;
  color: #000000;
}

.delete-btn {
  width: 210px;
  height: 72px;
  background: #E22929;
  border: none;
  border-radius: 15px;
  font-weight: 700;
  font-size: 40px;
  color: #FFFFFF;
  cursor: pointer;
  flex-shrink: 0;
}

.delete-btn:hover {
  opacity: 0.9;
}

/* Pagination */
.pagination {
  position: absolute;
  left: 88px;
  top: 1010px;
  width: 1428px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.page-btn {
  height: 50px;
  padding: 0 24px;
  background: #B5BDA0;
  border: none;
  border-radius: 10px;
  font-size: 28px;
  font-weight: 700;
  color: #FFFFFF;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.page-number {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 500;
  color: #000000;
  cursor: pointer;
  border-radius: 8px;
}

.page-number.active {
  background: #B5BDA0;
  color: #FFFFFF;
  font-weight: 700;
}

.page-number:hover {
  background: #D3D1C7;
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

/* Delete Popup */
.delete-popup {
  position: relative;
  width: 556px;
  height: 497px;
  background: #636363;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 70px 49px 40px;
  gap: 20px;
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

.delete-label {
  font-style: italic;
  font-size: 38px;
  color: #FFFFFF;
  text-align: center;
  margin: 0;
  width: 100%;
}

.notes-wrapper {
  width: 462px;
  height: 151px;
  background: #FFFFFF;
}

.notes-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  font-style: italic;
  font-size: 38px;
  color: #646464;
  padding: 10px 16px;
  resize: none;
  background: transparent;
}

.notes-input::placeholder {
  color: #646464;
}

/* Checkbox */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.checkbox {
  width: 52px;
  height: 46px;
  background: #FFFFFF;
  cursor: pointer;
  flex-shrink: 0;
  border: 2px solid #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #636363;
}

.checkbox.checked::after {
  content: '✓';
  font-weight: 700;
  font-size: 32px;
  color: #E22929;
}

.checkbox-label {
  font-style: italic;
  font-size: 35px;
  color: #FFFFFF;
  line-height: 1.3;
}

/* Confirm Button */
.confirm-btn {
  width: 308px;
  height: 76px;
  background: #E22929;
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

.confirm-btn:hover {
  opacity: 0.9;
}

/* Add Stock Confirm */
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

.confirm-text {
  width: 477px;
  font-style: italic;
  font-size: 38px;
  line-height: 46px;
  text-align: center;
  color: #FFFFFF;
  margin: 0;
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
</style>