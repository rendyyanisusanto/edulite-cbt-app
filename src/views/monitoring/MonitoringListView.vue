<script setup>
import { onMounted, computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMonitoringStore } from '@/stores/monitoring'
import { useAuthStore } from '@/stores/auth'
import { MonitorPlay, Users, Clock, AlertCircle, Search, ChevronDown, ChevronUp } from 'lucide-vue-next'

const router = useRouter()
const monitoringStore = useMonitoringStore()
const authStore = useAuthStore()

const rolePrefix = computed(() => authStore.isAdmin ? '/admin' : '/teacher')

const searchQuery = ref('')
const expandedGroups = ref({})

onMounted(async () => {
  await monitoringStore.fetchSchedules()
  expandAllGroups()
})

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'LIVE': return 'bg-green-100 text-green-700 border-green-200'
    case 'UPCOMING': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'EXPIRED': return 'bg-slate-100 text-slate-700 border-slate-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'LIVE': return 'Sedang Berlangsung'
    case 'UPCOMING': return 'Akan Datang'
    case 'EXPIRED': return 'Selesai'
    default: return status
  }
}

const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':')
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

const navigateToDetail = (scheduleId) => {
  router.push(`${rolePrefix.value}/monitoring/${scheduleId}`)
}

const groupedSchedules = computed(() => {
  const query = searchQuery.value.toLowerCase()
  
  const filtered = monitoringStore.schedules.filter(s => {
    const dateStr = formatDate(s.startAt).toLowerCase()
    const subject = (s.subjectName || '').toLowerCase()
    const teacher = (s.teacherName || '').toLowerCase()
    
    return dateStr.includes(query) || subject.includes(query) || teacher.includes(query)
  })

  const groups = {}
  filtered.forEach(s => {
    const examName = s.examTitle || 'Lainnya'
    if (!groups[examName]) {
      groups[examName] = []
    }
    groups[examName].push(s)
  })
  
  return groups
})

const expandAllGroups = () => {
  Object.keys(groupedSchedules.value).forEach(examName => {
    expandedGroups.value[examName] = true
  })
}

watch(() => groupedSchedules.value, (newGroups) => {
  Object.keys(newGroups).forEach(examName => {
    if (expandedGroups.value[examName] === undefined) {
      expandedGroups.value[examName] = true
    }
  })
}, { deep: true })

const toggleGroup = (examName) => {
  expandedGroups.value[examName] = !expandedGroups.value[examName]
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Monitoring Ujian</h1>
        <p class="text-sm text-slate-500 mt-1">Pantau aktivitas peserta ujian yang sedang berlangsung.</p>
      </div>
      <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <!-- Search Input -->
        <div class="relative w-full sm:w-64">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="h-4 w-4 text-slate-400" />
          </div>
          <input
            v-model="searchQuery"
            type="text"
            class="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            placeholder="Cari tanggal, guru, mapel..."
          />
        </div>
        <button 
          @click="monitoringStore.fetchSchedules()"
          class="px-4 py-2 w-full sm:w-auto bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          :disabled="monitoringStore.loading"
        >
          <span v-if="monitoringStore.loading" class="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="monitoringStore.loading && monitoringStore.schedules.length === 0" class="flex justify-center items-center py-24">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="monitoringStore.error" class="bg-red-50 border border-red-200 text-red-600 p-6 rounded-xl text-center">
      <AlertCircle class="w-8 h-8 mx-auto mb-2 text-red-500" />
      <p class="font-bold">{{ monitoringStore.error }}</p>
      <button @click="monitoringStore.fetchSchedules()" class="mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 text-sm">Coba Lagi</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="monitoringStore.schedules.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center">
      <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
        <MonitorPlay class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-slate-900 mb-1">Tidak Ada Jadwal Ujian</h3>
      <p class="text-slate-500 text-sm max-w-sm mx-auto">Saat ini belum ada jadwal ujian yang tersedia untuk dimonitor.</p>
    </div>

    <!-- Grouped List -->
    <div v-else class="space-y-6">
      <div v-for="(schedules, examName) in groupedSchedules" :key="examName" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        <!-- Accordion Header -->
        <button 
          @click="toggleGroup(examName)"
          class="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-100"
        >
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-bold text-slate-800">{{ examName }}</h2>
            <span class="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">{{ schedules.length }} Jadwal</span>
          </div>
          <component :is="expandedGroups[examName] ? ChevronUp : ChevronDown" class="w-5 h-5 text-slate-500" />
        </button>

        <!-- Accordion Body -->
        <div v-show="expandedGroups[examName]" class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              v-for="schedule in schedules" 
              :key="schedule.scheduleId"
              class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all group flex flex-col"
            >
              <div class="p-5 flex-grow">
                <div class="flex justify-between items-start mb-4">
                  <span :class="['px-2.5 py-1 text-xs font-bold rounded-md border', getStatusBadgeClass(schedule.status)]">
                    {{ getStatusLabel(schedule.status) }}
                  </span>
                  <span class="text-slate-400 text-sm font-medium flex items-center gap-1">
                    <Users class="w-4 h-4" />
                    {{ schedule.participantCount }}
                  </span>
                </div>
                
                <h3 class="text-base font-bold text-slate-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                  {{ schedule.subjectName }}
                </h3>
                <p class="text-sm font-medium text-slate-600 mb-4">{{ schedule.className }} &bull; {{ schedule.teacherName }}</p>

                <div class="space-y-2">
                  <div class="flex items-center gap-2 text-sm text-slate-500">
                    <Clock class="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{{ formatDate(schedule.startAt) }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-sm text-slate-500">
                    <span class="w-4 h-4 flex items-center justify-center text-slate-400 shrink-0 text-[10px] font-bold border border-slate-300 rounded-sm">H</span>
                    <span>{{ formatTime(schedule.startAt) }} - {{ formatTime(schedule.endAt) }} ({{ schedule.durationMinutes }}m)</span>
                  </div>
                </div>
              </div>
              
              <div class="p-4 bg-slate-50 border-t border-slate-100">
                <button 
                  @click="navigateToDetail(schedule.scheduleId)"
                  class="w-full py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  Monitor Kelas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="Object.keys(groupedSchedules).length === 0" class="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
        Pencarian tidak menemukan hasil apapun.
      </div>
    </div>
  </div>
</template>
