<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useExamStore } from '@/stores/exam'
import { useAssignmentStore } from '@/stores/assignment'
import { useMasterStore } from '@/stores/master'
import { useUiStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import { Plus, Search, MoreVertical } from 'lucide-vue-next'

import BaseButton from '@/components/common/BaseButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseDropdown from '@/components/common/BaseDropdown.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import Pagination from '@/components/common/Pagination.vue'
import ExamMobileCard from '@/components/exam/ExamMobileCard.vue'
import ExamFormModal from '@/components/exam/ExamFormModal.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const router = useRouter()
const examStore = useExamStore()
const assignmentStore = useAssignmentStore()
const masterStore = useMasterStore()
const uiStore = useUiStore()

const { exams, loading: examsLoading } = storeToRefs(examStore)
const { assignments, loading: assignmentsLoading } = storeToRefs(assignmentStore)

const loading = computed(() => examsLoading.value || assignmentsLoading.value)

// Modals State
const isFormOpen = ref(false)
const isDeleteOpen = ref(false)
const isSubmitting = ref(false)
const selectedExam = ref(null)
const examToDelete = ref(null)

// Filters State
const searchQuery = ref('')
const statusFilter = ref('')
const yearFilter = ref('')
const semesterFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

onMounted(async () => {
  await masterStore.fetchAll()
  await examStore.fetchExams()
  await assignmentStore.fetchAllAssignments()
})

// Reset to page 1 when filters change
watch([searchQuery, statusFilter, yearFilter, semesterFilter], () => {
  currentPage.value = 1
})

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  yearFilter.value = ''
  semesterFilter.value = ''
  currentPage.value = 1
}

// Compute counts for assignments per exam
const enrichedExams = computed(() => {
  return exams.value.map(exam => {
    const count = assignments.value.filter(a => a.examId === exam.id).length
    return { ...exam, assignmentCount: count }
  })
})

const filteredExams = computed(() => {
  let result = enrichedExams.value

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(e => 
      e.title.toLowerCase().includes(q) || 
      e.code.toLowerCase().includes(q)
    )
  }

  if (statusFilter.value) {
    result = result.filter(e => e.status.toLowerCase() === statusFilter.value.toLowerCase())
  }

  if (yearFilter.value) {
    result = result.filter(e => e.academicYearId == yearFilter.value)
  }

  if (semesterFilter.value) {
    result = result.filter(e => e.semester.toLowerCase() === semesterFilter.value.toLowerCase())
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredExams.value.length / itemsPerPage))

const paginatedExams = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredExams.value.slice(start, start + itemsPerPage)
})

const handleAction = (action, examIdOrPayload) => {
  if (action === 'detail') {
    router.push(`/admin/exams/${examIdOrPayload}`)
  } else if (action === 'edit') {
    selectedExam.value = examIdOrPayload
    isFormOpen.value = true
  } else if (action === 'delete') {
    examToDelete.value = examIdOrPayload
    isDeleteOpen.value = true
  } else if (action === 'create') {
    selectedExam.value = null
    isFormOpen.value = true
  }
}

const getDropdownItems = (exam) => [
  { label: 'Lihat Detail', onClick: () => handleAction('detail', exam.id) },
  { label: 'Edit', onClick: () => handleAction('edit', exam) },
  { label: 'Penugasan Guru', onClick: () => handleAction('detail', exam.id) },
  { label: 'Hapus', danger: true, onClick: () => handleAction('delete', exam) }
]

const handleFormSubmit = async (values) => {
  isSubmitting.value = true
  try {
    if (selectedExam.value) {
      await examStore.updateExam(selectedExam.value.id, values)
      uiStore.addToast('Ujian berhasil diperbarui', 'success')
    } else {
      await examStore.createExam(values)
      uiStore.addToast('Ujian berhasil dibuat', 'success')
    }
    isFormOpen.value = false
  } catch (error) {
    uiStore.addToast('Terjadi kesalahan', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  if (!examToDelete.value) return
  isSubmitting.value = true
  try {
    await examStore.deleteExam(examToDelete.value.id)
    uiStore.addToast('Ujian berhasil dihapus', 'success')
    isDeleteOpen.value = false
  } catch (error) {
    uiStore.addToast('Terjadi kesalahan', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Manajemen Ujian</h2>
        <p class="text-slate-500 mt-1">Kelola seluruh pelaksanaan ujian CBT Edulite.</p>
      </div>
      <BaseButton class="w-full sm:w-auto shadow-sm" @click="handleAction('create')">
        <Plus class="w-4 h-4 mr-2" /> Buat Ujian
      </BaseButton>
    </div>

    <!-- Filters Toolbar -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Cari nama atau kode ujian..." 
          class="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none transition-all bg-white"
        >
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:w-[60%] shrink-0">
        <select v-model="statusFilter" class="border border-slate-300 text-sm rounded-lg py-2 px-3 focus:ring-primary-blue bg-white w-full outline-none">
          <option value="">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="READY">Siap (Ready)</option>
          <option value="PUBLISHED">Dipublikasikan</option>
          <option value="FINISHED">Selesai</option>
        </select>
        
        <select v-model="yearFilter" class="border border-slate-300 text-sm rounded-lg py-2 px-3 focus:ring-primary-blue bg-white w-full outline-none">
          <option value="">Tahun Ajaran</option>
          <option v-for="ay in masterStore.academicYears" :key="ay.id" :value="ay.id">{{ ay.name }}</option>
        </select>
        
        <select v-model="semesterFilter" class="border border-slate-300 text-sm rounded-lg py-2 px-3 focus:ring-primary-blue bg-white w-full outline-none">
          <option value="">Semester</option>
          <option value="ganjil">Ganjil</option>
          <option value="genap">Genap</option>
        </select>
        
        <button 
          @click="resetFilters"
          class="text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <Skeleton type="table" :lines="5" />
    </div>
    
    <div v-else>
      <!-- Empty State -->
      <div v-if="filteredExams.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 shadow-sm text-center">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search class="w-8 h-8 text-slate-400" />
        </div>
        <h3 class="text-lg font-bold text-slate-800 mb-1">
          {{ exams.length === 0 ? 'Belum Ada Ujian' : 'Ujian Tidak Ditemukan' }}
        </h3>
        <p class="text-slate-500 mb-6 max-w-md mx-auto">
          {{ exams.length === 0 ? 'Buat ujian pertama untuk memulai CBT Edulite.' : 'Tidak ada ujian yang sesuai dengan pencarian atau filter saat ini.' }}
        </p>
        <BaseButton v-if="exams.length === 0" @click="handleAction('create')">
          <Plus class="w-4 h-4 mr-2" /> Buat Ujian
        </BaseButton>
        <BaseButton v-else variant="secondary" @click="resetFilters">
          Reset Filter
        </BaseButton>
      </div>

      <!-- Content State -->
      <div v-else>
        <!-- Desktop Table -->
        <div class="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
          <table class="w-full text-sm text-left text-slate-600">
            <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th scope="col" class="px-6 py-4 font-medium w-12 text-center rounded-tl-xl">No</th>
                <th scope="col" class="px-6 py-4 font-medium">Nama Ujian</th>
                <th scope="col" class="px-6 py-4 font-medium">Tahun Ajaran</th>
                <th scope="col" class="px-6 py-4 font-medium">Jenis Ujian</th>
                <th scope="col" class="px-6 py-4 font-medium">Status</th>
                <th scope="col" class="px-6 py-4 font-medium">Penugasan</th>
                <th scope="col" class="px-6 py-4 font-medium text-right w-24 rounded-tr-xl">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(exam, index) in paginatedExams" 
                :key="exam.id"
                class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
              >
                <td class="px-6 py-4 text-center font-medium text-slate-400">
                  {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                </td>
                <td class="px-6 py-4">
                  <div class="font-semibold text-slate-900">{{ exam.title }}</div>
                  <div class="text-xs text-slate-500 mt-0.5 font-mono">{{ exam.code }}</div>
                </td>
                <td class="px-6 py-4">
                  <div>{{ exam.academicYear }}</div>
                  <div class="text-xs text-slate-500 mt-0.5">Semester {{ exam.semester }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="font-medium text-slate-800">{{ exam.exam_type || exam.examType || '-' }}</div>
                </td>
                <td class="px-6 py-4">
                  <StatusBadge :status="exam.status" />
                </td>
                <td class="px-6 py-4">
                  <span class="font-medium text-slate-700">{{ exam.assignmentCount || 0 }}</span> Guru
                </td>
                <td class="px-6 py-4 text-right">
                  <BaseDropdown :items="getDropdownItems(exam)">
                    <template #trigger>
                      <button class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue">
                        <MoreVertical class="w-5 h-5" />
                      </button>
                    </template>
                  </BaseDropdown>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="md:hidden">
          <ExamMobileCard 
            v-for="exam in paginatedExams" 
            :key="exam.id" 
            :exam="exam" 
            @action="handleAction"
          />
        </div>

        <!-- Pagination -->
        <Pagination 
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :total-items="filteredExams.length"
          :items-per-page="itemsPerPage"
        />
      </div>
    </div>

    <!-- Modals -->
    <ExamFormModal 
      :isOpen="isFormOpen" 
      :loading="isSubmitting"
      :exam="selectedExam"
      @close="isFormOpen = false"
      @submit="handleFormSubmit"
    />

    <BaseModal 
      :isOpen="isDeleteOpen" 
      title="Hapus Ujian" 
      @close="isDeleteOpen = false"
      maxWidth="max-w-sm"
    >
      <div class="py-4">
        <p class="text-slate-600 text-sm">
          Apakah Anda yakin ingin menghapus ujian <strong>{{ examToDelete?.name }}</strong>? Data ini akan dihapus dari prototype CBT.
        </p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" :disabled="isSubmitting" @click="isDeleteOpen = false">Batal</BaseButton>
        <BaseButton variant="danger" :loading="isSubmitting" @click="handleDelete">Hapus Ujian</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
