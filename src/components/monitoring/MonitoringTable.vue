<script setup>
import { computed } from 'vue'
import { AlertCircle, Clock, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  participants: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['view-detail', 'reset-time', 'toggle-pause'])

const getStatusBadge = (status, isStale) => {
  if (isStale && status === 'IN_PROGRESS') {
    return { class: 'bg-red-50 text-red-700 border-red-200', label: 'Tidak Aktif' }
  }
  
  switch (status) {
    case 'NOT_STARTED': return { class: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Belum Mulai' }
    case 'IN_PROGRESS': return { class: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Mengerjakan' }
    case 'SUBMITTED': return { class: 'bg-green-50 text-green-700 border-green-200', label: 'Selesai' }
    case 'TIME_EXPIRED': return { class: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Waktu Habis' }
    case 'PAUSED': return { class: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Di-pause' }
    case 'BLOCKED': return { class: 'bg-red-50 text-red-700 border-red-200', label: 'Diblokir' }
    default: return { class: 'bg-slate-100 text-slate-700 border-slate-200', label: status }
  }
}

const formatTimeOnly = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\./g, ':')
}

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMinutes = Math.floor((now - date) / 60000)
  
  if (diffMinutes < 1) return 'Baru saja'
  if (diffMinutes < 60) return `${diffMinutes} mnt lalu`
  
  const diffHours = Math.floor(diffMinutes / 60)
  return `${diffHours} jam lalu`
}

const formatRemainingTime = (seconds) => {
  if (seconds <= 0) return '0 mnt'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  
  if (h > 0) return `${h}j ${m}m`
  return `${m} mnt`
}

const hasParticipants = computed(() => props.participants.length > 0)
</script>

<template>
  <div>
    <!-- Desktop Table -->
    <div class="hidden md:block overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
            <th class="px-6 py-4">No</th>
            <th class="px-6 py-4">Nama Siswa</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4">Progress</th>
            <th class="px-6 py-4">Last Activity</th>
            <th class="px-6 py-4">Sisa Waktu</th>
            <th class="px-6 py-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="!hasParticipants">
            <td colspan="7" class="px-6 py-12 text-center text-slate-500">
              Belum ada peserta yang sesuai dengan filter.
            </td>
          </tr>
          
          <tr 
            v-for="(p, idx) in participants" 
            :key="p.participantId"
            class="hover:bg-slate-50/80 transition-colors"
          >
            <td class="px-6 py-4 text-sm font-medium text-slate-500">{{ idx + 1 }}</td>
            <td class="px-6 py-4">
              <div class="text-sm font-bold text-slate-900">{{ p.student.name }}</div>
              <div class="text-xs text-slate-500 mt-0.5">{{ p.student.nis || '-' }} &bull; {{ p.student.className }}</div>
            </td>
            <td class="px-6 py-4">
              <span :class="['px-2.5 py-1 text-xs font-bold rounded-md border', getStatusBadge(p.status, p.isStale).class]">
                {{ getStatusBadge(p.status, p.isStale).label }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-slate-700">{{ p.progress.answered }} / {{ p.progress.total }}</span>
                <span class="text-xs font-medium text-slate-400">({{ p.progress.percentage }}%)</span>
              </div>
              <div class="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <div class="h-full bg-blue-500 rounded-full transition-all duration-500" :style="{ width: `${p.progress.percentage}%` }"></div>
              </div>
            </td>
            <td class="px-6 py-4">
              <div v-if="p.status === 'NOT_STARTED'" class="text-sm text-slate-400">-</div>
              <div v-else class="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Clock class="w-3.5 h-3.5 text-slate-400" />
                {{ formatTimeOnly(p.attempt?.lastActivityAt) }}
              </div>
            </td>
            <td class="px-6 py-4">
              <div v-if="p.status === 'IN_PROGRESS' || p.status === 'PAUSED'" class="text-sm font-bold text-slate-700">
                {{ formatRemainingTime(p.remainingSeconds) }}
              </div>
              <div v-else class="text-sm text-slate-400">-</div>
            </td>
            <td class="px-6 py-4 text-center">
              <div class="flex flex-col gap-1.5 items-center justify-center">
                <button 
                  @click="emit('view-detail', p.participantId)"
                  class="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-700 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  Detail
                </button>
                <button 
                  v-if="p.status === 'IN_PROGRESS' || p.status === 'PAUSED'"
                  @click="emit('toggle-pause', p.participantId)"
                  class="w-full px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-md text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                  title="Pause/Resume ujian"
                >
                  {{ p.status === 'PAUSED' ? 'Resume' : 'Pause' }}
                </button>
                <button 
                  v-if="p.attempt"
                  @click="emit('reset-time', p.participantId)"
                  class="w-full px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
                  title="Perpanjang/reset waktu ujian"
                >
                  Reset
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div class="md:hidden divide-y divide-slate-100">
      <div v-if="!hasParticipants" class="px-4 py-8 text-center text-slate-500 text-sm">
        Belum ada peserta yang sesuai dengan filter.
      </div>
      
      <div 
        v-for="p in participants" 
        :key="p.participantId"
        class="p-4 bg-white"
      >
        <div class="flex justify-between items-start mb-2">
          <div>
            <div class="text-sm font-bold text-slate-900 leading-tight">{{ p.student.name }}</div>
            <div class="text-xs text-slate-500 mt-0.5">{{ p.student.className }}</div>
          </div>
          <span :class="['px-2 py-0.5 text-[10px] font-bold rounded border', getStatusBadge(p.status, p.isStale).class]">
            {{ getStatusBadge(p.status, p.isStale).label }}
          </span>
        </div>
        
        <div class="grid grid-cols-2 gap-y-3 gap-x-2 mt-4 text-xs">
          <div>
            <div class="text-slate-400 font-medium mb-0.5">Progress</div>
            <div class="font-bold text-slate-700">{{ p.progress.answered }} / {{ p.progress.total }} ({{ p.progress.percentage }}%)</div>
          </div>
          <div>
            <div class="text-slate-400 font-medium mb-0.5">Sisa Waktu</div>
            <div class="font-bold text-slate-700">{{ p.status === 'IN_PROGRESS' || p.status === 'PAUSED' ? formatRemainingTime(p.remainingSeconds) : '-' }}</div>
          </div>
          <div>
            <div class="text-slate-400 font-medium mb-0.5">Last Activity</div>
            <div class="font-bold text-slate-700">{{ p.status === 'NOT_STARTED' ? '-' : formatRelativeTime(p.attempt?.lastActivityAt) }}</div>
          </div>
          <div class="flex flex-col gap-1.5 items-end justify-end">
            <button 
              @click="emit('view-detail', p.participantId)"
              class="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-md flex items-center gap-1 hover:bg-blue-100 w-full justify-center"
            >
              Detail
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
            <button 
              v-if="p.status === 'IN_PROGRESS' || p.status === 'PAUSED'"
              @click="emit('toggle-pause', p.participantId)"
              class="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 rounded-md flex items-center gap-1 hover:bg-indigo-100 w-full justify-center"
            >
              <Clock class="w-3.5 h-3.5" />
              {{ p.status === 'PAUSED' ? 'Resume' : 'Pause' }}
            </button>
            <button 
              v-if="p.attempt"
              @click="emit('reset-time', p.participantId)"
              class="px-3 py-1.5 bg-amber-50 text-amber-700 font-bold border border-amber-200 rounded-md flex items-center gap-1 hover:bg-amber-100 w-full justify-center"
            >
              <Clock class="w-3.5 h-3.5" />
              Reset Waktu
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
