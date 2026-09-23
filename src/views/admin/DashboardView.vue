<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useExamStore } from '@/stores/exam'
import { useAssignmentStore } from '@/stores/assignment'
import { storeToRefs } from 'pinia'
import { FileText, Activity, Users, UserCheck } from 'lucide-vue-next'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Skeleton from '@/components/common/Skeleton.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'

const authStore = useAuthStore()
const examStore = useExamStore()
const assignmentStore = useAssignmentStore()

const { user } = storeToRefs(authStore)
const { exams, loading: examsLoading } = storeToRefs(examStore)
const { allEnrichedAssignments: assignments, loading: assignmentsLoading } = storeToRefs(assignmentStore)

const recentExams = ref([])
const currentDate = ref('')

onMounted(async () => {
  // Format Date (e.g. Rabu, 16 September 2026)
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  currentDate.value = new Intl.DateTimeFormat('id-ID', options).format(new Date())

  await examStore.fetchExams()
  await assignmentStore.fetchAllAssignments()
  recentExams.value = exams.value.slice(0, 5) // Show top 5
})

const isLoading = computed(() => examsLoading.value || assignmentsLoading.value)

// Computed Stats
const stats = computed(() => {
  const totalExams = exams.value.length
  const activeExams = exams.value.filter(e => e.status === 'aktif').length
  
  // Unique teachers assigned
  const uniqueTeachers = new Set(assignments.value.map(a => a.teacherId)).size
  
  // Dummy student count based on active exams (e.g. 108 per exam)
  const studentCount = activeExams * 108

  return [
    { label: 'Total Ujian', value: totalExams, subtext: 'Semua ujian di sistem', icon: FileText, color: 'text-primary-blue', bg: 'bg-blue-100' },
    { label: 'Ujian Aktif', value: activeExams, subtext: 'Sedang berlangsung', icon: Activity, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Guru Ditugaskan', value: uniqueTeachers, subtext: 'Guru membuat soal', icon: UserCheck, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Peserta Ujian', value: studentCount, subtext: 'Estimasi terdaftar', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
  ]
})

// Assignment Summary Stats
const assignmentSummary = computed(() => {
  const all = assignments.value.length
  const siap = assignments.value.filter(a => a.status === 'Siap').length
  const proses = assignments.value.filter(a => a.status === 'Proses').length
  const belumMulai = assignments.value.filter(a => a.status === 'Belum Mulai').length

  return { all, siap, proses, belumMulai }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Banner -->
    <div class="bg-white rounded-xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:justify-between md:items-start gap-4">
      <div class="relative z-10 max-w-2xl">
        <h2 class="text-2xl font-bold text-slate-800 mb-2">Selamat Datang, {{ user?.name || 'Administrator' }} 👋</h2>
        <p class="text-slate-600">
          Kelola pelaksanaan ujian CBT Edulite dari satu tempat.
        </p>
      </div>
      <div class="relative z-10 hidden md:block text-right">
        <p class="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          {{ currentDate }}
        </p>
      </div>
      <!-- Decorative BG -->
      <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-50 to-transparent pointer-events-none hidden md:block"></div>
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-primary-blue/5 rounded-full pointer-events-none hidden md:block"></div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
      <template v-if="isLoading">
        <div v-for="i in 4" :key="'skel-stat-'+i" class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <Skeleton type="card" />
        </div>
      </template>
      <template v-else>
        <div 
          v-for="(stat, index) in stats" 
          :key="index"
          class="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center" :class="stat.bg">
              <component :is="stat.icon" class="w-6 h-6" :class="stat.color" />
            </div>
          </div>
          <div>
            <p class="text-sm font-medium text-slate-500 mb-1">{{ stat.label }}</p>
            <h3 class="text-2xl font-bold text-slate-900">{{ stat.value }}</h3>
            <p class="text-xs text-slate-400 mt-2">{{ stat.subtext }}</p>
          </div>
        </div>
      </template>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Exams -->
      <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">Ujian Terbaru</h3>
          <router-link to="/admin/exams" class="text-sm font-medium text-primary-blue hover:text-primary-dark hover:underline">
            Lihat Semua
          </router-link>
        </div>
        
        <div class="p-6" v-if="isLoading">
          <Skeleton type="table" :lines="4" />
        </div>
        
        <div v-else class="overflow-x-auto flex-1">
          <table class="w-full text-sm text-left text-slate-600">
            <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th scope="col" class="px-6 py-3 font-medium">Nama Ujian</th>
                <th scope="col" class="px-6 py-3 font-medium hidden sm:table-cell">Tahun Ajaran</th>
                <th scope="col" class="px-6 py-3 font-medium hidden xl:table-cell">Periode</th>
                <th scope="col" class="px-6 py-3 font-medium">Status</th>
                <th scope="col" class="px-6 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="recentExams.length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-slate-500">
                  Belum ada data ujian.
                </td>
              </tr>
              <tr 
                v-for="exam in recentExams" 
                :key="exam.id"
                class="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
              >
                <td class="px-6 py-4">
                  <div class="font-semibold text-slate-900">{{ exam.name }}</div>
                  <div class="text-xs text-slate-500 mt-0.5">{{ exam.code }}</div>
                  <div class="text-xs text-slate-500 mt-1 sm:hidden">
                    {{ exam.academicYear }} • Semester {{ exam.semester }}
                  </div>
                </td>
                <td class="px-6 py-4 hidden sm:table-cell">
                  {{ exam.academicYear }}
                  <div class="text-xs text-slate-500 mt-0.5">{{ exam.semester }}</div>
                </td>
                <td class="px-6 py-4 hidden xl:table-cell text-slate-500">
                  <div class="whitespace-nowrap">{{ exam.startDate }}</div>
                  <div class="whitespace-nowrap">s/d {{ exam.endDate }}</div>
                </td>
                <td class="px-6 py-4">
                  <StatusBadge :status="exam.status" />
                </td>
                <td class="px-6 py-4 text-right">
                  <router-link :to="`/admin/exams/${exam.id}`" class="inline-flex items-center text-sm font-medium text-primary-blue hover:text-primary-dark">
                    Detail
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Ringkasan Penugasan -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div class="px-6 py-5 border-b border-slate-100">
          <h3 class="text-lg font-semibold text-slate-800">Status Penugasan Guru</h3>
        </div>
        
        <div class="p-6" v-if="isLoading">
          <Skeleton type="text" :lines="6" />
        </div>
        
        <div v-else class="p-6 flex-1 flex flex-col justify-center space-y-6">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100">
            <span class="text-slate-600 font-medium">Total Penugasan</span>
            <span class="text-xl font-bold text-slate-900">{{ assignmentSummary.all }}</span>
          </div>
          
          <div>
            <ProgressBar :value="assignmentSummary.siap" :max="assignmentSummary.all" colorClass="bg-green-500">
              <template #label>
                <div class="flex justify-between w-full">
                  <span>Siap</span>
                  <span class="font-bold text-slate-900">{{ assignmentSummary.siap }}</span>
                </div>
              </template>
            </ProgressBar>
          </div>
          
          <div>
            <ProgressBar :value="assignmentSummary.proses" :max="assignmentSummary.all" colorClass="bg-amber-500">
              <template #label>
                <div class="flex justify-between w-full">
                  <span>Proses</span>
                  <span class="font-bold text-slate-900">{{ assignmentSummary.proses }}</span>
                </div>
              </template>
            </ProgressBar>
          </div>
          
          <div>
            <ProgressBar :value="assignmentSummary.belumMulai" :max="assignmentSummary.all" colorClass="bg-slate-300">
              <template #label>
                <div class="flex justify-between w-full">
                  <span>Belum Mulai</span>
                  <span class="font-bold text-slate-900">{{ assignmentSummary.belumMulai }}</span>
                </div>
              </template>
            </ProgressBar>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
