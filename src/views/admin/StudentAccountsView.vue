<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStudentAccountStore } from '@/stores/studentAccount'
import { useMasterStore } from '@/stores/master'
import { useUiStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import { 
  Users, KeyRound, UserRoundCog, Search, CheckCircle, 
  XCircle, Filter, MoreVertical, ShieldAlert, Printer
} from 'lucide-vue-next'

import BaseButton from '@/components/common/BaseButton.vue'
import BaseDropdown from '@/components/common/BaseDropdown.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import Pagination from '@/components/common/Pagination.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

import GenerateStudentAccountModal from '@/components/admin/GenerateStudentAccountModal.vue'
import StudentAccountResultModal from '@/components/admin/StudentAccountResultModal.vue'
import PrintCards from '@/components/admin/PrintCards.vue'

const studentStore = useStudentAccountStore()
const masterStore = useMasterStore()
const uiStore = useUiStore()

const { students, loading, generating, resetting, updatingStatus } = storeToRefs(studentStore)
const { classes } = storeToRefs(masterStore)

// Filters State
const searchQuery = ref('')
const classFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

// Modal States
const isGenerateModalOpen = ref(false)
const isResultModalOpen = ref(false)
const isResetModalOpen = ref(false)
const isToggleStatusModalOpen = ref(false)

const generateResults = ref({ generated: [], skipped: [] })
const resultTitle = ref('Hasil Generate Akun')
const isResetResult = ref(false)
const selectedStudent = ref(null)
const selectedStudentIds = ref([]) // For checkbox selection

// Print state
const isPrinting = ref(false)
const printStudents = ref([])

onMounted(async () => {
  await masterStore.fetchAll()
  await fetchStudents()
  
  window.addEventListener('afterprint', () => {
    isPrinting.value = false
  })
})

const fetchStudents = async () => {
  await studentStore.fetchStudentAccounts({
    search: searchQuery.value,
    classId: classFilter.value,
    accountStatus: statusFilter.value
  })
}

// Reset page when filters change (except search which might be debounce handled, but here direct watch)
let searchTimeout
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchStudents()
  }, 500)
})

watch([classFilter, statusFilter], () => {
  currentPage.value = 1
  fetchStudents()
})

const resetFilters = () => {
  searchQuery.value = ''
  classFilter.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  fetchStudents()
}

// Stats
const totalStudents = computed(() => students.value.length)
const totalHasAccount = computed(() => students.value.filter(s => s.account?.exists).length)
const totalNoAccount = computed(() => students.value.filter(s => !s.account?.exists).length)
const totalInactive = computed(() => students.value.filter(s => s.account?.exists && !s.account.isActive).length)

// Pagination
const totalPages = computed(() => Math.ceil(students.value.length / itemsPerPage))
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return students.value.slice(start, start + itemsPerPage)
})

// Checkbox logic
const toggleSelectAll = (e) => {
  if (e.target.checked) {
    selectedStudentIds.value = paginatedStudents.value.map(s => s.studentId)
  } else {
    selectedStudentIds.value = []
  }
}
const allCurrentPageSelected = computed(() => {
  if (paginatedStudents.value.length === 0) return false
  return paginatedStudents.value.every(s => selectedStudentIds.value.includes(s.studentId))
})

// Actions
const openGenerateModal = () => {
  isGenerateModalOpen.value = true
}

const handleGenerateSubmit = async (payload) => {
  try {
    const result = await studentStore.generateAccounts(payload)
    generateResults.value = result
    resultTitle.value = 'Hasil Generate Akun'
    isResetResult.value = false
    isGenerateModalOpen.value = false
    isResultModalOpen.value = true
    selectedStudentIds.value = []
    fetchStudents()
  } catch (error) {
    uiStore.addToast(error.message || 'Gagal membuat akun', 'error')
  }
}

const openResetModal = (student) => {
  selectedStudent.value = student
  isResetModalOpen.value = true
}

const confirmResetPassword = async () => {
  if (!selectedStudent.value) return
  try {
    const result = await studentStore.resetPassword(selectedStudent.value.studentId)
    generateResults.value = { generated: [result], skipped: [] }
    resultTitle.value = 'Password Berhasil Direset'
    isResetResult.value = true
    isResetModalOpen.value = false
    isResultModalOpen.value = true
  } catch (error) {
    uiStore.addToast(error.message || 'Gagal mereset password', 'error')
  }
}

const openToggleStatusModal = (student) => {
  selectedStudent.value = student
  isToggleStatusModalOpen.value = true
}

const confirmToggleStatus = async () => {
  if (!selectedStudent.value) return
  const newStatus = !selectedStudent.value.account.isActive
  try {
    await studentStore.updateStatus(selectedStudent.value.studentId, newStatus)
    uiStore.addToast(`Akun berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`, 'success')
    isToggleStatusModalOpen.value = false
  } catch (error) {
    uiStore.addToast(error.message || 'Gagal mengubah status akun', 'error')
  }
}

// Print Handlers
const handlePrint = (type, studentId = null) => {
  if (type === 'selected') {
    if (selectedStudentIds.value.length === 0) {
      uiStore.addToast('Pilih minimal satu siswa untuk dicetak', 'error')
      return
    }
    printStudents.value = students.value.filter(s => selectedStudentIds.value.includes(s.studentId))
  } else if (type === 'single' && studentId) {
    printStudents.value = students.value.filter(s => s.studentId === studentId)
  } else {
    // print all currently fetched/filtered students
    if (students.value.length === 0) {
      uiStore.addToast('Tidak ada data untuk dicetak', 'error')
      return
    }
    printStudents.value = students.value
  }
  
  isPrinting.value = true
  setTimeout(() => {
    window.print()
  }, 300)
}

// Dropdown Helper
const getDropdownItems = (student) => {
  const items = []
  if (student.account?.exists) {
    items.push({
      label: 'Cetak Kartu',
      icon: Printer,
      onClick: () => handlePrint('single', student.studentId)
    })
    items.push({
      label: 'Reset Password',
      icon: KeyRound,
      onClick: () => openResetModal(student)
    })
    if (student.account.isActive) {
      items.push({
        label: 'Nonaktifkan Akun',
        icon: XCircle,
        danger: true,
        onClick: () => openToggleStatusModal(student)
      })
    } else {
      items.push({
        label: 'Aktifkan Akun',
        icon: CheckCircle,
        onClick: () => openToggleStatusModal(student)
      })
    }
  } else {
    items.push({
      label: 'Generate Akun',
      icon: KeyRound,
      onClick: () => {
        selectedStudentIds.value = [student.studentId]
        openGenerateModal()
      }
    })
  }
  return items
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'
  })
}
</script>

<template>
  <div>
    <!-- Render Print Layout completely replacing UI when printing -->
    <PrintCards v-if="isPrinting" :students="printStudents" />
    
    <div v-show="!isPrinting" class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Akun CBT Siswa</h2>
        <p class="text-slate-500 mt-1">Kelola akun yang digunakan siswa untuk mengakses CBT Edulite.</p>
      </div>
        <BaseButton class="w-full sm:w-auto shadow-sm" @click="openGenerateModal" :loading="generating">
          <KeyRound class="w-4 h-4 mr-2" /> Generate Akun
        </BaseButton>
      </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-blue-50 text-primary-blue flex items-center justify-center shrink-0">
          <Users class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Total Siswa</p>
          <p class="text-2xl font-bold text-slate-800">{{ totalStudents }}</p>
        </div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
          <CheckCircle class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Punya Akun</p>
          <p class="text-2xl font-bold text-slate-800">{{ totalHasAccount }}</p>
        </div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
          <UserRoundCog class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Belum Ada Akun</p>
          <p class="text-2xl font-bold text-slate-800">{{ totalNoAccount }}</p>
        </div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
          <XCircle class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500">Akun Nonaktif</p>
          <p class="text-2xl font-bold text-slate-800">{{ totalInactive }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Cari nama siswa atau NIS..." 
          class="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none transition-all bg-white"
        >
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:w-[60%] shrink-0">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter class="h-4 w-4 text-slate-400" />
          </div>
          <select v-model="classFilter" class="w-full pl-9 pr-3 py-2 border border-slate-300 text-sm rounded-lg focus:ring-primary-blue bg-white outline-none truncate appearance-none">
            <option value="">Semua Kelas</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        
        <select v-model="statusFilter" class="border border-slate-300 text-sm rounded-lg py-2 px-3 focus:ring-primary-blue bg-white w-full outline-none">
          <option value="">Semua Status Akun</option>
          <option value="HAS_ACCOUNT">Sudah Punya Akun</option>
          <option value="NO_ACCOUNT">Belum Punya Akun</option>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Nonaktif</option>
        </select>
        
        <BaseButton variant="outline" class="w-full justify-center text-sm hidden md:flex" @click="resetFilters">
          Reset Filter
        </BaseButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <Skeleton type="table" />
    </div>

    <!-- Main Content -->
    <template v-else>
      <div v-if="students.length > 0" class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div class="flex items-center gap-2">
          <BaseButton 
            variant="outline" 
            size="sm"
            @click="handlePrint('selected')"
            :disabled="selectedStudentIds.length === 0"
          >
            <Printer class="w-4 h-4 mr-2" />
            Cetak Terpilih ({{ selectedStudentIds.length }})
          </BaseButton>
          <BaseButton 
            variant="outline" 
            size="sm"
            @click="handlePrint('all')"
          >
            <Printer class="w-4 h-4 mr-2" />
            Cetak Hasil Filter ({{ students.length }})
          </BaseButton>
        </div>
      </div>
      <div v-if="students.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div class="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users class="w-8 h-8" />
        </div>
        <h3 class="text-lg font-bold text-slate-800">Tidak Ada Siswa</h3>
        <p class="text-slate-500 mt-1 max-w-md mx-auto mb-6">
          Belum ada data siswa yang ditemukan untuk kriteria ini.
        </p>
        <BaseButton @click="resetFilters" variant="outline">Reset Filter</BaseButton>
      </div>

      <template v-else>
        <!-- Desktop Table -->
        <div class="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th class="px-6 py-4 w-12 text-center">
                    <input type="checkbox" class="rounded border-slate-300 text-primary-blue focus:ring-primary-blue" :checked="allCurrentPageSelected" @change="toggleSelectAll">
                  </th>
                  <th class="px-6 py-4">Siswa</th>
                  <th class="px-6 py-4">Kelas</th>
                  <th class="px-6 py-4">Username CBT</th>
                  <th class="px-6 py-4">Status Akun</th>
                  <th class="px-6 py-4">Login Terakhir</th>
                  <th class="px-6 py-4 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="student in paginatedStudents" :key="student.studentId" class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4 text-center">
                    <input type="checkbox" class="rounded border-slate-300 text-primary-blue focus:ring-primary-blue" v-model="selectedStudentIds" :value="student.studentId">
                  </td>
                  <td class="px-6 py-4">
                    <p class="font-bold text-slate-800">{{ student.name }}</p>
                    <p class="text-xs text-slate-500 font-mono mt-0.5">{{ student.nis || '-' }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                      {{ student.class?.name || '-' }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span v-if="student.account?.exists" class="font-mono text-slate-800 font-medium bg-slate-100 px-2 py-1 rounded">{{ student.account.username }}</span>
                    <span v-else class="text-slate-400 italic text-xs">-</span>
                  </td>
                  <td class="px-6 py-4">
                    <StatusBadge v-if="student.account?.exists" :status="student.account.isActive ? 'ACTIVE' : 'INACTIVE'" />
                    <span v-else class="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
                      Belum Dibuat
                    </span>
                  </td>
                  <td class="px-6 py-4 text-xs text-slate-500">
                    {{ student.account?.exists ? formatDate(student.account.lastLogin) : '-' }}
                  </td>
                  <td class="px-6 py-4 text-center">
                    <BaseDropdown :items="getDropdownItems(student)" placement="bottom-end">
                      <template #trigger>
                        <button class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                          <MoreVertical class="w-5 h-5" />
                        </button>
                      </template>
                    </BaseDropdown>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span class="text-sm text-slate-500">
              Menampilkan <span class="font-bold text-slate-700">{{ (currentPage - 1) * itemsPerPage + 1 }}</span> 
              hingga <span class="font-bold text-slate-700">{{ Math.min(currentPage * itemsPerPage, students.length) }}</span> 
              dari <span class="font-bold text-slate-700">{{ students.length }}</span> siswa
            </span>
            <Pagination 
              :currentPage="currentPage" 
              :totalPages="totalPages"
              @page-change="page => currentPage = page"
            />
          </div>
        </div>

        <!-- Mobile Card List -->
        <div class="md:hidden space-y-4">
          <div v-for="student in paginatedStudents" :key="student.studentId" class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative flex flex-col gap-3">
            <div class="absolute top-4 right-4">
               <BaseDropdown :items="getDropdownItems(student)" placement="bottom-end">
                  <template #trigger>
                    <button class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors bg-slate-50">
                      <MoreVertical class="w-5 h-5" />
                    </button>
                  </template>
                </BaseDropdown>
            </div>
            <div class="flex items-start gap-3 pr-10">
              <input type="checkbox" class="mt-1 rounded border-slate-300 text-primary-blue focus:ring-primary-blue" v-model="selectedStudentIds" :value="student.studentId">
              <div>
                <p class="font-bold text-slate-800">{{ student.name }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-slate-500 font-mono">{{ student.nis || '-' }}</span>
                  <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span class="text-xs font-medium text-slate-600">{{ student.class?.name || '-' }}</span>
                </div>
              </div>
            </div>
            
            <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-1">
              <div class="flex justify-between items-center mb-2">
                <span class="text-xs text-slate-500">Username</span>
                <span v-if="student.account?.exists" class="font-mono text-slate-800 font-medium text-sm">{{ student.account.username }}</span>
                <span v-else class="text-slate-400 italic text-xs">-</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-slate-500">Status</span>
                <StatusBadge v-if="student.account?.exists" :status="student.account.isActive ? 'ACTIVE' : 'INACTIVE'" />
                <span v-else class="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium border border-slate-200">
                  Belum Dibuat
                </span>
              </div>
            </div>
          </div>
          
          <div class="flex justify-center pt-4">
            <Pagination 
              :currentPage="currentPage" 
              :totalPages="totalPages"
              @page-change="page => currentPage = page"
            />
          </div>
        </div>
      </template>
    </template>

    <!-- Modals -->
    <GenerateStudentAccountModal 
      :isOpen="isGenerateModalOpen"
      :students="students"
      :classes="classes"
      :selectedStudentIds="selectedStudentIds"
      @close="isGenerateModalOpen = false"
      @submit="handleGenerateSubmit"
    />

    <StudentAccountResultModal
      :isOpen="isResultModalOpen"
      :title="resultTitle"
      :results="generateResults"
      :isReset="isResetResult"
      @close="isResultModalOpen = false"
    />

    <!-- Reset Confirmation -->
    <BaseModal :isOpen="isResetModalOpen" title="Reset Password" @close="isResetModalOpen = false">
      <div class="py-4">
        <div class="w-12 h-12 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center mb-4 mx-auto">
          <ShieldAlert class="w-6 h-6" />
        </div>
        <p class="text-center text-slate-700">Password CBT <span class="font-bold">{{ selectedStudent?.name }}</span> akan diganti secara acak.</p>
        <p class="text-center text-sm text-slate-500 mt-2">Password lama tidak akan dapat digunakan kembali.</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <BaseButton variant="secondary" @click="isResetModalOpen = false">Batal</BaseButton>
          <BaseButton variant="primary" @click="confirmResetPassword" :loading="resetting">Reset Password</BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Toggle Status Confirmation -->
    <BaseModal :isOpen="isToggleStatusModalOpen" :title="selectedStudent?.account?.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'" @close="isToggleStatusModalOpen = false">
      <div class="py-4">
        <p v-if="selectedStudent?.account?.isActive" class="text-slate-700">
          <span class="font-bold">{{ selectedStudent?.name }}</span> tidak akan dapat login CBT sampai akun ini diaktifkan kembali.
        </p>
        <p v-else class="text-slate-700">
          Aktifkan akun <span class="font-bold">{{ selectedStudent?.name }}</span> agar dapat kembali mengakses CBT?
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 w-full">
          <BaseButton variant="secondary" @click="isToggleStatusModalOpen = false">Batal</BaseButton>
          <BaseButton :variant="selectedStudent?.account?.isActive ? 'danger' : 'primary'" @click="confirmToggleStatus" :loading="updatingStatus">
            {{ selectedStudent?.account?.isActive ? 'Nonaktifkan' : 'Aktifkan' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    </div>
  </div>
</template>
