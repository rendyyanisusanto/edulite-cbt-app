<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useExamStore } from '@/stores/exam'
import { useAssignmentStore } from '@/stores/assignment'
import { useScheduleStore } from '@/stores/schedule'
import { useUiStore } from '@/stores/ui'
import { ArrowLeft, Users, UserCheck, Calendar, BookOpen, AlertCircle, Plus, MoreVertical, Clock, Eye, Trash2 } from 'lucide-vue-next'

import StatusBadge from '@/components/common/StatusBadge.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseDropdown from '@/components/common/BaseDropdown.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import AssignmentFormModal from '@/components/assignment/AssignmentFormModal.vue'
import ExamFormModal from '@/components/exam/ExamFormModal.vue'
import ScheduleFormModal from '@/components/admin/ScheduleFormModal.vue'

const route = useRoute()
const router = useRouter()
const examStore = useExamStore()
const assignmentStore = useAssignmentStore()
const scheduleStore = useScheduleStore()
const uiStore = useUiStore()

const exam = ref(null)
const assignments = ref([])
const examSchedules = ref([])
const loading = ref(true)
const notFound = ref(false)

// Modal States
const isFormOpen = ref(false)
const isDeleteOpen = ref(false)
const isExamFormOpen = ref(false)
const isExamDeleteOpen = ref(false)
const isScheduleFormOpen = ref(false)
const isSubmitting = ref(false)
const selectedAssignment = ref(null)
const assignmentToDelete = ref(null)

const fetchExamData = async () => {
  const examId = route.params.id
  loading.value = true
  notFound.value = false
  try {
    exam.value = await examStore.getExamById(examId)
    assignments.value = await assignmentStore.fetchAssignmentsByExamId(examId)
    await scheduleStore.fetchSchedules()
    examSchedules.value = scheduleStore.schedules.filter(s => s.examId == examId)
  } catch (error) {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchExamData()
})

const goBack = () => router.push('/admin/exams')

// Actions
const handleAction = (action, payload) => {
  if (action === 'create') {
    selectedAssignment.value = null
    isFormOpen.value = true
  } else if (action === 'edit') {
    selectedAssignment.value = payload
    isFormOpen.value = true
  } else if (action === 'delete') {
    assignmentToDelete.value = payload
    isDeleteOpen.value = true
  } else if (action === 'editExam') {
    isExamFormOpen.value = true
  } else if (action === 'deleteExam') {
    isExamDeleteOpen.value = true
  }
}

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
    await fetchExamData()
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
    await fetchExamData()
    isDeleteOpen.value = false
  } catch (error) {
    uiStore.addToast('Terjadi kesalahan', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleExamSubmit = async (values) => {
  isSubmitting.value = true
  try {
    await examStore.updateExam(exam.value.id, values)
    uiStore.addToast('Ujian berhasil diperbarui', 'success')
    await fetchExamData()
    isExamFormOpen.value = false
  } catch (error) {
    uiStore.addToast(error.message || 'Terjadi kesalahan', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleExamDelete = async () => {
  isSubmitting.value = true
  try {
    await examStore.deleteExam(exam.value.id)
    uiStore.addToast('Ujian berhasil dihapus', 'success')
    router.push('/admin/exams')
  } catch (error) {
    uiStore.addToast('Terjadi kesalahan', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleScheduleSubmit = async (values) => {
  isSubmitting.value = true
  try {
    await scheduleStore.createSchedule(values)
    uiStore.addToast('Jadwal berhasil dibuat, peserta telah digenerate', 'success')
    await fetchExamData()
    isScheduleFormOpen.value = false
  } catch (error) {
    uiStore.addToast(error.message || 'Gagal membuat jadwal', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleDeleteSchedule = async (id) => {
  if (window.confirm("Hapus Jadwal? Jadwal dan peserta akan dihapus. Lanjutkan?")) {
    try {
      await scheduleStore.deleteSchedule(id)
      uiStore.addToast('Jadwal berhasil dihapus', 'success')
      await fetchExamData()
    } catch (error) {
      uiStore.addToast(scheduleStore.error || 'Gagal menghapus jadwal', 'error')
    }
  }
}

// Progress Computation
const progressStats = computed(() => {
  if (!assignments.value.length) return { ready: 0, total: 0, percent: 0, info: 'Belum ada penugasan guru.' }
  
  const ready = assignments.value.filter(a => a.status === 'READY').length
  const total = assignments.value.length
  const percent = Math.round((ready / total) * 100)
  
  let info = ''
  const remaining = total - ready
  if (remaining === 0) info = 'Semua penugasan telah siap.'
  else info = `${remaining} penugasan masih dalam proses.`

  return { ready, total, percent, info }
})
</script>

<template>
  <div class="space-y-6">
    <!-- 404 State -->
    <div v-if="notFound" class="bg-white rounded-xl border border-slate-200 p-12 shadow-sm text-center">
      <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle class="w-8 h-8 text-red-500" />
      </div>
      <h3 class="text-xl font-bold text-slate-800 mb-2">Ujian Tidak Ditemukan</h3>
      <p class="text-slate-500 mb-6 max-w-md mx-auto">
        Data ujian yang Anda cari tidak tersedia atau mungkin telah dihapus.
      </p>
      <BaseButton @click="goBack">
        Kembali ke Daftar Ujian
      </BaseButton>
    </div>

    <template v-else>
      <!-- Breadcrumb -->
      <div class="flex items-center space-x-2 text-sm text-slate-500 mb-2">
        <router-link to="/admin/dashboard" class="hover:text-primary-blue transition-colors">Dashboard</router-link>
        <span>/</span>
        <router-link to="/admin/exams" class="hover:text-primary-blue transition-colors">Ujian</router-link>
        <span>/</span>
        <span class="text-slate-800 font-medium truncate max-w-[200px]" v-if="!loading">{{ exam?.title }}</span>
        <div v-else class="w-20 h-4 bg-slate-200 animate-pulse rounded"></div>
      </div>

      <!-- Main Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div class="flex items-start space-x-4">
          <button 
            @click="goBack"
            class="mt-1 p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          
          <div v-if="loading" class="space-y-2">
            <div class="w-48 h-7 bg-slate-200 animate-pulse rounded"></div>
            <div class="w-32 h-4 bg-slate-200 animate-pulse rounded"></div>
          </div>
          
          <div v-else>
            <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-3 flex-wrap">
              {{ exam?.title }}
              <StatusBadge :status="exam?.status || ''" />
            </h2>
            <p class="text-slate-500 mt-1 font-mono text-sm">{{ exam?.code }}</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-2 w-full sm:w-auto mt-2 sm:mt-0" v-if="!loading">
          <BaseButton variant="secondary" class="w-full sm:w-auto justify-center" @click="handleAction('editExam', exam)">
            Edit Ujian
          </BaseButton>
          <BaseDropdown 
            :items="[
              { label: 'Hapus Ujian', danger: true, onClick: () => handleAction('deleteExam', exam) }
            ]" 
            placement="bottom-end"
          >
            <template #trigger>
              <button class="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue">
                <MoreVertical class="w-4 h-4" />
              </button>
            </template>
          </BaseDropdown>
        </div>
      </div>

      <!-- Exam Info Summary & Progress -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Info Panel -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div class="px-6 py-5 border-b border-slate-100">
            <h3 class="text-lg font-semibold text-slate-800">Informasi Ujian</h3>
          </div>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 flex-1">
            <div v-if="loading" v-for="i in 4" :key="i" class="space-y-2">
              <div class="w-24 h-4 bg-slate-200 animate-pulse rounded"></div>
              <div class="w-32 h-5 bg-slate-200 animate-pulse rounded"></div>
            </div>
            
            <template v-else>
              <div>
                <p class="text-sm font-medium text-slate-500 mb-1">Tahun Ajaran & Semester</p>
                <p class="font-semibold text-slate-900">{{ exam?.academicYear }} &bull; Semester {{ exam?.semester }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 mb-1">Periode Pelaksanaan</p>
                <p class="font-semibold text-slate-900">{{ exam?.startDate }} <span class="text-slate-400 font-normal mx-1">s/d</span> {{ exam?.endDate }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 mb-1">Total Penugasan</p>
                <p class="font-semibold text-slate-900">{{ assignments.length }} Guru</p>
              </div>
              <div>
                <p class="text-sm font-medium text-slate-500 mb-1">Estimasi Peserta</p>
                <p class="font-semibold text-slate-900">~ 108 Siswa</p>
              </div>
            </template>
          </div>
        </div>

        <!-- Progress Panel -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div class="px-6 py-5 border-b border-slate-100">
            <h3 class="text-lg font-semibold text-slate-800">Persiapan Ujian</h3>
          </div>
          <div class="p-6 flex-1 flex flex-col justify-center space-y-4">
            <div v-if="loading" class="space-y-3">
              <div class="w-full h-3 bg-slate-200 animate-pulse rounded-full"></div>
              <div class="w-3/4 h-4 bg-slate-200 animate-pulse rounded"></div>
            </div>
            <template v-else>
              <div class="flex items-end justify-between mb-2">
                <span class="text-sm font-medium text-slate-600">
                  <span class="font-bold text-slate-900 text-xl">{{ progressStats.ready }}</span> dari {{ progressStats.total }} penugasan sudah siap
                </span>
              </div>
              <ProgressBar :value="progressStats.ready" :max="progressStats.total" colorClass="bg-green-500" heightClass="h-3" />
              <p class="text-sm text-slate-500 mt-2">{{ progressStats.info }}</p>
            </template>
          </div>
        </div>

      </div>

      <!-- Teacher Assignments -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-slate-800">Penugasan Guru</h3>
            <p class="text-sm text-slate-500 mt-0.5">Atur guru, mata pelajaran, dan kelas yang bertanggung jawab pada ujian ini.</p>
          </div>
          <BaseButton class="w-full sm:w-auto" @click="handleAction('create')">
            <Plus class="w-4 h-4 mr-2" /> Tambah Penugasan
          </BaseButton>
        </div>

        <div class="p-6" v-if="loading">
          <Skeleton type="table" :lines="4" />
        </div>
        
        <div v-else-if="assignments.length === 0" class="p-10 text-center">
          <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck class="w-8 h-8 text-slate-400" />
          </div>
          <h3 class="text-lg font-bold text-slate-800 mb-1">Belum Ada Penugasan</h3>
          <p class="text-slate-500 mb-6 max-w-sm mx-auto">
            Tambahkan guru pengampu untuk mulai menyiapkan soal-soal ujian ini.
          </p>
          <BaseButton @click="handleAction('create')">
            <Plus class="w-4 h-4 mr-2" /> Tambah Penugasan
          </BaseButton>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm text-left text-slate-600">
            <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" class="px-6 py-4 font-medium">Guru & Mapel</th>
                <th scope="col" class="px-6 py-4 font-medium">Kelas</th>
                <th scope="col" class="px-6 py-4 font-medium">Progress Soal</th>
                <th scope="col" class="px-6 py-4 font-medium">Status</th>
                <th scope="col" class="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="assignment in assignments" 
                :key="assignment.id"
                class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
              >
                <td class="px-6 py-4">
                  <div class="font-semibold text-slate-900">{{ assignment.teacherName }}</div>
                  <div class="text-xs text-slate-500 mt-0.5 flex items-center">
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
                  <BaseDropdown 
                    :items="[
                      { label: 'Edit', onClick: () => handleAction('edit', assignment) },
                      { label: 'Hapus', danger: true, onClick: () => handleAction('delete', assignment) }
                    ]"
                  >
                    <template #trigger>
                      <button class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none">
                        <MoreVertical class="w-5 h-5" />
                      </button>
                    </template>
                  </BaseDropdown>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Jadwal Ujian -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-slate-800">Jadwal Ujian</h3>
            <p class="text-sm text-slate-500 mt-0.5">Kelola sesi pelaksanaan ujian dan token akses untuk siswa.</p>
          </div>
          <BaseButton class="w-full sm:w-auto" @click="isScheduleFormOpen = true">
            <Plus class="w-4 h-4 mr-2" /> Buat Jadwal
          </BaseButton>
        </div>

        <div class="p-6" v-if="loading">
          <Skeleton type="table" :lines="3" />
        </div>
        
        <div v-else-if="examSchedules.length === 0" class="p-10 text-center">
          <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar class="w-8 h-8 text-slate-400" />
          </div>
          <h3 class="text-lg font-bold text-slate-800 mb-1">Belum Ada Jadwal</h3>
          <p class="text-slate-500 mb-6 max-w-sm mx-auto">
            Buat jadwal ujian agar siswa dapat mengakses soal yang telah ditugaskan.
          </p>
          <BaseButton @click="isScheduleFormOpen = true">
            <Plus class="w-4 h-4 mr-2" /> Buat Jadwal
          </BaseButton>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm text-left text-slate-600">
            <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" class="px-6 py-4 font-medium">Mapel & Kelas</th>
                <th scope="col" class="px-6 py-4 font-medium">Pelaksanaan</th>
                <th scope="col" class="px-6 py-4 font-medium">Peserta</th>
                <th scope="col" class="px-6 py-4 font-medium">Status</th>
                <th scope="col" class="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="s in examSchedules" 
                :key="s.id"
                class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
              >
                <td class="px-6 py-4">
                  <div class="font-semibold text-slate-900">{{ s.subjectName }}</div>
                  <div class="text-xs text-slate-500 mt-0.5">{{ s.className }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center text-slate-900 font-medium">
                    {{ new Date(s.start_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }}
                  </div>
                  <div class="text-xs text-slate-500 mt-0.5">
                    {{ new Date(s.start_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':') }} - {{ new Date(s.end_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':') }}
                  </div>
                  <div class="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">Durasi: {{ s.duration_minutes }}m</div>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {{ s.participantCount }} Siswa
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 text-[10px] font-bold rounded" :class="{
                    'bg-amber-100 text-amber-700': s.status === 'SCHEDULED',
                    'bg-green-100 text-green-700': s.status === 'OPEN',
                    'bg-slate-100 text-slate-700': s.status === 'CLOSED',
                    'bg-red-100 text-red-700': s.status === 'CANCELLED'
                  }">{{ s.status }}</span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button 
                      @click="router.push(`/admin/schedules/${s.id}`)"
                      class="p-1.5 text-slate-400 hover:text-primary-blue hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button 
                      @click="handleDeleteSchedule(s.id)"
                      class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Modals -->
    <AssignmentFormModal 
      :isOpen="isFormOpen" 
      :loading="isSubmitting"
      :assignment="selectedAssignment"
      :examId="exam?.id"
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
          Penugasan <span class="font-semibold text-slate-900">{{ assignmentToDelete?.teacherName }}</span> untuk <span class="font-semibold text-slate-900">{{ assignmentToDelete?.subjectName }}</span> &mdash; Kelas {{ assignmentToDelete?.className }} akan dihapus. Data soal yang mungkin sudah dibuat tidak akan terhapus.
        </p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" :disabled="isSubmitting" @click="isDeleteOpen = false">Batal</BaseButton>
        <BaseButton variant="danger" :loading="isSubmitting" @click="handleDelete">Hapus</BaseButton>
      </template>
    </BaseModal>

    <ExamFormModal 
      :isOpen="isExamFormOpen" 
      :loading="isSubmitting"
      :exam="exam"
      @close="isExamFormOpen = false"
      @submit="handleExamSubmit"
    />

    <BaseModal 
      :isOpen="isExamDeleteOpen" 
      title="Hapus Ujian" 
      @close="isExamDeleteOpen = false"
      maxWidth="max-w-sm"
    >
      <div class="py-4">
        <p class="text-slate-600 text-sm leading-relaxed">
          Apakah Anda yakin ingin menghapus ujian <span class="font-semibold text-slate-900">{{ exam?.name }}</span>? Semua penugasan, soal, dan hasil yang terkait juga akan dihapus dan tidak dapat dikembalikan.
        </p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" :disabled="isSubmitting" @click="isExamDeleteOpen = false">Batal</BaseButton>
        <BaseButton variant="danger" :loading="isSubmitting" @click="handleExamDelete">Ya, Hapus Ujian</BaseButton>
      </template>
    </BaseModal>

    <ScheduleFormModal 
      :isOpen="isScheduleFormOpen"
      :loading="isSubmitting"
      :assignments="assignments"
      @close="isScheduleFormOpen = false"
      @submit="handleScheduleSubmit"
    />
  </div>
</template>
