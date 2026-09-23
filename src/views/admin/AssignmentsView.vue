<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAssignmentStore } from '@/stores/assignment'
import { useExamStore } from '@/stores/exam'
import { useMasterStore } from '@/stores/master'
import { useUiStore } from '@/stores/ui'
import { storeToRefs } from 'pinia'
import { Search, Plus, MoreVertical, BookOpen } from 'lucide-vue-next'

import BaseButton from '@/components/common/BaseButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseDropdown from '@/components/common/BaseDropdown.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import Pagination from '@/components/common/Pagination.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import AssignmentMobileCard from '@/components/assignment/AssignmentMobileCard.vue'
import AssignmentFormModal from '@/components/assignment/AssignmentFormModal.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const assignmentStore = useAssignmentStore()
const examStore = useExamStore()
const masterStore = useMasterStore()
const uiStore = useUiStore()

const { allEnrichedAssignments: assignments, loading: assignmentsLoading } = storeToRefs(assignmentStore)
const { exams, loading: examsLoading } = storeToRefs(examStore)

const loading = computed(() => assignmentsLoading.value || examsLoading.value)

// Modals State
const isFormOpen = ref(false)
const isDeleteOpen = ref(false)
const isSubmitting = ref(false)
const selectedAssignment = ref(null)
const assignmentToDelete = ref(null)

// Filters State
const searchQuery = ref('')
const examFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 6

onMounted(async () => {
  await masterStore.fetchAll()
  await examStore.fetchExams()
  await assignmentStore.fetchAllAssignments()
})

// Reset to page 1 when filters change
watch([searchQuery, examFilter, statusFilter], () => {
  currentPage.value = 1
})

const resetFilters = () => {
  searchQuery.value = ''
  examFilter.value = ''
  statusFilter.value = ''
  currentPage.value = 1
}

// Compute counts for assignments per exam
const enrichedAssignments = computed(() => {
  return assignments.value.map(assignment => {
    const exam = exams.value.find(e => e.id === assignment.examId)
    return { ...assignment, examName: assignment.examName || exam?.title || 'Unknown Exam' }
  })
})

const filteredAssignments = computed(() => {
  let result = enrichedAssignments.value

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(a => 
      a.teacherName.toLowerCase().includes(q) || 
      a.subjectName.toLowerCase().includes(q)
    )
  }

  if (examFilter.value) {
    result = result.filter(a => a.examId === parseInt(examFilter.value))
  }

  if (statusFilter.value) {
    result = result.filter(a => a.status.toLowerCase() === statusFilter.value.toLowerCase())
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredAssignments.value.length / itemsPerPage))

const paginatedAssignments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredAssignments.value.slice(start, start + itemsPerPage)
})

const handleAction = (action, payload) => {
  if (action === 'edit') {
    selectedAssignment.value = payload
    isFormOpen.value = true
  } else if (action === 'delete') {
    assignmentToDelete.value = payload
    isDeleteOpen.value = true
  } else if (action === 'create') {
    selectedAssignment.value = null
    isFormOpen.value = true
  }
}

const getDropdownItems = (assignment) => [
  { label: 'Edit Penugasan', onClick: () => handleAction('edit', assignment) },
  { label: 'Hapus', danger: true, onClick: () => handleAction('delete', assignment) }
]

const handleFormSubmit = async (values) => {
  isSubmitting.value = true
  try {
    if (selectedAssignment.value) {
      await assignmentStore.updateAssignment(selectedAssignment.value.id, values)
      uiStore.addToast('Penugasan berhasil diperbarui', 'success')
    } else {
      await assignmentStore.createAssignment(values)
      uiStore.addToast('Penugasan berhasil ditambahkan', 'success')
    }
    await assignmentStore.fetchAllAssignments()
    isFormOpen.value = false
  } catch (error) {
    uiStore.addToast(error.message || 'Terjadi kesalahan', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  if (!assignmentToDelete.value) return
  isSubmitting.value = true
  try {
    await assignmentStore.deleteAssignment(assignmentToDelete.value.id)
    uiStore.addToast('Penugasan berhasil dihapus', 'success')
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
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Penugasan Guru</h2>
        <p class="text-slate-500 mt-1">Kelola guru yang bertanggung jawab pada setiap pelaksanaan ujian.</p>
      </div>
      <BaseButton class="w-full sm:w-auto shadow-sm" @click="handleAction('create')">
        <Plus class="w-4 h-4 mr-2" /> Tambah Penugasan
      </BaseButton>
    </div>

    <!-- Filters Toolbar -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Cari nama guru atau mapel..." 
          class="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue outline-none transition-all bg-white"
        >
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:w-[50%] shrink-0">
        <select v-model="examFilter" class="border border-slate-300 text-sm rounded-lg py-2 px-3 focus:ring-primary-blue bg-white w-full outline-none truncate">
          <option value="">Semua Ujian</option>
          <option v-for="exam in exams" :key="exam.id" :value="exam.id">{{ exam.title }}</option>
        </select>
        
        <select v-model="statusFilter" class="border border-slate-300 text-sm rounded-lg py-2 px-3 focus:ring-primary-blue bg-white w-full outline-none">
          <option value="">Semua Status</option>
          <option value="belum mulai">Belum Mulai</option>
          <option value="proses">Proses</option>
          <option value="siap">Siap</option>
        </select>
        
        <button 
          @click="resetFilters"
          class="text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors col-span-2 md:col-span-1"
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
      <div v-if="filteredAssignments.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 shadow-sm text-center">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search class="w-8 h-8 text-slate-400" />
        </div>
        <h3 class="text-lg font-bold text-slate-800 mb-1">
          {{ assignments.length === 0 ? 'Belum Ada Penugasan' : 'Penugasan Tidak Ditemukan' }}
        </h3>
        <p class="text-slate-500 mb-6 max-w-md mx-auto">
          {{ assignments.length === 0 ? 'Tambahkan guru pengampu untuk mulai menyiapkan ujian.' : 'Tidak ada penugasan yang sesuai dengan pencarian atau filter saat ini.' }}
        </p>
        <BaseButton v-if="assignments.length === 0" @click="handleAction('create')">
          <Plus class="w-4 h-4 mr-2" /> Tambah Penugasan
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
                <th scope="col" class="px-6 py-4 font-medium">Guru</th>
                <th scope="col" class="px-6 py-4 font-medium min-w-[200px]">Ujian & Mapel</th>
                <th scope="col" class="px-6 py-4 font-medium">Kelas</th>
                <th scope="col" class="px-6 py-4 font-medium">Progress Soal</th>
                <th scope="col" class="px-6 py-4 font-medium">Status</th>
                <th scope="col" class="px-6 py-4 font-medium text-right w-24 rounded-tr-xl">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(assignment, index) in paginatedAssignments" 
                :key="assignment.id"
                class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
              >
                <td class="px-6 py-4 text-center font-medium text-slate-400">
                  {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                </td>
                <td class="px-6 py-4">
                  <div class="font-semibold text-slate-900">{{ assignment.teacherName }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="font-medium text-slate-800">{{ assignment.examName }}</div>
                  <div class="text-xs text-slate-500 mt-1 flex items-center">
                    <BookOpen class="w-3.5 h-3.5 mr-1" /> {{ assignment.subjectName }}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md">{{ assignment.className }}</span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col space-y-2">
                    <div class="flex items-center space-x-3">
                      <div class="w-16">
                        <ProgressBar 
                          :value="assignment.choiceCount" 
                          :max="assignment.targetChoiceQuestions" 
                          :colorClass="assignment.choiceCount >= assignment.targetChoiceQuestions && assignment.targetChoiceQuestions > 0 ? 'bg-green-500' : 'bg-primary-blue'"
                          heightClass="h-1.5"
                        />
                      </div>
                      <span class="text-[11px] font-medium text-slate-500 whitespace-nowrap w-12">PG: {{ assignment.choiceCount || 0 }}/{{ assignment.targetChoiceQuestions || 0 }}</span>
                    </div>
                    <div class="flex items-center space-x-3">
                      <div class="w-16">
                        <ProgressBar 
                          :value="assignment.essayCount" 
                          :max="assignment.targetEssayQuestions" 
                          :colorClass="assignment.essayCount >= assignment.targetEssayQuestions && assignment.targetEssayQuestions > 0 ? 'bg-green-500' : 'bg-orange-400'"
                          heightClass="h-1.5"
                        />
                      </div>
                      <span class="text-[11px] font-medium text-slate-500 whitespace-nowrap w-12">Esai: {{ assignment.essayCount || 0 }}/{{ assignment.targetEssayQuestions || 0 }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <StatusBadge :status="assignment.status" />
                </td>
                <td class="px-6 py-4 text-right">
                  <BaseDropdown :items="getDropdownItems(assignment)" placement="bottom-end">
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
          <AssignmentMobileCard 
            v-for="assignment in paginatedAssignments" 
            :key="assignment.id" 
            :assignment="assignment" 
            @action="handleAction"
          />
        </div>

        <!-- Pagination -->
        <Pagination 
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :total-items="filteredAssignments.length"
          :items-per-page="itemsPerPage"
        />
      </div>
    </div>

    <!-- Modals -->
    <AssignmentFormModal 
      :isOpen="isFormOpen" 
      :loading="isSubmitting"
      :assignment="selectedAssignment"
      @close="isFormOpen = false"
      @submit="handleFormSubmit"
    />

    <BaseModal 
      :isOpen="isDeleteOpen" 
      title="Hapus Penugasan" 
      @close="isDeleteOpen = false"
      maxWidth="max-w-sm"
    >
      <div class="py-4">
        <p class="text-slate-600 text-sm leading-relaxed">
          Penugasan <span class="font-semibold text-slate-900">{{ assignmentToDelete?.teacherName }}</span> untuk <span class="font-semibold text-slate-900">{{ assignmentToDelete?.subjectName }}</span> &mdash; Kelas {{ assignmentToDelete?.className }} akan dihapus.
        </p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" :disabled="isSubmitting" @click="isDeleteOpen = false">Batal</BaseButton>
        <BaseButton variant="danger" :loading="isSubmitting" @click="handleDelete">Hapus</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
