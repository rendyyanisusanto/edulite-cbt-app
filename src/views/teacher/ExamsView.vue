<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAssignmentStore } from '@/stores/assignment'
import { useExamStore } from '@/stores/exam'
import { storeToRefs } from 'pinia'
import { Search, Filter, Calendar, BookOpen, Users } from 'lucide-vue-next'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import Skeleton from '@/components/common/Skeleton.vue'

const router = useRouter()
const authStore = useAuthStore()
const assignmentStore = useAssignmentStore()
const examStore = useExamStore()

const { user } = storeToRefs(authStore)
const { allEnrichedAssignments: assignments, loading: assignmentsLoading } = storeToRefs(assignmentStore)
const loading = computed(() => assignmentsLoading.value)

// Local state for filters
const searchQuery = ref('')
const statusFilter = ref('semua')

const statusOptions = [
  { label: 'Semua Status', value: 'semua' },
  { label: 'Belum Mulai', value: 'Belum Mulai' },
  { label: 'Proses', value: 'Proses' },
  { label: 'Siap', value: 'Siap' },
  { label: 'Selesai', value: 'Selesai' } // Mocking a completed assignment state
]

const teacherAssignments = computed(() => {
  return assignments.value.map(a => {
    const displayStatus = a.status === 'READY' ? 'Siap' : 
                          a.status === 'IN_PROGRESS' ? 'Proses' : 'Belum Mulai'
                          
    return {
      ...a,
      displayStatus
    }
  })
})

const filteredAssignments = computed(() => {
  let result = teacherAssignments.value

  // Search filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(a => 
      a.exam.title.toLowerCase().includes(q) ||
      a.subject.name.toLowerCase().includes(q) ||
      a.class.name.toLowerCase().includes(q)
    )
  }

  // Status filter
  if (statusFilter.value !== 'semua') {
    result = result.filter(a => a.displayStatus === statusFilter.value)
  }

  return result
})

const getProgressPercentage = (progress, target) => {
  if (!target) return 0
  return Math.round((progress / target) * 100)
}

const getStatusColor = (status) => {
  switch(status) {
    case 'Belum Mulai': return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'Proses': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'Siap': return 'bg-green-100 text-green-700 border-green-200'
    case 'Selesai': return 'bg-blue-100 text-blue-700 border-blue-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const handleAction = (assignment) => {
  if (assignment.displayStatus === 'Selesai') {
    router.push(`/teacher/assignments/${assignment.id}/results`)
  } else if (assignment.displayStatus === 'Siap') {
    router.push(`/teacher/assignments/${assignment.id}`)
  } else {
    router.push(`/teacher/assignments/${assignment.id}/questions`)
  }
}

const getActionLabel = (status) => {
  switch(status) {
    case 'Belum Mulai': return 'Mulai Buat Soal'
    case 'Proses': return 'Lanjutkan Soal'
    case 'Siap': return 'Lihat Soal'
    case 'Selesai': return 'Lihat Hasil'
    default: return 'Detail'
  }
}

onMounted(async () => {
  await assignmentStore.fetchTeacherAssignments()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Ujian Saya</h1>
      <p class="text-slate-500 mt-1">Kelola penugasan ujian dan soal yang menjadi tanggung jawab Anda.</p>
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <BaseInput 
          name="search" 
          v-model="searchQuery" 
          placeholder="Cari ujian / mapel / kelas..." 
          :icon="Search"
        />
      </div>
      <div class="w-full sm:w-48 shrink-0">
        <BaseSelect 
          name="status" 
          v-model="statusFilter" 
          :options="statusOptions"
        />
      </div>
    </div>

    <!-- Content -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <Skeleton type="card" />
      </div>
    </div>

    <div v-else-if="filteredAssignments.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
      <div class="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <BookOpen class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-slate-800">Tidak ada penugasan</h3>
      <p class="text-slate-500 mt-1 max-w-md mx-auto">
        Anda belum memiliki penugasan ujian yang sesuai dengan filter pencarian saat ini.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="assignment in filteredAssignments" 
        :key="assignment.id"
        class="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
      >
        <div class="p-5 border-b border-slate-100">
          <div class="flex justify-between items-start mb-3">
            <span 
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
              :class="getStatusColor(assignment.displayStatus)"
            >
              {{ assignment.displayStatus }}
            </span>
            <span class="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded">{{ assignment.exam.title }}</span>
          </div>
          
          <h3 class="font-bold text-lg text-slate-900 leading-tight mb-1">{{ assignment.subject.name }}</h3>
          
          <div class="flex items-center text-sm text-slate-500 space-x-4 mt-3">
            <div class="flex items-center">
              <Users class="w-4 h-4 mr-1.5" />
              <span>{{ assignment.class.name }}</span>
            </div>
            <div class="flex items-center">
              <Calendar class="w-4 h-4 mr-1.5" />
              <span>{{ assignment.exam.academicYear }} (Smt {{ assignment.exam.semester }})</span>
            </div>
          </div>
        </div>

        <div class="p-5 bg-slate-50/50 flex-1 flex flex-col">
          <div class="mb-5">
            <div class="flex justify-between text-sm mb-1.5">
              <span class="text-slate-600 font-medium">Progress Soal</span>
              <span class="font-bold text-slate-900">{{ assignment.totalQuestionCount }} / {{ assignment.targetChoiceQuestions + assignment.targetEssayQuestions }}</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div 
                class="h-2 rounded-full transition-all duration-500" 
                :class="assignment.totalProgress >= 100 && (assignment.targetChoiceQuestions + assignment.targetEssayQuestions) > 0 ? 'bg-green-500' : 'bg-primary-blue'"
                :style="{ width: assignment.totalProgress + '%' }"
              ></div>
            </div>
          </div>
          
          <div class="mt-auto">
            <BaseButton 
              variant="primary" 
              block 
              @click="handleAction(assignment)"
              :class="{'bg-slate-800 hover:bg-slate-900 focus:ring-slate-800': assignment.displayStatus === 'Selesai'}"
            >
              {{ getActionLabel(assignment.displayStatus) }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
