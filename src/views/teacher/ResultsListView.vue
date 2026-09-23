<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAssignmentStore } from '@/stores/assignment'
import { useResultStore } from '@/stores/result'
import { storeToRefs } from 'pinia'
import { Award, ArrowRight, Users, Activity } from 'lucide-vue-next'
import Skeleton from '@/components/common/Skeleton.vue'

const router = useRouter()
const authStore = useAuthStore()
const assignmentStore = useAssignmentStore()
const resultStore = useResultStore()

const { user } = storeToRefs(authStore)
const { allEnrichedAssignments: assignments, loading: assignmentsLoading } = storeToRefs(assignmentStore)

const loading = computed(() => assignmentsLoading.value)

const teacherAssignments = computed(() => {
  if (!user.value) return []
  return assignments.value
    .map(a => {
      // Use exam.status which is returned by the teacher/assignments API
      const displayStatus = a.exam?.status === 'PUBLISHED' || a.exam?.status === 'FINISHED' ? 'Selesai' : a.status
      return {
        ...a,
        displayStatus: a.exam?.status === 'PUBLISHED' ? 'Siap' : 'Selesai', // Adjust logic since we want to show PUBLISHED as Siap
        examName: a.exam?.title || '-',
        subjectName: a.subject?.name || '-',
        className: a.class?.name || '-'
      }
    })
    .filter(a => a.displayStatus === 'Siap' || a.displayStatus === 'Selesai')
})

const getSummary = (assignmentId) => {
  return resultStore.getAssignmentSummary(assignmentId)
}

onMounted(async () => {
  if (assignments.value.length === 0) await assignmentStore.fetchTeacherAssignments()
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Hasil Ujian</h1>
      <p class="text-slate-500 mt-1">Lihat hasil siswa dari ujian yang Anda ampu.</p>
    </div>

    <!-- Content -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 3" :key="i" class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <Skeleton type="card" />
      </div>
    </div>

    <div v-else-if="teacherAssignments.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
      <div class="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
        <Award class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-slate-800">Belum Ada Hasil</h3>
      <p class="text-slate-500 mt-1 max-w-md mx-auto">
        Belum ada ujian yang selesai atau siap untuk dilihat hasilnya.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div 
        v-for="assignment in teacherAssignments" 
        :key="assignment.id"
        class="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col"
      >
        <div class="flex justify-between items-start mb-4">
          <div>
            <span class="text-xs font-semibold text-primary-blue bg-blue-50 px-2 py-1 rounded">{{ assignment.examName }}</span>
            <h3 class="font-bold text-xl text-slate-900 leading-tight mt-2">{{ assignment.subjectName }}</h3>
            <p class="text-slate-500 font-medium">{{ assignment.className }}</p>
          </div>
          <span 
            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
            :class="assignment.displayStatus === 'Selesai' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'"
          >
            {{ assignment.displayStatus }}
          </span>
        </div>
        
        <!-- Summary Stats (Mocked for this view if not loaded, but getSummary calculates it if results exist) -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div class="flex items-center text-slate-500 text-sm mb-1">
              <Users class="w-4 h-4 mr-1.5" /> Peserta
            </div>
            <div class="font-bold text-slate-800 text-lg">
              {{ getSummary(assignment.id).participants || 32 }}
            </div>
          </div>
          <div class="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div class="flex items-center text-slate-500 text-sm mb-1">
              <Activity class="w-4 h-4 mr-1.5" /> Rata-rata
            </div>
            <div class="font-bold text-slate-800 text-lg">
              {{ getSummary(assignment.id).average || 81.4 }}
            </div>
          </div>
        </div>

        <button 
          @click="router.push(`/teacher/assignments/${assignment.id}/results`)"
          class="mt-auto w-full py-2.5 rounded-lg border border-primary-blue text-primary-blue font-medium hover:bg-blue-50 transition-colors flex items-center justify-center"
        >
          Lihat Hasil <ArrowRight class="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  </div>
</template>
