<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssignmentStore } from '@/stores/assignment'
import { useExamStore } from '@/stores/exam'
import { storeToRefs } from 'pinia'
import { 
  ArrowLeft, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  Target,
  FileText,
  Eye,
  AlertCircle
} from 'lucide-vue-next'
import BaseButton from '@/components/common/BaseButton.vue'
import Skeleton from '@/components/common/Skeleton.vue'

const route = useRoute()
const router = useRouter()
const assignmentStore = useAssignmentStore()
const loading = ref(true)
const assignmentId = computed(() => Number(route.params.id))
const assignment = ref(null)

const displayStatus = computed(() => {
  if (!assignment.value) return ''
  return assignment.value.exam?.status === 'FINISHED' ? 'Selesai' : 
         assignment.value.status === 'READY' ? 'Siap' : 
         assignment.value.status === 'IN_PROGRESS' ? 'Proses' : 'Belum Mulai'
})

const totalTarget = computed(() => {
  if (!assignment.value) return 0
  return (assignment.value.targetChoiceQuestions || 0) + (assignment.value.targetEssayQuestions || 0)
})

const totalProgress = computed(() => {
  if (!assignment.value) return 0
  return assignment.value.totalQuestionCount || 0
})

const getProgressPercentage = computed(() => {
  if (totalTarget.value === 0) return 0
  return Math.round((totalProgress.value / totalTarget.value) * 100)
})

const getStatusColor = (status) => {
  switch(status) {
    case 'Belum Mulai': return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'Proses': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'Siap': return 'bg-green-100 text-green-700 border-green-200'
    case 'Selesai': return 'bg-blue-100 text-blue-700 border-blue-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const primaryActionLabel = computed(() => {
  if (!assignment.value) return 'Kelola Soal'
  switch(displayStatus.value) {
    case 'Belum Mulai': return 'Mulai Buat Soal'
    case 'Proses': return 'Kelola Soal'
    case 'Siap': return 'Periksa Soal'
    case 'Selesai': return 'Lihat Hasil'
    default: return 'Kelola Soal'
  }
})

const handlePrimaryAction = () => {
  if (displayStatus.value === 'Selesai') {
    router.push(`/teacher/assignments/${assignment.value.id}/results`)
  } else {
    router.push(`/teacher/assignments/${assignment.value.id}/questions`)
  }
}

const handleSecondaryAction = () => {
  router.push(`/teacher/assignments/${assignment.value.id}/preview`)
}

onMounted(async () => {
  loading.value = true
  try {
    assignment.value = await assignmentStore.fetchTeacherAssignmentById(assignmentId.value)
  } catch (error) {
    console.error('Failed to fetch assignment detail', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading State -->
    <div v-if="loading" class="space-y-6">
      <Skeleton type="card" />
      <Skeleton type="card" />
    </div>

    <!-- Error State -->
    <div v-else-if="!assignment" class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
      <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle class="w-8 h-8" />
      </div>
      <h3 class="text-xl font-bold text-slate-800">Penugasan Tidak Ditemukan</h3>
      <p class="text-slate-500 mt-2 mb-6 max-w-md mx-auto">
        Penugasan yang Anda cari tidak tersedia atau Anda tidak memiliki akses.
      </p>
      <BaseButton @click="router.push('/teacher/exams')">Kembali ke Ujian Saya</BaseButton>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Breadcrumb -->
      <nav class="flex items-center text-sm font-medium text-slate-500 mb-2">
        <button @click="router.push('/teacher/exams')" class="hover:text-slate-800 flex items-center transition-colors">
          <ArrowLeft class="w-4 h-4 mr-1" />
          Ujian Saya
        </button>
        <span class="mx-2 text-slate-300">/</span>
        <span class="text-slate-800">{{ assignment.subject.name }}</span>
      </nav>

      <!-- Header Section -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div>
            <div class="text-sm font-semibold text-primary-blue mb-2">{{ assignment.exam.title }}</div>
            <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-2">
              {{ assignment.subject.name }}
            </h1>
            <p class="text-lg text-slate-600 font-medium">{{ assignment.class.name }}</p>
          </div>
          <div>
            <span 
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
              :class="getStatusColor(displayStatus)"
            >
              {{ displayStatus }}
            </span>
          </div>
        </div>

        <hr class="border-slate-100 my-6" />

        <!-- Info Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p class="text-sm text-slate-500 mb-1 flex items-center">
              <FileText class="w-4 h-4 mr-1.5" /> Ujian
            </p>
            <p class="font-semibold text-slate-800">{{ assignment.exam.title }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500 mb-1 flex items-center">
              <BookOpen class="w-4 h-4 mr-1.5" /> Mata Pelajaran
            </p>
            <p class="font-semibold text-slate-800">{{ assignment.subject.name }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500 mb-1 flex items-center">
              <GraduationCap class="w-4 h-4 mr-1.5" /> Kelas
            </p>
            <p class="font-semibold text-slate-800">{{ assignment.class.name }}</p>
          </div>
          <div>
            <p class="text-sm text-slate-500 mb-1 flex items-center">
              <Calendar class="w-4 h-4 mr-1.5" /> Periode
            </p>
            <p class="font-semibold text-slate-800">{{ assignment.exam.academicYear }} (Smt {{ assignment.exam.semester }})</p>
          </div>
        </div>
      </div>

      <!-- Progress Section -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-lg font-bold text-slate-800 flex items-center">
            <Target class="w-5 h-5 mr-2 text-slate-400" />
            Progress Pembuatan Soal
          </h2>
          <span class="text-2xl font-black text-slate-900">{{ getProgressPercentage }}%</span>
        </div>
        
        <p class="text-slate-600 mb-4 font-medium">
          {{ totalProgress }} dari {{ totalTarget }} soal selesai
        </p>
        
        <div class="w-full bg-slate-100 rounded-full h-4 mb-3 overflow-hidden">
          <div 
            class="h-4 rounded-full transition-all duration-700 ease-out" 
            :class="getProgressPercentage >= 100 ? 'bg-green-500' : 'bg-primary-blue'"
            :style="{ width: getProgressPercentage + '%' }"
          ></div>
        </div>
        
        <p class="text-sm text-slate-500">
          <span v-if="totalProgress < totalTarget">
            {{ totalTarget - totalProgress }} soal lagi untuk mencapai target.
          </span>
          <span v-else class="text-green-600 font-medium">
            Target soal sudah terpenuhi.
          </span>
        </p>

        <!-- Actions -->
        <div class="mt-8 flex flex-col sm:flex-row gap-3">
          <BaseButton 
            variant="primary" 
            class="flex-1 justify-center py-2.5 text-base"
            @click="handlePrimaryAction"
          >
            {{ primaryActionLabel }}
          </BaseButton>
          <BaseButton 
            v-if="displayStatus !== 'Selesai'"
            variant="secondary" 
            class="flex-1 justify-center py-2.5 text-base"
            @click="handleSecondaryAction"
            :disabled="totalProgress === 0"
          >
            <Eye class="w-5 h-5 mr-2" />
            Preview Ujian
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
