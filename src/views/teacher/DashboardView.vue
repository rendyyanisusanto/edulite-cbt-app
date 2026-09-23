<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAssignmentStore } from '@/stores/assignment'
import { storeToRefs } from 'pinia'
import { 
  ClipboardList, 
  Clock, 
  PencilLine, 
  CircleCheck,
  ArrowRight
} from 'lucide-vue-next'
import Skeleton from '@/components/common/Skeleton.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const assignmentStore = useAssignmentStore()

const { user } = storeToRefs(authStore)
const { allEnrichedAssignments: assignments, loading } = storeToRefs(assignmentStore)

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

const stats = computed(() => {
  const total = teacherAssignments.value.length
  const belumMulai = teacherAssignments.value.filter(a => a.displayStatus === 'Belum Mulai').length
  const proses = teacherAssignments.value.filter(a => a.displayStatus === 'Proses').length
  const siap = teacherAssignments.value.filter(a => a.displayStatus === 'Siap').length

  return [
    { title: 'Total Penugasan', value: total, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Belum Mulai', value: belumMulai, icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' },
    { title: 'Dalam Proses', value: proses, icon: PencilLine, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Siap Ujian', value: siap, icon: CircleCheck, color: 'text-green-600', bg: 'bg-green-100' }
  ]
})

const needsAction = computed(() => {
  return teacherAssignments.value.filter(a => a.displayStatus === 'Belum Mulai' || a.displayStatus === 'Proses')
})

const readyAssignments = computed(() => {
  return teacherAssignments.value.filter(a => a.displayStatus === 'Siap')
})

const getProgressPercentage = (progress, target) => {
  if (!target) return 0
  return Math.round((progress / target) * 100)
}

const goToQuestions = (id) => {
  router.push(`/teacher/assignments/${id}/questions`)
}

onMounted(async () => {
  if (assignments.value.length === 0) {
    await assignmentStore.fetchTeacherAssignments()
  }
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Welcome Section -->
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Selamat Datang, {{ user?.name || 'Guru' }}</h1>
      <p class="text-slate-500 mt-1">Berikut ringkasan tugas ujian Anda.</p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <template v-if="loading">
        <div v-for="i in 4" :key="'skel-'+i" class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <Skeleton type="card" />
        </div>
      </template>
      <template v-else>
        <div 
          v-for="(stat, index) in stats" 
          :key="index"
          class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-start space-x-4"
        >
          <div :class="[stat.bg, stat.color]" class="p-3 rounded-lg flex-shrink-0">
            <component :is="stat.icon" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-sm font-medium text-slate-500">{{ stat.title }}</p>
            <p class="text-2xl font-bold text-slate-800 mt-1">{{ stat.value }}</p>
          </div>
        </div>
      </template>
    </div>

    <!-- Priority Tasks -->
    <div v-if="!loading">
      <h2 class="text-lg font-bold text-slate-800 mb-4">Perlu Diselesaikan</h2>
      
      <div v-if="needsAction.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          v-for="assignment in needsAction" 
          :key="assignment.id"
          class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="font-bold text-lg text-slate-900 leading-tight">{{ assignment.exam.title }}</h3>
              <p class="text-slate-600 font-medium mt-1">{{ assignment.subject.name }} &mdash; {{ assignment.class.name }}</p>
            </div>
          </div>
          
          <div class="mb-4">
            <div class="flex justify-between text-sm mb-1.5">
              <span class="text-slate-600 font-medium">Soal</span>
              <span class="font-bold text-slate-900">{{ assignment.totalQuestionCount }} / {{ assignment.totalTarget || (assignment.targetChoiceQuestions + assignment.targetEssayQuestions) }}</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 mb-1.5 overflow-hidden">
              <div class="bg-amber-500 h-2.5 rounded-full transition-all duration-500" :style="{ width: assignment.totalProgress + '%' }"></div>
            </div>
            <div class="flex justify-between text-xs text-slate-500">
              <span>{{ assignment.totalProgress }}%</span>
              <span>{{ (assignment.targetChoiceQuestions + assignment.targetEssayQuestions) - assignment.totalQuestionCount }} soal lagi untuk diselesaikan</span>
            </div>
          </div>
          
          <div class="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
            <div class="text-xs font-medium px-2.5 py-1 rounded bg-amber-100 text-amber-700">
              {{ assignment.displayStatus === 'Belum Mulai' ? 'Belum Mulai' : 'Dalam Proses' }}
            </div>
            <BaseButton size="sm" @click="goToQuestions(assignment.id)">
              {{ assignment.displayStatus === 'Belum Mulai' ? 'Mulai Buat Soal' : 'Lanjutkan Soal' }}
            </BaseButton>
          </div>
        </div>
      </div>
      
      <div v-else class="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
        <div class="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <CircleCheck class="w-6 h-6" />
        </div>
        <h3 class="text-lg font-bold text-slate-800">Semua Penugasan Sudah Siap</h3>
        <p class="text-slate-500 mt-1 max-w-sm mx-auto">Tidak ada soal yang perlu Anda selesaikan saat ini.</p>
      </div>
    </div>

    <!-- Ready Tasks -->
    <div v-if="!loading && readyAssignments.length > 0">
      <h2 class="text-lg font-bold text-slate-800 mb-4">Sudah Siap</h2>
      <div class="space-y-3">
        <div 
          v-for="assignment in readyAssignments" 
          :key="assignment.id"
          class="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h3 class="font-bold text-slate-900">{{ assignment.exam.title }}</h3>
            <p class="text-sm text-slate-600">{{ assignment.subject.name }} &mdash; {{ assignment.class.name }}</p>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm font-medium text-slate-600">{{ assignment.totalQuestionCount }} / {{ assignment.targetChoiceQuestions + assignment.targetEssayQuestions }} soal</span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              Siap
            </span>
            <button 
              @click="router.push(`/teacher/assignments/${assignment.id}`)"
              class="text-primary-blue hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ArrowRight class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
