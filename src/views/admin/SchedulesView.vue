<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useScheduleStore } from '@/stores/schedule'
import { Plus, Search, Calendar, Clock, Eye, Trash2, ShieldAlert } from 'lucide-vue-next'

const router = useRouter()
const scheduleStore = useScheduleStore()

const searchQuery = ref('')
const selectedStatus = ref('')

onMounted(async () => {
  await scheduleStore.fetchSchedules()
})

const filteredSchedules = computed(() => {
  return scheduleStore.schedules.filter(s => {
    const matchSearch = s.examTitle?.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                        s.subjectName?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                        s.className?.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchStatus = selectedStatus.value ? s.status === selectedStatus.value : true
    return matchSearch && matchStatus
  })
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

const formatTime = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', hour12: false
  }).replace('.', ':')
}

const getStatusColor = (status) => {
  const map = {
    'SCHEDULED': 'bg-blue-100 text-blue-700',
    'OPEN': 'bg-green-100 text-green-700',
    'CLOSED': 'bg-slate-100 text-slate-700',
    'CANCELLED': 'bg-red-100 text-red-700'
  }
  return map[status] || 'bg-slate-100 text-slate-700'
}

const getEffectiveStatus = (s) => {
  const now = new Date()
  const start = new Date(s.start_at)
  const end = new Date(s.end_at)
  
  if (s.status === 'CANCELLED' || s.status === 'CLOSED') return s.status
  
  if (now < start) return 'UPCOMING'
  if (now >= start && now <= end) return 'AVAILABLE'
  return 'CLOSED'
}

const getEffectiveStatusColor = (status) => {
  const map = {
    'UPCOMING': 'bg-amber-100 text-amber-700',
    'AVAILABLE': 'bg-green-100 text-green-700',
    'CLOSED': 'bg-slate-100 text-slate-700',
    'CANCELLED': 'bg-red-100 text-red-700'
  }
  return map[status] || 'bg-slate-100 text-slate-700'
}

const openDetail = (id) => {
  router.push(`/admin/schedules/${id}`)
}

const deleteSchedule = async (id) => {
  if (window.confirm("Hapus Jadwal? Tindakan ini tidak dapat dibatalkan. Jika jadwal sudah ada aktivitas (peserta mulai ujian), maka jadwal tidak bisa dihapus.")) {
    try {
      await scheduleStore.deleteSchedule(id)
      window.alert('Berhasil! Jadwal berhasil dihapus.')
    } catch (error) {
      window.alert('Gagal: ' + (scheduleStore.error || 'Gagal menghapus jadwal'))
    }
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Jadwal Ujian</h1>
        <p class="text-sm text-slate-500 mt-1">Kelola jadwal, sesi pelaksanaan CBT, dan token ujian.</p>
      </div>
      <!-- Note: Create schedule is usually done from Exam Detail, but we can add a global button if needed. 
           For now, following the user's flow, we'll keep creation in ExamDetailView / Global later. -->
    </div>

    <!-- Filters -->
    <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="h-5 w-5 text-slate-400" />
        </div>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Cari ujian, mapel, atau kelas..." 
          class="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-blue focus:border-primary-blue sm:text-sm"
        >
      </div>
      <div class="sm:w-48">
        <select 
          v-model="selectedStatus"
          class="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary-blue focus:border-primary-blue sm:text-sm rounded-lg"
        >
          <option value="">Semua Status</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="scheduleStore.loading" class="flex justify-center items-center py-20 bg-white rounded-xl border border-slate-200">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredSchedules.length === 0" class="flex flex-col justify-center items-center py-20 bg-white rounded-xl border border-slate-200 text-slate-500">
      <Calendar class="w-12 h-12 mb-4 text-slate-300" />
      <h3 class="text-lg font-medium text-slate-900 mb-1">Belum Ada Jadwal</h3>
      <p class="text-sm">Jadwal ujian belum dibuat atau tidak ada yang sesuai filter.</p>
    </div>

    <!-- Desktop Table -->
    <div v-else class="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ujian & Kelas</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal & Waktu</th>
              <th scope="col" class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Durasi</th>
              <th scope="col" class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Peserta</th>
              <th scope="col" class="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status Akses</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr v-for="s in filteredSchedules" :key="s.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-bold text-slate-900">{{ s.subjectName }}</div>
                <div class="text-xs text-slate-500">{{ s.examTitle }} • {{ s.className }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center text-sm text-slate-900">
                  <Calendar class="w-4 h-4 text-slate-400 mr-1.5" />
                  {{ formatDate(s.start_at) }}
                </div>
                <div class="flex items-center text-xs text-slate-500 mt-1">
                  <Clock class="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                  {{ formatTime(s.start_at) }} - {{ formatTime(s.end_at) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-900">
                {{ s.duration_minutes }} mnt
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {{ s.participantCount }} Siswa
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span :class="`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEffectiveStatusColor(getEffectiveStatus(s))}`">
                  {{ getEffectiveStatus(s) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    @click="openDetail(s.id)"
                    class="p-1.5 text-slate-400 hover:text-primary-blue hover:bg-blue-50 rounded-lg transition-colors"
                    title="Detail Jadwal"
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                  <button 
                    @click="deleteSchedule(s.id)"
                    class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus Jadwal"
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

    <!-- Mobile Cards -->
    <div class="md:hidden space-y-4">
      <div v-for="s in filteredSchedules" :key="s.id" class="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="text-base font-bold text-slate-900">{{ s.subjectName }}</h3>
            <p class="text-xs text-slate-500">{{ s.examTitle }} • {{ s.className }}</p>
          </div>
          <span :class="`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getEffectiveStatusColor(getEffectiveStatus(s))}`">
            {{ getEffectiveStatus(s) }}
          </span>
        </div>
        
        <div class="grid grid-cols-2 gap-y-2 text-sm mb-4">
          <div class="flex items-center text-slate-600">
            <Calendar class="w-4 h-4 mr-1.5 text-slate-400" />
            <span class="text-xs">{{ formatDate(s.start_at) }}</span>
          </div>
          <div class="flex items-center text-slate-600">
            <Clock class="w-4 h-4 mr-1.5 text-slate-400" />
            <span class="text-xs">{{ formatTime(s.start_at) }} - {{ formatTime(s.end_at) }}</span>
          </div>
          <div class="flex items-center text-slate-600">
            <span class="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">Durasi: {{ s.duration_minutes }}m</span>
          </div>
          <div class="flex items-center text-slate-600">
            <span class="text-xs font-medium bg-blue-50 px-2 py-0.5 rounded text-blue-700">Peserta: {{ s.participantCount }}</span>
          </div>
        </div>

        <div class="flex gap-2 border-t border-slate-100 pt-3">
          <button 
            @click="openDetail(s.id)"
            class="flex-1 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-100"
          >
            Detail Jadwal
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
